# emdash-plugin-bible-by-midvash

Auto-detecta referências bíblicas no conteúdo do site EmDash e renderiza tooltips com o versículo no hover. Texto vem da [Midvash API](https://api.midvash.com) (pública, sem auth).

## Instalação

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
      // ... resto da config
    }),
  ],
});
```

```astro
<!-- src/layouts/Base.astro, no <head> -->
<link rel="stylesheet" href="/_emdash/api/plugins/bible-by-midvash/client.css" />

<!-- antes de </body> -->
<script is:inline defer src="/_emdash/api/plugins/bible-by-midvash/client.js"></script>
```

## Configuração

Acesse `/_emdash/admin/plugins/bible-by-midvash/settings` no admin EmDash. Settings principais:

- **Idioma** — pt-BR / en / es (afeta nomes de livros reconhecidos)
- **Versão padrão** — NAA, ARA, NVI, ACF, ESV, KJV, RVR1960, etc.
- **Seletores CSS** — onde detectar referências (default: `article`, `.prose`, `.post-content`, `main`)
- **Tema do tooltip** — auto / pergaminho (claro) / noite quente (escuro) / sépia
- **Cores e estilo** — link, sublinhado
- **Cache** — duração em segundos (default: 30 dias)

## Formatos suportados

| Formato            | Exemplo            |
| ------------------ | ------------------ |
| Versículo único    | `João 3:16`        |
| Separador alt.     | `João 3.16`        |
| Faixa              | `João 3:16-18`     |
| Capítulo inteiro   | `Salmos 23`        |
| Abreviação         | `Gn 1:1`           |
| Numerado c/ espaço | `1 Coríntios 13:4` |
| Numerado sem esp.  | `1Co 13:4`         |

## Endpoints

| Rota                    | Descrição                                |
| ----------------------- | ---------------------------------------- |
| `GET /lookup?ref=...`   | Resolve uma referência (público)         |
| `GET /versions?lang=`   | Lista versões disponíveis (público)      |
| `GET /client.js`        | Script de detecção + tooltip (público)   |
| `GET /client.css`       | Estilos do tooltip (público)             |
| `GET /settings`         | Lê settings (admin)                      |
| `POST /settings/save`   | Persiste settings (admin)                |

## Identidade visual

Tooltip usa a paleta da [Midvash](https://midvash.com): Honey Deep (`#B17027`) para links, Pergaminho (`#FBF5E8`) para fundo claro, Noite Quente (`#302A21`) para fundo escuro. Tipografia: Literata para o versículo, Figtree para a UI (com fallbacks `Georgia, serif` / `system-ui`).

## Licença

MIT
