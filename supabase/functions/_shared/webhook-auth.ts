const WEBHOOK_SECRET = Deno.env.get('CLIENTES_PENDIENTES_WEBHOOK_SECRET') ?? '';

export function autorizadoPorWebhook(req: Request): boolean {
  const recibido = req.headers.get('x-webhook-secret') ?? '';

  if (!WEBHOOK_SECRET) {
    console.error(
      'CLIENTES_PENDIENTES_WEBHOOK_SECRET no está configurado como secret de la función.',
    );
    return false;
  }

  if (recibido !== WEBHOOK_SECRET) {
    console.error(
      `x-webhook-secret no coincide. Largo recibido: ${recibido.length} (esperado: ${WEBHOOK_SECRET.length}).` +
        (recibido.length !== WEBHOOK_SECRET.length
          ? ' Los largos son distintos: revisá si el secret configurado quedó con comillas, espacios o un salto de línea de más.'
          : ' Mismo largo pero contenido distinto: revisá que el header configurado en el webhook sea exactamente el mismo valor que el secret.'),
    );
    return false;
  }

  return true;
}
