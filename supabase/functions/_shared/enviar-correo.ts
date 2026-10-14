
export async function enviarCorreo(
  destino: string,
  asunto: string,
  html: string,
): Promise<void> {
  const usuario = Deno.env.get('GMAIL_USER') ?? '';

  if (!usuario) {
    throw new Error('Falta configurar GMAIL_USER en los secrets de la función.');
  }

  const accessToken = await obtenerAccessToken();
  const raw = construirMensajeCrudo(usuario, destino, asunto, compactarHtml(html));

  const resp = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    },
  );

  if (!resp.ok) {
    const detalle = await resp.text();
    throw new Error(`La API de Gmail respondió ${resp.status}: ${detalle}`);
  }
}

async function obtenerAccessToken(): Promise<string> {
  const clientId = Deno.env.get('GMAIL_OAUTH_CLIENT_ID') ?? '';
  const clientSecret = Deno.env.get('GMAIL_OAUTH_CLIENT_SECRET') ?? '';
  const refreshToken = Deno.env.get('GMAIL_OAUTH_REFRESH_TOKEN') ?? '';

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Faltan GMAIL_OAUTH_CLIENT_ID / GMAIL_OAUTH_CLIENT_SECRET / GMAIL_OAUTH_REFRESH_TOKEN en los secrets de la función.',
    );
  }

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await resp.json();
  if (!resp.ok || !data.access_token) {
    throw new Error(`No se pudo renovar el token de Gmail: ${JSON.stringify(data)}`);
  }

  return data.access_token as string;
}

function construirMensajeCrudo(
  remitente: string,
  destino: string,
  asunto: string,
  html: string,
): string {
  const mensaje =
    `From: Brasa Viva <${remitente}>\r\n` +
    `To: ${destino}\r\n` +
    `Subject: ${codificarAsuntoRFC2047(asunto)}\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: text/html; charset="UTF-8"\r\n` +
    `Content-Transfer-Encoding: 8bit\r\n` +
    `\r\n` +
    html;

  return base64UrlEncode(mensaje);
}

function codificarAsuntoRFC2047(asunto: string): string {
  return `=?UTF-8?B?${base64Simple(asunto)}?=`;
}

function base64Simple(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let binario = '';
  bytes.forEach((b) => (binario += String.fromCharCode(b)));
  return btoa(binario);
}

function base64UrlEncode(texto: string): string {
  return base64Simple(texto)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function compactarHtml(html: string): string {
  return html.replace(/\s*\n\s*/g, ' ').trim();
}
