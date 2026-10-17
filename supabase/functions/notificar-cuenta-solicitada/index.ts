import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { json } from '../_shared/cors.ts';
import { enviarPush, fcmConfigurado } from '../_shared/fcm.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function err(mensaje: string, status = 400): Response {
    return json({ error: mensaje }, status);
    }

    Deno.serve(async (req) => {
        if (req.method === 'OPTIONS') {
            const requestedHeaders = req.headers.get('Access-Control-Request-Headers') ?? '*';
            return new Response('ok', {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': requestedHeaders,
                },
            });
        }
        
    if (req.method !== 'POST') {
        return err('Método no permitido.', 405);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return err('No autorizado.', 401);
    }

    if (!fcmConfigurado()) {
        return err('FCM no configurado.', 500);
    }

    let body: { ocupacion_id?: number };
    try {
        body = await req.json();
    } catch {
        return err('Cuerpo de solicitud inválido.');
    }

    if (!body.ocupacion_id) {
        return err('Falta ocupacion_id.');
    }

    const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: ocupacion } = await admin
        .from('ocupaciones_mesa')
        .select('mesa_id, mesas(numero)')
        .eq('id', body.ocupacion_id)
        .maybeSingle();

    if (!ocupacion) {
        return err('Ocupación no encontrada.', 404);
    }

    const numeroMesa = (ocupacion as any).mesas?.numero ?? 'desconocida';

    const { data: filas, error: tokensErr } = await admin
        .from('push_tokens')
        .select('token, usuarios!inner(roles!inner(nombre))')
        .eq('usuarios.roles.nombre', 'mozo');

    if (tokensErr) {
        console.error('Error al leer tokens:', tokensErr);
        return err('No se pudieron leer los destinatarios.', 500);
    }

    if (!filas?.length) {
        return json({ enviados: 0, motivo: 'sin mozos con token' });
    }

    const tokens = filas.map((f: any) => f.token as string);

    const { enviados, destinatarios, tokensInvalidos } = await enviarPush(
        tokens,
        { title: 'Cuenta solicitada', body: `Mesa ${numeroMesa} solicitó la cuenta.` },
        { tipo: 'cuenta_solicitada', ocupacion_id: String(body.ocupacion_id) },
    );

    if (tokensInvalidos.length) {
        await admin.from('push_tokens').delete().in('token', tokensInvalidos);
    }

    return json({ enviados, destinatarios });
});