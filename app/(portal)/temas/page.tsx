import type { Metadata } from "next"
import Link from "next/link"
import { BarraLateral } from "@/components/BarraLateral"
import { FechaRelativa } from "@/components/FechaRelativa"
import { IconoFlechaDerecha } from "@/components/Iconos"
import { JsonLd } from "@/components/JsonLd"
import { TituloListado } from "@/components/Listado"
import { almacen } from "@/lib/almacen"
import { rutas, sitio, urlAbsoluta } from "@/lib/config"
import { jsonLdMigas, metadatosListado } from "@/lib/seo"

export const revalidate = 300

const descripcion = `Todos los temas que cubre ${sitio.nombre}: cultivos, ganadería, clima y agua, sanidad, mercados, innovación y más.`

export const metadata: Metadata = metadatosListado({ titulo: "Temas", descripcion, ruta: rutas.temas() })

export default async function Temas() {
  const db = await almacen()
  const temas = await db.temas()
  const conNoticias = await Promise.all(
    temas.map(async (t) => ({ ...t, ...(await db.listar({ tema: t.slug, pagina: 1, porPagina: 3 })) })),
  )

  return (
    <div className="mx-auto my-4 w-full max-w-[1240px] px-4 md:my-8 md:px-8">
      <div className="grid gap-6 min-[860px]:grid-cols-[minmax(0,1fr)_336px] lg:gap-10">
        <div className="min-w-0">
          <TituloListado titulo="Temas" descripcion={descripcion} />
          <ul className="grid gap-4 sm:grid-cols-2">
            {conNoticias.map((t) => (
              <li key={t.slug} className="flex flex-col rounded-xl border border-borde bg-raised p-4">
                <Link href={rutas.tema(t.slug)} className="group flex items-center justify-between gap-2">
                  <h2 className="font-editorial text-xl transition-colors group-hover:text-acento">{t.nombre}</h2>
                  <IconoFlechaDerecha className="size-4 text-tertiary transition-transform group-hover:translate-x-0.5" />
                </Link>
                <p className="mt-0.5 text-xs text-tertiary">
                  {t.total === 1 ? "1 noticia" : `${t.total} noticias`}
                </p>
                {t.items.length > 0 && (
                  <ul className="mt-3 flex flex-col divide-y divide-borde border-t border-borde">
                    {t.items.map((n) => (
                      <li key={n.id} className="py-2.5">
                        <Link href={rutas.noticia(n.slug)} className="block text-sm leading-snug hover:text-acento">
                          {n.titular}
                        </Link>
                        <FechaRelativa iso={n.publicada_at} className="text-xs text-tertiary" />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
        <BarraLateral />
      </div>
      <JsonLd
        datos={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Temas",
            description: descripcion,
            url: urlAbsoluta(rutas.temas()),
            hasPart: temas.map((t) => ({ "@type": "CollectionPage", name: t.nombre, url: urlAbsoluta(rutas.tema(t.slug)) })),
          },
          jsonLdMigas([
            { nombre: "Inicio", ruta: "/" },
            { nombre: "Temas", ruta: rutas.temas() },
          ]),
        ]}
      />
    </div>
  )
}
