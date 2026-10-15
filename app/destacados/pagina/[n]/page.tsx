import { notFound, permanentRedirect } from "next/navigation"
import { rutas } from "@/lib/config"
import { paginaValida } from "@/components/Listado"
import { metadatosDestacados, VistaDestacados } from "../../../_vistas/listados"

export const revalidate = 300
export const generateStaticParams = async () => []

type Props = { params: Promise<{ n: string }> }

export async function generateMetadata({ params }: Props) {
  const pagina = paginaValida((await params).n)
  return pagina ? metadatosDestacados(pagina) : {}
}

export default async function PaginaDestacados({ params }: Props) {
  const { n } = await params
  if (n === "1") permanentRedirect(rutas.destacados())
  const pagina = paginaValida(n)
  if (!pagina) notFound()
  return <VistaDestacados pagina={pagina} />
}
