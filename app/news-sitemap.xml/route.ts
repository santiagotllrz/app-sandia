import { almacen } from "@/lib/almacen"
import { rutas, sitio, urlAbsoluta } from "@/lib/config"
import { escaparXml } from "@/lib/xml"

export const revalidate = 300

// Sitemap de Google News: solo noticias de las últimas 48 horas, máximo 1.000.
export async function GET() {
  const limite = Date.now() - 48 * 3600 * 1000
  const noticias = (await (await almacen()).todas(1000)).filter((n) => new Date(n.publicada_at).getTime() >= limite)

  const urls = noticias.map((n) => {
    const imagen = n.imagen ? `\n    <image:image><image:loc>${escaparXml(n.imagen)}</image:loc></image:image>` : ""
    return `  <url>
    <loc>${escaparXml(urlAbsoluta(rutas.noticia(n.slug)))}</loc>
    <lastmod>${n.actualizada_at}</lastmod>
    <news:news>
      <news:publication>
        <news:name>${escaparXml(sitio.nombre)}</news:name>
        <news:language>es</news:language>
      </news:publication>
      <news:publication_date>${n.publicada_at}</news:publication_date>
      <news:title>${escaparXml(n.titular)}</news:title>
    </news:news>${imagen}
  </url>`
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } })
}
