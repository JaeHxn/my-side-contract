import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://my-side-contract.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date("2026-05-22"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/upload`,
      lastModified: new Date("2026-05-22"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/payment`,
      lastModified: new Date("2026-05-22"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date("2026-05-22"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date("2026-05-22"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
