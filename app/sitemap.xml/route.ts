import siteConfig from "@/config/site.config";
import { CACHE, cacheControl } from "@/lib/cache";

export const revalidate = 86400;

export async function GET() {
  let xml: string;

  try {
    const res = await fetch(`${siteConfig.framerUrl}/sitemap.xml`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate },
    } as RequestInit & { next: { revalidate: number } });

    if (!res.ok) throw new Error(`Framer returned ${res.status}`);
    xml = await res.text();
  } catch {
    xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${siteConfig.domain}/</loc></url>
</urlset>`;
  }

  xml = xml.replaceAll(siteConfig.framerUrl, siteConfig.domain);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": cacheControl(CACHE.SITEMAP),
    },
  });
}
