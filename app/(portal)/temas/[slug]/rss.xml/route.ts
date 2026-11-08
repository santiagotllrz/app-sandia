import { almacen } from "@/lib/almacen"
import { rutas, sitio } from "@/lib/config"
import { respuestaRss } from "@/lib/rss"

export const revalidate = 300
export const generateStaticParams = async () => []

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = await almacen()
  const tema = (await db.temas()).find((t) => t.slug === slug)
  if (!tema) return new Response("No encontrado", { status: 404 })
  const { items } = await db.listar({ tema: slug, pagina: 1, porPagina: 50 })
  return respuestaRss({
    titulo: `${tema.nombre} | ${sitio.nombre}`,
    descripcion: `Noticias de ${tema.nombre.toLowerCase()} en ${sitio.nombre}.`,
    ruta: rutas.tema(slug),
    noticias: items,
  })
}
