import Link from "next/link"
import { rutas } from "@/lib/config"
import type { NoticiaResumen } from "@/lib/tipos"
import { FechaRelativa } from "./FechaRelativa"
import { PilaFuentes } from "./Fuentes"
import { IconoReloj } from "./Iconos"
import { ImagenNoticia } from "./ImagenNoticia"

type Nivel = "h2" | "h3"

/** Tarjeta grande: texto a la izquierda, foto a la derecha (o al revés). */
export function TarjetaGrande({
  noticia: n,
  prioridad = false,
  invertida = false,
  Titulo = "h2",
}: {
  noticia: NoticiaResumen
  prioridad?: boolean
  invertida?: boolean
  Titulo?: Nivel
}) {
  return (
    <article className="col-span-3">
      <Link href={rutas.noticia(n.slug)} className="group grid h-full gap-4 outline-none md:grid-cols-2 md:gap-8">
        <ImagenNoticia
          src={n.imagen}
          alt={n.imagen_alt ?? n.titular}
          sizes="(min-width: 1240px) 420px, (min-width: 768px) 45vw, 100vw"
          prioridad={prioridad}
          className={`aspect-[16/9] rounded-xl md:aspect-auto md:min-h-[250px] ${invertida ? "md:order-first" : "md:order-last"}`}
        />
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Titulo className="font-editorial line-clamp-3 text-[1.5rem] text-primary transition-colors duration-150 group-hover:text-acento md:text-[1.75rem]">
              {n.titular}
            </Titulo>
            <div className="flex items-center gap-1 text-xs font-medium text-secondary">
              <IconoReloj className="size-3.5" />
              <span>Publicado</span>
              <FechaRelativa iso={n.publicada_at} className="truncate" />
            </div>
          </div>
          <div className="flex-1" />
          <PilaFuentes dominios={n.fuentes_dominios} total={n.fuentes_total} />
        </div>
      </Link>
    </article>
  )
}

/** Tarjeta pequeña: foto 3:2 arriba y titular. */
export function TarjetaPequena({ noticia: n, Titulo = "h2" }: { noticia: NoticiaResumen; Titulo?: Nivel }) {
  return (
    <article className="h-full">
      <Link
        href={rutas.noticia(n.slug)}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-borde bg-raised outline-none transition-shadow duration-150 hover:border-transparent hover:shadow-hover"
      >
        <ImagenNoticia
          src={n.imagen}
          alt={n.imagen_alt ?? n.titular}
          sizes="(min-width: 1240px) 270px, (min-width: 768px) 30vw, 100vw"
          className="aspect-[3/2] shrink-0"
        />
        <div className="flex grow flex-col gap-3 py-2.5">
          <Titulo className="line-clamp-3 px-4 text-base font-medium leading-snug text-primary transition-colors duration-150 group-hover:text-acento">
            {n.titular}
          </Titulo>
          <div className="flex-1" />
          <div className="px-4 pb-0.5">
            <PilaFuentes dominios={n.fuentes_dominios} total={n.fuentes_total} />
          </div>
        </div>
      </Link>
    </article>
  )
}

/** Patrón de Discover: una grande y tres pequeñas, alternando el lado de la foto. */
export function Feed({ noticias, prioridadPrimera = true }: { noticias: NoticiaResumen[]; prioridadPrimera?: boolean }) {
  const bloques: NoticiaResumen[][] = []
  for (let i = 0; i < noticias.length; i += 4) bloques.push(noticias.slice(i, i + 4))

  return (
    <div className="flex flex-col gap-4 pb-8 md:grid md:grid-cols-3 lg:gap-y-8">
      {bloques.map(([grande, ...pequenas], b) => (
        <FeedBloque key={grande.id} grande={grande} pequenas={pequenas} indice={b} prioridad={prioridadPrimera && b === 0} />
      ))}
    </div>
  )
}

function FeedBloque({
  grande,
  pequenas,
  indice,
  prioridad,
}: {
  grande: NoticiaResumen
  pequenas: NoticiaResumen[]
  indice: number
  prioridad: boolean
}) {
  return (
    <>
      <TarjetaGrande noticia={grande} prioridad={prioridad} invertida={indice % 2 === 1} />
      {pequenas.map((n) => (
        <TarjetaPequena key={n.id} noticia={n} />
      ))}
    </>
  )
}
