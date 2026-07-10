// ─── HTML POST-PROCESSING ─────────────────────────────────────────────────────
// Utilities that transform the raw HTML received from Framer before it is
// forwarded to the browser.
// ─────────────────────────────────────────────────────────────────────────────

import siteConfig from "@/config/site.config";

/**
 * Rewrites absolute Framer origin URLs to relative paths.
 * This ensures all asset requests (JS, CSS, images, fonts) route through the
 * proxy instead of hitting the Framer domain directly.
 */
export function rewriteFramerUrls(html: string): string {
  return html.replaceAll(siteConfig.framerUrl, "");
}

/**
 * Adds Safari / iOS video compatibility attributes to every `<video>` element.
 *
 * - `playsinline` — prevents iOS from hijacking playback into fullscreen.
 * - `muted`       — required for `autoplay` to function on iOS Safari.
 */
export function fixVideoAttributes(html: string): string {
  return html.replace(/<video([^>]*)>/gi, (_, attrs: string) => {
    if (!attrs.includes("playsinline")) attrs += " playsinline";
    if (attrs.includes("autoplay") && !attrs.includes("muted")) attrs += " muted";
    return `<video${attrs}>`;
  });
}
