# @midvash/emdash-plugin-bible

> 🌐 **English** · [Português (BR)](./README.pt-BR.md) · [Español](./README.es.md)

Auto-detects Bible references in your EmDash site content and renders verse tooltips on hover. Verse text comes from the public [Midvash API](https://api.midvash.com) — no auth required.

Made by [Midvash](https://midvash.com). Prefer WordPress? See the sibling plugin: [midvash/bible-by-midvash](https://github.com/midvash/bible-by-midvash).

## Installation

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
      // ...rest of your config
    }),
  ],
});
```

```astro
<!-- src/layouts/Base.astro, inside <head> -->
<link rel="stylesheet" href="/_emdash/api/plugins/bible-by-midvash/client.css" />

<!-- before </body> -->
<script is:inline defer src="/_emdash/api/plugins/bible-by-midvash/client.js"></script>
```

## Configuration

Open `/_emdash/admin/plugins/bible-by-midvash/settings` in the EmDash admin. Key settings:

- **Language** — pt-BR / en / es (controls which book names are recognized)
- **Default version** — NAA, ARA, NVI, ACF, ESV, KJV, RVR1960, and more
- **CSS selectors** — where references are detected (default: `article`, `.prose`, `.post-content`, `main`)
- **Tooltip theme** — auto / parchment (light) / warm night (dark) / sepia
- **Colors & style** — link color, underline
- **Cache** — duration in seconds (default: 30 days)

## Supported formats

| Format | Example |
| ------------------- | ------------------- |
| Single verse | `John 3:16` |
| Alt. separator | `John 3.16` |
| Range | `John 3:16-18` |
| Whole chapter | `Psalm 23` |
| Abbreviation | `Gn 1:1` |
| Numbered (spaced) | `1 Corinthians 13:4` |
| Numbered (no space) | `1Co 13:4` |

Book names are recognized in Portuguese, English and Spanish (Latin abbreviations are universal).

## Endpoints

All routes are served under `/_emdash/api/plugins/bible-by-midvash/`.

| Route | Description |
| --------------------- | -------------------------------------- |
| `GET /lookup?ref=...` | Resolve a reference (public) |
| `GET /versions?lang=` | List available versions (public) |
| `GET /client.js` | Detection + tooltip script (public) |
| `GET /client.css` | Tooltip styles (public) |
| `GET /settings` | Read settings (admin) |
| `POST /settings/save` | Persist settings (admin) |

## Visual identity

The tooltip uses the [Midvash](https://midvash.com) palette: Honey Deep (`#B17027`) for links, Parchment (`#FBF5E8`) for the light background, Warm Night (`#302A21`) for the dark background. Typography: Literata for the verse, Figtree for the UI (with `Georgia, serif` / `system-ui` fallbacks).

## Links

- 🌐 [midvash.com](https://midvash.com) — the project behind the data
- 📖 [Midvash API](https://api.midvash.com) — public Bible API (no auth)
- 🧩 [WordPress version](https://github.com/midvash/bible-by-midvash) — same feature for WordPress

## License

[MIT](./LICENSE) © [Midvash](https://midvash.com)
