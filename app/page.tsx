import { metadatosInicio, VistaInicio } from "./_vistas/listados"

export const revalidate = 300
export const metadata = metadatosInicio(1)

export default function Inicio() {
  return <VistaInicio pagina={1} />
}
