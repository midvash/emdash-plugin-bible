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
 * Settings schema metadata — the canonical field declarations live in
 * `./lib/settings` (`SETTINGS_FIELDS`) and are the single source of truth for
 * the runtime defaults/type, the KV coercion, and the Block Kit admin form.
 * Re-exported here as `SETTINGS_SCHEMA` for future marketplace bundling
 * (manifest.json `admin.settingsSchema`).
 */
export { SETTINGS_FIELDS as SETTINGS_SCHEMA } from "./lib/settings.ts";
export type { BibleSettings } from "./lib/settings.ts";

export default biblePlugin;
