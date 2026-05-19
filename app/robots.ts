import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://naepyuncontract.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/upload"],
        disallow: ["/admin", "/api/", "/result/"],
      },
      {
        userAgent: "GPTBot",
        allow: ["/", "/upload"],
        disallow: ["/admin", "/api/", "/result/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/upload"],
        disallow: ["/admin", "/api/", "/result/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/upload"],
        disallow: ["/admin", "/api/", "/result/"],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/upload"],
        disallow: ["/admin", "/api/", "/result/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
