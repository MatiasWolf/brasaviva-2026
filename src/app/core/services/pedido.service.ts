import { computed, inject, Injectable, signal } from '@angular/core';
import { ItemCarrito, Producto } from '../models/pedido.models';
import { SupabaseService } from './supabase.service';
import { AnonymousSessionService } from './anonymous-session.service';

@Injectable({
    providedIn: 'root' 
})
export class PedidoService {
    private supabaseService = inject(SupabaseService);
    private anonymousSession = inject(AnonymousSessionService);

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
            if (itemExistente.cantidad >= 20) {
                console.warn(`Limite alcanzado: No se pueden pedir mas de 20 unidades de ${producto.nombre}`);
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

    async enviarPedidoAConfirmar(ocupacionMesaId: number) {
        const items = this.pedido();

        if (items.length === 0) {
            return { ok: false, error: new Error('El pedido está vacío.') };
        }

        try {
            // El pedido se cuelga de la ocupacion: de ahi sale la mesa.
            const ocupacion = await this.ocupacionActiva(ocupacionMesaId);

            const { data: pedido, error: errorPedido } =
                await this.supabaseService.client
                    .from('pedidos')
                    .insert({
                        ocupacion_id: ocupacion.id,
                        estado: 'pendiente',
                        importe_total: this.importeTotal(),
                        tiempo_estimado_preparacion: this.tiempoEstimadoTotal(),
                    })
                    .select('id')
                    .single();

            if (errorPedido) throw errorPedido;

            const { error: errorItems } =
                await this.supabaseService.client
                    .from('items_pedido')
                    .insert(
                        items.map(item => ({
                            pedido_id: pedido.id,
                            producto_id: item.producto.id,
                            cantidad: item.cantidad,
                            precio_unitario: item.producto.precio,
                            sector: this.sectorDe(item.producto),
                            estado_item: 'pendiente',
                        }))
                    );

            if (errorItems) {
                // Sin items el pedido no sirve: se borra la cabecera.
                await this.supabaseService.client
                    .from('pedidos')
                    .delete()
                    .eq('id', pedido.id);

                throw errorItems;
            }

            this.vaciarPedido();

            return { ok: true, pedidoId: pedido.id as number };

        } catch (err) {
            console.error('Error al procesar el pedido:', err);
            return { ok: false, error: err };
        }
    }

    private sectorDe(producto: Producto): 'cocina' | 'bar' {
        return producto.categoria_id === 2 ? 'bar' : 'cocina';
    }

    async ocupacionActiva(
        ocupacionMesaId: number
    ): Promise<{ id: number }> {

        const buscar = async (columna: string, valor: string | number) => {
            const { data } = await this.supabaseService.client
                .from('ocupaciones_mesa')
                .select('id')
                .eq(columna, valor)
                .eq('estado', 'activa')
                .order('fecha_ingreso', { ascending: false })
                .limit(1)
                .maybeSingle();

            return data as { id: number } | null;
        };

        if (ocupacionMesaId) {
            const porId = await buscar('id', ocupacionMesaId);
            if (porId) return porId;
        }

        const { data: sesion } =
            await this.supabaseService.client.auth.getUser();

        if (sesion?.user) {
            const porUsuario = await buscar('usuario_id', sesion.user.id);
            if (porUsuario) return porUsuario;
        }

        const idAnonimo = this.anonymousSession.obtenerIdSesion();

        if (idAnonimo) {
            const porAnonimo = await buscar('sesion_anonima_id', idAnonimo);
            if (porAnonimo) return porAnonimo;
        }

        throw new Error(
            'No encontramos una mesa asignada. Pedile al metre que te asigne una.'
        );
    }
}