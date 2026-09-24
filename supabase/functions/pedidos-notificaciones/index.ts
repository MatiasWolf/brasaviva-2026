import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';
import { json } from '../_shared/cors.ts';
import { autorizadoPorWebhook } from '../_shared/webhook-auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const FCM_PROJECT_ID = Deno.env.get('FCM_PROJECT_ID') ?? '';
const FCM_SERVICE_ACCOUNT_JSON = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON') ?? '';

interface CuentaServicio {
    client_email: string;
    private_key: string;
}

interface FilaToken {
    token: string;
}

function err(mensaje: string, status = 400): Response {
    return json({ error: mensaje }, status);
}

/**
 * Intercambia la clave de Firebase por un token OAuth2 de Google (Vigencia 1 hora)
 */
async function obtenerAccessTokenFcm(): Promise<string> {
    const cuenta = JSON.parse(FCM_SERVICE_ACCOUNT_JSON) as CuentaServicio;

    const pem = cuenta.private_key
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\s/g, '');
    const bytes = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));

    const clave = await crypto.subtle.importKey(
        'pkcs8',
        bytes,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign'],
    );

    const jwt = await create(
        { alg: 'RS256', typ: 'JWT' },
        {
            iss: cuenta.client_email,
            scope: 'https://www.googleapis.com/auth/firebase.messaging',
            aud: 'https://oauth2.googleapis.com/token',
            iat: getNumericDate(0),
            exp: getNumericDate(3600),
        },
        clave,
    );

    const resp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    });

    const data = await resp.json();
    if (!resp.ok || !data.access_token) {
        throw new Error(`No se pudo obtener el token de acceso de FCM: ${JSON.stringify(data)}`);
    }
    return data.access_token as string;
}

/**
 * Envia notificaciones push a un array de tokens obtenidos de la base de datos
 */
async function enviarNotificaciones(
    admin: SupabaseClient,
    tokens: FilaToken[],
    titulo: string,
    cuerpo: string,
    dataPayload: Record<string, string>
): Promise<number> {
    if (!tokens || tokens.length === 0) return 0;

    let accessToken: string;
    try {
        accessToken = await obtenerAccessTokenFcm();
    } catch (e) {
        console.error(e);
        throw new Error('No se pudo autenticar contra Firebase Cloud Messaging.');
    }

    const tokensInvalidos: string[] = [];
    const resultados = await Promise.allSettled(
        tokens.map(async ({ token }) => {
            const resp = await fetch(
                `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: {
                            token,
                            notification: { title: titulo, body: cuerpo },
                            data: dataPayload,
                            android: { priority: 'high' },
                        },
                    }),
                }
            );

            if (!resp.ok) {
                const detalle = await resp.text();
                if (resp.status === 404 || /UNREGISTERED|NOT_FOUND/i.test(detalle)) {
                    tokensInvalidos.push(token);
                } else {
                    console.error('Error de FCM:', resp.status, detalle);
                }
            }
        })
    );

    if (tokensInvalidos.length > 0) {
        await admin.from('push_tokens').delete().in('token', tokensInvalidos);
    }

    return resultados.filter((r) => r.status === 'fulfilled').length;
}

Deno.serve(async (req) => {
    if (req.method !== 'POST') return err('Método no permitido.', 405);
    if (!autorizadoPorWebhook(req)) return err('No autorizado.', 401);

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !FCM_PROJECT_ID || !FCM_SERVICE_ACCOUNT_JSON) {
        return err('La función no está configurada (faltan variables de entorno).', 500);
    }

    let payload: { record?: Record<string, unknown>; old_record?: Record<string, unknown> };
    try {
        payload = await req.json();
    } catch {
        return err('El cuerpo de la solicitud no es válido.');
    }

    const registro = payload.record;
    if (!registro) return err('No se encontró el registro modificado.');
    
    const anterior = payload.old_record;
    if (anterior && registro['estado'] === anterior['estado']) {
        return json({ ignorado: true, motivo: 'sin cambio de estado' });
    }

    const pedidoId = String(registro['id'] ?? '');
    const estado = String(registro['estado'] ?? '');

    const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    switch (estado) {
        case 'pendiente_confirmacion': {
            //Notificación al mozo al crearse el pedido en la mesa
            const { data: tokensMozo, error: errM } = await admin
                .from('push_tokens')
                .select('token, usuarios!inner(roles!inner(nombre))')
                .eq('usuarios.roles.nombre', 'mozo');

            if (errM) return err('Error consultando tokens de mozos.', 500);
            
            const enviados = await enviarNotificaciones(
                admin,
                tokensMozo as FilaToken[],
                '¡Nuevo pedido para revisar!',
                `Se registró la comanda N° ${pedidoId}. Revisá la sección de nuevos ingresos.`,
                { tipo: 'pedido_nuevo', pedido_id: pedidoId }
            );
            return json({ enviados, destinatarios: tokensMozo?.length ?? 0 });
        }

        case 'rechazado': {
            //El mozo rechaza el pedido, viaja al cliente de la mesa (registrado o anónimo)
            const ocupacionId = registro['ocupacion_id'];
            if (!ocupacionId) return json({ ignorado: true, motivo: 'Sin ocupacion_id' });

            const { data: ocupacion, error: errOcup } = await admin
                .from('ocupaciones_mesa')
                .select('usuario_id, sesion_anonima_id, mesas(numero)')
                .eq('id', ocupacionId)
                .single();

            if (errOcup || !ocupacion) return err('No se pudo encontrar la ocupación de la mesa.', 500);

            const nroMesa = ocupacion.mesas?.numero ?? '?';
            
            // Construimos una query dinámica OR para capturar el token de la sesión correspondiente
            let queryTokens = admin.from('push_tokens').select('token');
            if (ocupacion.usuario_id && ocupacion.sesion_anonima_id) {
                queryTokens = queryTokens.or(`usuario_id.eq.${ocupacion.usuario_id},sesion_anonima_id.eq.${ocupacion.sesion_anonima_id}`);
            } else if (ocupacion.usuario_id) {
                queryTokens = queryTokens.eq('usuario_id', ocupacion.usuario_id);
            } else if (ocupacion.sesion_anonima_id) {
                queryTokens = queryTokens.eq('sesion_anonima_id', ocupacion.sesion_anonima_id);
            } else {
                return json({ enviados: 0, motivo: 'Ocupación sin cliente asignado' });
            }

            const { data: tokensCliente, error: errC } = await queryTokens;
            if (errC) return err('Error consultando tokens del cliente.', 500);

            const enviados = await enviarNotificaciones(
                admin,
                tokensCliente as FilaToken[],
                'Pedido rechazado',
                `Tu pedido N° ${pedidoId} de la Mesa ${nroMesa} fue rechazado por el mozo para modificaciones.`,
                { tipo: 'pedido_rechazado', pedido_id: pedidoId }
            );
            return json({ enviados, destinatarios: tokensCliente?.length ?? 0 });
        }

        case 'en_preparacion': {
            const { data: items, error: itemsErr } = await admin
                .from('items_pedido')
                .select('sector')
                .eq('pedido_id', pedidoId);

            if (itemsErr || !items?.length) {
                console.error('Error leyendo ítems:', itemsErr);
                return err('No se pudieron leer los sectores de los ítems.', 500);
            }

            const tieneCocina = items.some((i: any) => i.sector === 'cocina');
            const tieneBar = items.some((i: any) => i.sector === 'bar');

            let allTokens: FilaToken[] = [];

            if (tieneCocina) {
                const { data: tokensCocina, error: errCocina } = await admin
                    .from('push_tokens')
                    .select('token, usuarios!inner(roles!inner(nombre))')
                    .eq('usuarios.roles.nombre', 'cocinero');

                if (errCocina) {
                    console.error('Error tokens cocina:', errCocina);
                    return err('Error consultando tokens de cocina.', 500);
                }
                if (tokensCocina) allTokens = [...allTokens, ...(tokensCocina as FilaToken[])];
            }

            if (tieneBar) {
                const { data: tokensBar, error: errBar } = await admin
                    .from('push_tokens')
                    .select('token, usuarios!inner(roles!inner(nombre))')
                    .eq('usuarios.roles.nombre', 'cantinero');

                if (errBar) {
                    console.error('Error tokens bar:', errBar);
                    return err('Error consultando tokens de bar.', 500);
                }
                if (tokensBar) allTokens = [...allTokens, ...(tokensBar as FilaToken[])];
            }

            if (allTokens.length === 0) {
                return json({ enviados: 0, motivo: 'sin tokens en sectores' });
            }

            const enviados = await enviarNotificaciones(
                admin,
                allTokens,
                '¡Nueva comanda asignada! 🍳',
                `Llegaron nuevos ítems del pedido N° ${pedidoId} a tu sector para elaborar.`,
                { tipo: 'pedido_derivado', pedido_id: pedidoId }
            );
            return json({ enviados, destinatarios: allTokens.length });
        }

        case 'listo': {
            // PUNTO 18: Cocina y bar terminaron. El pedido completo está listo y se le avisa al mozo
            const { data: tokensMozo, error: errM } = await admin
                .from('push_tokens')
                .select('token, usuarios!inner(roles!inner(nombre))')
                .eq('usuarios.roles.nombre', 'mozo');

            if (errM) return err('Error consultando tokens de mozos para entrega.', 500);

            const enviados = await enviarNotificaciones(
                admin,
                tokensMozo as FilaToken[],
                '¡Pedido listo para retirar!',
                `El pedido N° ${pedidoId} está listo. Retiralo del sector correspondiente para servirlo.`,
                { tipo: 'pedido_listo', pedido_id: pedidoId }
            );
            return json({ enviados, destinatarios: tokensMozo?.length ?? 0 });
        }

        default:
            return json({ ignorado: true, motivo: `El estado '${estado}' no dispara push automáticas` });
    }
});