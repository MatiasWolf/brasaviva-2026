<p align="center">
  <img src="src/assets/brand/logo.svg" width="140" alt="Logo de Brasa Viva">
</p>

<h1 align="center">Brasa Viva</h1>

<p align="center">
  Aplicación móvil para la gestión integral de un restaurante<br>
  Trabajo Final Integrador — Tecnicatura Universitaria en Programación (UTN Avellaneda), 2026
</p>

<p align="center">
  <img alt="Ionic" src="https://img.shields.io/badge/Ionic-9-3880FF?logo=ionic&logoColor=white">
  <img alt="Angular" src="https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white">
  <img alt="Capacitor" src="https://img.shields.io/badge/Capacitor-Android-119EFF?logo=capacitor&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase&logoColor=white">
</p>

Repositorio: `brasaviva-2026`

---

## 📑 Tabla de contenidos

- [👥 Integrantes del equipo](#integrantes-del-equipo)
- [🛠️ Stack tecnológico](#stack-tecnologico)
- [🚀 Puesta en marcha](#puesta-en-marcha)
  - [Scripts disponibles](#scripts-disponibles)
- [📁 Estructura del proyecto](#estructura-del-proyecto)
- [🗂️ Índice de imágenes del proyecto](#indice-de-imagenes-del-proyecto)
  - [Capturas de pantalla](#capturas-de-pantalla)
- [✅ Estado de avance — Puntos funcionales](#estado-de-avance--puntos-funcionales)
- [🔑 Perfiles de usuario](#perfiles-de-usuario)
- [📲 Códigos QR utilizados](#codigos-qr-utilizados)
- [🧩 Integración y coordinación técnica](#integracion-y-coordinacion-tecnica)

---

## <a id="integrantes-del-equipo"></a>👥 Integrantes del equipo 

| Apellido y Nombre | Usuario GitHub | 
|---|---|
| Wolf, Matias | [@MatiasWolf](https://github.com/MatiasWolf) |
| Moyano, Martín | [@MartinMoyano1](https://github.com/MartinMoyano1) |
| Miguel, Luján | [@Lujan-84](https://github.com/Lujan-84) |
| Torrez, Maximiliano | [@MxmlnST](https://github.com/MxmlnST) |

**Responsable de mantener este README actualizado:** Matias Wolf

---

## <a id="stack-tecnologico"></a>🛠️ Stack tecnológico

- **Framework:** Ionic 9 + Angular 22 (standalone components, signals)
- **App nativa:** Capacitor 8 (Android)
- **Base de datos / Backend:** Supabase (Postgres, Auth, Storage, Realtime, Edge Functions)
- **Control de versiones:** Git / GitHub


---

## <a id="puesta-en-marcha"></a>🚀 Puesta en marcha

> **Requisito:** Node.js **22.22.3+** o **24.15.0+** (Angular CLI 22 no arranca con
> versiones anteriores). Verificar con `node -v` antes de instalar.

```bash
# Clonar el repositorio
git clone https://github.com/MatiasWolf/brasaviva-2026.git
cd brasaviva-2026

# Instalar dependencias
npm install

# Sincronizar el proyecto con Android Studio
npx cap sync android
npx cap open android

# Desde Android Studio, al conectar el celular mediante USB, vas a poder instalar la aplicación en tu celular

# Levantar en modo desarrollo
ionic serve
```

### <a id="scripts-disponibles"></a>Scripts disponibles

| Comando | Qué hace |
|---|---|
| `ionic serve` / `ng serve` | Levanta la app en el navegador en modo desarrollo |
| `ng build` | Compila el build de producción |
| `ng lint` | Corre ESLint sobre todo el proyecto |
| `ng test` | Corre los tests unitarios (Vitest) |

---

## <a id="estructura-del-proyecto"></a>📁 Estructura del proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── models/       # interfaces de dominio (Plato, Bebida, ...)
│   │   └── services/     # acceso a Supabase (auth, tablas, storage)
│   ├── shared/
│   │   └── components/   # componentes reutilizables (spinner-logo, mensaje-modal, ...)
│   ├── home/             # menú principal según el rol
│   ├── pages/            # una carpeta por punto funcional
│   ├── app.routes.ts     # cada punto agrega acá su ruta
│   └── app.component.ts
├── assets/               # íconos, splash e imágenes
├── environments/         # environment.ts (dev) y environment.prod.ts
└── global.scss           # estilos globales

supabase/
├── functions/            # Edge Functions (Deno): altas de empleados, notificaciones por push/mail
└── sql/                  # scripts SQL puntuales (RLS, triggers, parches)
```

> Cada punto funcional se desarrolla en su propia rama y crea su carpeta dentro
> de `src/app/pages/`. Lo que sea común a varios puntos va en `core/` o `shared/`.

---

## <a id="indice-de-imagenes-del-proyecto"></a>🗂️ Índice de imágenes del proyecto

| Imagen | Descripción | Ruta |
|---|---|---|
| <img src="src/assets/brand/logo-mono.svg" width="60" alt="Logo mono"> | Logo en una tinta — usado en login, splash (estática y animada) y el spinner de carga, vía `<app-brand-logo variant="mono">` | `src/assets/brand/logo-mono.svg` |
| <img src="src/assets/brand/logo.svg" width="60" alt="Logo a color"> | Logo a color completo — disponible en `BrandLogoComponent` (`variant="color"`), todavía no se usa en ninguna pantalla | `src/assets/brand/logo.svg` |
| <img src="src/assets/icons/icon-192.webp" width="60" alt="Ícono PWA"> | Ícono de la app para el manifest PWA y "agregar a pantalla de inicio" | `src/assets/icons/icon-48.webp` … `icon-512.webp` |
| <img src="resources/logo.png" width="60" alt="Logo fuente para splash nativo"> | Logo fuente (transparente) para generar el splash nativo con `@capacitor/assets` | `resources/logo.png` |
| <img src="resources/icon_foreground.png" width="60" alt="Ícono adaptativo Android – primer plano"> | Capa de primer plano del ícono adaptativo de Android | `resources/icon_foreground.png` |
| <img src="resources/icon_background.png" width="60" alt="Ícono adaptativo Android – fondo"> | Capa de fondo del ícono adaptativo de Android | `resources/icon_background.png` |

### <a id="capturas-de-pantalla"></a>Capturas de pantalla


| Pantalla | Imagen | Ruta |
|---|---|---|
| Splash | <img src="docs/capturas/splash.png" width="240" alt="Splash"> | `docs/capturas/splash.png` |
| Login | <img src="docs/capturas/login.png" width="240" alt="Login"> | `docs/capturas/login.png` |
| Home (dueño / supervisor) | <img src="docs/capturas/principal.png" width="240" alt="Principal"> | `docs/capturas/principal.png` |
| Listado de empleados | <img src="docs/capturas/empleados.png" width="240" alt="Empleados"> | `docs/capturas/empleados.png` |
| Alta de empleado | <img src="docs/capturas/alta-empleado.png" width="240" alt="Alta empleado"> |`docs/capturas/alta-empleado.png` |
| Listado de mesas | <img src="docs/capturas/mesas.png" width="240" alt="Mesas"> | `docs/capturas/mesas.png` |
| Alta de mesa | <img src="docs/capturas/alta-mesa.png" width="240" alt="Alta mesa"> | `docs/capturas/alta-mesa.png` |
| Carta de platos | <img src="docs/capturas/platos.png" width="240" alt="Carta de platos"> | `docs/capturas/platos.png` |
| Alta de platos | <img src="docs/capturas/alta-platos.png" width="240" alt="Alta de platos"> | `docs/capturas/alta-platos.png` |
| Carta de bebidas | <img src="docs/capturas/bebidas.png" width="240" alt="Carta de bebidas"> | `docs/capturas/bebidas.png` |
| Alta de bebidas | <img src="docs/capturas/alta-bebidas.png" width="240" alt="Alta de bebidas"> | `docs/capturas/alta-bebidas.png` |
| Registro de cliente | <img src="docs/capturas/registro-cliente.png" width="240" alt="Registro de Cliente"> | `docs/capturas/registro-cliente.png` |
| Registro de cliente Anónimo | <img src="docs/capturas/registro-anonimo.png" width="240" alt="Registro de Cliente anónimo"> | `docs/capturas/registro-anonimo.png` |
| Mail de aceptación | <img src="docs/capturas/mail_aceptacion.png" width="500" alt="Mail de aceptación"> | `docs/capturas/mail_aceptacion.png` |
| Mail de rechazo | <img src="docs/capturas/mail_rechazo.png" width="500" alt="Mail de rechazo"> | `docs/capturas/mail_rechazo.png` |
| Lista de espera | <img src="docs/capturas/lista_espera.png" width="240" alt="Lista de espera"> | `docs/capturas/lista_espera.png` |
| Calificación cocina | <img src="docs/capturas/estadisticas_1.png" width="240" alt="estadistica calif cocina"> | `docs/capturas/estadisticas_1.png` |
| Desempeño de personal | <img src="docs/capturas/estadisticas_2.png" width="240" alt="estadistica desemp personal"> | `docs/capturas/estadisticas_2.png` |
| Tiempo de espera | <img src="docs/capturas/estadisticas_3.png" width="240" alt="estadistica tiempo de espera"> | `docs/capturas/estadisticas_3.png` |
| Calificación de fortalezas | <img src="docs/capturas/estadisticas_4.png" width="240" alt="estadistica fortalezas"> | `docs/capturas/estadisticas_4.png` |
| Indice de recomendación | <img src="docs/capturas/estadisticas_5.png" width="240" alt="estadistica indice recomendación"> | `docs/capturas/estadisticas_5.png` |
| Solicitud de mesa | <img src="docs/capturas/solicitud_mesa.png" width="240" alt="Solicitud de mesa"> | `docs/capturas/solicitud_mesa.png` |
| Chat | <img src="docs/capturas/chat.png" width="240" alt="Chat"> | `docs/capturas/chat.png` |
| Lista de productos para el pedido | <img src="docs/capturas/pedido-1.png" width="240" alt="Listado productos"> | `docs/capturas/pedido-1.png` |
| Mi pedido | <img src="docs/capturas/pedido-2.png" width="240" alt="Mi pedido"> | `docs/capturas/pedido-2.png` |
| Pedidos | <img src="docs/capturas/pedidos.png" width="240" alt="Pedidos"> | `docs/capturas/pedidos.png` |
| Estado del pedido | <img src="docs/capturas/estado-pedido.png" width="240" alt="Estado del pedido"> | `docs/capturas/estado-pedido.png` |
| Pedidos en cocina y bar | <img src="docs/capturas/pedidos-cocina.png" width="240" alt="Pedidos cocina bar"> | `docs/capturas/pedidos-cocina.png` |
| Juegos | <img src="docs/capturas/juegos.png" width="240" alt="Juegos"> | `docs/capturas/juegos.png` |
| Juego Memoria | <img src="docs/capturas/juego_1.png" width="240" alt="Juego memoria"> | `docs/capturas/juego_1.png` |
| Juego Reflejos | <img src="docs/capturas/juego_2.png" width="240" alt="Juego reflejos"> | `docs/capturas/juego_2.png` |
| Juego Trivia | <img src="docs/capturas/juego_3.png" width="240" alt="Juego trivia"> | `docs/capturas/juego_3.png` |
| Realizar encuestas | <img src="docs/capturas/realizar_encuesta.png" width="240" alt="Realizar encuestas"> | `docs/capturas/realizar_encuesta.png` |
| Solicitar Cuenta | <img src="docs/capturas/solicitar_cuenta.png" width="240" alt="Solicitar cuenta"> | `docs/capturas/solicitar_cuenta.png` |
| Porcentaje propina | <img src="docs/capturas/porcentaje_propina.png" width="240" alt="Porcentaje propina"> | `docs/capturas/porcentaje_propina.png` |
| Confirmación propina | <img src="docs/capturas/confirmacion_propina.png" width="240" alt="Confirmación propina"> | `docs/capturas/confirmacion_propina.png` |
| Solicitar Cuenta Confirmación | <img src="docs/capturas/solicitar_cuenta_final.png" width="240" alt="Solicitud de cuenta confirmación"> | `docs/capturas/confirmar_cuenta_final.png` |
| Confirmación de pago | <img src="docs/capturas/confirmacion_pago.png" width="240" alt="confirmación de pago"> | `docs/capturas/confirmar_pago.png` |
| Push Notification: cliente esperando aceptación | <img src="docs/capturas/push_cliente_esperando_aceptacion.jpg" width="240" alt="push cliente esperando aceptacion"> | `docs/capturas/push_cliente_esperando_aceptacion.jpg` |
| Push Notification: cliente en lista de espera | <img src="docs/capturas/push_cliente_lista_espera.jpg" width="240" alt="push cliente en lista de espera"> | `docs/capturas/push_cliente_lista_espera.jpg` |
| Push Notification: mesa asignada | <img src="docs/capturas/push_mesa_asignada.jpg" width="240" alt="push mesa asignada"> | `docs/capturas/push_mesa_asignada.jpg` |
| Push Notification: consulta de cliente | <img src="docs/capturas/push_consulta_cliente.jpg" width="240" alt="push consulta de cliente"> | `docs/capturas/push_consulta_cliente.jpg` |
| Push Notification: Respuesta de mozo a consulta | <img src="docs/capturas/push_respuesta_mozo.jpg" width="240" alt="push respuesta de mozo a consulta"> | `docs/capturas/push_respuesta_mozo.jpg` |
| Push Notification: pedido a mozo | <img src="docs/capturas/push_pedido_mozo.jpg" width="240" alt="push pedido a mozo"> | `docs/capturas/push_pedido_mozo.jpg` |
| Push Notification: pedido rechazado | <img src="docs/capturas/push_pedido_rechazado.jpg" width="240" alt="push pedido rechazado"> | `docs/capturas/push_pedido_rechazado.jpg` |
| Push Notification: comanda asignada | <img src="docs/capturas/push_comanda_asignada.jpg" width="240" alt="push comanda asignada"> | `docs/capturas/push_comanda_asignada.jpg` |
| Push Notification: cuenta solicitada | <img src="docs/capturas/push_cuenta_solicitada.jpg" width="240" alt="push cuenta solicitada"> | `docs/capturas/push_cuenta_solicitada.jpg` |
| Push Notification: pago pendiente de confirmación | <img src="docs/capturas/push_pago_pendiente.jpg" width="240" alt="push pago pendiente de confirmación"> | `docs/capturas/push_pago_pendiente.jpg` |
| Push Notification: confirmación de pago | <img src="docs/capturas/push_confirmacion_pago.jpg" width="240" alt="push confirmación de pago"> | `docs/capturas/push_confirmacion_pago.jpg` |
---

## <a id="estado-de-avance--puntos-funcionales"></a>✅ Estado de avance — Puntos funcionales

### Primera fecha (puntos 1 al 22)

| # | Funcionalidad | Responsable | Est. (días) | Inicio | Fin | Estado |
|---|---|---|---|---|---|---|
| 1 | Agregar empleado | Wolf, Matías | 2 | 03-09 | 04-09 | ✅ Completo |
| 2 | Agregar nuevo plato | Moyano, Martín | 1 | 03-09 | 03-09 | ✅ Completo |
| 3 | Agregar nueva bebida | Moyano, Martín | 1 | 03-09 | 03-09 | ✅ Completo |
| 4 | Agregar nueva mesa | Wolf, Matías | 2 | 04-09 | 04-09 | ✅ Completo |
| 5 | Crear cliente registrado | Miguel, Luján | 2 | 01-09 | 09-09 | ✅ Completo |
| 6 | Verificar ingreso de cliente | Wolf, Matías | 2 | 09-09 | 11-09 | ✅ Completo |
| 7 | Rechazar cliente | Wolf, Matías | 1 | 09-09 | 11-09 | ✅ Completo |
| 8 | Aceptar cliente | Wolf, Matías | 1 | 09-09 | 11-09 | ✅ Completo |
| 9 | Ingreso cliente anónimo | Miguel, Luján | 1 | 31-08 | 01-09 | ✅ Completo |
| 10 | Metre asigna mesa | Miguel, Luján | 2 | 17-09 | 18-09 | ✅ Completo |
| 11 | Ver menú + consulta al mozo | Torrez, Maximiliano | 2 | 06-09 | 11-09 | ✅ Completo |
| 12 | Cliente realiza pedido | Torrez, Maximiliano | 4 | 15-09 | 17-09 | ✅ Completo
| 13 | Mozo rechaza pedido | Torrez, Maximiliano | 1 | 18-09 | 19-09 | ✅ Completo
| 14 | Mozo confirma pedido | Torrez, Maximiliano | 1 | 18-09 | 19-09 | ✅ Completo
| 15 | Juegos con descuento | Miguel, Luján | 6 | 20-09 | 02-10 | ✅ Completo |
| 16 | Cocina recibe pedidos | Moyano, Martín | 2 | 16-09 | 18-09 | ✅ Completo |
| 17 | Bar recibe pedidos | Moyano, Martín | 3 | 16-09 | 18-09 | ✅ Completo |
| 18 | Aviso de pedido completo | Moyano, Martín | 3 | 16-09 | 18-09 | ✅ Completo |
| 19 | Mozo entrega pedido | Torrez, Maximiliano | 1 | 18-09 | 19-09 | ✅ Completo |
| 20 | Encuesta de satisfacción | Torrez, Maximiliano | 3 | 08-10 | 10-10 | ✅ Completo |
| 21 | Cliente pide la cuenta | Torrez, Maximiliano | 2 | 11-10 | 12-10 | ✅ Completo |
| 22 | Confirmar pago y liberar mesa | Torrez, Maximiliano | 1 | 13-10 | 13-10 | ✅ Completo |

**Leyenda:** ⬜ Pendiente · 🟨 En progreso · ✅ Completo

---

## <a id="perfiles-de-usuario"></a>🔑 Perfiles de usuario

- Dueño
- Supervisor
- Empleados: Metre / Mozo / Cocinero / Cantinero
- Cliente registrado
- Cliente anónimo

## <a id="codigos-qr-utilizados"></a>📲 Códigos QR utilizados

| QR | Función |
|---|---|
| <img src="docs/capturas/qr_ingreso.png" width="240" alt="QR Ingreso"> | Anunciarse en lista de espera / ver encuestas previas |
| <img src="docs/capturas/qr_mesa_1.png" width="240" alt="QR Mesa 1"> | Ver mesa 1 para acceder a menú, pedido, encuesta, juegos y pago (cliente) |
| <img src="docs/capturas/qr_mesa_2.png" width="240" alt="QR Mesa 2"> | Ver mesa 2 para acceder a menú, pedido, encuesta, juegos y pago (cliente) |
| <img src="docs/capturas/qr_mesa_3.png" width="240" alt="QR Mesa 3"> | Ver mesa 3 para acceder a menú, pedido, encuesta, juegos y pago (cliente) |
| <img src="docs/capturas/qr_mesa_4.png" width="240" alt="QR Mesa 4"> | Ver mesa 4 para acceder a menú, pedido, encuesta, juegos y pago (cliente) |
| <img src="docs/capturas/qr_mesa_6.png" width="240" alt="QR Mesa 6"> | Ver mesa 6 para acceder a menú, pedido, encuesta, juegos y pago (cliente) |
| <img src="docs/capturas/qr_mesa_8.png" width="240" alt="QR Mesa 8"> | Ver mesa 8 para acceder a menú, pedido, encuesta, juegos y pago (cliente) |
| <img src="docs/capturas/qr_propina_malo.png" width="240" alt="QR Propina Malo (0%)"> | Qr de propina 0% (malo) |
| <img src="docs/capturas/qr_propina_regular.png" width="240" alt="QR Propina Regular (5%)"> | Qr de propina 5% (regular) |
| <img src="docs/capturas/qr_propina_bueno.png" width="240" alt="QR Propina Bueno (10%)"> | Qr de propina 10% (bueno) |
| <img src="docs/capturas/qr_propina_muy_bueno.png" width="240" alt="QR Propina Muy Bueno (15%)"> | Qr de propina 15% (muy bueno) |
| <img src="docs/capturas/qr_propina_excelente.png" width="240" alt="QR Propina Excelente (20%)"> | Qr de propina 20% (excelente) |

---

## <a id="integracion-y-coordinacion-tecnica"></a>🧩 Integración y coordinación técnica

Además del desarrollo de los puntos funcionales que figuran en la tabla de arriba, **Wolf, Matías**, como líder del equipo, estuvo a cargo de:

- Integrar las ramas `feature/*` de cada punto en las sucesivas ramas `integracion/*-fecha`, resolviendo los conflictos que fueron surgiendo.
- Mergear cada ronda de integración a `main`.
- Revisar y pulir detalles transversales a toda la app (consistencia visual entre pantallas, manejo de errores, performance, limpieza de código, etc.) que no quedan reflejados como un punto funcional propio pero sí como trabajo necesario para que el conjunto funcione de forma coherente.

---