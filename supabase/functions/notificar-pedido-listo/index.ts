import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { json } from '../_shared/cors.ts';
import { autorizadoPorWebhook } from '../_shared/webhook-auth.ts';
import { enviarPush, fcmConfigurado } from '../_shared/fcm.ts';

// Punto 18 - Aviso de pedido completo.
// La llama un Database Webhook sobre UPDATE en "pedidos", con el header
// x-webhook-secret. El pedido pasa a "listo" solo, por el trigger
// pedidos_recalcular_estado, cuando cocina y bar terminaron sus items.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const ROLES_A_AVISAR = ['mozo', 'dueño', 'supervisor'];

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

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !fcmConfigurado()) {
    return err('La función no está configurada (faltan variables de entorno).', 500);
  }

  let payload: {
    record?: Record<string, unknown>;
    old_record?: Record<string, unknown>;
  };

  try {
    payload = await req.json();
  } catch {
    return err('El cuerpo de la solicitud no es válido.');
  }

  const registro = payload.record;
  const anterior = payload.old_record;

  // Solo la transicion a "listo": si no, la entrega volveria a notificar.
  if (
    !registro ||
    registro['estado'] !== 'listo' ||
    anterior?.['estado'] === 'listo'
  ) {
    return json({ ignorado: true });
  }

  const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // El pedido no guarda la mesa: se llega por la ocupacion.
  const { data: ocupacion } = await admin
    .from('ocupaciones_mesa')
    .select('mesas ( numero )')
    .eq('id', registro['ocupacion_id'])
    .maybeSingle();

  const mesaEmbebida = (ocupacion as { mesas?: unknown } | null)?.mesas;
  const mesa = (Array.isArray(mesaEmbebida) ? mesaEmbebida[0] : mesaEmbebida) as
    | { numero: number }
    | undefined;

  const numeroMesa = mesa?.numero ?? '?';

  const { data: tokens, error: tokensErr } = await admin
    .from('push_tokens')
    .select('token, usuarios!inner(roles!inner(nombre))')
    .in('usuarios.roles.nombre', ROLES_A_AVISAR);

  if (tokensErr) {
    console.error('Error al leer los tokens de notificación:', tokensErr);
    return err('No se pudieron leer los destinatarios.', 500);
  }

  if (!tokens?.length) {
    return json({ enviados: 0, motivo: 'sin destinatarios' });
  }

  const pedidoId = String(registro['id'] ?? '');

  try {
    const resultado = await enviarPush(
      (tokens as { token: string }[]).map((t) => t.token),
      {
        title: 'Pedido listo para entregar',
        body: `La mesa ${numeroMesa} tiene el pedido completo.`,
      },
      {
        tipo: 'pedido_listo',
        pedido_id: pedidoId,
        mesa_numero: String(numeroMesa),
      },
    );

    if (resultado.tokensInvalidos.length) {
      await admin
        .from('push_tokens')
        .delete()
        .in('token', resultado.tokensInvalidos);
    }

    return json({
      enviados: resultado.enviados,
      destinatarios: resultado.destinatarios,
      mesa: numeroMesa,
    });
  } catch (e) {
    console.error('No se pudo notificar el pedido listo:', e);
    return err('No se pudo enviar la notificación.', 500);
  }
});
