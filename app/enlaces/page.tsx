import type { Metadata } from "next"
import { GrillaPortadas } from "@/components/GrillaPortadas"
import { Logo } from "@/components/Logo"
import { almacen } from "@/lib/almacen"
import { rutas, sitio } from "@/lib/config"
import type { PortadaEnlace } from "@/lib/tipos"

// La página del link de la bio: las portadas de los carruseles, la última primero, y cada una
// lleva a su noticia. El webhook la regenera al llegar una portada; esto es la red de seguridad.
export const revalidate = 300

const PRIMERA_TANDA = 30 // el resto llega con scroll infinito desde /api/portadas

export const metadata: Metadata = {
  title: "Enlaces",
  description: `Las últimas noticias de ${sitio.nombre} que publicamos en redes.`,
  alternates: { canonical: rutas.enlaces() },
  // Repite lo que ya está en el inicio: no aporta nada a los buscadores.
  robots: { index: false, follow: true },
}

async function cargar(): Promise<{ portadas: PortadaEnlace[]; hayMas: boolean }> {
  try {
    const filas = await (await almacen()).portadas(PRIMERA_TANDA + 1)
    return { portadas: filas.slice(0, PRIMERA_TANDA), hayMas: filas.length > PRIMERA_TANDA }
  } catch (e) {
    console.error("[enlaces] portadas", e)
    return { portadas: [], hayMas: false }
  }
}

export default async function Enlaces() {
  const { portadas, hayMas } = await cargar()
  const usuario = sitio.redes.instagram.replace(/\/$/, "").split("/").pop()

  return (
    // Página para el link de la bio: sin encabezado, pestañas ni pie (vive fuera del grupo (portal)).
    <main className="mx-auto max-w-[640px] px-4 pb-16 pt-8 md:pt-12">
      <section className="flex flex-col items-center text-center">
        <Logo className="h-9" />
        {usuario ? <p className="mt-3 text-sm font-medium text-secondary">@{usuario}</p> : null}
        <p className="mt-2 max-w-md text-[0.95rem] leading-relaxed text-secondary">
          Noticias del agro colombiano con sus fuentes a la vista. Toca una portada para leer la nota completa.
        </p>
      </section>

      <a
        href={sitio.alertasUrl}
        data-medir="alertas"
        className="mt-6 flex h-12 w-full items-center justify-center rounded-xl border border-borde-fuerte bg-raised px-4 text-[0.95rem] font-semibold transition-colors hover:bg-subtle"
      >
        Active las alertas de precios agrícolas
      </a>

      {portadas.length ? (
        <div className="mt-6">
          <GrillaPortadas iniciales={portadas} hayMasInicial={hayMas} />
        </div>
      ) : (
        <p className="mt-10 text-center text-sm text-tertiary">Pronto verás aquí las últimas noticias.</p>
      )}
    </main>
  )
}
