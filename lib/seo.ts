// ─── SEO INJECTION ────────────────────────────────────────────────────────────
// Overwrites and locks SEO metadata in the proxied HTML.
// Per-page title + description are read from config/seo.config.ts.
// Falls back to the homepage entry ("") when a slug has no explicit config.
// ─────────────────────────────────────────────────────────────────────────────

import seoConfig from "@/config/seo.config";

/**
 * Resolves the SEO entry for a given page slug.
 * Falls back to the homepage entry ("") when the slug is not configured.
 */
function resolveSeo(slug: string): { title: string; description: string } {
  return seoConfig[slug] ?? seoConfig[""] ?? { title: "", description: "" };
}

/**
 * Injects and locks SEO metadata into an HTML string for the given page slug.
 * Runs four passes:
 *   1. Overwrite <title>
 *   2. Overwrite / inject <meta name="description">
 *   3. Overwrite / inject Open Graph + Twitter card tags
 *   4. Inject a title-lock script so Framer's client-side JS cannot overwrite it
 */
export function injectSeo(html: string, slug: string): string {
  const { title, description } = resolveSeo(slug);
  html = replaceTitle(html, title);
  html = replaceMetaDescription(html, description);
  html = replaceOpenGraph(html, title, description);
  html = injectTitleLock(html, title);
  return html;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function replaceTitle(html: string, title: string): string {
  return html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
}

function replaceMetaDescription(html: string, description: string): string {
  const tag = `<meta name="description" content="${description}">`;
  if (/<meta name="description"/i.test(html)) {
    return html.replace(/<meta name="description"[^>]*>/i, tag);
  }
  return html.replace("</head>", `${tag}\n</head>`);
}

function replaceOpenGraph(html: string, title: string, description: string): string {
  const tags: [RegExp, string][] = [
    [/<meta property="og:title"[^>]*>/i,       `<meta property="og:title" content="${title}">`],
    [/<meta property="og:description"[^>]*>/i,  `<meta property="og:description" content="${description}">`],
    [/<meta name="twitter:title"[^>]*>/i,       `<meta name="twitter:title" content="${title}">`],
    [/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${description}">`],
  ];

  for (const [pattern, replacement] of tags) {
    if (pattern.test(html)) {
      html = html.replace(pattern, replacement);
    } else {
      html = html.replace("</head>", `${replacement}\n</head>`);
    }
  }

  return html;
}

/**
 * Injects a tiny inline script that:
 *   - Sets document.title immediately on parse
 *   - Freezes document.title so Framer's JS cannot overwrite it later
 * Also hides the Framer watermark badge.
 */
function injectTitleLock(html: string, title: string): string {
  const script = `<script>(function(){var t=${JSON.stringify(title)};document.title=t;Object.defineProperty(document,"title",{get:function(){return t;},set:function(){},configurable:false});})();</script>`;
  const hideBadge = `<style>.__framer-badge{display:none!important}</style>`;
  return html.replace("</head>", `${script}${hideBadge}\n</head>`);
}
