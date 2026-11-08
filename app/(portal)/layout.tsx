import { Encabezado } from "@/components/Encabezado"
import { PiePagina } from "@/components/PiePagina"
import { almacen } from "@/lib/almacen"
import type { Tema } from "@/lib/tipos"

async function cargarTemas(): Promise<Tema[]> {
  try {
    return await (await almacen()).temas()
  } catch (e) {
    console.error("[layout] temas", e)
    return []
  }
}

/** Portal completo: encabezado con pestañas y temas, y pie con temas y redes. */
export default async function LayoutPortal({ children }: { children: React.ReactNode }) {
  const temas = await cargarTemas()
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-raised focus:px-3 focus:py-2 focus:text-sm"
      >
        Saltar al contenido
      </a>
      <Encabezado temas={temas} />
      <main id="contenido">{children}</main>
      <PiePagina temas={temas} />
    </>
  )
}
