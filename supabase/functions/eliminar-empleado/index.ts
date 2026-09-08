import { corsHeaders, json } from '../_shared/cors.ts';
import { resolverAdmin } from '../_shared/permisos.ts';

const BUCKET_FOTOS = 'fotos-perfiles';

function err(mensaje: string, status = 400): Response {
  return json({ error: mensaje }, status);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return err('Método no permitido.', 405);
  }

  const ctx = await resolverAdmin(req, err);
  if (ctx instanceof Response) {
    return ctx;
  }
  const { admin, callerId } = ctx;

  let id = '';
  try {
    id = (((await req.json()) as { id?: string }).id ?? '').trim();
  } catch {
    return err('El cuerpo de la solicitud no es válido.');
  }

  if (!id) {
    return err('Falta el id del empleado.');
  }
  if (id === callerId) {
    return err('No podés eliminar tu propia cuenta.');
  }

  const { data: objetivo, error: objetivoErr } = await admin
    .from('usuarios')
    .select('id, rol_id')
    .eq('id', id)
    .maybeSingle();

  if (objetivoErr) {
    return err(`No pudimos leer el empleado: ${objetivoErr.message}`, 500);
  }
  if (!objetivo) {
    return err('No se encontró el empleado.', 404);
  }

  const { data: rolObjetivo } = await admin
    .from('roles')
    .select('nombre')
    .eq('id', objetivo.rol_id)
    .maybeSingle();

  if (rolObjetivo?.nombre === 'dueño') {
    return err('No se puede eliminar a un usuario con rol dueño.');
  }

  const { error: delFilaErr } = await admin
    .from('usuarios')
    .delete()
    .eq('id', id);

  if (delFilaErr) {
    const esFk = /foreign key|violates|referenced/i.test(delFilaErr.message);
    return err(
      esFk
        ? 'El empleado tiene datos asociados (pedidos, mesas, etc.). Marcalo como "rechazado" desde la edición en lugar de eliminarlo.'
        : delFilaErr.message,
      esFk ? 409 : 500,
    );
  }

  const { error: delAuthErr } = await admin.auth.admin.deleteUser(id);
  if (delAuthErr) {
    console.error('usuarios borrado pero falló deleteUser:', delAuthErr);
    return err(
      'Se eliminó el perfil pero quedó la cuenta de acceso. Avisá a un administrador.',
      500,
    );
  }

  await admin.storage
    .from(BUCKET_FOTOS)
    .remove([`${id}.jpg`, `${id}.png`])
    .catch(() => {});

  return json({ ok: true });
});
