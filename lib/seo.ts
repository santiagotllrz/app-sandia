import type { Metadata } from "next"
import { rutas, sitio, urlAbsoluta } from "./config"
import type { NoticiaCompleta, NoticiaResumen } from "./tipos"

export const IMAGEN_OG = { url: "/og.png", width: 1200, height: 630, alt: sitio.nombre }

const ID_ORG = urlAbsoluta("/#organizacion")
const ID_SITIO = urlAbsoluta("/#sitio")

export function jsonLdOrganizacion() {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "@id": ID_ORG,
    name: sitio.nombre,
    url: urlAbsoluta("/"),
    logo: { "@type": "ImageObject", url: urlAbsoluta("/logo.png"), width: 512, height: 512 },
    areaServed: { "@type": "Country", name: "Colombia" },
    knowsLanguage: sitio.idioma,
  }
}

export function jsonLdSitio() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": ID_SITIO,
    name: sitio.nombre,
    url: urlAbsoluta("/"),
    inLanguage: sitio.idioma,
    description: sitio.descripcion,
    publisher: { "@id": ID_ORG },
  }
}

export function jsonLdMigas(items: { nombre: string; ruta: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.nombre,
      item: urlAbsoluta(it.ruta),
    })),
  }
}

export function jsonLdColeccion({ nombre, descripcion, ruta, noticias }: { nombre: string; descripcion: string; ruta: string; noticias: NoticiaResumen[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: nombre,
    description: descripcion,
    url: urlAbsoluta(ruta),
    inLanguage: sitio.idioma,
    isPartOf: { "@id": ID_SITIO },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: noticias.map((n, i) => ({ "@type": "ListItem", position: i + 1, url: urlAbsoluta(rutas.noticia(n.slug)), name: n.titular })),
    },
  }
}

export function jsonLdNoticia(n: NoticiaCompleta, temaNombre: string | null) {
  const url = urlAbsoluta(rutas.noticia(n.slug))
  const d = n.datos
  const credito = d.imagen?.credito
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${url}#articulo`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    headline: n.titular.length > 110 ? `${n.titular.slice(0, 107).trimEnd()}…` : n.titular,
    alternativeHeadline: n.titular.length > 110 ? n.titular : undefined,
    description: n.resumen ?? undefined,
    inLanguage: d.idioma ?? sitio.idioma,
    datePublished: n.publicada_at,
    dateModified: n.actualizada_at,
    articleSection: temaNombre ?? undefined,
    keywords: n.etiquetas.length ? n.etiquetas.join(", ") : undefined,
    wordCount: n.palabras ?? undefined,
    timeRequired: n.minutos_lectura ? `PT${n.minutos_lectura}M` : undefined,
    image: n.imagen
      ? [
          {
            "@type": "ImageObject",
            url: n.imagen,
            width: n.imagen_ancho ?? undefined,
            height: n.imagen_alto ?? undefined,
            caption: n.imagen_alt ?? undefined,
            creditText: credito?.texto ?? undefined,
            copyrightHolder: credito?.medio ? { "@type": "Organization", name: credito.medio } : undefined,
          },
        ]
      : undefined,
    author: { "@type": "Organization", "@id": ID_ORG, name: sitio.nombre, url: urlAbsoluta("/") },
    publisher: { "@id": ID_ORG },
    isPartOf: { "@id": ID_SITIO },
    citation: d.fuentes.map((f) => ({
      "@type": "CreativeWork",
      name: f.titulo,
      url: f.url,
      publisher: { "@type": "Organization", name: f.medio },
      datePublished: f.fecha ?? undefined,
    })),
    isBasedOn: d.url_original ?? undefined,
  }
}

/** Metadatos de un listado (inicio, destacados, tema) con canonical y su paginación. */
export function metadatosListado({
  titulo,
  descripcion,
  ruta,
  pagina = 1,
  tituloAbsoluto = false,
}: {
  titulo: string
  descripcion: string
  ruta: string
  pagina?: number
  tituloAbsoluto?: boolean
}): Metadata {
  const tituloFinal = pagina > 1 ? `${titulo} · Página ${pagina}` : titulo
  return {
    title: tituloAbsoluto && pagina === 1 ? { absolute: tituloFinal } : tituloFinal,
    description: descripcion,
    alternates: { canonical: ruta },
    openGraph: { type: "website", url: ruta, title: tituloFinal, description: descripcion, siteName: sitio.nombre, locale: sitio.locale, images: [IMAGEN_OG] },
    twitter: { card: "summary_large_image", title: tituloFinal, description: descripcion, images: [IMAGEN_OG.url] },
  }
}
