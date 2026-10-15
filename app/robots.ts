import type { MetadataRoute } from "next"
import { indexable, sitio, urlAbsoluta } from "@/lib/config"

export default function robots(): MetadataRoute.Robots {
  if (!indexable) return { rules: [{ userAgent: "*", disallow: "/" }] }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: [urlAbsoluta("/sitemap.xml"), urlAbsoluta("/news-sitemap.xml")],
    host: sitio.url,
  }
}
