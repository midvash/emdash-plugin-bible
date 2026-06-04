---
"@midvash/emdash-plugin-bible": patch
---

Docs: clarify the SEO model + document 0.3.0 changes.

- Reframe the SSR middleware section as "recommended" (was "optional") — SEO
  is the plugin's stated goal.
- Document the two-layer model: SSR middleware + client-side fallback both
  produce real `<a href>` anchors (since 0.3.0 in the client fallback too).
- List the SEO contract explicitly: no `nofollow`, no `target="_blank"`,
  `title` attribute, scope limited to article content (no nav/footer/title
  pollution).
- Document the new mobile / touch behavior (tap-to-toggle, second-tap to
  navigate).
- Updates to README.md, README.pt-BR.md, README.es.md — kept in sync.

Patch-level bump (docs only).
