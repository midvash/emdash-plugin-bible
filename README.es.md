# @midvash/emdash-plugin-bible

> 🌐 [English](./README.md) · [Português (BR)](./README.pt-BR.md) · **Español**

Detecta automáticamente referencias bíblicas en el contenido de tu sitio EmDash y muestra tooltips con el versículo al pasar el cursor. El texto proviene de la [Midvash API](https://api.midvash.com) — pública, sin autenticación.

Hecho por [Midvash](https://midvash.com). ¿Usas WordPress? Mira el plugin hermano: [midvash/bible-by-midvash](https://github.com/midvash/bible-by-midvash).

## Instalación

```bash
npm install @midvash/emdash-plugin-bible
```

```js
// astro.config.mjs
import { biblePlugin } from "@midvash/emdash-plugin-bible";
import emdash from "emdash/astro";

export default defineConfig({
  integrations: [
    emdash({
      plugins: [biblePlugin()],
      // ...resto de tu config
    }),
  ],
});
```

```astro
<!-- src/layouts/Base.astro, dentro de <head> -->
<link rel="stylesheet" href="/_emdash/api/plugins/bible-by-midvash/client.css" />

<!-- antes de </body> -->
<script is:inline defer src="/_emdash/api/plugins/bible-by-midvash/client.js"></script>
```

## Configuración

Abre `/_emdash/admin/plugins/bible-by-midvash/settings` en el admin de EmDash. Ajustes principales:

- **Idioma** — pt-BR / en / es (controla qué nombres de libros se reconocen)
- **Versión por defecto** — NAA, ARA, NVI, ACF, ESV, KJV, RVR1960, y más
- **Selectores CSS** — dónde se detectan las referencias (por defecto: `article`, `.prose`, `.post-content`, `main`)
- **Tema del tooltip** — auto / pergamino (claro) / noche cálida (oscuro) / sepia
- **Colores y estilo** — color del enlace, subrayado
- **Caché** — duración en segundos (por defecto: 30 días)

## Formatos soportados

| Formato | Ejemplo |
| ---------------------- | ----------------- |
| Versículo único | `Juan 3:16` |
| Separador alt. | `Juan 3.16` |
| Rango | `Juan 3:16-18` |
| Capítulo completo | `Salmos 23` |
| Abreviatura | `Gn 1:1` |
| Numerado (con espacio) | `1 Corintios 13:4` |
| Numerado (sin espacio) | `1Co 13:4` |

Los nombres de los libros se reconocen en portugués, inglés y español (las abreviaturas latinas son universales).

## Endpoints

Todas las rutas se sirven bajo `/_emdash/api/plugins/bible-by-midvash/`.

| Ruta | Descripción |
| --------------------- | ---------------------------------------- |
| `GET /lookup?ref=...` | Resuelve una referencia (público) |
| `GET /versions?lang=` | Lista las versiones disponibles (público) |
| `GET /client.js` | Script de detección + tooltip (público) |
| `GET /client.css` | Estilos del tooltip (público) |
| `GET /settings` | Lee la configuración (admin) |
| `POST /settings/save` | Guarda la configuración (admin) |

## Identidad visual

El tooltip usa la paleta de [Midvash](https://midvash.com): Honey Deep (`#B17027`) para los enlaces, Pergamino (`#FBF5E8`) para el fondo claro, Noche Cálida (`#302A21`) para el fondo oscuro. Tipografía: Literata para el versículo, Figtree para la interfaz (con fallbacks `Georgia, serif` / `system-ui`).

## Enlaces

- 🌐 [midvash.com](https://midvash.com) — el proyecto detrás de los datos
- 📖 [Midvash API](https://api.midvash.com) — API bíblica pública (sin auth)
- 🧩 [Versión WordPress](https://github.com/midvash/bible-by-midvash) — la misma función en WordPress

## Licencia

[MIT](./LICENSE) © [Midvash](https://midvash.com)
