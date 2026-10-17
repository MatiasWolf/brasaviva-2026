import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { json } from '../_shared/cors.ts';
import { autorizadoPorWebhook } from '../_shared/webhook-auth.ts';
import { enviarPush, fcmConfigurado } from '../_shared/fcm.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function err(mensaje: string, status = 400): Response {
    return json({ error: mensaje }, status);
    }

    Deno.serve(async (req) => {
    if (req.method !== 'POST') {
        return err('Método no permitido.', 405);
    }

    if (!autorizadoPorWebhook(req)) {
        return err('No autorizado.', 401);
    }

    if (!fcmConfigurado()) {
        return err('FCM no configurado.', 500);
    }

    let payload: { record?: Record<string, unknown> };
    try {
        payload = await req.json();
    } catch {
        return err('Cuerpo de solicitud inválido.');
    }

    const registro = payload.record;
    if (!registro || registro['estado'] !== 'confirmado') {
        return json({ ignorado: true });
    }

    const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: ocupacion } = await admin
        .from('ocupaciones_mesa')
        .select('mesa_id, mesas(numero)')
        .eq('id', registro['ocupacion_id'])
        .maybeSingle();

    const numeroMesa = (ocupacion as any)?.mesas?.numero ?? 'desconocida';
    const total = String(registro['total_final'] ?? '');

    const { data: filas, error: tokensErr } = await admin
        .from('push_tokens')
        .select('token, usuarios!inner(roles!inner(nombre))')
        .in('usuarios.roles.nombre', ['dueño', 'supervisor']);

    if (tokensErr) {
        console.error('Error al leer tokens:', tokensErr);
        return err('No se pudieron leer los destinatarios.', 500);
    }

    if (!filas?.length) {
        return json({ enviados: 0, motivo: 'sin destinatarios' });
    }

    const tokens = filas.map((f: any) => f.token as string);

    const { enviados, destinatarios, tokensInvalidos } = await enviarPush(
        tokens,
        { title: 'Pago confirmado', body: `Mesa ${numeroMesa} pagó $${total}. Mesa liberada.` },
        { tipo: 'pago_confirmado', ocupacion_id: String(registro['ocupacion_id']) },
    );

    if (tokensInvalidos.length) {
        await admin.from('push_tokens').delete().in('token', tokensInvalidos);
    }

    return json({ enviados, destinatarios });
});