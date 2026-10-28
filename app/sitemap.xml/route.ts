import { almacen } from "@/lib/almacen"
import { rutas, urlAbsoluta } from "@/lib/config"
import { escaparXml } from "@/lib/xml"

// Route handler (no app/sitemap.ts): en Vercel el sitemap de metadatos quedaba congelado en el build.
export const revalidate = 900

// Sitemap general: listados, temas con noticias y hasta 45.000 noticias (límite de 50.000 URLs por archivo).
export async function GET() {
  const db = await almacen()
  const [noticias, temas] = await Promise.all([db.todas(45_000), db.temas()])
  const ultima = noticias[0]?.actualizada_at
  const temasConNoticias = new Set(noticias.map((n) => n.tema_slug))

  const url = (loc: string, lastmod?: string, changefreq?: string, priority?: number, imagen?: string | null) =>
    [
      "  <url>",
      `    <loc>${escaparXml(loc)}</loc>`,
      lastmod && `    <lastmod>${lastmod}</lastmod>`,
      changefreq && `    <changefreq>${changefreq}</changefreq>`,
      priority != null && `    <priority>${priority}</priority>`,
      imagen && `    <image:image><image:loc>${escaparXml(imagen)}</image:loc></image:image>`,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n")

  const urls = [
    url(urlAbsoluta("/"), ultima, "hourly", 1),
    url(urlAbsoluta(rutas.destacados()), ultima, "hourly", 0.8),
    url(urlAbsoluta(rutas.temas()), undefined, "daily", 0.6),
    ...temas
      .filter((t) => temasConNoticias.has(t.slug))
      .map((t) =>
        url(urlAbsoluta(rutas.tema(t.slug)), noticias.find((n) => n.tema_slug === t.slug)?.actualizada_at, "hourly", 0.7),
      ),
    ...noticias.map((n) => url(urlAbsoluta(rutas.noticia(n.slug)), n.actualizada_at, "weekly", 0.6, n.imagen)),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } })
}
