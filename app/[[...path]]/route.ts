// ─── PROXY ROUTE ──────────────────────────────────────────────────────────────
// Catches every request and forwards it to the Framer site.
// HTML responses are post-processed (SEO injection, URL rewriting, video fixes).
// All configuration lives in config/site.config.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import siteConfig from "@/config/site.config";
import { CACHE, cacheControl } from "@/lib/cache";
import { injectSeo } from "@/lib/seo";
import { rewriteFramerUrls, fixVideoAttributes } from "@/lib/html";
import { loadAllowedPages } from "@/lib/allowed-pages";

// Resolved once at cold-start and kept for the process lifetime.
const ALLOWED_PAGES = loadAllowedPages();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params;
  const pathname = path ? path.join("/") : "";

  // robots.txt is a static file managed by the postbuild script.
  // sitemap.xml is handled by app/sitemap.xml/route.ts.
  if (pathname === "robots.txt") {
    try {
      const content = readFileSync(join(process.cwd(), "public", "robots.txt"), "utf-8");
      return new Response(content, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": cacheControl(CACHE.ROBOTS),
        },
      });
    } catch {
      return new Response(null, { status: 404 });
    }
  }

  // Assets (any segment with a ".") and Framer internals (starting with "_")
  // always pass through. Unknown page slugs receive the Framer 404 page.
  const isAsset = path?.some((segment) => segment.includes("."));
  const isFramerInternal = path?.[0]?.startsWith("_");
  const isAllowedPage = isAsset || isFramerInternal || ALLOWED_PAGES.has(pathname);

  const targetUrl = isAllowedPage
    ? `${siteConfig.framerUrl}/${pathname}`
    : `${siteConfig.framerUrl}/404`;

  // Forward the Range header so Safari / iOS can seek in video files.
  const range = req.headers.get("range");
  const fetchHeaders: Record<string, string> = {
    "User-Agent": req.headers.get("user-agent") ?? "Mozilla/5.0",
    Accept: req.headers.get("accept") ?? "*/*",
    "Accept-Encoding": "identity",
  };
  if (range) fetchHeaders["Range"] = range;

  let res: Response;
  try {
    res = await fetch(targetUrl, {
      headers: fetchHeaders,
      next: { revalidate: CACHE.ASSET },
    } as RequestInit & { next: { revalidate: number } });
  } catch {
    return new Response("Page temporarily unavailable. Please try again.", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("text/html")) {
    let html = await res.text();
    html = rewriteFramerUrls(html);
    html = injectSeo(html, pathname);
    html = fixVideoAttributes(html);

    return new Response(html, {
      status: isAllowedPage ? 200 : 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": cacheControl(CACHE.HTML),
      },
    });
  }

  const body = await res.arrayBuffer();
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": cacheControl(CACHE.ASSET),
  };

  const contentEncoding = res.headers.get("content-encoding");
  if (contentEncoding) headers["Content-Encoding"] = contentEncoding;

  if (contentType.includes("video/")) {
    headers["Accept-Ranges"] = res.headers.get("accept-ranges") ?? "bytes";
    const contentLength = res.headers.get("content-length");
    if (contentLength) headers["Content-Length"] = contentLength;
    const contentRange = res.headers.get("content-range");
    if (contentRange) headers["Content-Range"] = contentRange;
  }

  return new Response(body, { status: res.status, headers });
}
