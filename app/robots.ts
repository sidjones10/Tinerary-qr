import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/site-url"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/settings",
          "/dashboard",
          "/messages",
          "/notifications",
          "/saved",
          "/liked",
          "/mentions",
          "/transactions",
          "/tickets",
          "/auth/",
          // Print view duplicates the itinerary page.
          "/itinerary/*/print",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
