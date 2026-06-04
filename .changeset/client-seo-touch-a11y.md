---
"@midvash/emdash-plugin-bible": minor
---

Client bundle: real `<a href>` fallback (SEO), touch support, scheme guard, aria-live.

- **SEO (issue #49)**: the client-only fallback now renders **real `<a href>`
  anchors** instead of `<span>` — so when a consuming site forgets to register
  the SSR middleware, Googlebot still sees real links to midvash.com and link
  equity flows. URLs match the SSR shape exactly (`/{lang}/{version}/{slug}/
  {ch}/{verse}`), with the slug pre-localized server-side. No `nofollow`, no
  `target="_blank"` — by design.
- **Touch / mobile (issue #36)**: on coarse-pointer devices a single tap on a
  reference opens the tooltip and blocks navigation; a second tap on the same
  reference (tooltip still open) lets the click through so the user reaches
  midvash.com. Tap-outside closes the tooltip. Desktop (`pointer: fine`)
  behavior is unchanged — hover/focus still drives the tooltip, click
  navigates normally.
- **Security defense-in-depth (issue #42)**: `payload.readMoreUrl` is now
  validated before being placed in an `href`. Only `http:` / `https:` schemes
  are accepted; `javascript:` / `data:` / etc. cause the "Ler mais" link to
  be omitted (the verse text still renders).
- **a11y (issue #38)**: the tooltip body is marked `aria-live="polite"` /
  `aria-atomic="true"`, so screen readers announce the verse when it
  replaces the "Carregando…" placeholder (follow-up to #13).

`buildClientPattern` is now capturing (`m[1..4]` = book, chapter, verse,
verseEnd) so the client can extract the parts needed to build a URL; the
non-capturing shape is no longer exported. New `buildNameToSlug` helper
exports a small name→localized-slug map alongside the pattern.
