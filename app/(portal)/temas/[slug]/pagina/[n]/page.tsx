import { notFound, permanentRedirect } from "next/navigation"
import { rutas } from "@/lib/config"
import { paginaValida } from "@/components/Listado"
import { metadatosTema, VistaTema } from "../../../../_vistas/listados"

export const revalidate = 300
export const generateStaticParams = async () => []

type Props = { params: Promise<{ slug: string; n: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug, n } = await params
  const pagina = paginaValida(n)
  return pagina ? metadatosTema(slug, pagina) : {}
}

export default async function PaginaTemaN({ params }: Props) {
  const { slug, n } = await params
  if (n === "1") permanentRedirect(rutas.tema(slug))
  const pagina = paginaValida(n)
  if (!pagina) notFound()
  return <VistaTema slug={slug} pagina={pagina} />
}
