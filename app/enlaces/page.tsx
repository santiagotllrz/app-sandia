import type { Metadata } from "next"
import Link from "next/link"
import { Logo } from "@/components/Logo"
import { almacen } from "@/lib/almacen"
import { rutas, sitio } from "@/lib/config"
import type { PortadaEnlace } from "@/lib/tipos"

// La página del link de la bio: las portadas de los carruseles, la última primero, y cada una
// lleva a su noticia. El webhook la regenera al llegar una portada; esto es la red de seguridad.
export const revalidate = 300

const LIMITE = 60

export const metadata: Metadata = {
  title: "Enlaces",
  description: `Las últimas noticias de ${sitio.nombre} que publicamos en redes.`,
  alternates: { canonical: rutas.enlaces() },
  // Repite lo que ya está en el inicio: no aporta nada a los buscadores.
  robots: { index: false, follow: true },
}

async function cargar(): Promise<PortadaEnlace[]> {
  try {
    return await (await almacen()).portadas(LIMITE)
  } catch (e) {
    console.error("[enlaces] portadas", e)
    return []
  }
}

export default async function Enlaces() {
  const portadas = await cargar()
  const usuario = sitio.redes.instagram.replace(/\/$/, "").split("/").pop()

  return (
    <div className="mx-auto max-w-[640px] px-4 pb-16 pt-8 md:pt-12">
      <section className="flex flex-col items-center text-center">
        <Logo className="h-9" />
        {usuario ? <p className="mt-3 text-sm font-medium text-secondary">@{usuario}</p> : null}
        <p className="mt-2 max-w-md text-[0.95rem] leading-relaxed text-secondary">
          Noticias del agro colombiano con sus fuentes a la vista. Toca una portada para leer la nota completa.
        </p>
      </section>

      <a
        href={sitio.alertasUrl ?? "#"}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-xl border border-borde-fuerte bg-raised px-4 text-[0.95rem] font-semibold transition-colors hover:bg-subtle"
      >
        Active las alertas de precios agrícolas
      </a>

      {portadas.length ? (
        <ul className="mt-6 grid grid-cols-3 gap-[3px] overflow-hidden rounded-lg">
          {portadas.map((p, i) => (
            <li key={p.slug}>
              <Link href={rutas.noticia(p.slug)} className="group block aspect-[4/5] overflow-hidden bg-subtle" title={p.titular}>
                {/* Ya viene comprimida desde el motor (WebP de ~40 KB): pasarla por el optimizador no gana nada. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imagen}
                  alt={p.titular}
                  width={p.ancho}
                  height={p.alto}
                  loading={i < 9 ? "eager" : "lazy"}
                  fetchPriority={i < 3 ? "high" : "auto"}
                  decoding="async"
                  className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-85"
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 text-center text-sm text-tertiary">Pronto verás aquí las últimas noticias.</p>
      )}

      <div className="mt-8 flex justify-center">
        <Link
          href={rutas.inicio()}
          className="inline-flex h-9 items-center rounded-lg border border-borde-fuerte px-4 text-sm font-medium hover:bg-subtle"
        >
          Ver todas las noticias
        </Link>
      </div>
    </div>
  )
}
