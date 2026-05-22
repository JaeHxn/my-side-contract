import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://my-side-contract.vercel.app";

const botRule = {
  allow: ["/", "/upload"],
  disallow: ["/admin", "/api/", "/result/"],
};

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", ...botRule },
      { userAgent: "GPTBot", ...botRule },
      { userAgent: "PerplexityBot", ...botRule },
      { userAgent: "ClaudeBot", ...botRule },
      { userAgent: "Anthropic-AI", ...botRule },
      { userAgent: "Googlebot", ...botRule },
      { userAgent: "Google-Extended", ...botRule },
      { userAgent: "Meta-ExternalAgent", ...botRule },
      { userAgent: "YouBot", ...botRule },
      { userAgent: "Applebot-Extended", ...botRule },
      { userAgent: "Naverbot", ...botRule },
      { userAgent: "Yeti", ...botRule },
      { userAgent: "DuckAssistBot", ...botRule },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}