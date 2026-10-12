import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ClienteService } from './cliente.service';
import { AuthService } from './auth.service';
import { AnonymousSessionService } from './anonymous-session.service';

export interface ItemDetalleCuenta {
    producto_nombre: string;
    cantidad: number;
    precio_unitario: number;
    importe: number;
    }

    @Injectable({
    providedIn: 'root'
    })
    export class CuentaService {
    private readonly supabase = inject(SupabaseService);
    private readonly clienteService = inject(ClienteService);
    private readonly authService = inject(AuthService);
    private readonly anonymousSession = inject(AnonymousSessionService);

    // Signals reactivas para el estado financiero de la cuenta
    readonly propinaPorcentaje = signal<number | null>(null);
    readonly itemsEntregados = signal<ItemDetalleCuenta[]>([]);
    readonly cargandoCuenta = signal<boolean>(false);
    readonly juegoDescuentoPorcentaje = signal<number>(0);
    
    // Guardado local de la ocupación y de todos los pedidos válidos cobrados
    public ocupacionMesaId: number | null = null;
    private idsPedidosAsociados: number[] = [];

    // Cálculos matemáticos en caliente usando Computed para el flujo estilo Mercado Pago
    readonly subtotal = computed(() => {
        return this.itemsEntregados().reduce((sum, item) => sum + item.importe, 0);
    });

    readonly juegoDescuentoMonto = computed(() => {
        const porcentaje = this.juegoDescuentoPorcentaje();
        if (porcentaje <= 0) return 0;
        return this.subtotal() * (porcentaje / 100);
    });

    readonly subtotalConDescuento = computed(() => {
        return this.subtotal() - this.juegoDescuentoMonto();
    });

    readonly propinaMonto = computed(() => {
        const porcentaje = this.propinaPorcentaje();
        if (!porcentaje || porcentaje <= 0) return 0;
        return this.subtotalConDescuento() * (porcentaje / 100);
    });

    readonly totalFinal = computed(() => {
        return this.subtotalConDescuento() + this.propinaMonto();
    });

    /**
     * Busca de forma directa la ocupación en estado 'activa' evaluando de manera autónoma
     * si el cliente posee una sesión registrada o anónima en el salón.
     */
    async obtenerOcupacionActivaLocal(): Promise<number | null> {
        try {
        let usuarioId: string | null = null;
        let sesionAnonimaId: string | null = null;

        if (this.authService.usuarioActual) {
            usuarioId = this.authService.usuarioActual.id;
        } else {
            sesionAnonimaId = this.anonymousSession.obtenerIdSesion();
        }

        if (!usuarioId && !sesionAnonimaId) {
            console.warn('No se detectó ninguna sesión activa para procesar la cuenta.');
            this.ocupacionMesaId = null;
            return null;
        }

        let consulta = this.supabase.client
            .from('ocupaciones_mesa')
            .select('id')
            .eq('estado', 'activa'); // Filtramos únicamente las estadías sentadas y consumiendo

        if (usuarioId) {
            consulta = consulta.eq('usuario_id', usuarioId);
        } else {
            consulta = consulta.eq('sesion_anonima_id', sesionAnonimaId);
        }

        const { data, error } = await consulta
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            this.ocupacionMesaId = data.id;
            return data.id;
        }

        this.ocupacionMesaId = null;
        return null;
        } catch (err) {
        console.error('Error al recuperar ocupacion_id para la cuenta:', err);
        this.ocupacionMesaId = null;
        return null;
        }
    }

    /**
     * Consulta en Supabase la totalidad de los pedidos en estado 'entregado' o 'en_mesa'
     * de la estadía y unifica sus ítems para evitar fugas de saldos.
     */
    async cargarConsumosEntregados(): Promise<boolean> {
        if (!this.ocupacionMesaId) {
        console.warn('No hay una ocupación de mesa vinculada para calcular la cuenta.');
        return false;
        }

        this.cargandoCuenta.set(true);
        try {
        const { data: pedidos, error: errorPedidos } = await this.supabase.client
            .from('pedidos')
            .select(`
            id,
            items_pedido (
                cantidad,
                precio_unitario,
                productos ( nombre )
            )
            `)
            .eq('ocupacion_id', this.ocupacionMesaId)
            .eq('estado', 'entregado'); // Ajustado estrictamente al estado solicitado por la consigna

        if (errorPedidos) throw errorPedidos;

        if (!pedidos || pedidos.length === 0) {
            this.itemsEntregados.set([]);
            this.idsPedidosAsociados = [];
            return false;
        }

        // Guardamos la referencia de todos los IDs de pedidos para la FK de la tabla pagos
        this.idsPedidosAsociados = pedidos.map(p => p.id);

        const listaMapeada: ItemDetalleCuenta[] = [];
        pedidos.forEach((p: any) => {
            if (p.items_pedido) {
            p.items_pedido.forEach((item: any) => {
                listaMapeada.push({
                producto_nombre: item.productos?.nombre || 'Producto',
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario,
                importe: item.cantidad * item.precio_unitario
                });
            });
            }
        });

        this.itemsEntregados.set(listaMapeada);
        return listaMapeada.length > 0;
        } catch (err) {
        console.error('Error al cargar consumos para la cuenta:', err);
        return false;
        } finally {
        this.cargandoCuenta.set(false);
        }
    }

    /**
     * Verifica de forma directa en Supabase si el cliente registrado obtuvo un descuento
     * válido para la estadía actual del salón.
     */
    async verificarDescuentoJuegos(): Promise<number> {
        this.juegoDescuentoPorcentaje.set(0);
        if (!this.ocupacionMesaId) return 0;

        try {
        const esRegistrado = await this.clienteService.esClienteRegistrado();
        if (!esRegistrado) {
            return 0; // Clientes anónimos no participan por descuentos según la consigna
        }

        const { data: juegos, error } = await this.supabase.client
            .from('juegos_descuentos')
            .select('descuento')
            .eq('ocupacion_mesa_id', this.ocupacionMesaId)
            .eq('gano', true);

        if (error) throw error;

        if (juegos && juegos.length > 0) {
            // Si por algún error del juego se guardara más de uno, otorgamos el máximo beneficio
            const maxDescuento = Math.max(...juegos.map(j => j.descuento));
            this.juegoDescuentoPorcentaje.set(maxDescuento);
            return maxDescuento;
        }
        return 0;
        } catch (err) {
        console.error('Error al verificar descuento de juegos en Supabase:', err);
        return 0;
        }
    }

    /**
     * Realiza el mapeo exacto de los strings de los QR físicos a sus porcentajes reales.
     */
    evaluarQrPropina(texto: string): number {
        switch (texto.trim()) {
        case 'Excelente': return 20;
        case 'Muy Bueno': return 15;
        case 'Bueno':     return 10;
        case 'Regular':   return 5;
        case 'Malo':      return 0;
        default:          return -1; // Código inválido o ajeno al restaurante
        }
    }

    /**
     * Registra la transacción inicial del pago simulado en Supabase en estado pendiente.
     */
    async registrarSolicitudPago(): Promise<boolean> {
        const pedidoId = this.idsPedidosAsociados[0]; // Tomamos el primer ID de pedido como cabecera para la relación FK obligatoria

        if (!this.ocupacionMesaId || !pedidoId || this.propinaPorcentaje() === null) {
        console.error('Faltan parámetros obligatorios para registrar la solicitud de pago.');
        return false;
        }

        try {
        const { error } = await this.supabase.client
            .from('pagos')
            .insert({
            pedido_id: pedidoId,
            ocupacion_id: this.ocupacionMesaId,
            subtotal: this.subtotal(),
            descuento_juego_porcentaje: this.juegoDescuentoPorcentaje(),
            descuento_juego_monto: this.juegoDescuentoMonto(),
            propina_porcentaje: this.propinaPorcentaje(),
            propina_monto: this.propinaMonto(),
            total_final: this.totalFinal(),
            estado: 'pendiente_confirmacion'
            });

        if (error) throw error;
        return true;
        } catch (err) {
        console.error('Error al insertar el registro de pago en Supabase:', err);
        return false;
        }
    }
}