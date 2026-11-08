import { Encabezado } from "@/components/Encabezado"
import { ContenidoNoEncontrado } from "@/components/NoEncontrado"
import { PiePagina } from "@/components/PiePagina"
import { almacen } from "@/lib/almacen"

// URL que no existe en ninguna ruta: se muestra fuera del grupo (portal), así que trae su encabezado y pie.
export default async function NoEncontrado() {
  const temas = await (await almacen()).temas().catch(() => [])
  return (
    <>
      <Encabezado temas={temas} />
      <main>
        <ContenidoNoEncontrado />
      </main>
      <PiePagina temas={temas} />
    </>
  )
}
