import { metadatosDestacados, VistaDestacados } from "../_vistas/listados"

export const revalidate = 300
export const metadata = metadatosDestacados(1)

export default function Destacados() {
  return <VistaDestacados pagina={1} />
}
