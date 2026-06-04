/**
 * Bible by Midvash — runtime entry.
 *
 * Routes:
 *   GET /lookup?ref=...&v=...   public — resolve a single reference
 *   GET /versions?lang=...      public — list versions (cached daily)
 *   GET /settings               admin  — read all settings
 *   POST /settings              admin  — patch settings (used by admin UI)
 *
 * Client assets (tooltip JS/CSS) are intentionally NOT served from a route.
 * EmDash 0.16+ always JSON-wraps a plugin route's return value as
 * `{ data: ... }`, so there is no supported way to emit a raw JS/CSS body —
 * the old `client.js` / `client.css` routes always 500'd. The assets are
 * inlined into the host layout via `@midvash/emdash-plugin-bible/runtime`
 * (`getBibleByMidvashSnippets`) or injected automatically through the
 * `page:fragments` hook.
 *
 * Error handling: handlers throw `PluginRouteError` (not `new Response`).
 * EmDash treats any other thrown value as an INTERNAL_ERROR and masks it as
 * a generic 500 "Plugin route error"; `PluginRouteError` is the supported way
 * to return a real status code + message.
 */

import { PluginRouteError } from "emdash";
import type { PluginContext, SandboxedPlugin } from "emdash/plugin";

import { displayName, type Language } from "./lib/books.ts";
import { findReferences, parseReference } from "./lib/parser.ts";
import { buildReadMoreUrl, fetchVerse, fetchVersions } from "./lib/midvash.ts";
import {
	DEFAULTS,
	SETTINGS_FIELDS,
	type SettingsKey,
	coerceSettings,
	type BibleSettings,
	type SettingsField,
} from "./lib/settings.ts";

type Settings = BibleSettings;

/**
 * Read every setting from the plugin KV store, validating and coercing each
 * value against its declared type/enum and falling back to the default on any
 * mismatch (see `coerceSettings`). A corrupt or wrong-typed KV value can no
 * longer flow straight into the rendered output.
 */
async function loadSettings(ctx: PluginContext): Promise<Settings> {
	const raw: Record<string, unknown> = {};
	for (const key of Object.keys(SETTINGS_FIELDS)) {
		const v = await ctx.kv.get<unknown>(`settings:${key}`);
		if (v !== null && v !== undefined) raw[key] = v;
	}
	return coerceSettings(raw);
}

/** Map one canonical settings field to its Block Kit form control. */
function fieldToFormControl(
	key: SettingsKey,
	field: SettingsField,
	current: BibleSettings,
): Record<string, unknown> {
	const base = { action_id: key, label: field.label, initial_value: current[key] };
	switch (field.type) {
		case "boolean":
			return { type: "toggle", ...base };
		case "select":
			return { type: "select", ...base, options: field.options };
		case "number":
			return {
				type: "number_input",
				...base,
				...(field.min !== undefined ? { min: field.min } : {}),
				...(field.max !== undefined ? { max: field.max } : {}),
			};
		case "string":
			return { type: "text_input", ...base, ...(field.multiline ? { multiline: true } : {}) };
	}
}

/**
 * Build the Block Kit form fields straight from the canonical settings
 * declaration, so the admin form can never drift from the settings — there is
 * no hand-maintained field list to keep in sync.
 */
function buildSettingsFormFields(current: BibleSettings): Record<string, unknown>[] {
	return (Object.keys(SETTINGS_FIELDS) as SettingsKey[]).map((key) =>
		fieldToFormControl(key, SETTINGS_FIELDS[key], current),
	);
}

async function renderSettingsBlocks(ctx: PluginContext): Promise<unknown[]> {
	const s = await loadSettings(ctx);
	return [
		{ type: "header", text: "Bible by Midvash" },
		{
			type: "context",
			text: "Detecta referências bíblicas no conteúdo e exibe tooltips com o versículo, via api.midvash.com.",
		},
		{
			type: "form",
			block_id: "settings",
			submit: { label: "Salvar", action_id: "save" },
			fields: buildSettingsFormFields(s),
		},
		{ type: "divider" },
		{
			type: "context",
			text: "Powered by Midvash API • https://api.midvash.com",
		},
	];
}

export default {
	hooks: {
		"plugin:install": {
			handler: async (_event: unknown, ctx: PluginContext) => {
				ctx.log.info("Bible by Midvash installed — seeding defaults");
				for (const [k, v] of Object.entries(DEFAULTS)) {
					const existing = await ctx.kv.get(`settings:${k}`);
					if (existing === null || existing === undefined) {
						await ctx.kv.set(`settings:${k}`, v);
					}
				}
			},
		},
	},

	routes: {
		lookup: {
			public: true,
			handler: async (routeCtx: any, ctx: PluginContext) => {
				const url = new URL(routeCtx.request.url);
				const refRaw = url.searchParams.get("ref");
				if (!refRaw) throw new PluginRouteError("MISSING_REF", "Missing ?ref", 400);

				const settings = await loadSettings(ctx);
				const version = url.searchParams.get("v") || settings.defaultVersion;
				const language = (url.searchParams.get("lang") as Language) || settings.language;

				const parsed = parseReference(refRaw);
				if (!parsed) {
					throw new PluginRouteError("UNRECOGNIZED_REFERENCE", "Unrecognized reference", 422);
				}

				if (!ctx.http) {
					throw new PluginRouteError("NETWORK_UNAVAILABLE", "Network capability missing", 500);
				}

				const verse = await fetchVerse(
					parsed,
					{
						version,
						timeoutMs: settings.apiTimeoutMs,
						cacheEnabled: settings.cacheEnabled,
						cacheTtlSeconds: settings.cacheTtlSeconds,
					},
					ctx.kv,
					ctx.http,
				);

				if (!verse) {
					throw new PluginRouteError("UPSTREAM_ERROR", "Upstream lookup failed", 502);
				}

				// Build the display reference in the requested language. We prefer
				// the user's exact matched name (preserves their casing/accents),
				// then fall back to the canonical name in `language`, then to
				// the upstream English meta.reference as a last resort.
				const versePart =
					parsed.verse !== undefined
						? `:${parsed.verse}${parsed.verseEnd && parsed.verseEnd !== parsed.verse ? `-${parsed.verseEnd}` : ""}`
						: "";
				const displayRef =
					`${parsed.matchedName || displayName(parsed.slug, language)} ${parsed.chapter}${versePart}`.trim();

				return {
					reference: displayRef,
					text: verse.data.text,
					version,
					readMoreUrl: buildReadMoreUrl(parsed, version, language),
					meta: { cached: verse.meta.cached, upstreamReference: verse.meta.reference },
				};
			},
		},

		versions: {
			public: true,
			handler: async (routeCtx: any, ctx: PluginContext) => {
				const url = new URL(routeCtx.request.url);
				const lang = url.searchParams.get("lang") || undefined;
				const settings = await loadSettings(ctx);
				if (!ctx.http) {
					throw new PluginRouteError("NETWORK_UNAVAILABLE", "Network capability missing", 500);
				}
				const result = await fetchVersions(lang, settings.apiTimeoutMs, ctx.kv, ctx.http);
				if (!result) throw new PluginRouteError("UPSTREAM_ERROR", "Upstream failed", 502);
				// EmDash wraps a route's return value in `{ data: ... }`. fetchVersions
				// already returns `{ data: [...] }`, so returning it whole would double-wrap
				// (`{ data: { data: [...] } }`). Return the inner array to match /lookup.
				return result.data;
			},
		},

		// Admin: read settings (for the auto-generated form).
		settings: {
			handler: async (_routeCtx: any, ctx: PluginContext) => {
				return await loadSettings(ctx);
			},
		},

		// Admin: persist settings.
		"settings/save": {
			handler: async (routeCtx: any, ctx: PluginContext) => {
				const body = (routeCtx.input ?? (await routeCtx.request.json())) as Record<
					string,
					unknown
				>;
				for (const [k, v] of Object.entries(body)) {
					if (v !== undefined) await ctx.kv.set(`settings:${k}`, v);
				}
				return { success: true };
			},
		},

		// Block Kit admin form — rendered at /_emdash/admin/plugins/bible-by-midvash/settings.
		admin: {
			handler: async (routeCtx: any, ctx: PluginContext) => {
				const interaction = (routeCtx.input ?? {}) as {
					type?: string;
					page?: string;
					action_id?: string;
					values?: Record<string, unknown>;
				};

				if (interaction.type === "form_submit" && interaction.action_id === "save") {
					const values = interaction.values ?? {};
					for (const [k, v] of Object.entries(values)) {
						if (v !== undefined) await ctx.kv.set(`settings:${k}`, v);
					}
					return {
						blocks: await renderSettingsBlocks(ctx),
						toast: { message: "Configurações salvas", type: "success" },
					};
				}

				return { blocks: await renderSettingsBlocks(ctx) };
			},
		},

		// Diagnostic: scan an arbitrary text and return all detected refs.
		// Useful for debugging from the admin or testing the parser.
		scan: {
			public: false,
			handler: async (routeCtx: any) => {
				const text = (routeCtx.input?.text ?? "") as string;
				const matches = [];
				for (const m of findReferences(text)) matches.push(m);
				return { matches };
			},
		},
	},
} satisfies SandboxedPlugin;
