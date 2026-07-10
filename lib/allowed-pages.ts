// ─── ALLOWED PAGES ────────────────────────────────────────────────────────────
// Builds the set of page slugs that the proxy will serve.
// The set is derived from public/sitemap.xml at startup and cached for the
// lifetime of the process.
//
// Unknown slugs are not blocked — they receive the Framer 404 page instead,
// so Framer's own 404 design is preserved.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync } from "fs";
import { join } from "path";

/**
 * Fallback list used when public/sitemap.xml cannot be read at startup.
 * Add your page slugs here so the proxy works even before a sitemap exists.
 * (The root homepage is represented by an empty string "".)
 */
const FALLBACK_PAGES = ["", "404"];

/**
 * Reads public/sitemap.xml and extracts every page slug into a Set.
 * Falls back to FALLBACK_PAGES if the file is missing or unreadable.
 *
 * Call once at module load — the result is module-level cached.
 */
export function loadAllowedPages(): Set<string> {
  try {
    const xml = readFileSync(join(process.cwd(), "public/sitemap.xml"), "utf-8");
    const pages = new Set<string>(["404"]);
    for (const match of xml.matchAll(/<loc>\s*https?:\/\/[^/]+\/?([^<\s]*)\s*<\/loc>/g)) {
      pages.add(match[1].trim());
    }
    return pages;
  } catch {
    return new Set(FALLBACK_PAGES);
  }
}
