/**
 * Canonical plugin settings — the single source of truth.
 *
 * `SETTINGS_FIELDS` below is the ONLY place a setting (its key, type, default,
 * label and constraints) is declared. Everything else is derived from it:
 *
 *   - the `BibleSettings` type           (this module)
 *   - `DEFAULTS`                          (this module)
 *   - `coerceSettings()` validation       (this module)
 *   - `SETTINGS_SCHEMA` (admin/manifest)  (re-exported from index.ts)
 *   - the Block Kit admin form fields      (sandbox-entry.ts)
 *
 * Previously these lived in three hand-maintained copies (index.ts schema,
 * runtime.ts DEFAULTS, sandbox-entry.ts DEFAULTS) that had already drifted —
 * `useCustomColors` was missing from the schema and `underlineLinks` had two
 * different defaults. Deriving from one declaration makes the admin form and
 * the rendered output provably consistent.
 */

export interface SelectOption {
	value: string;
	label: string;
}

interface FieldBase {
	label: string;
	description?: string;
}

export interface BooleanField extends FieldBase {
	type: "boolean";
	default: boolean;
}
export interface StringField extends FieldBase {
	type: "string";
	default: string;
	multiline?: boolean;
}
export interface NumberField extends FieldBase {
	type: "number";
	default: number;
	min?: number;
	max?: number;
}
export interface SelectField extends FieldBase {
	type: "select";
	default: string;
	options: readonly SelectOption[];
}

export type SettingsField = BooleanField | StringField | NumberField | SelectField;

const LANGUAGE_OPTIONS = [
	{ value: "pt-br", label: "Português (Brasil)" },
	{ value: "en", label: "English" },
	{ value: "es", label: "Español" },
] as const;

const VERSION_OPTIONS = [
	// Portuguese-BR (14)
	{ value: "naa", label: "NAA — Nova Almeida Atualizada" },
	{ value: "ara", label: "ARA — Almeida Revista e Atualizada" },
	{ value: "arc", label: "ARC — Almeida Revista e Corrigida" },
	{ value: "acf", label: "ACF — Almeida Corrigida Fiel" },
	{ value: "nvi", label: "NVI — Nova Versão Internacional" },
	{ value: "nvt", label: "NVT — Nova Versão Transformadora" },
	{ value: "ntlh", label: "NTLH — Nova Tradução na Linguagem de Hoje" },
	{ value: "aa", label: "AA — Almeida Antiga" },
	{ value: "as21", label: "AS21 — Almeida Século 21" },
	{ value: "jfaa", label: "JFAA — João Ferreira de Almeida Atualizada" },
	{ value: "kja", label: "KJA — King James Atualizada" },
	{ value: "kjf", label: "KJF — King James Fiel" },
	{ value: "msgpt", label: "MSG — A Mensagem (PT)" },
	{ value: "nbv", label: "NBV — Nova Bíblia Viva" },
	// English (6)
	{ value: "esv", label: "ESV — English Standard Version" },
	{ value: "kjv", label: "KJV — King James Version" },
	{ value: "nkjv", label: "NKJV — New King James Version" },
	{ value: "niv", label: "NIV — New International Version" },
	{ value: "nlt", label: "NLT — New Living Translation" },
	{ value: "msg", label: "MSG — The Message" },
	// Spanish (3)
	{ value: "rvr1960", label: "RVR1960 — Reina-Valera 1960" },
	{ value: "nvi-es", label: "NVI — Nueva Versión Internacional (ES)" },
	{ value: "ntv", label: "NTV — Nueva Traducción Viviente" },
] as const;

const THEME_OPTIONS = [
	{ value: "auto", label: "Automático (segue prefers-color-scheme)" },
	{ value: "light", label: "Pergaminho (claro)" },
	{ value: "dark", label: "Noite Quente (escuro)" },
	{ value: "sepia", label: "Sépia (modo leitura)" },
] as const;

const UNDERLINE_STYLE_OPTIONS = [
	{ value: "solid", label: "Sólido" },
	{ value: "dashed", label: "Tracejado" },
	{ value: "dotted", label: "Pontilhado" },
	{ value: "wavy", label: "Ondulado" },
] as const;

export const SETTINGS_FIELDS = {
	enabled: {
		type: "boolean",
		label: "Ativar detecção de referências",
		description: "Quando desligado, o script cliente não é injetado.",
		default: true,
	},
	language: {
		type: "select",
		label: "Idioma",
		description:
			"Define o conjunto de nomes de livros reconhecidos e a URL no midvash.com.",
		options: LANGUAGE_OPTIONS,
		default: "pt-br",
	},
	defaultVersion: {
		type: "select",
		label: "Versão padrão",
		description: "Versão da Bíblia usada nos tooltips e no link 'Ler mais'.",
		options: VERSION_OPTIONS,
		default: "naa",
	},
	selectors: {
		type: "string",
		multiline: true,
		label: "Seletores CSS onde detectar (um por linha)",
		description:
			"O script só procura referências dentro destes elementos. Use seletores específicos para evitar processar a UI inteira.",
		default: "article\n.prose\n.post-content\nmain",
	},
	theme: {
		type: "select",
		label: "Tema do tooltip",
		options: THEME_OPTIONS,
		default: "auto",
	},
	useCustomColors: {
		type: "boolean",
		label: "Usar cores personalizadas",
		description:
			"Quando desligado, as referências herdam o estilo de link do site. Quando ligado, aplica a cor e o sublinhado configurados abaixo.",
		default: false,
	},
	linkColor: {
		type: "string",
		label: "Cor do link",
		description:
			"Hex (#B17027) ou qualquer valor CSS. Só aplica se 'Usar cores personalizadas' estiver ligado. Padrão: Honey Deep da Midvash.",
		default: "#B17027",
	},
	underlineLinks: {
		type: "boolean",
		label: "Sublinhar referências",
		description: "Só aplica se 'Usar cores personalizadas' estiver ligado.",
		default: false,
	},
	underlineColor: {
		type: "string",
		label: "Cor do sublinhado",
		description: "Padrão: Honey da Midvash.",
		default: "#E8B45A",
	},
	underlineStyle: {
		type: "select",
		label: "Estilo do sublinhado",
		options: UNDERLINE_STYLE_OPTIONS,
		default: "solid",
	},
	showVersionBadge: {
		type: "boolean",
		label: "Mostrar badge da versão no tooltip",
		default: true,
	},
	showReadMore: {
		type: "boolean",
		label: "Mostrar link 'Ler mais' no tooltip",
		default: true,
	},
	cacheEnabled: {
		type: "boolean",
		label: "Ativar cache",
		description: "Armazena versículos no KV pra reduzir chamadas à API.",
		default: true,
	},
	cacheTtlSeconds: {
		type: "number",
		label: "Duração do cache (segundos)",
		description: "Padrão: 2.592.000 = 30 dias. Texto bíblico não muda; pode aumentar.",
		default: 2_592_000,
		min: 60,
		max: 31_536_000,
	},
	apiTimeoutMs: {
		type: "number",
		label: "Timeout da API (ms)",
		description: "Tempo máximo de espera por resposta da api.midvash.com.",
		default: 5000,
		min: 500,
		max: 30_000,
	},
} as const satisfies Record<string, SettingsField>;

export type SettingsKey = keyof typeof SETTINGS_FIELDS;

/** Map a field declaration to the type of its value. */
type FieldValue<F> = F extends { readonly type: "boolean" }
	? boolean
	: F extends { readonly type: "number" }
		? number
		: F extends { readonly type: "select"; readonly options: readonly { readonly value: infer V }[] }
			? V
			: F extends { readonly type: "string" }
				? string
				: never;

/** The resolved settings object, derived from SETTINGS_FIELDS. */
export type BibleSettings = {
	-readonly [K in SettingsKey]: FieldValue<(typeof SETTINGS_FIELDS)[K]>;
};

export const DEFAULTS: BibleSettings = Object.fromEntries(
	(Object.keys(SETTINGS_FIELDS) as SettingsKey[]).map((k) => [k, SETTINGS_FIELDS[k].default]),
) as BibleSettings;

function coerceValue(field: SettingsField, raw: unknown): unknown {
	switch (field.type) {
		case "boolean":
			if (typeof raw === "boolean") return raw;
			if (raw === "true") return true;
			if (raw === "false") return false;
			return undefined;
		case "number": {
			const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
			if (!Number.isFinite(n)) return undefined;
			let clamped = n;
			if (field.min !== undefined) clamped = Math.max(field.min, clamped);
			if (field.max !== undefined) clamped = Math.min(field.max, clamped);
			return clamped;
		}
		case "select":
			return typeof raw === "string" && field.options.some((o) => o.value === raw)
				? raw
				: undefined;
		case "string":
			return typeof raw === "string" ? raw : undefined;
	}
}

/**
 * Build a `BibleSettings` from raw (persisted) values, validating and coercing
 * each one against its declared type / enum and falling back to the default on
 * any mismatch. Hardens both the runtime helper and `/lookup` against corrupt
 * or wrong-typed KV values (a string where a boolean is expected, an unknown
 * `theme` / `language` / `underlineStyle`, an out-of-range number, …).
 */
export function coerceSettings(raw: Record<string, unknown> | null | undefined): BibleSettings {
	const out: BibleSettings = { ...DEFAULTS };
	if (!raw) return out;
	for (const key of Object.keys(SETTINGS_FIELDS) as SettingsKey[]) {
		const value = raw[key];
		if (value === null || value === undefined) continue;
		const coerced = coerceValue(SETTINGS_FIELDS[key], value);
		if (coerced !== undefined) (out as Record<string, unknown>)[key] = coerced;
	}
	return out;
}
