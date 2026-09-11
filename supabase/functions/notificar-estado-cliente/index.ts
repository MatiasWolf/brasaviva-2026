import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { json } from '../_shared/cors.ts';
import { plantillaAprobado, plantillaRechazado } from '../_shared/plantillas-correo.ts';
import { enviarCorreo } from '../_shared/enviar-correo.ts';
import { autorizadoPorWebhook } from '../_shared/webhook-auth.ts';

// La llama un Database Webhook de Supabase (Database > Webhooks) configurado
// sobre UPDATE en la tabla "usuarios", con el header x-webhook-secret puesto
// a mano. Ver docs/notificaciones-email.md.

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

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
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

  // Solo nos interesa la transición "pendiente" -> "aprobado"/"rechazado".
  // Así no se manda un correo de nuevo si en el futuro se toca cualquier
  // otro campo de un cliente ya resuelto.
  const nuevoEstado = registro?.['estado'];
  const estadoAnterior = anterior?.['estado'];

  if (
    !registro ||
    estadoAnterior !== 'pendiente' ||
    (nuevoEstado !== 'aprobado' && nuevoEstado !== 'rechazado')
  ) {
    return json({ ignorado: true });
  }

  const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: rol } = await admin
    .from('roles')
    .select('nombre')
    .eq('id', registro['rol_id'])
    .maybeSingle();

  if (rol?.nombre !== 'cliente_registrado') {
    return json({ ignorado: true });
  }

  const correo = String(registro['correo'] ?? '');
  if (!correo) {
    return err('El registro no tiene correo electrónico.', 500);
  }

  const datos = {
    nombre: String(registro['nombre'] ?? ''),
    apellido: String(registro['apellido'] ?? ''),
  };

  const { asunto, html } =
    nuevoEstado === 'aprobado' ? plantillaAprobado(datos) : plantillaRechazado(datos);

  try {
    await enviarCorreo(correo, asunto, html);
  } catch (e) {
    console.error('Error al enviar el correo de estado del cliente:', e);
    return err('No se pudo enviar el correo.', 500);
  }

  return json({ enviado: true, estado: nuevoEstado });
});
