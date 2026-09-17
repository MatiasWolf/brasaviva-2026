import { computed, inject, Injectable, signal } from '@angular/core';
import { ItemCarrito, Producto } from '../models/pedido.models';
import { SupabaseService } from './supabase.service';

@Injectable({
    providedIn: 'root' 
})
export class PedidoService {
    private supabaseService = inject(SupabaseService);

    public productos = signal<Producto[]>([]);
 
    public pedido = signal<ItemCarrito[]>([]);
 
    public cargandoProductos = signal<boolean>(false);

    public importeTotal = computed(() => {
        return this.pedido().reduce((total, item) => total + (item.producto.precio * item.cantidad), 0);
    });

    public tiempoEstimadoTotal = computed(() => {
        const items = this.pedido();
        if (items.length === 0){
            return 0;
        }
        return Math.max(...items.map(item => item.producto.tiempo_preparacion));
    });

    public cantidadTotalItems = computed(() => {
        return this.pedido().reduce((total, item) => total + item.cantidad, 0);
    });


    agregarAlPedido(producto: Producto) {
        const pedidoActual = this.pedido();
        const itemExistente = pedidoActual.find(item => item.producto.id === producto.id);

        if (itemExistente) {
            // Si ya llegó a 20, no hace nada 
            if (itemExistente.cantidad >= 20) {
                console.warn(`Límite alcanzado: No se pueden pedir más de 20 unidades de ${producto.nombre}`);
                return; 
            }

            this.pedido.set(
                pedidoActual.map(item =>
                item.producto.id === producto.id
                    ? { ...item, cantidad: item.cantidad + 1 }
                    : item
                )
            );
        } else {
            this.pedido.set([...pedidoActual, { producto, cantidad: 1 }]);
        }
    }

    restarDelPedido(productoId: number) {
        const pedidoActual = this.pedido();
        const itemExistente = pedidoActual.find(item => item.producto.id === productoId);

        if (!itemExistente) return;

        if (itemExistente.cantidad === 1) {
        this.pedido.set(pedidoActual.filter(item => item.producto.id !== productoId));
        } else {
        this.pedido.set(
            pedidoActual.map(item =>
            item.producto.id === productoId
                ? { ...item, cantidad: item.cantidad - 1 }
                : item
            )
        );
        }
    }

    eliminarDelPedido(productoId: number) {
        const pedidoActual = this.pedido();
        this.pedido.set(pedidoActual.filter(item => item.producto.id !== productoId));
    }

    vaciarPedido() {
        this.pedido.set([]);
    }

    async obtenerProductosMenu() {
        this.cargandoProductos.set(true);
        
        try {
        const { data, error } = await this.supabaseService.client
            .from('productos')
            .select('*')
            .eq('disponible', true);

        if (error) throw error;
        
        this.productos.set(data || []);
        
        } catch (err) {
        console.error('Error al cargar la carta desde Supabase:', err);
        } finally {
        this.cargandoProductos.set(false);
        }
    }

    async enviarPedidoAConfirmar(ocupacionMesaId: number): Promise<{ ok: boolean; productosAgotados?: string[]; error?: any }> {
        try {
            const itemsActuales = this.pedido();
            if (itemsActuales.length === 0) {
                throw new Error('No se puede enviar un pedido vacío.');
            }

            // 1. VALIDACIÓN PREVENTIVA DE DISPONIBILIDAD (Misma lógica previa)
            const idsProductos = itemsActuales.map(item => item.producto.id);
            const { data: productosDB, error: errorValidacion } = await this.supabaseService.client
                .from('productos')
                .select('id, nombre, disponible')
                .in('id', idsProductos);

            if (errorValidacion) throw errorValidacion;

            const productosAgotados: string[] = [];
            itemsActuales.forEach(item => {
                const prodBD = productosDB?.find(p => p.id === item.producto.id);
                if (!prodBD || !prodBD.disponible) {
                    productosAgotados.push(item.producto.nombre);
                    this.eliminarDelPedido(item.producto.id);
                }
            });

            if (productosAgotados.length > 0) {
                await this.obtenerProductosMenu();
                return { ok: false, productosAgotados };
            }

            // 2. COMPROBAR SI LA OCUPACIÓN YA TIENE UN PEDIDO RECHAZADO PREVIO
            const { data: pedidoExistente, error: errorBusqueda } = await this.supabaseService.client
                .from('pedidos')
                .select('id, estado')
                .eq('ocupacion_id', ocupacionMesaId)
                .eq('estado', 'rechazado')
                .maybeSingle();

            if (errorBusqueda) throw errorBusqueda;

            let pedidoId: number;

            if (pedidoExistente) {
                // ---- CAMINIO B: RE-ACTUALIZACIÓN POR RECHAZO (PUNTO 13) ----
                pedidoId = pedidoExistente.id;

                // A. Actualizamos la cabecera del pedido existente regresándolo a pendiente
                const { error: errorUpdate } = await this.supabaseService.client
                    .from('pedidos')
                    .update({
                        estado: 'pendiente_confirmacion',
                        importe_total: this.importeTotal(),
                        tiempo_estimado_preparacion: this.tiempoEstimadoTotal(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', pedidoId);

                if (errorUpdate) throw errorUpdate;

                // B. Limpiamos por completo los ítems viejos e inválidos para evitar basura
                const { error: errorDeleteItems } = await this.supabaseService.client
                    .from('items_pedido')
                    .delete()
                    .eq('pedido_id', pedidoId);

                if (errorDeleteItems) throw errorDeleteItems;

            } else {
                // ---- CAMINO A: PEDIDO NUEVO DESDE CERO (PUNTO 12) ----
                const { data: nuevoPedido, error: errorPedido } = await this.supabaseService.client
                    .from('pedidos')
                    .insert({
                        ocupacion_id: ocupacionMesaId,
                        estado: 'pendiente_confirmacion',
                        importe_total: this.importeTotal(),
                        tiempo_estimado_preparacion: this.tiempoEstimadoTotal()
                    })
                    .select('id')
                    .single();

                if (errorPedido) throw errorPedido;
                if (!nuevoPedido) throw new Error('No se pudo recuperar el ID del nuevo pedido.');
                
                pedidoId = nuevoPedido.id;
            }

            // 3. INSERCIÓN DE LOS ÍTEMS ACTUALES (Aplica tanto para pedido nuevo como para el reenvío)
            const itemsParaInsertar = itemsActuales.map(item => ({
                pedido_id: pedidoId,
                producto_id: item.producto.id,
                cantidad: item.cantidad,
                precio_unitario: item.producto.precio,
                estado_item: 'en_espera'
            }));

            const { error: errorItems } = await this.supabaseService.client
                .from('items_pedido')
                .insert(itemsParaInsertar);

            if (errorItems) throw errorItems;

            // 4. ÉXITO TOTAL: Vaciamos el carrito local
            this.vaciarPedido();
            return { ok: true };

        } catch (err) {
            console.error('Error en el proceso transaccional del pedido:', err);
            return { ok: false, error: err };
        }
    }
}
