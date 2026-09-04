# Edge Functions — Brasa Viva

| Función | Qué hace | Quién puede llamarla |
|---|---|---|
| `crear-empleado` | Crea la cuenta de un empleado (Auth + fila en `usuarios` + foto) sin cerrar la sesión del admin | dueño / supervisor |
| `eliminar-empleado` | Borra la cuenta de un empleado (fila + usuario de Auth + foto) | dueño / supervisor |

Ambas validan el JWT de quien llama y su rol antes de hacer nada. Usan la
variable `SUPABASE_SERVICE_ROLE_KEY`, que Supabase inyecta automáticamente en
las funciones deployadas (no se guarda en el repo).

## Requisitos (una sola vez)

```bash
# El CLI ya está como devDependency: se instala con `npm install`.
npx supabase login                       # abre el navegador
npx supabase link --project-ref bmmrcsqogbhkayzurspc
```

## Deploy

```bash
npx supabase functions deploy crear-empleado
npx supabase functions deploy eliminar-empleado
```

## SQL

Antes de usar la feature hay que correr una vez `supabase/sql/empleados_setup.sql`
en el **SQL Editor** del panel de Supabase (policies RLS + botón del menú).

## Probar en local (opcional)

```bash
npx supabase start
npx supabase functions serve crear-empleado --env-file supabase/functions/.env.local
```
