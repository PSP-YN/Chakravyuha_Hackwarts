import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://krishi-connect-360.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: new URL("/", siteUrl).toString(), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: new URL("/privacy", siteUrl).toString(), lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: new URL("/terms", siteUrl).toString(), lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
