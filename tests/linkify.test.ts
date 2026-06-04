import { describe, expect, it } from "vitest";

import { linkifyHtml } from "../src/lib/linkify.ts";

const opts = { language: "pt-br", version: "naa" } as const;

describe("linkifyHtml", () => {
	it("wraps a reference found in body text", () => {
		const out = linkifyHtml("<p>Veja João 3:16 hoje.</p>", opts);
		expect(out).toContain('class="midvash-ref"');
		expect(out).toContain('data-ref="João 3:16"');
		expect(out).toContain(">João 3:16</a>");
		// surrounding HTML preserved
		expect(out).toContain("<p>");
		expect(out).toContain("hoje.");
	});

	it("builds an href to midvash.com for the configured version", () => {
		const out = linkifyHtml("<p>João 3:16</p>", opts);
		expect(out).toMatch(/href="https:\/\/midvash\.com\/pt-br\/naa\/joao\/3\/16"/);
	});

	it("never wraps a reference already inside an <a>", () => {
		const input = '<a href="/x">João 3:16</a>';
		expect(linkifyHtml(input, opts)).not.toContain("midvash-ref");
	});

	it("never wraps inside <code>", () => {
		const input = "<code>João 3:16</code>";
		expect(linkifyHtml(input, opts)).not.toContain("midvash-ref");
	});

	it("never wraps inside <pre>", () => {
		const input = "<pre>João 3:16</pre>";
		expect(linkifyHtml(input, opts)).not.toContain("midvash-ref");
	});

	it("wraps outside skip tags but leaves matches inside them alone", () => {
		const out = linkifyHtml("<p>João 3:16</p><code>Romanos 8:28</code>", opts);
		// exactly one anchor (the <p> one), the <code> ref untouched
		expect(out.match(/midvash-ref/g)).toHaveLength(1);
		expect(out).toContain("<code>Romanos 8:28</code>");
	});

	it("leaves text with no references untouched", () => {
		const input = "<p>Nenhuma referência por aqui.</p>";
		expect(linkifyHtml(input, opts)).toBe(input);
	});
});
