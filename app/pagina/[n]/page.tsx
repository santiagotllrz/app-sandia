import { notFound, permanentRedirect } from "next/navigation"
import { rutas } from "@/lib/config"
import { paginaValida } from "@/components/Listado"
import { metadatosInicio, VistaInicio } from "../../_vistas/listados"

export const revalidate = 300
export const generateStaticParams = async () => []

type Props = { params: Promise<{ n: string }> }

export async function generateMetadata({ params }: Props) {
  const pagina = paginaValida((await params).n)
  return pagina ? metadatosInicio(pagina) : {}
}

export default async function PaginaInicio({ params }: Props) {
  const { n } = await params
  if (n === "1") permanentRedirect(rutas.inicio())
  const pagina = paginaValida(n)
  if (!pagina) notFound()
  return <VistaInicio pagina={pagina} />
}
