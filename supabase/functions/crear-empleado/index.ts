import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';
import { resolverAdmin, ROLES_ASIGNABLES } from '../_shared/permisos.ts';

const BUCKET_FOTOS = 'fotos-perfiles';

interface Payload {
  apellido?: string;
  nombre?: string;
  dni?: string;
  cuil?: string;
  correo?: string;
  password?: string;
  rol?: string;
  fotoBase64?: string;
}

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
  const { admin } = ctx;

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return err('El cuerpo de la solicitud no es válido.');
  }

  const apellido = (body.apellido ?? '').trim();
  const nombre = (body.nombre ?? '').trim();
  const dni = (body.dni ?? '').trim();
  const cuil = (body.cuil ?? '').trim();
  const correo = (body.correo ?? '').trim().toLowerCase();
  const password = body.password ?? '';
  const rol = (body.rol ?? '').trim();
  const fotoBase64 = body.fotoBase64 ?? '';

  if (apellido.length < 2 || nombre.length < 2) {
    return err('Nombre y apellido son obligatorios.');
  }
  if (!/^\d{7,8}$/.test(dni)) {
    return err('El DNI debe tener entre 7 y 8 dígitos.');
  }
  if (!/^\d{11}$/.test(cuil)) {
    return err('El CUIL debe tener 11 dígitos.');
  }
  if (cuil.slice(2, 10) !== dni.padStart(8, '0')) {
    return err('El CUIL no se corresponde con el DNI ingresado.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return err('El correo electrónico no es válido.');
  }
  if (password.length < 6) {
    return err('La contraseña debe tener al menos 6 caracteres.');
  }
  if (!ROLES_ASIGNABLES.includes(rol)) {
    return err('El rol seleccionado no es válido.');
  }
  if (!fotoBase64.startsWith('data:image/')) {
    return err('La foto de perfil es obligatoria.');
  }

  const { data: rolRow, error: rolErr } = await admin
    .from('roles')
    .select('id')
    .eq('nombre', rol)
    .single();

  if (rolErr || !rolRow) {
    return err('No se encontró el rol seleccionado.');
  }

  const { data: creado, error: createErr } = await admin.auth.admin.createUser({
    email: correo,
    password,
    email_confirm: true,
    // 'origen: empleado' es lo que distingue esta alta de un registro de
    // cliente real en el trigger de auth.users (mismo shape de metadata
    // en ambos casos, salvo por este campo) — así el trigger puede evitar
    // dejar pasar, aunque sea un instante, una fila "pendiente" con rol
    // cliente_registrado que dispara la notificación de cliente nuevo.
    user_metadata: { apellido, nombre, dni, origen: 'empleado' },
  });

  if (createErr || !creado?.user) {
    const detalle = createErr?.message ?? '';
    let msg = detalle || 'No se pudo crear el usuario.';
    if (/already been registered|already registered|already exists/i.test(detalle)) {
      msg = 'Ese correo ya se encuentra registrado.';
    } else if (/duplicate key|unique constraint/i.test(detalle)) {
      msg = 'Ya existe un empleado con ese DNI o correo.';
    }
    return err(msg);
  }

  const nuevoId = creado.user.id;

  try {
    const fotoUrl = await subirFoto(admin, nuevoId, fotoBase64);

    const { error: updErr } = await admin
      .from('usuarios')
      .update({
        rol_id: rolRow.id,
        estado: 'aprobado',
        cuil,
        foto_url: fotoUrl,
      })
      .eq('id', nuevoId);

    if (updErr) {
      throw updErr;
    }
  } catch (e) {
    await admin.auth.admin.deleteUser(nuevoId).catch(() => {});
    await admin.from('usuarios').delete().eq('id', nuevoId).catch(() => {});
    console.error('Error completando el alta, se revirtió:', e);
    return err(
      'No se pudo completar el alta del empleado. No se creó ninguna cuenta.',
      500,
    );
  }

  return json({ ok: true, id: nuevoId }, 201);
});

async function subirFoto(
  admin: SupabaseClient,
  userId: string,
  dataUrl: string,
): Promise<string> {
  const coma = dataUrl.indexOf(',');
  const meta = dataUrl.slice(0, coma);
  const base64 = dataUrl.slice(coma + 1);
  const contentType = /data:(.*?);base64/.exec(meta)?.[1] ?? 'image/jpeg';
  const ext = contentType.includes('png') ? 'png' : 'jpg';

  const binaria = atob(base64);
  const bytes = new Uint8Array(binaria.length);
  for (let i = 0; i < binaria.length; i++) {
    bytes[i] = binaria.charCodeAt(i);
  }

  const path = `${userId}.${ext}`;
  const { error } = await admin.storage
    .from(BUCKET_FOTOS)
    .upload(path, bytes, { contentType, upsert: true });

  if (error) {
    throw error;
  }

  return admin.storage.from(BUCKET_FOTOS).getPublicUrl(path).data.publicUrl;
}
