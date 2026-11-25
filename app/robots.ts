import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://krishi-connect-360.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/workspace", "/api/", "/login", "/signup"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
