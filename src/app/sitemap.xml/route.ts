import { MetadataRoute } from "next";

const BASE_URL = "https://cab.devvyy.xyz";

const pages = [
  "/",
  "/about",
  "/trade-calculator",
  "/compare",
  "/damage-calculator",
  "/inventory",
  "/news",
  "/settings",
  "/team-builder",
  "/battle",
  "/battle-simulator",
  "/values",
  "/database/brainrots",
  "/database/items",
  "/database/movesets",
  "/admin/news",
  "/share",
];

export async function GET() {
  const sitemap = pages.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "daily" as const,
    priority: path === "/" ? 1.0 : 0.8,
  }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap
  .map(
    (item) => `  <url>
    <loc>${item.url}</loc>
    <lastmod>${item.lastModified}</lastmod>
    <changefreq>${item.changeFrequency}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
