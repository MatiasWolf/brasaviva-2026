# 🔥 Brasa Viva

Aplicación móvil para la gestión integral de un restaurante — Trabajo Final Integrador, Tecnicatura Universitaria en Programación (UTN Avellaneda), 2026.

Repositorio: `brasaviva-2026`

---

## 👥 Integrantes del equipo 

| Apellido y Nombre | Usuario GitHub |
|---|---|
| Wolf, Matias | [@MatiasWolf](https://github.com/MatiasWolf) |
| Moyano, Martín | [@MartinMoyano1](https://github.com/MartinMoyano1) |
| Miguel, Luján | [@Lujan-84](https://github.com/Lujan-84) |
| Torrez, Maximiliano | [@MxmlnST](https://github.com/MxmlnST) |

**Responsable de mantener este README actualizado:** Matias Wolf

---

## 🛠️ Stack tecnológico

- **Framework:** Ionic + Angular
- **Base de datos / Backend:** Supabase
- **Control de versiones:** Git / GitHub

---

## 🚀 Puesta en marcha

```bash
# Clonar el repositorio
git clone https://github.com/MatiasWolf/brasaviva-2026.git
cd brasaviva-2026

# Instalar dependencias
npm install

# Variables de entorno (Supabase)
# Crear un archivo de entorno (ej: src/environments/environment.ts) con:
# supabaseUrl: 'TU_URL_DE_SUPABASE'
# supabaseKey: 'TU_ANON_KEY'

# Levantar en modo desarrollo
ionic serve
```

---

## 📁 Estructura del proyecto

```
(completar a medida que se defina la arquitectura de carpetas)
```

---

## 🗂️ Índice de imágenes del proyecto

| Imagen | Descripción | Ruta |
|---|---|---|
| _(completar)_ | Ícono de la aplicación | `_(completar)_` |
| _(completar)_ | Splash screen estática | `_(completar)_` |
| _(completar)_ | Splash screen animada | `_(completar)_` |
| _(completar)_ | _(completar)_ | `_(completar)_` |

---

## ✅ Estado de avance — Puntos funcionales

### Primera fecha (puntos 1 al 22)

| # | Funcionalidad | Responsable | Est. (días) | Inicio | Fin | Branch | Estado |
|---|---|---|---|---|---|---|---|
| 1 | Agregar empleado | Wolf, Matías | 2 | 01-09 | 03-09 | | ⬜ Pendiente |
| 2 | Agregar nuevo plato | Moyano, Martín | 2 | 01-09 | 03-09 | `feature/agregar-plato` | 🟨 En progreso |
| 3 | Agregar nueva bebida | Moyano, Martín | 1 | 04-09 | 05-09 | | ⬜ Pendiente |
| 4 | Agregar nueva mesa | Wolf, Matías | 2 | 04-09 | 06-09 | | ⬜ Pendiente |
| 5 | Crear cliente registrado | Miguel, Luján | 2 | 01-09 | 03-09 | `feature/registro-cliente` | 🟨 En progreso |
| 6 | Verificar ingreso de cliente | Wolf, Matías | 1,5 | 07-09 | 08-09 | | ⬜ Pendiente |
| 7 | Rechazar cliente | Wolf, Matías | 2 | 09-09 | 11-09 | | ⬜ Pendiente |
| 8 | Aceptar cliente | Wolf, Matías | 1 | 11-09 | 12-09 | | ⬜ Pendiente |
| 9 | Ingreso como cliente anónimo | Miguel, Luján | 2 | 04-09 | 06-09 | `feature/registro-cliente-anonimo` | 🟨 En progreso |
| 10 | Metre asigna mesa | Miguel, Luján | 1,5 | 07-09 | 08-09 | | ⬜ Pendiente |
| 11 | Ver menú + consulta al mozo | Miguel, Luján | 3 | 08-09 | 11-09 | | ⬜ Pendiente |
| 12 | Cliente realiza pedido | Torrez, Maximiliano | 3 | 08-09 | 11-09 | | ⬜ Pendiente |
| 13 | Mozo rechaza pedido | Torrez, Maximiliano | 1 | 12-09 | 13-09 | | ⬜ Pendiente |
| 14 | Mozo confirma pedido | Torrez, Maximiliano | 1,5 | 14-09 | 15-09 | | ⬜ Pendiente |
| 15 | Cliente accede a juegos (descuentos) | Miguel, Luján | 4 | 12-09 | 16-09 | | ⬜ Pendiente |
| 16 | Cocina recibe pedidos | Moyano, Martín | 1,5 | 08-09 | 09-09 | | ⬜ Pendiente |
| 17 | Bar recibe pedidos | Moyano, Martín | 1 | 13-09 | 13-09 | | ⬜ Pendiente |
| 18 | Aviso de pedido completo | Moyano, Martín | 1 | 14-09 | 15-09 | | ⬜ Pendiente |
| 19 | Mozo entrega pedido | Torrez, Maximiliano | 1 | 16-09 | 17-09 | | ⬜ Pendiente |
| 20 | Encuesta de satisfacción | Torrez, Maximiliano | 2,5 | 18-09 | 20-09 | | ⬜ Pendiente |
| 21 | Cliente pide la cuenta | Torrez, Maximiliano | 2 | 21-09 | 23-09 | | ⬜ Pendiente |
| 22 | Confirmación de pago y liberación de mesa | Torrez, Maximiliano | 1,5 | 24-09 | 25-09 | | ⬜ Pendiente |

**Leyenda:** ⬜ Pendiente · 🟨 En progreso · ✅ Completo

---

## 🔑 Perfiles de usuario

- Dueño
- Supervisor
- Empleados: Metre / Mozo / Cocinero / Cantinero
- Cliente registrado
- Cliente anónimo

---

## 📲 Códigos QR utilizados

| QR | Función |
|---|---|
| Ingreso al local | Anunciarse en lista de espera / ver encuestas previas |
| Mesa | Ver info de mesa (staff) o acceder a menú, pedido, encuesta, juegos y pago (cliente) |
| Propina (x5) | Excelente 20% · Muy Bueno 15% · Bueno 10% · Regular 5% · Malo 0% |

---
