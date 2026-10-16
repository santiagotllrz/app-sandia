import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cache } from "react"
import { BotonCompartir } from "@/components/BotonCompartir"
import { Parrafos } from "@/components/Citas"
import { ContadorVistas } from "@/components/ContadorVistas"
import { FechaRelativa } from "@/components/FechaRelativa"
import { IconoLibro, IconoReloj } from "@/components/Iconos"
import { ImagenNoticia } from "@/components/ImagenNoticia"
import { JsonLd } from "@/components/JsonLd"
import { TarjetaPequena } from "@/components/Tarjetas"
import { almacen } from "@/lib/almacen"
import { rutas, sitio, urlAbsoluta } from "@/lib/config"
import { descripcionMeta, dominio, favicon, formatoFechaCorta, formatoFechaLarga } from "@/lib/formato"
import { IMAGEN_OG, jsonLdMigas, jsonLdNoticia } from "@/lib/seo"
import type { Fuente, NoticiaResumen } from "@/lib/tipos"

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

const cargar = cache(async (slug: string) => {
  const db = await almacen()
  const noticia = await db.porSlug(slug)
  if (!noticia) return null
  const temas = await db.temas()
  return { noticia, tema: temas.find((t) => t.slug === noticia.tema_slug) ?? null }
})

export async function generateStaticParams() {
  try {
    return (await (await almacen()).todas(100)).map((n) => ({ slug: n.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const datos = await cargar((await params).slug)
  if (!datos) return { title: "Noticia no encontrada", robots: { index: false } }
  const { noticia: n, tema } = datos
  const ruta = rutas.noticia(n.slug)
  const description = descripcionMeta(n.datos)
  const imagen = n.imagen
    ? [{ url: n.imagen, width: n.imagen_ancho ?? undefined, height: n.imagen_alto ?? undefined, alt: n.imagen_alt ?? n.titular }]
    : [IMAGEN_OG]
  return {
    title: n.titular,
    description,
    keywords: n.etiquetas,
    alternates: { canonical: ruta },
    openGraph: {
      type: "article",
      url: ruta,
      title: n.titular,
      description,
      siteName: sitio.nombre,
      locale: sitio.locale,
      publishedTime: n.publicada_at,
      modifiedTime: n.actualizada_at,
      section: tema?.nombre,
      tags: n.etiquetas,
      images: imagen,
    },
    twitter: { card: "summary_large_image", title: n.titular, description, images: imagen.map((i) => i.url) },
  }
}

export default async function PaginaNoticia({ params }: Props) {
  const datos = await cargar((await params).slug)
  if (!datos) notFound()
  const { noticia: n, tema } = datos
  const d = n.datos
  const porId = new Map(d.fuentes.map((f) => [f.id, f]))
  const fuentesDe = (ids: string[]) => ids.map((id) => porId.get(id)).filter((f): f is Fuente => !!f)
  const fuentesOrdenadas = [...d.fuentes].sort((a, b) => Number(!!b.principal) - Number(!!a.principal))
  const actualizada = new Date(n.actualizada_at).getTime() - new Date(n.publicada_at).getTime() > 10 * 60_000

  const relacionadas = await masNoticias(n.id, n.tema_slug)

  return (
    <div className="mx-auto my-4 w-full max-w-[1240px] px-4 md:my-8 md:px-8">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="mx-auto w-full min-w-0 max-w-[720px]">
          <nav aria-label="Ruta de navegación" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-secondary">
              <li>
                <Link href="/" className="hover:text-primary">
                  Inicio
                </Link>
              </li>
              {tema && (
                <>
                  <li aria-hidden="true" className="text-tertiary">
                    /
                  </li>
                  <li>
                    <Link href={rutas.tema(tema.slug)} className="text-primary underline-offset-2 hover:underline">
                      {tema.nombre}
                    </Link>
                  </li>
                </>
              )}
            </ol>
          </nav>

          <header className="flex flex-col gap-4">
            <h1 className="font-editorial text-[2rem] leading-[1.15] md:text-[2.6rem]">{n.titular}</h1>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-secondary">
                <span className="flex items-center gap-1">
                  <IconoReloj className="size-3.5" />
                  Publicado <FechaRelativa iso={n.publicada_at} />
                </span>
                {actualizada && (
                  <span>
                    Actualizado <time dateTime={n.actualizada_at}>{formatoFechaLarga(n.actualizada_at)}</time>
                  </span>
                )}
                {n.minutos_lectura && (
                  <span className="flex items-center gap-1">
                    <IconoLibro className="size-3.5" />
                    {n.minutos_lectura} min de lectura
                  </span>
                )}
              </div>
              <BotonCompartir titulo={n.titular} url={urlAbsoluta(rutas.noticia(n.slug))} />
            </div>
          </header>

          {d.fuentes.length > 0 && <FilaFuentes fuentes={fuentesOrdenadas} />}

          <figure className="mt-6">
            <ImagenNoticia
              src={n.imagen}
              alt={n.imagen_alt ?? n.titular}
              sizes="(min-width: 768px) 720px, 100vw"
              prioridad
              className="aspect-[16/9] rounded-xl"
            />
            {d.imagen?.credito?.texto && (
              <figcaption className="mt-2 text-xs text-tertiary">
                {d.imagen.credito.url_origen ? (
                  <a href={d.imagen.credito.url_origen} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-secondary">
                    {d.imagen.credito.texto}
                  </a>
                ) : (
                  d.imagen.credito.texto
                )}
              </figcaption>
            )}
          </figure>

          <div className="cuerpo-noticia mt-8">
            <Parrafos parrafos={d.entrada.parrafos} fuentes={fuentesDe(d.entrada.fuentes)} />
            {d.secciones.map((s, i) => (
              <section key={i}>
                {s.subtitulo && <h2>{s.subtitulo}</h2>}
                <Parrafos parrafos={s.parrafos} fuentes={fuentesDe(s.fuentes)} />
              </section>
            ))}
          </div>

          {n.etiquetas.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Etiquetas">
              {n.etiquetas.map((e) => (
                <li key={e} className="rounded-full bg-subtle px-3 py-1 text-xs text-secondary">
                  {e}
                </li>
              ))}
            </ul>
          )}

          {d.fuentes.length > 0 && <ListaFuentes fuentes={fuentesOrdenadas} />}
        </article>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start" aria-labelledby="titulo-relacionadas">
          {relacionadas.length > 0 && (
            <>
              <h2 id="titulo-relacionadas" className="text-sm font-medium">
                {tema ? `Más de ${tema.nombre}` : "Más noticias"}
              </h2>
              <ul className="flex flex-col divide-y divide-borde">
                {relacionadas.slice(0, 5).map((r) => (
                  <li key={r.id}>
                    <Link href={rutas.noticia(r.slug)} className="group flex gap-3 py-3">
                      <ImagenNoticia src={r.imagen} alt="" sizes="96px" className="aspect-[4/3] w-24 shrink-0 rounded-lg" />
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="text-sm font-medium leading-snug group-hover:text-acento">{r.titular}</span>
                        <FechaRelativa iso={r.publicada_at} className="text-xs text-tertiary" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>

      {relacionadas.length > 5 && (
        <section className="mt-12 border-t border-borde pt-8" aria-labelledby="titulo-descubre">
          <h2 id="titulo-descubre" className="mb-4 text-sm font-medium">
            Descubre más
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relacionadas.slice(5, 9).map((r) => (
              <TarjetaPequena key={r.id} noticia={r} Titulo="h3" />
            ))}
          </div>
        </section>
      )}

      <ContadorVistas id={n.id} />
      <JsonLd
        datos={[
          jsonLdNoticia(n, tema?.nombre ?? null),
          jsonLdMigas([
            { nombre: "Inicio", ruta: "/" },
            ...(tema ? [{ nombre: tema.nombre, ruta: rutas.tema(tema.slug) }] : []),
            { nombre: n.titular, ruta: rutas.noticia(n.slug) },
          ]),
        ]}
      />
    </div>
  )
}

/** Del mismo tema primero; si no alcanzan, completa con las más recientes. */
async function masNoticias(id: string, tema: string | null): Promise<NoticiaResumen[]> {
  const db = await almacen()
  const [delTema, recientes] = await Promise.all([
    tema ? db.listar({ tema, pagina: 1, porPagina: 10 }) : Promise.resolve({ items: [], total: 0 }),
    db.listar({ pagina: 1, porPagina: 10 }),
  ])
  const vistos = new Set([id])
  return [...delTema.items, ...recientes.items].filter((n) => !vistos.has(n.id) && !!vistos.add(n.id)).slice(0, 9)
}

function FilaFuentes({ fuentes }: { fuentes: Fuente[] }) {
  const visibles = fuentes.slice(0, 3)
  const resto = fuentes.length - visibles.length
  return (
    <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {visibles.map((f) => (
        <a
          key={f.id}
          href={f.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 flex-col gap-1.5 rounded-xl bg-subtle p-2.5 transition-colors hover:bg-soft"
        >
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-secondary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={favicon(dominio(f.url))} alt="" width={14} height={14} loading="lazy" className="size-3.5 rounded-full" />
            <span className="truncate">{f.medio}</span>
          </span>
          <span className="text-xs leading-snug">{f.titulo}</span>
        </a>
      ))}
      {resto > 0 && (
        <a href="#fuentes" className="flex items-end rounded-xl bg-subtle p-2.5 text-xs font-medium text-secondary transition-colors hover:bg-soft">
          +{resto} {resto === 1 ? "fuente" : "fuentes"}
        </a>
      )}
    </div>
  )
}

const ETIQUETA_TIPO: Record<string, string> = { primaria: "Fuente primaria", parte_interesada: "Parte interesada", medio: "Medio" }

function ListaFuentes({ fuentes }: { fuentes: Fuente[] }) {
  return (
    <section id="fuentes" className="mt-10 scroll-mt-24 border-t border-borde pt-6" aria-labelledby="titulo-fuentes">
      <h2 id="titulo-fuentes" className="mb-3 text-sm font-medium">
        Fuentes ({fuentes.length})
      </h2>
      <ol className="flex flex-col gap-1">
        {fuentes.map((f, i) => (
          <li key={f.id}>
            <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-subtle">
              <span className="w-4 shrink-0 pt-0.5 text-xs text-tertiary tabular-nums">{i + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={favicon(dominio(f.url))} alt="" width={16} height={16} loading="lazy" className="mt-0.5 size-4 shrink-0 rounded-full" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm leading-snug">{f.titulo}</span>
                <span className="flex flex-wrap items-center gap-x-2 text-xs text-secondary">
                  <span>{f.medio}</span>
                  {f.fecha && <time dateTime={f.fecha}>{formatoFechaCorta(f.fecha)}</time>}
                  {f.principal && <span className="rounded-full bg-soft px-1.5 text-primary">Origen de la noticia</span>}
                  {f.tipo && f.tipo !== "medio" && ETIQUETA_TIPO[f.tipo] && <span className="text-tertiary">{ETIQUETA_TIPO[f.tipo]}</span>}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  )
}
