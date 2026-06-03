/**
 * Bible by Midvash — EmDash plugin descriptor.
 *
 * Auto-detects Bible references (PT-BR, EN, ES) in rendered pages and turns
 * them into hover tooltips that pull verse text from the public Midvash API
 * (https://api.midvash.com).
 *
 * Imported in `astro.config.mjs`:
 *   import { biblePlugin } from "@midvash/emdash-plugin-bible";
 *   emdash({ plugins: [biblePlugin()] })
 */

import type { PluginDescriptor } from "emdash";

export interface BiblePluginOptions {
	/**
	 * Override the plugin id. Useful only when running multiple instances
	 * of the same plugin (rare). Defaults to "bible-by-midvash".
	 */
	id?: string;
}

export function biblePlugin(options: BiblePluginOptions = {}): PluginDescriptor {
	return {
		id: options.id ?? "bible-by-midvash",
		version: "0.1.0",
		format: "standard",
		entrypoint: "@midvash/emdash-plugin-bible/sandbox",
		options: {},
		capabilities: ["network:fetch"],
		allowedHosts: ["api.midvash.com"],

		// Admin page rendered by the `admin` route via Block Kit.
		adminPages: [{ path: "/settings", label: "Bible by Midvash", icon: "book" }],
	};
}

/**
 * Settings schema metadata — kept here for future marketplace bundling
 * (manifest.json `admin.settingsSchema`) and consumed by the Block Kit
 * admin route at runtime. Not part of PluginDescriptor (standard format
 * has no top-level settingsSchema field).
 */
export const SETTINGS_SCHEMA = {
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
				options: [
					{ value: "pt-br", label: "Português (Brasil)" },
					{ value: "en", label: "English" },
					{ value: "es", label: "Español" },
				],
				default: "pt-br",
			},
			defaultVersion: {
				type: "select",
				label: "Versão padrão",
				description: "Versão da Bíblia usada nos tooltips e no link 'Ler mais'.",
				options: [
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
				],
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
				options: [
					{ value: "auto", label: "Automático (segue prefers-color-scheme)" },
					{ value: "light", label: "Pergaminho (claro)" },
					{ value: "dark", label: "Noite Quente (escuro)" },
					{ value: "sepia", label: "Sépia (modo leitura)" },
				],
				default: "auto",
			},
			linkColor: {
				type: "string",
				label: "Cor do link",
				description: "Hex (#B17027) ou qualquer valor CSS. Padrão: Honey Deep da Midvash.",
				default: "#B17027",
			},
			underlineLinks: {
				type: "boolean",
				label: "Sublinhar referências",
				default: true,
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
				options: [
					{ value: "solid", label: "Sólido" },
					{ value: "dashed", label: "Tracejado" },
					{ value: "dotted", label: "Pontilhado" },
					{ value: "wavy", label: "Ondulado" },
				],
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
} as const;

export default biblePlugin;
