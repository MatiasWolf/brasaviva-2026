# resources/ — íconos y splash para generar los assets nativos y PWA

Esta carpeta va en la **raíz del proyecto** (al lado de `package.json` y
`capacitor.config.ts`). La lee `@capacitor/assets`.

## Archivos a dejar acá

### Mínimo recomendado

| Archivo | Tamaño | Fondo | Para qué |
|---|---|---|---|
| `icon.png` | 1024×1024 | **relleno, sin transparencia** | ícono de iOS/Android (y base del favicon/PWA). Símbolo centrado con 15-20% de aire en todo el borde. Sin esquinas redondeadas. |
| `logo.png` | 1024×1024 | **transparente** | lo usa para generar el splash (símbolo centrado sobre el color de fondo). Evita tener que dibujar `splash.png` a mano. |

Generás con:

```bash
npx @capacitor/assets generate --splashBackgroundColor "#130905" --splashBackgroundColorDark "#130905"
```

### Opcionales (solo si querés control fino)

| Archivo | Tamaño | Fondo | Para qué |
|---|---|---|---|
| `splash.png` | 2732×2732 | sólido (`#130905`) | splash con composición propia (no "logo centrado"). Todo lo importante dentro del 60% central. |
| `splash-dark.png` | 2732×2732 | sólido oscuro | variante dark del splash |
| `icon-foreground.png` | 1024×1024 | **transparente** | Android adaptativo: solo el símbolo, dentro del círculo seguro central (~66% del alto) |
| `icon-background.png` | 1024×1024 | opaco | Android adaptativo: color o textura de fondo |

Si NO ponés `splash.png`, lo genera desde `logo.png` + color. Si NO ponés
`icon-foreground/background`, usa `icon.png` para todo.

## Cómo generar

```bash
# 1. (una sola vez) agregar las plataformas nativas, si todavía no están
npx cap add android
npx cap add ios        # solo en Mac

# 2. generar todos los tamaños a partir de esta carpeta
npx @capacitor/assets generate

# 3. sincronizar
npx cap sync
```

`@capacitor/assets generate` también deja íconos PWA en `www/` (o donde apunte
`--pwaManifestPath`). Para la web sin nativo, con reemplazar
`src/assets/icon/favicon.png` por una versión del símbolo alcanza por ahora.

## Nota

`@capacitor/assets` no está instalado como dependencia: `npx` lo baja al vuelo
la primera vez. Si lo querés fijo: `npm i -D @capacitor/assets`.
