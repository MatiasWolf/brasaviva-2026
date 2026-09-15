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

    async enviarPedidoAConfirmar(ocupacionMesaId: number) {
        try {
        console.log('Enviando pedido para la ocupación de mesa:', ocupacionMesaId);
        console.log('Detalle del pedido:', this.pedido());
        console.log('Total a cobrar:', this.importeTotal());
        console.log('Tiempo estimado total:', this.tiempoEstimadoTotal());

        this.vaciarPedido();
        
        return { ok: true };
        } catch (err) {
        console.error('Error al procesar el pedido:', err);
        return { ok: false, error: err };
        }
    }
}
