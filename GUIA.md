# Guía rápida para personalizar

Estás en la rama **personalizacion**. Cambia lo que quieras aquí sin miedo: no afecta a la versión principal (`main`) hasta que se decida fusionar.

## Cómo ver los cambios
1. Abre el proyecto y ejecuta `./start.sh` (o abre `index.html`).
2. Cada vez que guardes un archivo, recarga la página en el navegador.

## Qué hay en cada archivo
- `index.html` — estructura de la página (botones, secciones, textos visibles).
- `marketing.css` / `styles.css` — colores, tamaños, tipografías, márgenes.
- `marketing.js` — lógica de los vídeos de la app (calendario, gym, swipe...).
- `lockscreen.js` — la pantalla de bloqueo del móvil (reloj y notificaciones).
- `i18n.js` — textos en español e inglés.
- `assets/` — imágenes e iconos.

## Cosas típicas y dónde tocarlas
- **Colores** → `marketing.css` (busca códigos como `#ff7a1a`).
- **Textos** → `index.html` o `i18n.js`.
- **Reloj / notificaciones del móvil** → `lockscreen.js`.
- **Imágenes / iconos** → carpeta `assets/`.

## Cómo pedir ayuda a ChatGPT
Pégale esto y luego tu petición:

> "Tengo un proyecto web con HTML, CSS y JavaScript. Los archivos son:
> index.html (estructura), marketing.css/styles.css (estilos), marketing.js
> (lógica de los vídeos) y lockscreen.js (pantalla de bloqueo del móvil).
> Quiero cambiar [lo que sea]. Dime exactamente qué línea o archivo tocar."

Copia el trozo de código que quieras cambiar y pégaselo también: así te dirá
justo qué reemplazar. Cuando te dé el cambio, sustituye solo esas líneas y
recarga la página para verlo.

## Guardar tus cambios en GitHub
En la terminal, dentro de la carpeta del proyecto:

```
git add -A
git commit -m "describe tu cambio"
git push
```

Todo se guarda en la rama **personalizacion**, separada de la principal.
