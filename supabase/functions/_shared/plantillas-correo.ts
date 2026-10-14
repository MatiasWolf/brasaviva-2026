const LOGO_URL =
  Deno.env.get('LOGO_URL') ??
  'https://placehold.co/160x160/2a1204/ffd485?text=Brasa+Viva';

interface DatosCorreo {
  nombre: string;
  apellido: string;
}

function envoltorio(contenido: string, colorFondoExterior: string): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Brasa Viva</title>
  </head>
  <body style="margin:0; padding:0; background:${colorFondoExterior};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colorFondoExterior}; padding: 32px 12px;">
      <tr>
        <td align="center">
          ${contenido}
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function plantillaRechazado(datos: DatosCorreo): { asunto: string; html: string } {
  const nombreCompleto = `${datos.nombre} ${datos.apellido}`.trim();

  const contenido = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background:#f4f1ee; border:1px solid #cfc7bd; border-radius:4px; font-family: Georgia, 'Times New Roman', Times, serif;">
      <tr>
        <td style="background:#2a2622; padding:28px 36px; border-radius:4px 4px 0 0;" align="center">
          <img src="${LOGO_URL}" alt="Brasa Viva" width="56" height="56" style="display:block; margin: 0 auto 10px;" />
          <span style="color:#cbb896; font-size:13px; letter-spacing:3px; text-transform:uppercase;">Brasa Viva</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 36px 40px 8px;">
          <h1 style="margin:0 0 22px; color:#2a2622; font-size:21px; font-weight:400; font-style:italic; border-bottom:1px solid #cfc7bd; padding-bottom:14px;">
            Novedades sobre tu registro
          </h1>
          <p style="margin:0 0 16px; color:#3a352f; font-size:15px; line-height:1.7;">
            Estimado/a ${nombreCompleto},
          </p>
          <p style="margin:0 0 16px; color:#3a352f; font-size:15px; line-height:1.7;">
            Revisamos tu solicitud de registro como cliente en <strong>Brasa Viva</strong> y,
            por el momento, no fue posible aprobarla.
          </p>
          <p style="margin:0 0 26px; color:#3a352f; font-size:15px; line-height:1.7;">
            Si creés que se trata de un error o querés más información, podés
            acercarte al restaurante y consultar con el encargado.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 40px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #cfc7bd;">
            <tr>
              <td style="padding-top:18px; color:#847c6f; font-size:12px; font-style:italic;">
                Este mensaje se generó automáticamente, por favor no lo respondas.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;

  return {
    asunto: 'Brasa Viva — Novedades sobre tu registro',
    html: envoltorio(contenido, '#e7e3dd'),
  };
}

export function plantillaAprobado(datos: DatosCorreo): { asunto: string; html: string } {
  const contenido = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background:#fff3df; border-radius:20px; overflow:hidden; font-family: 'Trebuchet MS', 'Segoe UI', Verdana, sans-serif; box-shadow: 0 8px 24px rgba(58,23,11,0.15);">
      <tr>
        <td style="background:linear-gradient(135deg, #ffb347 0%, #e9820e 100%); padding:34px 36px;" align="center">
          <img src="${LOGO_URL}" alt="Brasa Viva" width="72" height="72" style="display:block; margin: 0 auto 12px;" />
          <span style="color:#2a1204; font-size:15px; font-weight:800; letter-spacing:1px; text-transform:uppercase;">Brasa Viva</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 38px 40px 10px;" align="center">
          <div style="font-size:44px; line-height:1; margin-bottom:10px;">🎉</div>
          <h1 style="margin:0 0 20px; color:#4d200f; font-size:28px; font-weight:800;">
            ¡Ya sos parte de Brasa Viva!
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 40px 8px;">
          <p style="margin:0 0 16px; color:#5a3420; font-size:16px; line-height:1.6;">
            Hola ${datos.nombre},
          </p>
          <p style="margin:0 0 16px; color:#5a3420; font-size:16px; line-height:1.6;">
            Tu registro fue <strong style="color:#c0631a;">aprobado</strong>. Ya podés iniciar
            sesión en la aplicación con tu correo y contraseña, y empezar a disfrutar
            de <strong>Brasa Viva</strong>.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 40px 34px;" align="center">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#4d200f; border-radius:999px; padding:14px 32px;">
                <span style="color:#ffe0a3; font-size:15px; font-weight:700;">¡Te esperamos!</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 40px 30px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e9c990;">
            <tr>
              <td style="padding-top:16px; color:#a17040; font-size:12px;">
                Este mensaje se generó automáticamente, por favor no lo respondas.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;

  return {
    asunto: '¡Tu registro en Brasa Viva fue aprobado!',
    html: envoltorio(contenido, '#fdf6ec'),
  };
}
