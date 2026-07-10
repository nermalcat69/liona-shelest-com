// ─── CACHING ──────────────────────────────────────────────────────────────────
// Centralised cache durations and Cache-Control header helpers.
// Adjust the values below to tune CDN / browser caching for your deployment.
// ─────────────────────────────────────────────────────────────────────────────

/** Cache durations in seconds. */
export const CACHE = {
  /** 70 days — aggressive long-term cache for static assets (JS, CSS, images, fonts, video). */
  ASSET: 60,
  /** 70 days — HTML pages served through the proxy. */
  HTML: 60,
  /** 24 hours — sitemap revalidation. */
  SITEMAP: 86_400,
  /** 1 hour — robots.txt. */
  ROBOTS: 3_600,
} as const;

/**
 * Builds a `Cache-Control` header value for the given max-age.
 * Uses `s-maxage` (CDN/edge) + `stale-while-revalidate` so stale content is
 * served instantly while the edge revalidates in the background.
 */
export function cacheControl(maxAge: number): string {
  return `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge}`;
}
