# Assets de marca — Brasa Viva

Dejá acá los archivos del logo con **estos nombres exactos** (así los toma
`BrandLogoComponent` y el resto sin tocar código):

| Nombre | Qué es | Formato | Fondo |
|---|---|---|---|
| `logo.svg` | Símbolo a color (llama + parrilla + círculo) | SVG | transparente |
| `logo-mono.svg` | Símbolo a 1 tinta, simplificado (sin textura ni círculo roto) | SVG | transparente |
| `logo.png` | Fallback de `logo.svg` por si no hay SVG | PNG 1024×1024 | transparente |
| `logo-mono.png` | Fallback de `logo-mono.svg` | PNG 512×512 | transparente |
| `lockup.svg` | Símbolo + texto "Brasa Viva" (solo para splash / compartir) | SVG | transparente |

Para el **ícono nativo y el favicon** NO van acá: van en `/resources/`
(`icon.png` 1024×1024 con fondo relleno, `splash.png` 2732×2732) y se generan
con `npx @capacitor/assets generate`. Ver el detalle en la conversación / doc del equipo.

`BrandLogoComponent` usa `logo.svg` (o `logo-mono.svg` con `variant="mono"`) y,
si el archivo no existe todavía, muestra un ícono de llama como fallback, así
la app no se rompe mientras tanto.
