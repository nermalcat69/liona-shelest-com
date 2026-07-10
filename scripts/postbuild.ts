// ─── POSTBUILD SCRIPT ─────────────────────────────────────────────────────────
// Runs automatically after `next build` via the `postbuild` npm script.
//
// What it does:
//   1. Scrapes the Framer sitemap to discover all published pages
//   2. Merges new slugs into config/seo.config.ts as placeholder entries
//      (existing user edits are never overwritten)
//   3. Stamps public/robots.txt with the correct Sitemap URL from site.config.ts
//
// You never need to edit this file.
// ─────────────────────────────────────────────────────────────────────────────

import { writeFileSync } from "fs";
import { join } from "path";
import siteConfig from "../config/site.config";
import currentSeoConfig, { type PageSeo } from "../config/seo.config";

// ─── 1. Scrape sitemap ────────────────────────────────────────────────────────

async function fetchSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${siteConfig.framerUrl}/sitemap.xml`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const slugs: string[] = [];
    for (const match of xml.matchAll(/<loc>\s*https?:\/\/[^/]+\/?([^<\s]*)\s*<\/loc>/g)) {
      slugs.push(match[1].trim());
    }
    // Always ensure the homepage slug is present
    if (!slugs.includes("")) slugs.unshift("");
    return slugs;
  } catch (err) {
    console.warn(`postbuild: could not fetch sitemap (${err}) — skipping seo.config.ts update`);
    return [];
  }
}

// ─── 2. Generate config/seo.config.ts ────────────────────────────────────────

function generateSeoConfigFile(entries: Record<string, PageSeo>): string {
  const lines: string[] = [
    `// ─── PER-PAGE SEO CONFIGURATION ───────────────────────────────────────────────`,
    `// Edit the title and description for each page below.`,
    `// Slug ""  = homepage  ( / )`,
    `// Slug "about" = /about, etc.`,
    `//`,
    `// Running \`npm run build\` scrapes the Framer sitemap and automatically adds`,
    `// any new pages as placeholder entries — your existing edits are never touched.`,
    `// ─────────────────────────────────────────────────────────────────────────────`,
    ``,
    `export interface PageSeo {`,
    `  title: string;`,
    `  description: string;`,
    `}`,
    ``,
    `const seoConfig: Record<string, PageSeo> = {`,
  ];

  for (const [slug, { title, description }] of Object.entries(entries)) {
    lines.push(`  ${JSON.stringify(slug)}: {`);
    lines.push(`    title: ${JSON.stringify(title)},`);
    lines.push(`    description: ${JSON.stringify(description)},`);
    lines.push(`  },`);
  }

  lines.push(`};`, ``, `export default seoConfig;`, ``);
  return lines.join("\n");
}

// ─── 3. Generate public/robots.txt ───────────────────────────────────────────

function generateRobotsTxt(): string {
  return `User-agent: *\nAllow: /\nSitemap: ${siteConfig.domain}/sitemap.xml\n`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const slugs = await fetchSlugs();

  if (slugs.length > 0) {
    const merged: Record<string, PageSeo> = { ...currentSeoConfig };
    const newSlugs: string[] = [];

    // Add placeholder entries for pages not yet in the config
    for (const slug of slugs) {
      if (!(slug in merged)) {
        const lastSegment = slug.split("/").pop() ?? slug;
        const label = slug === "" ? "Home" : lastSegment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        merged[slug] = {
          title: `${label} | ${siteConfig.name}`,
          description: `Description for the ${label} page.`,
        };
        newSlugs.push(slug || "/");
      }
    }

    // Sync the " | <name>" suffix on every existing entry so changing
    // siteConfig.name propagates across all titles automatically.
    // Titles without a " | " separator are left untouched (custom titles).
    let updatedNames = 0;
    for (const entry of Object.values(merged)) {
      const separatorIdx = entry.title.lastIndexOf(" | ");
      if (separatorIdx !== -1) {
        const currentSuffix = entry.title.slice(separatorIdx + 3);
        if (currentSuffix !== siteConfig.name) {
          entry.title = `${entry.title.slice(0, separatorIdx)} | ${siteConfig.name}`;
          updatedNames++;
        }
      }
    }

    const seoConfigPath = join(process.cwd(), "config", "seo.config.ts");
    writeFileSync(seoConfigPath, generateSeoConfigFile(merged), "utf-8");

    if (newSlugs.length > 0) {
      console.log(`postbuild: added ${newSlugs.length} new page(s) to config/seo.config.ts → ${newSlugs.join(", ")}`);
    }
    if (updatedNames > 0) {
      console.log(`postbuild: updated site name to "${siteConfig.name}" in ${updatedNames} title(s)`);
    }
    if (newSlugs.length === 0 && updatedNames === 0) {
      console.log(`postbuild: config/seo.config.ts is up to date (${slugs.length} pages)`);
    }
  } else {
    console.log(`postbuild: skipped seo.config.ts update (sitemap unavailable)`);
  }

  // Always update robots.txt
  const robotsPath = join(process.cwd(), "public", "robots.txt");
  writeFileSync(robotsPath, generateRobotsTxt(), "utf-8");
  console.log(`postbuild: wrote public/robots.txt (Sitemap: ${siteConfig.domain}/sitemap.xml)`);
}

main();
