import { almacen } from "@/lib/almacen"
import { sitio } from "@/lib/config"
import { respuestaRss } from "@/lib/rss"

export const revalidate = 300

export async function GET() {
  const { items } = await (await almacen()).listar({ pagina: 1, porPagina: 50 })
  return respuestaRss({ titulo: sitio.nombre, descripcion: sitio.descripcion, ruta: "/", noticias: items })
}
