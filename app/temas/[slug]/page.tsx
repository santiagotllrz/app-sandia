import { almacen } from "@/lib/almacen"
import { metadatosTema, VistaTema } from "../../_vistas/listados"

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  try {
    return (await (await almacen()).temas()).map((t) => ({ slug: t.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props) {
  return metadatosTema((await params).slug, 1)
}

export default async function PaginaTema({ params }: Props) {
  return <VistaTema slug={(await params).slug} pagina={1} />
}
