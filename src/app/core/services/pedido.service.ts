import { computed, inject, Injectable, signal } from '@angular/core';
import { ItemCarrito, Producto } from '../models/pedido.models';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { AnonymousSessionService } from './anonymous-session.service';

@Injectable({
    providedIn: 'root' 
})
export class PedidoService {
    private supabaseService = inject(SupabaseService);
    private authService = inject(AuthService);
    private anonymousService = inject(AnonymousSessionService);

    public productos = signal<Producto[]>([]);
 
    public pedido = signal<ItemCarrito[]>([]);

    private respaldoPedido: ItemCarrito[] = [];

    public tiempoEstimadoPedido = signal<number>(0);

    public horaConfirmacionPedido: string | null = null;

    public cargandoProductos = signal<boolean>(false);

    public ocupacionMesaId: number | null = null;

    public pedidosPendientesMozo = signal<any[]>([]);
    public pedidosEnPreparacionMozo = signal<any[]>([]); 
    public pedidosListosMozo = signal<any[]>([]);        
    private mozoRealtimeChannel: any = null;

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

    public estadoPedidoActual = signal<string | null>(null);
    private pedidoRealtimeChannel: any = null;

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

    /**
     * Busca el ocupacion_id de la mesa en Supabase 
     * evaluando si el cliente es registrado o anónimo.
     */
    async cargarOcupacionMesaId(): Promise<number | null> {
        try {
            let usuarioId: string | null = null;
            let sesionAnonimaId: string | null = null;

            // 1. Verificar si hay un usuario registrado logueado
            if (this.authService.usuarioActual) {
                usuarioId = this.authService.usuarioActual.id;
            } else {
                // 2. Si no, buscar el ID de la sesión anónima en el localStorage
                sesionAnonimaId = this.anonymousService.obtenerIdSesion();
            }

            // Si no encontramos ninguna sesión activa, no se puede buscar ocupación
            if (!usuarioId && !sesionAnonimaId) {
                console.warn('No se detectó ninguna sesión activa (registrada o anónima) para buscar la mesa.');
                this.ocupacionMesaId = null;
                return null;
            }

            // 3. Inicializar la consulta apuntando a las ocupaciones vigentes
            let consulta = this.supabaseService.client
                .from('ocupaciones_mesa')
                .select('id')
                .in('estado', ['asignada', 'activa']);

            // 4. Aplicar los filtros de identificación antes de cerrar la estructura de la consulta
            if (usuarioId) {
                consulta = consulta.eq('usuario_id', usuarioId);
            } else {
                consulta = consulta.eq('sesion_anonima_id', sesionAnonimaId);
            }

            // 5. Ordenar y ejecutar la llamada trayendo un único registro
            const { data, error } = await consulta
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                this.ocupacionMesaId = data.id;
                console.log(`Ocupación de mesa vinculada con éxito. ID: ${this.ocupacionMesaId}`);
                return data.id;
            } else {
                console.warn('No se encontró ninguna ocupación de mesa activa en Supabase para este cliente.');
                this.ocupacionMesaId = null;
                return null;
            }

        } catch (err) {
            console.error('Error al recuperar el ocupacion_id dinámico desde Supabase:', err);
            this.ocupacionMesaId = null;
            return null;
        }
    }

    async enviarPedidoAConfirmar(): Promise<{ ok: boolean; productosAgotados?: string[]; error?: any }> {
    try {
        const itemsActuales = this.pedido();
        if (itemsActuales.length === 0) {
            throw new Error('No se puede enviar un pedido vacío.');
        }

        // 1. VALIDACIÓN PREVENTIVA DE DISPONIBILIDAD
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
            .eq('ocupacion_id', this.ocupacionMesaId)
            .eq('estado', 'rechazado')
            .maybeSingle();

        if (errorBusqueda) throw errorBusqueda;

        let pedidoId: number;

        if (pedidoExistente) {
            pedidoId = pedidoExistente.id;

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
        } else {
            const { data: nuevoPedido, error: errorPedido } = await this.supabaseService.client
                .from('pedidos')
                .insert({
                    ocupacion_id: this.ocupacionMesaId,
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

        // 3. INSERCIÓN DE LOS ÍTEMS ACTUALES 
        const itemsParaInsertar = itemsActuales.map(item => ({
            pedido_id: pedidoId,
            producto_id: item.producto.id,
            cantidad: item.cantidad,
            precio_unitario: item.producto.precio,
            estado_item: 'en_espera',
            sector: item.producto.categoria_id === 1 ? 'cocina' : 'bar'
        }));

        const { error: errorItems } = await this.supabaseService.client
            .from('items_pedido')
            .insert(itemsParaInsertar);

        if (errorItems) throw errorItems;

        // ---- 4. RESPALDO DEL PEDIDO POR SI ES RECHAZADO ----
        this.respaldoPedido = itemsActuales.map(item => ({ ...item }));

        this.vaciarPedido();
        return { ok: true };

    } catch (err) {
        console.error('Error en el proceso transaccional del pedido:', err);
        return { ok: false, error: err };
    }
}

    /**
   * Carga el estado actual del pedido y abre la escucha en tiempo real
   */
    async escucharEstadoPedido() {
        // 1. PRIMERO: Hacer una consulta rápida para saber en qué estado nació el pedido
        try {
        const { data: pedidoActual, error: errorFetch } = await this.supabaseService.client
            .from('pedidos')
            .select('estado, tiempo_estimado_preparacion, updated_at')
            .eq('ocupacion_id', this.ocupacionMesaId)
            // Buscamos el pedido que no esté finalizado (o el último creado)
            .order('created_at', { ascending: false }) 
            .limit(1)
            .maybeSingle();

        if (errorFetch) throw errorFetch;
        
        if (pedidoActual) {
            this.estadoPedidoActual.set(pedidoActual.estado);
            this.tiempoEstimadoPedido.set(pedidoActual.tiempo_estimado_preparacion || 0);
            this.horaConfirmacionPedido = pedidoActual.updated_at 
                ? new Date(pedidoActual.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                : null;

            if (pedidoActual.estado === 'en_preparacion' || pedidoActual.estado === 'listo') {
                    this.borrarRespaldoPedido();
                }
        }
        } catch (err) {
        console.error('Error al recuperar el estado inicial del pedido:', err);
        }

        // 2. SEGUNDO: Dejar el canal Realtime encendido para los cambios futuros
        if (this.pedidoRealtimeChannel) {
        this.supabaseService.client.removeChannel(this.pedidoRealtimeChannel);
        }

        this.pedidoRealtimeChannel = this.supabaseService.client
        .channel('seguimiento-pedido-cliente')
        .on(
            'postgres_changes',
            {
            event: 'UPDATE',
            schema: 'public',
            table: 'pedidos',
            filter: `ocupacion_id=eq.${this.ocupacionMesaId}`
            },
            (payload: any) => {
                console.log('Cambio detectado en tiempo real:', payload.new);
                this.estadoPedidoActual.set(payload.new.estado);
                this.tiempoEstimadoPedido.set(payload.new.tiempo_estimado_preparacion || 0);

                if (payload.new.estado === 'en_preparacion') {
                    this.borrarRespaldoPedido();
                }
            }
        )
        .subscribe();
    }

    //Cierra el canal de escucha del pedido
    desconectarseDelPedido() {
        if (this.pedidoRealtimeChannel) {
        this.supabaseService.client.removeChannel(this.pedidoRealtimeChannel);
        this.pedidoRealtimeChannel = null;
        this.estadoPedidoActual.set(null);
        }
    }

    public restaurarPedidoDesdeRespaldo() {
        if (this.respaldoPedido.length > 0) {
            this.pedido.set([...this.respaldoPedido]);
            this.respaldoPedido = []; 
        }
    }

    public borrarRespaldoPedido() {
        this.respaldoPedido = [];
    }



    /* ----------  METODOS PARA EL MOZO  ---------- */

    /**
     * Enciende la escucha en tiempo real de todos los pedidos divididos en 3 listas
     */
    async escucharPedidosMozo() {
        await this.cargarDatosMozo();

        if (this.mozoRealtimeChannel) {
            this.supabaseService.client.removeChannel(this.mozoRealtimeChannel);
        }

        this.mozoRealtimeChannel = this.supabaseService.client
            .channel('gestion-global-pedidos-mozo')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'pedidos' },
                async () => {
                    // Refrescar las 3 listas ante cualquier cambio 
                    await this.cargarDatosMozo();
                }
            )
            .subscribe();
    }

    /**
     * Sincroniza y divide los pedidos según su estado de progreso
     */
    private async cargarDatosMozo() {
        try {
            const consultaBase = `
                id, 
                ocupacion_id, 
                estado, 
                importe_total, 
                tiempo_estimado_preparacion,
                ocupaciones_mesa ( 
                    mesa_id, usuario_id, sesion_anonima_id, 
                    mesas ( numero ) 
                ),
                items_pedido (
                    cantidad,
                    precio_unitario,
                    productos ( nombre )
                )
            `;
            
            // 1. Pestaña: Por Confirmar 
            const { data: pendientes } = await this.supabaseService.client
                .from('pedidos')
                .select(consultaBase)
                .eq('estado', 'pendiente_confirmacion');
            this.pedidosPendientesMozo.set(pendientes || []);

            // 2. Pestaña: En Cocina 
            const { data: enPreparacion } = await this.supabaseService.client
                .from('pedidos')
                .select(consultaBase)
                .eq('estado', 'en_preparacion');
            this.pedidosEnPreparacionMozo.set(enPreparacion || []);

            // 3. Pestaña: Para Servir 
            const { data: listos } = await this.supabaseService.client
                .from('pedidos')
                .select(consultaBase)
                .eq('estado', 'listo');
            this.pedidosListosMozo.set(listos || []);

        } catch (err) {
            console.error('Error al mapear las 3 pestañas del mozo:', err);
        }
    }

    /**
     * Apaga los canales de escucha del mozo y limpia las signals
     */
    desconectarseDePedidosMozo() {
        if (this.mozoRealtimeChannel) {
            this.supabaseService.client.removeChannel(this.mozoRealtimeChannel);
            this.mozoRealtimeChannel = null;
            this.pedidosPendientesMozo.set([]);
            this.pedidosEnPreparacionMozo.set([]);
            this.pedidosListosMozo.set([]);
        }
    }

    /**
     * Confirma el pedido, lo manda a preparación y cambia la estadía del usuario
     */
    async confirmarPedidoMozo(pedidoId: number, ocupacionData: any): Promise<boolean> {
        try {
            const { error: errorPedido } = await this.supabaseService.client
                .from('pedidos')
                .update({ estado: 'en_preparacion', updated_at: new Date().toISOString() })
                .eq('id', pedidoId);

            if (errorPedido) throw errorPedido;

            const { error: errorItems } = await this.supabaseService.client
                .from('items_pedido')
                .update({ estado_item: 'en_preparacion' })
                .eq('pedido_id', pedidoId);

            if (errorItems) throw errorItems;

            this.borrarRespaldoPedido();

            const clienteId = ocupacionData.usuario_id || ocupacionData.sesion_anonima_id;
            const tablaDestino = ocupacionData.usuario_id ? 'usuarios' : 'sesiones_anonimas';

            if (clienteId) {
                const { error: errorEstadia } = await this.supabaseService.client
                    .from(tablaDestino)
                    .update({ estado_estadia: 'pedido_confirmado' })
                    .eq('id', clienteId);

                if (errorEstadia) throw errorEstadia;
            }
            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * Rchaza el pedido y limpia la tabla items_pedido 
     */
    async rechazarPedidoMozo(pedidoId: number): Promise<boolean> {
        try {
            const { error: errorItems } = await this.supabaseService.client
                .from('items_pedido')
                .delete()
                .eq('pedido_id', pedidoId);

            if (errorItems) throw errorItems;

            const { error: errorPedido } = await this.supabaseService.client
                .from('pedidos')
                .update({ estado: 'rechazado', updated_at: new Date().toISOString() })
                .eq('id', pedidoId);

            if (errorPedido) throw errorPedido;

            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * El mozo entrega el pedido completo en la mesa
     */
    async mozoEntregaPedidoCompleto(pedidoId: number, ocupacionData: any): Promise<boolean> {
        try {
            const { error: errorPedido } = await this.supabaseService.client
                .from('pedidos')
                .update({ estado: 'entregado', updated_at: new Date().toISOString() })
                .eq('id', pedidoId);

            if (errorPedido) throw errorPedido;

            const clienteId = ocupacionData.usuario_id || ocupacionData.sesion_anonima_id;
            const tablaDestino = ocupacionData.usuario_id ? 'usuarios' : 'sesiones_anonimas';

            if (clienteId) {
                const { error: errorEstadia } = await this.supabaseService.client
                    .from(tablaDestino)
                    .update({ estado_estadia: 'pedido_entregado' })
                    .eq('id', clienteId);

                if (errorEstadia) throw errorEstadia;
            }
            return true;
        } catch (err) {
            return false;
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