import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const ROLES_ADMIN = ['dueño', 'supervisor'];

export const ROLES_ASIGNABLES = [
  'supervisor',
  'metre',
  'mozo',
  'cocinero',
  'cantinero',
];

export interface Contexto {
  admin: SupabaseClient;
  callerId: string;
  callerRol: string;
}

export async function resolverAdmin(
  req: Request,
  errorResponse: (mensaje: string, status: number) => Response,
): Promise<Contexto | Response> {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!url || !anonKey || !serviceKey) {
    return errorResponse(
      'La función no está configurada (faltan variables de entorno de Supabase).',
      500,
    );
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader) {
    return errorResponse('No autenticado.', 401);
  }

  const supabaseCaller = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user: caller },
    error: callerErr,
  } = await supabaseCaller.auth.getUser();

  if (callerErr || !caller) {
    return errorResponse('Tu sesión no es válida. Volvé a iniciar sesión.', 401);
  }

  const admin = createClient(url, serviceKey);

  const { data: perfil, error: perfilErr } = await admin
    .from('usuarios')
    .select('estado, rol_id')
    .eq('id', caller.id)
    .maybeSingle();

  if (perfilErr) {
    return errorResponse(
      `No pudimos leer tu perfil: ${perfilErr.message}`,
      403,
    );
  }
  if (!perfil) {
    return errorResponse(
      'No encontramos tu perfil (no hay una fila en "usuarios" para tu usuario).',
      403,
    );
  }
  if (perfil.estado === 'rechazado') {
    return errorResponse('Tu cuenta está rechazada.', 403);
  }

  const { data: rol, error: rolErr } = await admin
    .from('roles')
    .select('nombre')
    .eq('id', perfil.rol_id)
    .maybeSingle();

  if (rolErr) {
    return errorResponse(`No pudimos leer tu rol: ${rolErr.message}`, 403);
  }

  const callerRol = rol?.nombre ?? '';

  if (!ROLES_ADMIN.includes(callerRol)) {
    return errorResponse(
      `No tenés permisos para gestionar empleados (tu rol es "${callerRol || 'desconocido'}").`,
      403,
    );
  }

  return { admin, callerId: caller.id, callerRol };
}
