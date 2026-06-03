/**
 * Astro middleware that linkifies Bible references in the SSR HTML.
 *
 * Usage in the consuming Astro project:
 *
 *   // src/middleware.ts
 *   import { sequence } from "astro:middleware";
 *   import { bibleLinkifier } from "@midvash/emdash-plugin-bible/middleware";
 *
 *   export const onRequest = sequence(bibleLinkifier());
 *
 * The middleware runs after the page renders, intercepts HTML responses,
 * and transforms text content (outside <a>, <code>, <pre>, etc.) by
 * wrapping recognized Bible references in real <a href> anchors. The
 * client-side script then attaches hover tooltips to those anchors.
 */

import type { MiddlewareHandler } from "astro";

import type { Language } from "./lib/books.ts";
import { linkifyHtml } from "./lib/linkify.ts";

interface BibleLinkifierOptions {
	/**
	 * Override the default language for sites that don't expose locale
	 * information through `Astro.currentLocale`. Defaults to reading
	 * the locale from the request and falling back to the plugin's
	 * configured default language.
	 */
	language?: Language;
	/** Override the version. Falls back to plugin settings. */
	version?: string;
}

const PLUGIN_ID = "bible-by-midvash";

export function bibleLinkifier(options: BibleLinkifierOptions = {}): MiddlewareHandler {
	return async (context, next) => {
		const response = await next();

		// Only touch HTML responses. Skip API routes, _emdash, _astro, etc.
		const ct = response.headers.get("content-type") || "";
		if (!ct.includes("text/html")) return response;

		const url = new URL(context.request.url);
		if (url.pathname.startsWith("/_emdash") || url.pathname.startsWith("/_astro")) {
			return response;
		}

		// Resolve settings lazily so this module doesn't import emdash at
		// build time (avoids edge cases when the plugin runs in isolated
		// sandbox contexts).
		const { getPluginSetting } = await import("emdash");

		const enabled = (await getPluginSetting(PLUGIN_ID, "enabled")) as boolean | null;
		if (enabled === false) return response;

		const language =
			options.language ??
			((await getPluginSetting(PLUGIN_ID, "language")) as Language | null) ??
			"pt-br";
		const version =
			options.version ??
			((await getPluginSetting(PLUGIN_ID, "defaultVersion")) as string | null) ??
			"naa";

		const html = await response.text();
		const transformed = linkifyHtml(html, { language, version });

		const headers = new Headers(response.headers);
		// Body length changed, drop any pre-set content-length.
		headers.delete("content-length");

		return new Response(transformed, {
			status: response.status,
			statusText: response.statusText,
			headers,
		});
	};
}
