import { describe, expect, it } from "vitest";

import { displayName } from "../src/lib/books.ts";
import { findReferences, parseReference } from "../src/lib/parser.ts";

describe("parseReference — supported formats", () => {
	it("single verse (pt-br)", () => {
		expect(parseReference("João 3:16")).toMatchObject({
			slug: "john",
			matchedName: "João",
			chapter: 3,
			verse: 16,
			verseEnd: 16,
		});
	});

	it("alternate '.' separator", () => {
		expect(parseReference("João 3.16")).toMatchObject({ chapter: 3, verse: 16 });
	});

	it("verse range with hyphen", () => {
		expect(parseReference("João 3:16-18")).toMatchObject({ verse: 16, verseEnd: 18 });
	});

	it("verse range with en-dash", () => {
		expect(parseReference("João 3:16–18")).toMatchObject({ verse: 16, verseEnd: 18 });
	});

	it("whole chapter (no verse)", () => {
		const r = parseReference("Salmos 23");
		expect(r?.slug).toBe("psalms");
		expect(r?.chapter).toBe(23);
		expect(r?.verse).toBeUndefined();
	});

	it("Latin abbreviation (Gn)", () => {
		expect(parseReference("Gn 1:1")).toMatchObject({ slug: "genesis", chapter: 1, verse: 1 });
	});

	it("numbered book with space", () => {
		expect(parseReference("1 Coríntios 13:4")).toMatchObject({
			slug: "1-corinthians",
			chapter: 13,
			verse: 4,
		});
	});

	it("numbered book concatenated", () => {
		expect(parseReference("1Co 13:4")).toMatchObject({ slug: "1-corinthians", chapter: 13, verse: 4 });
	});

	it("resolves pt/en/es names to the same slug", () => {
		const pt = parseReference("João 3:16");
		const en = parseReference("John 3:16");
		const es = parseReference("Juan 3:16");
		expect(pt?.slug).toBe("john");
		expect(en?.slug).toBe("john");
		expect(es?.slug).toBe("john");
	});
});

describe("parseReference — false-positive guards", () => {
	it("rejects a bare chapter:verse with no book", () => {
		expect(parseReference("3:16")).toBeNull();
	});

	it("rejects an unknown leading word", () => {
		expect(parseReference("Hello 3:16")).toBeNull();
	});

	it("rejects an inverted range (end < start)", () => {
		expect(parseReference("João 3:18-16")).toBeNull();
	});

	it("does not match a book name embedded inside another word", () => {
		// "ajo" ends in "jo" but the lookbehind prevents matching inside a word.
		expect(parseReference("trabalho 3:16")).toBeNull();
	});
});

describe("findReferences — scanning free text", () => {
	it("yields every match with correct offsets and raw text", () => {
		const text = "Veja João 3:16 e Romanos 8:28";
		const matches = [...findReferences(text)];
		expect(matches).toHaveLength(2);
		expect(matches[0]).toMatchObject({ raw: "João 3:16", start: 5, end: 14, slug: "john" });
		expect(text.slice(matches[1].start, matches[1].end)).toBe("Romanos 8:28");
	});

	it("returns nothing for text with no references", () => {
		expect([...findReferences("Nenhuma referência aqui.")]).toHaveLength(0);
	});
});

describe("displayName", () => {
	it("localizes the canonical book name", () => {
		expect(displayName("john", "pt-br")).toBe("João");
		expect(displayName("john", "en")).toBe("John");
		expect(displayName("john", "es")).toBe("Juan");
	});
});
