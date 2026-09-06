import { computed, inject, Injectable, signal } from '@angular/core';
import { ItemCarrito, Producto } from '../models/pedido.models';
import { SupabaseService } from './supabase.service';

@Injectable({
    providedIn: 'root' 
})
export class PedidoService {
    private supabaseService = inject(SupabaseService);

    // --- SIGNALS ---

    // Almacena la lista de productos de la base de datos 
    public productos = signal<Producto[]>([]);

    // Almacena los productos seleccionados por el cliente 
    public pedido = signal<ItemCarrito[]>([]);

     // Flag para controlar el spinner de carga obligatorio 
    public cargandoProductos = signal<boolean>(false);

    // --- SIGNALS COMPUTADAS ---
    
    // Calcula el importe acumulado sumando el precio por la cantidad de cada ítem
    public importeTotal = computed(() => {
        return this.pedido().reduce((total, item) => total + (item.producto.precio * item.cantidad), 0);
    });

    // Calcula el tiempo estimado total basándose en el producto que más demora
    public tiempoEstimadoTotal = computed(() => {
        const items = this.pedido();
        if (items.length === 0){
            return 0;
        }
        return Math.max(...items.map(item => item.producto.tiempo_preparacion));
    });

    // Calcula la cantidad total de unidades en el carrito
    public cantidadTotalItems = computed(() => {
        return this.pedido().reduce((total, item) => total + item.cantidad, 0);
    });


    // --- MÉTODOS DE GESTIÓN DEL PEDIDO ---

    // Suma un producto al pedido o incrementa su cantidad si ya existe
    agregarAlPedido(producto: Producto) {
        const pedidoActual = this.pedido();
        const itemExistente = pedidoActual.find(item => item.producto.id === producto.id);

        if (itemExistente) {
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

    // Resta una unidad o remueve el producto por completo si llega a 0
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

    // Vacía el pedido 
    vaciarPedido() {
        this.pedido.set([]);
    }

    // --- MÉTODOS DE BASE DE DATOS CON SUPABASE ---

    // Trae los platos y bebidas que tengan 'disponible' en true desde Supabase
    async obtenerProductosMenu() {
        this.cargandoProductos.set(true);
        
        try {
        const { data, error } = await this.supabaseService.client
            .from('productos')
            .select('*')
            .eq('disponible', true);

        if (error) throw error;
        
        // Guardamos los productos en la Signal
        this.productos.set(data || []);
        
        } catch (err) {
        console.error('Error al cargar la carta desde Supabase:', err);
        } finally {
        this.cargandoProductos.set(false);
        }
    }

    // Método provisional para que compile la interfaz visual
    async enviarPedidoAConfirmar(ocupacionMesaId: number) {
        try {
        console.log('Enviando pedido para la ocupación de mesa:', ocupacionMesaId);
        console.log('Detalle del pedido:', this.pedido());
        console.log('Total a cobrar:', this.importeTotal());
        console.log('Tiempo estimado total:', this.tiempoEstimadoTotal());

        // Por ahora, solo simulamos el éxito vaciando el pedido local
        this.vaciarPedido();
        
        return { ok: true };
        } catch (err) {
        console.error('Error al procesar el pedido:', err);
        return { ok: false, error: err };
        }
    }
}
