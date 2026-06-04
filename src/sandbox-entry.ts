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

interface Settings {
	enabled: boolean;
	language: Language;
	defaultVersion: string;
	selectors: string;
	theme: "auto" | "light" | "dark" | "sepia";
	useCustomColors: boolean;
	linkColor: string;
	underlineLinks: boolean;
	underlineColor: string;
	underlineStyle: "solid" | "dashed" | "dotted" | "wavy";
	showVersionBadge: boolean;
	showReadMore: boolean;
	cacheEnabled: boolean;
	cacheTtlSeconds: number;
	apiTimeoutMs: number;
}

const DEFAULTS: Settings = {
	enabled: true,
	language: "pt-br",
	defaultVersion: "naa",
	selectors: "article\n.prose\n.post-content\nmain",
	theme: "auto",
	useCustomColors: false,
	linkColor: "#B17027",
	underlineLinks: false,
	underlineColor: "#E8B45A",
	underlineStyle: "solid",
	showVersionBadge: true,
	showReadMore: true,
	cacheEnabled: true,
	cacheTtlSeconds: 2_592_000,
	apiTimeoutMs: 5000,
};

async function loadSettings(ctx: PluginContext): Promise<Settings> {
	const out = { ...DEFAULTS };
	for (const key of Object.keys(DEFAULTS) as Array<keyof Settings>) {
		const v = await ctx.kv.get<unknown>(`settings:${key}`);
		if (v !== null && v !== undefined) (out as Record<string, unknown>)[key] = v;
	}
	return out;
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
			fields: [
				{
					type: "toggle",
					action_id: "enabled",
					label: "Ativar detecção",
					initial_value: s.enabled,
				},
				{
					type: "select",
					action_id: "language",
					label: "Idioma",
					initial_value: s.language,
					options: [
						{ value: "pt-br", label: "Português (Brasil)" },
						{ value: "en", label: "English" },
						{ value: "es", label: "Español" },
					],
				},
				{
					type: "select",
					action_id: "defaultVersion",
					label: "Versão padrão",
					initial_value: s.defaultVersion,
					options: [
						{ value: "naa", label: "NAA — Nova Almeida Atualizada" },
						{ value: "ara", label: "ARA — Almeida Revista e Atualizada" },
						{ value: "arc", label: "ARC — Almeida Revista e Corrigida" },
						{ value: "acf", label: "ACF — Almeida Corrigida Fiel" },
						{ value: "nvi", label: "NVI — Nova Versão Internacional" },
						{ value: "nvt", label: "NVT — Nova Versão Transformadora" },
						{ value: "ntlh", label: "NTLH — Nova Tradução na Linguagem de Hoje" },
						{ value: "kja", label: "KJA — King James Atualizada" },
						{ value: "esv", label: "ESV — English Standard Version" },
						{ value: "kjv", label: "KJV — King James Version" },
						{ value: "niv", label: "NIV — New International Version" },
						{ value: "rvr1960", label: "RVR1960 — Reina-Valera 1960" },
					],
				},
				{
					type: "text_input",
					action_id: "selectors",
					label: "Seletores CSS (um por linha)",
					initial_value: s.selectors,
					multiline: true,
				},
				{
					type: "select",
					action_id: "theme",
					label: "Tema do tooltip",
					initial_value: s.theme,
					options: [
						{ value: "auto", label: "Automático" },
						{ value: "light", label: "Pergaminho (claro)" },
						{ value: "dark", label: "Noite Quente (escuro)" },
						{ value: "sepia", label: "Sépia" },
					],
				},
				{
					type: "toggle",
					action_id: "useCustomColors",
					label: "Usar cores customizadas",
					initial_value: s.useCustomColors,
				},
				{
					type: "text_input",
					action_id: "linkColor",
					label: "Cor do link (hex) — só ativa se 'Usar cores customizadas' estiver ligado",
					initial_value: s.linkColor,
				},
				{
					type: "toggle",
					action_id: "underlineLinks",
					label: "Sublinhar referências",
					initial_value: s.underlineLinks,
				},
				{
					type: "text_input",
					action_id: "underlineColor",
					label: "Cor do sublinhado",
					initial_value: s.underlineColor,
				},
				{
					type: "select",
					action_id: "underlineStyle",
					label: "Estilo do sublinhado",
					initial_value: s.underlineStyle,
					options: [
						{ value: "solid", label: "Sólido" },
						{ value: "dashed", label: "Tracejado" },
						{ value: "dotted", label: "Pontilhado" },
						{ value: "wavy", label: "Ondulado" },
					],
				},
				{
					type: "toggle",
					action_id: "showVersionBadge",
					label: "Mostrar badge da versão",
					initial_value: s.showVersionBadge,
				},
				{
					type: "toggle",
					action_id: "showReadMore",
					label: "Mostrar link 'Ler mais'",
					initial_value: s.showReadMore,
				},
				{
					type: "toggle",
					action_id: "cacheEnabled",
					label: "Cache de versículos",
					initial_value: s.cacheEnabled,
				},
				{
					type: "number_input",
					action_id: "cacheTtlSeconds",
					label: "Duração do cache (segundos)",
					initial_value: s.cacheTtlSeconds,
					min: 60,
					max: 31_536_000,
				},
				{
					type: "number_input",
					action_id: "apiTimeoutMs",
					label: "Timeout da API (ms)",
					initial_value: s.apiTimeoutMs,
					min: 500,
					max: 30_000,
				},
			],
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
