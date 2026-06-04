import { describe, expect, it } from "vitest";

import { DEFAULTS, SETTINGS_FIELDS, coerceSettings } from "../src/lib/settings.ts";

describe("settings declaration", () => {
	it("includes useCustomColors in the schema", () => {
		expect(SETTINGS_FIELDS).toHaveProperty("useCustomColors");
		expect(SETTINGS_FIELDS.useCustomColors.type).toBe("boolean");
	});

	it("DEFAULTS covers every declared field", () => {
		for (const key of Object.keys(SETTINGS_FIELDS)) {
			expect(DEFAULTS).toHaveProperty(key);
		}
		// underlineLinks reconciled to false (was the schema's `true` outlier)
		expect(DEFAULTS.underlineLinks).toBe(false);
		expect(DEFAULTS.useCustomColors).toBe(false);
	});
});

describe("coerceSettings", () => {
	it("returns the defaults for empty/missing input", () => {
		expect(coerceSettings({})).toEqual(DEFAULTS);
		expect(coerceSettings(null)).toEqual(DEFAULTS);
		expect(coerceSettings(undefined)).toEqual(DEFAULTS);
	});

	it("coerces stringy booleans", () => {
		expect(coerceSettings({ enabled: "false" }).enabled).toBe(false);
		expect(coerceSettings({ enabled: "true" }).enabled).toBe(true);
	});

	it("falls back to default on an unknown enum value", () => {
		expect(coerceSettings({ theme: "nope" }).theme).toBe(DEFAULTS.theme);
		expect(coerceSettings({ language: "xx" }).language).toBe(DEFAULTS.language);
		expect(coerceSettings({ underlineStyle: "zigzag" }).underlineStyle).toBe(
			DEFAULTS.underlineStyle,
		);
	});

	it("accepts a valid enum value", () => {
		expect(coerceSettings({ language: "es" }).language).toBe("es");
		expect(coerceSettings({ theme: "dark" }).theme).toBe("dark");
	});

	it("clamps numbers to their min/max", () => {
		expect(coerceSettings({ cacheTtlSeconds: 999_999_999_999 }).cacheTtlSeconds).toBe(31_536_000);
		expect(coerceSettings({ apiTimeoutMs: 1 }).apiTimeoutMs).toBe(500);
		expect(coerceSettings({ cacheTtlSeconds: "120" }).cacheTtlSeconds).toBe(120);
	});

	it("rejects wrong-typed values and keeps the default", () => {
		expect(coerceSettings({ defaultVersion: 123 }).defaultVersion).toBe(DEFAULTS.defaultVersion);
		expect(coerceSettings({ selectors: 42 }).selectors).toBe(DEFAULTS.selectors);
		expect(coerceSettings({ cacheTtlSeconds: "abc" }).cacheTtlSeconds).toBe(DEFAULTS.cacheTtlSeconds);
	});
});
