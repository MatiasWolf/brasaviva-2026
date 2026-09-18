import { create, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

/**
 * Utilidades para mandar notificaciones push por Firebase Cloud Messaging.
 *
 * Se separó acá porque lo usan dos funciones distintas:
 *   - notificar-cliente-pendiente (punto 6, Wolf)
 *   - notificar-pedido-listo      (punto 18, Moyano)
 */

const FCM_PROJECT_ID = Deno.env.get('FCM_PROJECT_ID') ?? '';
const FCM_SERVICE_ACCOUNT_JSON = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON') ?? '';

interface CuentaServicio {
  client_email: string;
  private_key: string;
}

export interface ResultadoEnvio {
  enviados: number;
  destinatarios: number;
  tokensInvalidos: string[];
}

export function fcmConfigurado(): boolean {
  return Boolean(FCM_PROJECT_ID && FCM_SERVICE_ACCOUNT_JSON);
}

/**
 * Cambia la clave privada de la cuenta de servicio por un access token de
 * Google OAuth2, válido una hora, para poder usar la API HTTP v1 de FCM
 * (la "legacy" con server key está deprecada).
 */
export async function obtenerAccessTokenFcm(): Promise<string> {
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
      'No se pudo obtener el token de acceso de FCM: ' + JSON.stringify(data),
    );
  }

  return data.access_token as string;
}

/**
 * Manda la misma notificación a varios dispositivos.
 * Devuelve también los tokens que FCM rechazó, para poder limpiarlos.
 */
export async function enviarPush(
  tokens: string[],
  notificacion: { title: string; body: string },
  datos: Record<string, string>,
): Promise<ResultadoEnvio> {
  const accessToken = await obtenerAccessTokenFcm();
  const tokensInvalidos: string[] = [];

  const resultados = await Promise.allSettled(
    tokens.map(async (token) => {
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
              notification: notificacion,
              data: datos,
              android: { priority: 'high' },
            },
          }),
        },
      );

      if (!resp.ok) {
        const detalle = await resp.text();

        // Token de una instalación que ya no existe: se limpia.
        if (resp.status === 404 || /UNREGISTERED|NOT_FOUND/i.test(detalle)) {
          tokensInvalidos.push(token);
        } else {
          console.error('Error de FCM:', resp.status, detalle);
        }

        throw new Error('FCM respondió ' + resp.status);
      }
    }),
  );

  return {
    enviados: resultados.filter((r) => r.status === 'fulfilled').length,
    destinatarios: tokens.length,
    tokensInvalidos,
  };
}
