import { rutas, sitio, urlAbsoluta } from "./config"
import type { NoticiaResumen } from "./tipos"
import { escaparXml } from "./xml"

export function respuestaRss({
  titulo,
  descripcion,
  ruta,
  noticias,
}: {
  titulo: string
  descripcion: string
  ruta: string
  noticias: NoticiaResumen[]
}) {
  const items = noticias.map((n) => {
    const lineas = [
      `<title>${escaparXml(n.titular)}</title>`,
      `<link>${escaparXml(urlAbsoluta(rutas.noticia(n.slug)))}</link>`,
      `<guid isPermaLink="false">${n.id}</guid>`,
      `<pubDate>${new Date(n.publicada_at).toUTCString()}</pubDate>`,
      n.resumen && `<description>${escaparXml(n.resumen)}</description>`,
      n.tema_slug && `<category>${escaparXml(n.tema_slug)}</category>`,
      n.imagen &&
        `<media:content url="${escaparXml(n.imagen)}" medium="image"${n.imagen_ancho ? ` width="${n.imagen_ancho}"` : ""}${
          n.imagen_alto ? ` height="${n.imagen_alto}"` : ""
        } />`,
    ].filter(Boolean)
    return `    <item>\n      ${lineas.join("\n      ")}\n    </item>`
  })

  const propia = urlAbsoluta(ruta === "/" ? "/rss.xml" : `${ruta}/rss.xml`)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escaparXml(titulo)}</title>
    <link>${escaparXml(urlAbsoluta(ruta))}</link>
    <description>${escaparXml(descripcion)}</description>
    <language>${sitio.idioma.toLowerCase()}</language>
    <atom:link href="${escaparXml(propia)}" rel="self" type="application/rss+xml" />${
      noticias[0] ? `\n    <lastBuildDate>${new Date(noticias[0].actualizada_at).toUTCString()}</lastBuildDate>` : ""
    }
${items.join("\n")}
  </channel>
</rss>`
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } })
}
