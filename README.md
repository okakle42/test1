# Minijuegos · Entrenador de Bots

Colección de minijuegos web pensados como entrenamiento de reflejos, memoria y precisión, inspirados en mecánicas tipo *skill check*. Todo el proyecto es **HTML + CSS + JavaScript vanilla**, sin dependencias ni build step: se abre directo en el navegador.

## Demo local

```bash
# Opción 1 — abrir el archivo
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows

# Opción 2 — servidor estático (recomendado, evita restricciones de file://)
npx serve .
# o
python3 -m http.server 8080
```

Luego visita `http://localhost:8080`.

## Minijuegos incluidos

- **Unlocked** — desbloqueo por patrones.
- **Termita** — escritura rápida bajo presión.
- **Simon** — repetir secuencias de colores/sonidos.
- **Arrow** — reaccionar a flechas direccionales.
- **Letters Fall** — atrapar/teclear letras que caen.
- **Hacking Device** — minijuego tipo terminal.
- **Hole Match** — sincronizar el círculo con el objetivo activo.
- **Color Count** — contar elementos por color.
- **Pairs** — memoria de cartas.
- **Typix** — mecanografía.
- **Skillcheck** — pulsar en el momento exacto.
- **Maze** — recorrer laberintos.
- **Keyspam** — pulsar teclas a alta velocidad.
- **Sequence** — repetir secuencias largas.
- **Rhythm Click** — clicks al ritmo.
- **Rapid Lines** — reacción a líneas rápidas.

Cada minijuego vive en su propio módulo dentro de `js/games/` y su hoja de estilos en `css/`.

## Estructura del proyecto

```
.
├── index.html              # Punto de entrada con todos los layouts
├── css/                    # Una hoja por minijuego + styles.css base
├── js/
│   ├── app.js              # Bootstrap y enrutado entre minijuegos
│   ├── audioManager.js     # Gestión de SFX
│   ├── backgroundManager.js
│   └── games/              # Lógica de cada minijuego
├── audio/                  # Efectos de sonido (.mp3)
└── assets/icons/           # Iconos SVG del selector
```

## Cómo añadir un minijuego nuevo

1. Crea `js/games/miJuego.js` exportando un inicializador en `window` (sigue el patrón de `holematch.js`).
2. Crea `css/miJuego.css` con estilos *scoped* por prefijo (`.mijuego-…`).
3. Añade el `<link>` y la sección con el layout en `index.html`.
4. Registra el juego en `js/app.js` para que aparezca en el menú.

## Convenciones

- Sin frameworks, sin bundler. Mantener todo en JS vanilla.
- Prefijar clases CSS por minijuego para evitar colisiones.
- Sin `console.log` en código productivo (usar `console.warn` / `console.error` solo para errores reales).

## Despliegue

Al ser 100 % estático, sirve cualquier host de archivos:

- **GitHub Pages**: activa Pages apuntando a la rama `main` y carpeta `/` (root).
- **Netlify / Vercel / Cloudflare Pages**: arrastra el directorio o conecta el repo, sin configuración.

## Licencia

[MIT](./LICENSE)
