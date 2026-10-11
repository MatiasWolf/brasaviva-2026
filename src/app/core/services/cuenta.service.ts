import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { PedidoService } from './pedido.service';
import { JuegoService } from './juego.service';
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
    private readonly pedidoService = inject(PedidoService);
    private readonly juegoService = inject(JuegoService);
    private readonly clienteService = inject(ClienteService);
    private readonly authService = inject(AuthService);
    private readonly anonymousSession = inject(AnonymousSessionService);

    readonly propinaPorcentaje = signal<number | null>(null);
    readonly itemsEntregados = signal<ItemDetalleCuenta[]>([]);
    readonly cargandoCuenta = signal<boolean>(false);
    readonly pedidoIdVincular = signal<number | null>(null);
    readonly juegoDescuentoPorcentaje = signal<number>(0);

    readonly subtotal = computed(() => {
        return this.itemsEntregados().reduce((sum, item) => sum + item.importe, 0);
    });

    // Calcula el monto a restar basado en el subtotal de consumos entregados
    readonly juegoDescuentoMonto = computed(() => {
        const porcentaje = this.juegoDescuentoPorcentaje();
        if (porcentaje <= 0) return 0;
        return this.subtotal() * (porcentaje / 100);
    });

    // Calcula el subtotal neto después de aplicar el beneficio del juego
    readonly subtotalConDescuento = computed(() => {
        return this.subtotal() - this.juegoDescuentoMonto();
    });

    // Calcula el monto de la propina en base al subtotal neto con descuento
    readonly propinaMonto = computed(() => {
        const porcentaje = this.propinaPorcentaje();
        if (!porcentaje || porcentaje <= 0) return 0;
        return this.subtotalConDescuento() * (porcentaje / 100);
    });

    // El TOTAL final que se mostrará en la pantalla 
    readonly totalFinal = computed(() => {
        return this.subtotalConDescuento() + this.propinaMonto();
    });


    /**
     * Consulta Supabase buscando los pedidos finalizados ('entregado') de la estadía actual
     * y mapea sus ítems con los precios unitarios cobrados.
     */
    async cargarConsumosEntregados(): Promise<boolean> {
        const ocupacionId = this.pedidoService.ocupacionMesaId;
        if (!ocupacionId) {
        console.warn('No hay una ocupación de mesa vinculada para calcular la cuenta.');
        return false;
        }

        this.cargandoCuenta.set(true);
        try {
        // Buscar los pedidos de la ocupación que ya fueron entregados en la mesa
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
            .eq('ocupacion_id', ocupacionId)
            .eq('estado', 'entregado');

        if (errorPedidos) throw errorPedidos;

        if (!pedidos || pedidos.length === 0) {
            this.itemsEntregados.set([]);
            this.pedidoIdVincular.set(null);
            return false;
        }

        // Guardar el ID del último pedido entregado para asociarlo al pago posterior
        this.pedidoIdVincular.set(pedidos[pedidos.length - 1].id);

        // Mapear y aplanar todas las líneas de ítems de consumo
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
   * Verifica si el usuario actual es registrado y si ganó algún descuento
   * en su primer intento de juego.
   */
    async verificarDescuentoJuegos(): Promise<number> {
        this.juegoDescuentoPorcentaje.set(0);
        try {
        const esRegistrado = await this.clienteService.esClienteRegistrado();
        if (!esRegistrado || !this.authService.usuarioActual) {
            return 0; // Los anónimos o deslogueados no tienen descuento
        }

        const uid = this.authService.usuarioActual.id;
        const resultadoJuego = await this.juegoService.obtenerResultadoActual(uid);

        if (resultadoJuego && resultadoJuego.gano) {
            this.juegoDescuentoPorcentaje.set(resultadoJuego.descuento);
            return resultadoJuego.descuento;
        }
        return 0;
        } catch (err) {
        console.error('Error al verificar descuento de juegos:', err);
        return 0;
        }
    }

    /**
     * Mapea el texto leído del código QR de propinas a su valor numérico real.
     * Si el código no pertenece a la empresa, retorna -1 para disparar error.
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
     * Registra la transacción inicial del pago simulado en Supabase.
     * Deja el registro en estado 'pendiente_confirmacion'.
     */
    async registrarSolicitudPago(): Promise<boolean> {
        const ocupacionId = this.pedidoService.ocupacionMesaId;
        const pedidoId = this.pedidoIdVincular();

        if (!ocupacionId || !pedidoId || this.propinaPorcentaje() === null) {
        console.error('Faltan parámetros obligatorios para registrar el pago.');
        return false;
        }

        try {
        const { error } = await this.supabase.client
            .from('pagos')
            .insert({
            pedido_id: pedidoId,
            ocupacion_id: ocupacionId,
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


    // --- GESTIÓN DEL MOZO ---

    /**
     * El mozo confirma el pago pendiente: transacciona la finalización de la estadía,
     * libera la mesa poniéndola vacía y desvincula al cliente (registrado o anónimo) 
     * devolviendo su estado_estadia a 'sin_estadia'.
     */
    async confirmarPagoYLiberarMesa(pagoId: number, datosPago: any): Promise<boolean> {
        try {
        // 1. Actualizar el estado de la tabla pagos a 'confirmado'
        const { error: errorPago } = await this.supabase.client
            .from('pagos')
            .update({ estado: 'confirmado' })
            .eq('id', pagoId);

        if (errorPago) throw errorPago;

        // 2. Finalizar el estado de la ocupación de la mesa
        const { error: errorOcupacion } = await this.supabase.client
            .from('ocupaciones_mesa')
            .update({ 
            estado: 'finalizada',
            fecha_salida: new Date().toISOString()
            })
            .eq('id', datosPago.ocupacion_id);

        if (errorOcupacion) throw errorOcupacion;

        // 3. Liberar la mesa física (Volver a disponibilidad 'vacia')
        const { error: errorMesa } = await this.supabase.client
            .from('mesas')
            .update({ disponibilidad: 'vacia' })
            .eq('id', datosPago.ocupaciones_mesa?.mesa_id);

        if (errorMesa) throw errorMesa;

        // 4. Devolver al cliente a 'sin_estadia' evaluando su tipo de cuenta
        const registradoId = datosPago.ocupaciones_mesa?.usuario_id;
        const anonimoId = datosPago.ocupaciones_mesa?.sesion_anonima_id;

        if (registradoId) {
            const { error: errorUser } = await this.supabase.client
            .from('usuarios')
            .update({ estado_estadia: 'sin_estadia' })
            .eq('id', registradoId);
            if (errorUser) throw errorUser;
        } else if (anonimoId) {
            const { error: errorAnon } = await this.supabase.client
            .from('sesiones_anonimas')
            .update({ estado_estadia: 'sin_estadia' })
            .eq('id', anonimoId);
            if (errorAnon) throw errorAnon;
        }

        return true;
        } catch (err) {
        console.error('Error crítico al confirmar el pago y liberar la mesa:', err);
        return false;
        }
    }
}