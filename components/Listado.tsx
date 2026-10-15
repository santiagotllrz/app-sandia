import Link from "next/link"
import type { NoticiaResumen } from "@/lib/tipos"
import { BarraLateral } from "./BarraLateral"
import { IconoFlechaDerecha, IconoFlechaIzquierda } from "./Iconos"
import { Feed } from "./Tarjetas"

/** Página de listado: feed a la izquierda y columna de clima/mercado a la derecha (336 px). */
export function Listado({
  encabezado,
  noticias,
  pagina,
  totalPaginas,
  rutaPagina,
  vacio = "Todavía no hay noticias publicadas.",
}: {
  encabezado: React.ReactNode
  noticias: NoticiaResumen[]
  pagina: number
  totalPaginas: number
  rutaPagina: (n: number) => string
  vacio?: string
}) {
  return (
    <div className="mx-auto my-4 w-full max-w-[1240px] px-4 md:my-8 md:px-8">
      <div className="grid gap-6 min-[860px]:grid-cols-[minmax(0,1fr)_336px] lg:gap-10">
        <div className="min-w-0">
          {encabezado}
          {noticias.length ? (
            <Feed noticias={noticias} prioridadPrimera={pagina === 1} />
          ) : (
            <p className="rounded-xl border border-dashed border-borde-fuerte px-6 py-16 text-center text-secondary">{vacio}</p>
          )}
          <Paginacion pagina={pagina} total={totalPaginas} ruta={rutaPagina} />
        </div>
        <BarraLateral />
      </div>
    </div>
  )
}

function Paginacion({ pagina, total, ruta }: { pagina: number; total: number; ruta: (n: number) => string }) {
  if (total <= 1) return null
  const boton =
    "inline-flex h-9 items-center gap-1.5 rounded-lg border border-borde-fuerte px-3.5 text-sm font-medium transition-colors duration-300 hover:bg-subtle"
  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-3 pb-6">
      {pagina > 1 && (
        <Link href={ruta(pagina - 1)} rel="prev" className={boton}>
          <IconoFlechaIzquierda className="size-4" /> Página anterior
        </Link>
      )}
      <span className="text-xs text-tertiary tabular-nums">
        {pagina} de {total}
      </span>
      {pagina < total && (
        <Link href={ruta(pagina + 1)} rel="next" className={boton}>
          Página siguiente <IconoFlechaDerecha className="size-4" />
        </Link>
      )}
    </nav>
  )
}

export function TituloListado({ titulo, descripcion, oculto = false }: { titulo: string; descripcion?: string; oculto?: boolean }) {
  if (oculto) return <h1 className="sr-only">{titulo}</h1>
  return (
    <div className="mb-6 flex flex-col gap-1.5 md:mb-8">
      <h1 className="font-editorial text-3xl md:text-4xl">{titulo}</h1>
      {descripcion && <p className="max-w-2xl text-secondary">{descripcion}</p>}
    </div>
  )
}

export function paginaValida(valor: string) {
  const n = Number(valor)
  return Number.isInteger(n) && n >= 2 && String(n) === valor ? n : null
}
