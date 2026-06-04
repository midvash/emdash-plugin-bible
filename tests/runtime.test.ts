import { describe, expect, it, vi } from "vitest";

import { buildClientPattern, getBibleByMidvashSnippets } from "../src/runtime.ts";

/** A getPluginSetting(pluginId, key) stub backed by a plain object. */
function getter(values: Record<string, unknown> = {}) {
	return vi.fn(async (_pluginId: string, key: string) => values[key]);
}

describe("buildClientPattern", () => {
	it("returns a usable unicode regex with the giu flags", () => {
		const { pattern, flags } = buildClientPattern("pt-br");
		expect(flags).toBe("giu");
		const re = new RegExp(pattern, flags);
		expect(re.test("João 3:16")).toBe(true);
		re.lastIndex = 0;
		expect(re.test("nada por aqui")).toBe(false);
	});
});

describe("getBibleByMidvashSnippets", () => {
	it("returns inline js/css with defaults", async () => {
		const { enabled, js, css } = await getBibleByMidvashSnippets(getter());
		expect(enabled).toBe(true);
		expect(js).toContain("use strict");
		expect(js).toContain("/_emdash/api/plugins/bible-by-midvash");
		expect(css).toContain(".midvash-ref");
	});

	it("does NOT emit color overrides when useCustomColors is off (default)", async () => {
		const { css } = await getBibleByMidvashSnippets(getter());
		expect(css).not.toContain("--midvash-link-color:");
	});

	it("emits color overrides only when useCustomColors is on", async () => {
		const { css } = await getBibleByMidvashSnippets(
			getter({ useCustomColors: true, linkColor: "#123456", underlineLinks: true }),
		);
		expect(css).toContain("--midvash-link-color: #123456");
		expect(css).toContain("--midvash-underline-line: underline");
	});

	it("returns empty snippets when disabled", async () => {
		const out = await getBibleByMidvashSnippets(getter({ enabled: false }));
		expect(out).toEqual({ enabled: false, js: "", css: "" });
	});

	it("uses the batch getter in a single call when provided", async () => {
		const perKey = getter();
		const getAll = vi.fn(async () => ({ language: "en", theme: "dark" }));
		const { enabled, js } = await getBibleByMidvashSnippets(perKey, getAll);
		expect(enabled).toBe(true);
		expect(getAll).toHaveBeenCalledTimes(1);
		expect(perKey).not.toHaveBeenCalled();
		expect(js).toContain('"theme":"dark"');
	});
});
