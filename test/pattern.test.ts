import { describe, it, expect } from "vitest";

import { buildClientPattern, buildNameToSlug } from "../src/lib/pattern.ts";

describe("buildClientPattern", () => {
	it("returns a usable regex string with unicode flags", () => {
		const { pattern, flags } = buildClientPattern("pt-br");
		expect(flags).toBe("giu");
		expect(() => new RegExp(pattern, flags)).not.toThrow();
	});

	it("matches references in the configured language and in English", () => {
		const { pattern, flags } = buildClientPattern("pt-br");
		const re = new RegExp(pattern, flags);
		expect("João 3:16".match(re)?.[0]).toBe("João 3:16");
		re.lastIndex = 0;
		expect("Genesis 1:1".match(re)?.[0]).toBe("Genesis 1:1"); // English names included
	});

	it("captures book, chapter, verse, and range end (m[1..4])", () => {
		const { pattern, flags } = buildClientPattern("pt-br");
		const re = new RegExp(pattern, flags.replace("g", ""));

		const m1 = re.exec("João 3:16");
		expect(m1?.[1]).toBe("João");
		expect(m1?.[2]).toBe("3");
		expect(m1?.[3]).toBe("16");
		expect(m1?.[4]).toBeUndefined();

		const m2 = new RegExp(pattern, flags.replace("g", "")).exec("João 3:16-18");
		expect(m2?.[4]).toBe("18");

		const m3 = new RegExp(pattern, flags.replace("g", "")).exec("Salmos 23");
		expect(m3?.[2]).toBe("23");
		expect(m3?.[3]).toBeUndefined();
	});

	it("does not match unknown words", () => {
		const { pattern, flags } = buildClientPattern("pt-br");
		const re = new RegExp(pattern, flags);
		expect(re.test("Hello 3:16")).toBe(false);
	});
});

describe("buildNameToSlug", () => {
	it("maps localized and English book names (normalized) to the localized URL slug", () => {
		const map = buildNameToSlug("pt-br");
		// Localized slug for pt-br: "João" → "joao", "Salmos" → "salmos".
		expect(map.joao).toBe("joao");
		expect(map.john).toBe("joao");
		expect(map.salmos).toBe("salmos");
		expect(map.psalms).toBe("salmos");
		expect(map["1 corintios"]).toBe("1-corintios");
	});

	it("for `en`, returns the English slug (no localization)", () => {
		const map = buildNameToSlug("en");
		expect(map.john).toBe("john");
		expect(map.psalms).toBe("psalms");
	});

	it("normalized key 'jo' exists for both Jó (book of Job) and Jo (abbreviation for João)", () => {
		const map = buildNameToSlug("pt-br");
		// After accent stripping both "Jó" and "Jo" collide on the key "jo".
		// The accent-aware override in the client's resolveSlug handles "Jó"
		// vs "Jo" disambiguation at runtime.
		expect(map.jo).toBeDefined();
	});
});
