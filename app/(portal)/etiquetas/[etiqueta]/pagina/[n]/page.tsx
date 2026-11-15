import { notFound, permanentRedirect } from "next/navigation"
import { paginaValida } from "@/components/Listado"
import { rutas } from "@/lib/config"
import { decodificarEtiqueta, metadatosEtiqueta, VistaEtiqueta } from "../../../../_vistas/listados"

export const revalidate = 300
export const generateStaticParams = async () => []

type Props = { params: Promise<{ etiqueta: string; n: string }> }

export async function generateMetadata({ params }: Props) {
  const { etiqueta, n } = await params
  const pagina = paginaValida(n)
  return pagina ? metadatosEtiqueta(etiqueta, pagina) : {}
}

export default async function PaginaEtiquetaN({ params }: Props) {
  const { etiqueta, n } = await params
  if (n === "1") permanentRedirect(rutas.etiqueta(decodificarEtiqueta(etiqueta)))
  const pagina = paginaValida(n)
  if (!pagina) notFound()
  return <VistaEtiqueta etiqueta={etiqueta} pagina={pagina} />
}
