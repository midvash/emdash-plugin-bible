import { describe, expect, it, vi } from "vitest";

// Stub emdash's PluginRouteError so the sandbox entry can be imported without
// pulling in the full emdash runtime. It only needs to carry code/status.
vi.mock("emdash", () => ({
	PluginRouteError: class PluginRouteError extends Error {
		code: string;
		status: number;
		constructor(code: string, message: string, status: number) {
			super(message);
			this.code = code;
			this.status = status;
		}
	},
}));

const plugin = (await import("../src/sandbox-entry.ts")).default as any;

function mockCtx(versionsPayload: unknown = { data: [{ slug: "naa", name: "NAA", language: "pt-br" }] }) {
	return {
		kv: { get: async () => undefined, set: async () => {} },
		http: {
			fetch: async () => new Response(JSON.stringify(versionsPayload), { status: 200 }),
		},
		log: { info() {}, warn() {}, error() {} },
	};
}

describe("/versions route", () => {
	it("returns the inner array (no double { data } wrap)", async () => {
		const routeCtx = { request: new Request("https://x/versions?lang=pt-br") };
		const result = await plugin.routes.versions.handler(routeCtx, mockCtx());
		// EmDash wraps the return as { data: result }; result must be the array
		// itself so consumers get { data: [...] }, matching /lookup.
		expect(Array.isArray(result)).toBe(true);
		expect(result[0]).toMatchObject({ slug: "naa" });
	});
});

describe("/lookup route error statuses", () => {
	it("throws 400 when ?ref is missing", async () => {
		const routeCtx = { request: new Request("https://x/lookup") };
		await expect(plugin.routes.lookup.handler(routeCtx, mockCtx())).rejects.toMatchObject({
			status: 400,
		});
	});

	it("throws 422 for an unrecognized reference", async () => {
		const routeCtx = { request: new Request("https://x/lookup?ref=ZZZ999") };
		await expect(plugin.routes.lookup.handler(routeCtx, mockCtx())).rejects.toMatchObject({
			status: 422,
		});
	});
});
