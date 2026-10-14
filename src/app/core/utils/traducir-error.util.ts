const MENSAJE_GENERICO = 'Ocurrió un problema. Intentá nuevamente más tarde.';

const MENSAJES_POR_CODIGO_SQL: Record<string, string> = {
  '23502': 'Faltan datos obligatorios.',
  '23503': 'No se puede completar: hay datos relacionados que lo impiden.',
  '23505': 'Ya existe un registro con esos datos.',
  '22001': 'Uno de los datos ingresados es demasiado largo.',
  '22P02': 'Uno de los datos ingresados no tiene un formato válido.',
  '42501': 'Tu usuario no tiene permisos para realizar esta acción.',
  '42P01': 'Error interno (tabla no encontrada). Avisá al administrador.',
  '08006': 'Se perdió la conexión con el servidor. Intentá de nuevo.',
  '57014': 'La operación tardó demasiado. Intentá de nuevo.',
};

const MENSAJES_POR_CODIGO_SUPABASE: Record<string, string> = {
  PGRST116: 'No se encontró el registro solicitado.',
  PGRST301: 'Tu sesión expiró. Iniciá sesión de nuevo.',
  invalid_credentials: 'Correo o contraseña incorrectos.',
  email_not_confirmed: 'Debés confirmar tu correo electrónico antes de ingresar.',
  user_already_exists: 'Ese correo ya se encuentra registrado.',
  email_exists: 'Ese correo ya se encuentra registrado.',
  weak_password: 'La contraseña es demasiado débil.',
  over_request_rate_limit: 'Demasiados intentos. Esperá un momento y volvé a intentar.',
  same_password: 'La nueva contraseña tiene que ser distinta de la actual.',
};

const PATRONES_POR_TEXTO: [RegExp, string][] = [
  [/network|fetch|failed to fetch/i, 'Sin conexión. Revisá tu internet e intentá de nuevo.'],
  [/permission denied|row-level security/i, 'Tu usuario no tiene permisos para realizar esta acción.'],
  [/duplicate key|already exists|already registered/i, 'Ya existe un registro con esos datos.'],
  [/bucket not found/i, 'No se encontró el depósito de archivos. Avisá al administrador.'],
  [/jwt|token/i, 'Tu sesión expiró. Iniciá sesión de nuevo.'],
];

export function traducirErrorSupabase(
  error: unknown,
  mensajePorDefecto: string = MENSAJE_GENERICO,
): string {
  const codigo = (error as { code?: string } | undefined)?.code;

  if (codigo) {
    if (MENSAJES_POR_CODIGO_SQL[codigo]) {
      return MENSAJES_POR_CODIGO_SQL[codigo];
    }
    if (MENSAJES_POR_CODIGO_SUPABASE[codigo]) {
      return MENSAJES_POR_CODIGO_SUPABASE[codigo];
    }
  }

  const mensaje = (error as { message?: string } | undefined)?.message ?? '';
  for (const [patron, traduccion] of PATRONES_POR_TEXTO) {
    if (patron.test(mensaje)) {
      return traduccion;
    }
  }

  if (!codigo && error instanceof Error && mensaje) {
    return mensaje;
  }

  return mensajePorDefecto;
}
