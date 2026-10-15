export const sitio = {
  nombre: "Índice Agro",
  nombreCorto: "Índice Agro",
  descripcion:
    "Noticias del agro colombiano: cultivos, ganadería, clima y agua, mercados, sanidad, innovación y vida rural, con sus fuentes a la vista.",
  idioma: "es-CO",
  locale: "es_CO",
  pais: "CO",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  // Ubicación por defecto del widget de clima cuando no se conoce la del visitante.
  climaPorDefecto: { ciudad: "Bogotá", lat: 4.711, lon: -74.0721 },
}

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
