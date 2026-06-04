---
"@midvash/emdash-plugin-bible": patch
---

🚨 Hotfix: client bundle threw SyntaxError on every page (silently), so 0
references got linkified and 0 tooltips ever rendered. Confirmed against two
production sites running v0.3.0.

Cause: Astro/EmDash escape every literal `</` inside `<script>` content to
`<\/` before shipping the HTML (standard XSS hardening so a stray
`</script>` can't break out of the inline script). That rewrite silently
corrupted `escapeHtml`'s `/</g` regex literal — `/<\/g` parses as `/<`
(regex) + `\/g` (something else) and throws "Invalid regular expression:
missing /" the moment the IIFE evaluates. The error happened so early that
`buildPattern()` never ran and the scanner emitted no `.midvash-ref`
elements.

Fix: rewrite `/</g` as `/[<]/g` — a character class with the same semantics,
but without the literal `</` sequence in source, so the host-side escape no
longer corrupts the regex. Added 3 regression tests that apply the same
`</` → `<\/` rewrite to the injected JS before evaluating, locking the
contract in: any future regex literal containing `</` will fail these tests
before shipping.
