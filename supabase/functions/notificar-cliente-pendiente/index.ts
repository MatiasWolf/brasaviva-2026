import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';
import { json } from '../_shared/cors.ts';
import { autorizadoPorWebhook } from '../_shared/webhook-auth.ts';

// La llama un Database Webhook de Supabase (Database > Webhooks) configurado
// sobre INSERT en la tabla "usuarios", con el header x-webhook-secret puesto
// a mano. Ver supabase/functions/notificar-cliente-pendiente/README.md.

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
 * Cambia la clave privada de la cuenta de servicio de Firebase por un access
 * token de Google OAuth2, válido por 1 hora, para poder llamar a la API
 * HTTP v1 de FCM (la API "legacy" con server key está deprecada).
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
    throw new Error(
      `No se pudo obtener el token de acceso de FCM: ${JSON.stringify(data)}`,
    );
  }
  return data.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return err('Método no permitido.', 405);
  }

  if (!autorizadoPorWebhook(req)) {
    return err('No autorizado.', 401);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !FCM_PROJECT_ID || !FCM_SERVICE_ACCOUNT_JSON) {
    return err('La función no está configurada (faltan variables de entorno).', 500);
  }

  let payload: { record?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return err('El cuerpo de la solicitud no es válido.');
  }

  const registro = payload.record;
  if (!registro || registro['estado'] !== 'pendiente') {
    // No es una fila que nos interese (empleados nunca quedan en "pendiente").
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

  const { data: tokens, error: tokensErr } = await admin
    .from('push_tokens')
    .select('token, usuarios!inner(roles!inner(nombre))')
    .in('usuarios.roles.nombre', ['dueño', 'supervisor']);

  if (tokensErr) {
    console.error('Error al leer los tokens de notificación:', tokensErr);
    return err('No se pudieron leer los destinatarios.', 500);
  }

  if (!tokens?.length) {
    return json({ enviados: 0, motivo: 'sin destinatarios' });
  }

  let accessToken: string;
  try {
    accessToken = await obtenerAccessTokenFcm();
  } catch (e) {
    console.error(e);
    return err('No se pudo autenticar contra Firebase Cloud Messaging.', 500);
  }

  const apellido = String(registro['apellido'] ?? '');
  const nombre = String(registro['nombre'] ?? '');
  const tokensInvalidos: string[] = [];

  const resultados = await Promise.allSettled(
    (tokens as FilaToken[]).map(async ({ token }) => {
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
              notification: {
                title: 'Nuevo cliente esperando aprobación',
                body: `${apellido}, ${nombre} se registró y espera tu aprobación.`,
              },
              data: {
                tipo: 'cliente_pendiente',
                usuario_id: String(registro['id'] ?? ''),
              },
              android: { priority: 'high' },
            },
          }),
        },
      );

      if (!resp.ok) {
        const detalle = await resp.text();
        if (resp.status === 404 || /UNREGISTERED|NOT_FOUND/i.test(detalle)) {
          tokensInvalidos.push(token);
        } else {
          console.error('Error de FCM:', resp.status, detalle);
        }
      }
    }),
  );

  if (tokensInvalidos.length) {
    // Limpieza: tokens de instalaciones desinstaladas o expiradas.
    await admin.from('push_tokens').delete().in('token', tokensInvalidos);
  }

  const enviados = resultados.filter((r) => r.status === 'fulfilled').length;
  return json({ enviados, destinatarios: tokens.length });
});
