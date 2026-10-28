export const sitio = {
  nombre: "Índice Agro",
  nombreCorto: "Índice Agro",
  descripcion:
    "Noticias del agro colombiano: cultivos, ganadería, clima y agua, mercados, sanidad, innovación y vida rural, con sus fuentes a la vista.",
  idioma: "es-CO",
  locale: "es_CO",
  pais: "CO",
  // Dominio público. Canonical, sitemaps, RSS y JSON-LD usan siempre este, aunque la página se abra
  // desde un dominio *.vercel.app. NEXT_PUBLIC_SITE_URL solo hace falta para cambiarlo.
  url: (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === "production" ? "https://app.usesandia.com" : "http://localhost:3000")
  ).replace(/\/$/, ""),
  // Ubicación por defecto del widget de clima cuando no se conoce la del visitante.
  climaPorDefecto: { ciudad: "Bogotá", lat: 4.711, lon: -74.0721 },
  redes: {
    instagram: "https://www.instagram.com/indiceagro.co",
    facebook: "https://www.facebook.com/people/%C3%8Dndice-Agro/61593986745138/",
  },
}

/** Solo el despliegue de producción se indexa; las vistas previas de Vercel quedan fuera de Google. */
export const indexable = !process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production"

export const POR_PAGINA = 19 // 1 tarjeta grande + 3 pequeñas, repetido; cierra con una grande

export function urlAbsoluta(ruta = "/") {
  return `${sitio.url}${ruta.startsWith("/") ? ruta : `/${ruta}`}`
}

export const rutas = {
  inicio: (pagina = 1) => (pagina > 1 ? `/pagina/${pagina}` : "/"),
  destacados: (pagina = 1) => (pagina > 1 ? `/destacados/pagina/${pagina}` : "/destacados"),
  temas: () => "/temas",
  tema: (slug: string, pagina = 1) => (pagina > 1 ? `/temas/${slug}/pagina/${pagina}` : `/temas/${slug}`),
  noticia: (slug: string) => `/noticias/${slug}`,
}
