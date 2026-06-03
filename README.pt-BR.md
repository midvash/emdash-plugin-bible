# @midvash/emdash-plugin-bible

> 🌐 [English](./README.md) · **Português (BR)** · [Español](./README.es.md)

Auto-detecta referências bíblicas no conteúdo do seu site EmDash e renderiza tooltips com o versículo no hover. O texto vem da [Midvash API](https://api.midvash.com) — pública, sem auth.

Feito pela [Midvash](https://midvash.com). Usa WordPress? Veja o plugin irmão: [midvash/bible-by-midvash](https://github.com/midvash/bible-by-midvash).

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
      // ...resto da sua config
    }),
  ],
});
```

```astro
<!-- src/layouts/Base.astro, dentro do <head> -->
<link rel="stylesheet" href="/_emdash/api/plugins/bible-by-midvash/client.css" />

<!-- antes de </body> -->
<script is:inline defer src="/_emdash/api/plugins/bible-by-midvash/client.js"></script>
```

## Configuração

Acesse `/_emdash/admin/plugins/bible-by-midvash/settings` no admin do EmDash. Principais settings:

- **Idioma** — pt-BR / en / es (define quais nomes de livros são reconhecidos)
- **Versão padrão** — NAA, ARA, NVI, ACF, ESV, KJV, RVR1960, e outras
- **Seletores CSS** — onde as referências são detectadas (default: `article`, `.prose`, `.post-content`, `main`)
- **Tema do tooltip** — auto / pergaminho (claro) / noite quente (escuro) / sépia
- **Cores e estilo** — cor do link, sublinhado
- **Cache** — duração em segundos (default: 30 dias)

## Formatos suportados

| Formato | Exemplo |
| --------------------- | ------------------ |
| Versículo único | `João 3:16` |
| Separador alt. | `João 3.16` |
| Faixa | `João 3:16-18` |
| Capítulo inteiro | `Salmos 23` |
| Abreviação | `Gn 1:1` |
| Numerado (com espaço) | `1 Coríntios 13:4` |
| Numerado (sem espaço) | `1Co 13:4` |

Os nomes dos livros são reconhecidos em português, inglês e espanhol (abreviações latinas são universais).

## Endpoints

Todas as rotas ficam sob `/_emdash/api/plugins/bible-by-midvash/`.

| Rota | Descrição |
| --------------------- | ---------------------------------------- |
| `GET /lookup?ref=...` | Resolve uma referência (público) |
| `GET /versions?lang=` | Lista as versões disponíveis (público) |
| `GET /client.js` | Script de detecção + tooltip (público) |
| `GET /client.css` | Estilos do tooltip (público) |
| `GET /settings` | Lê as settings (admin) |
| `POST /settings/save` | Persiste as settings (admin) |

## Identidade visual

O tooltip usa a paleta da [Midvash](https://midvash.com): Honey Deep (`#B17027`) para links, Pergaminho (`#FBF5E8`) para o fundo claro, Noite Quente (`#302A21`) para o fundo escuro. Tipografia: Literata para o versículo, Figtree para a UI (com fallbacks `Georgia, serif` / `system-ui`).

## Links

- 🌐 [midvash.com](https://midvash.com) — o projeto por trás dos dados
- 📖 [Midvash API](https://api.midvash.com) — API bíblica pública (sem auth)
- 🧩 [Versão WordPress](https://github.com/midvash/bible-by-midvash) — mesma funcionalidade no WordPress

## Licença

[MIT](./LICENSE) © [Midvash](https://midvash.com)
