import type { MetadataRoute } from "next"
import { almacen } from "@/lib/almacen"
import { rutas, urlAbsoluta } from "@/lib/config"

export const revalidate = 900

// Sitemap general: listados, temas con noticias y hasta 45.000 noticias (límite de 50.000 URLs por archivo).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = await almacen()
  const [noticias, temas] = await Promise.all([db.todas(45_000), db.temas()])
  const ultima = noticias[0]?.actualizada_at
  const temasConNoticias = new Set(noticias.map((n) => n.tema_slug))

  return [
    { url: urlAbsoluta("/"), lastModified: ultima, changeFrequency: "hourly", priority: 1 },
    { url: urlAbsoluta(rutas.destacados()), lastModified: ultima, changeFrequency: "hourly", priority: 0.8 },
    { url: urlAbsoluta(rutas.temas()), changeFrequency: "daily", priority: 0.6 },
    ...temas
      .filter((t) => temasConNoticias.has(t.slug))
      .map((t) => ({
        url: urlAbsoluta(rutas.tema(t.slug)),
        lastModified: noticias.find((n) => n.tema_slug === t.slug)?.actualizada_at,
        changeFrequency: "hourly" as const,
        priority: 0.7,
      })),
    ...noticias.map((n) => ({
      url: urlAbsoluta(rutas.noticia(n.slug)),
      lastModified: n.actualizada_at,
      changeFrequency: "weekly" as const,
      priority: 0.6,
      images: n.imagen ? [n.imagen] : undefined,
    })),
  ]
}
