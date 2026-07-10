# Framer Reverse Proxy
<img width="1108" height="611" alt="image" src="https://github.com/user-attachments/assets/d1d1dc7e-f8b7-4f4b-8ddd-ba75587d997a" />

A Next.js reverse proxy that forwards requests to a Framer-hosted site under your own custom domain. It rewrites URLs, injects SEO metadata, and handles static assets and video streaming transparently.

> **Note:** This project is for educational purposes only. Use it at your own risk. It is a demonstration of how reverse proxies work and how they can be useful when you want to map a custom domain to a Framer site.

> This was made by me to tackle the issue of 1GB Bandwidth limit

---

## How it works

Every incoming request is caught by a single catch-all route and forwarded to the configured Framer publish URL. HTML responses are post-processed to rewrite internal Framer URLs to your domain and inject per-page SEO tags. Assets and videos pass through as-is.

---

## Setup

1. Install dependencies:

```bash
bun install
```

2. Edit [config/site.config.ts](config/site.config.ts) and set your values:

```ts
const siteConfig = {
  framerUrl: "https://your-project.framer.app", // your Framer publish URL
  domain: "https://yourdomain.com",              // your custom domain
  name: "Your Site Name",
};
```

3. Edit [config/seo.config.ts](config/seo.config.ts) to set titles and descriptions for each page. Running a build will automatically append any new pages found in the Framer sitemap.

4. Run the development server:

```bash
bun run dev
```

5. Build and start for production:

```bash
bun run build
bun start
```

---

## Deployment

Deploy to any platform that supports Next.js (Vercel, Railway, etc.). Point your custom domain DNS to the deployment. No additional configuration is required beyond [config/site.config.ts](config/site.config.ts).
