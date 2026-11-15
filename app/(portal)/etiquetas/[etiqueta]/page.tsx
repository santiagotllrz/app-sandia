import { metadatosEtiqueta, VistaEtiqueta } from "../../_vistas/listados"

export const revalidate = 300
export const generateStaticParams = async () => []

type Props = { params: Promise<{ etiqueta: string }> }

export async function generateMetadata({ params }: Props) {
  return metadatosEtiqueta((await params).etiqueta, 1)
}

export default async function PaginaEtiqueta({ params }: Props) {
  return <VistaEtiqueta etiqueta={(await params).etiqueta} pagina={1} />
}
