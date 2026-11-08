import Link from "next/link"
import { notFound } from "next/navigation"
import { JsonLd } from "@/components/JsonLd"
import { Listado, TituloListado } from "@/components/Listado"
import { almacen } from "@/lib/almacen"
import { POR_PAGINA, rutas, sitio } from "@/lib/config"
import { jsonLdColeccion, jsonLdMigas, metadatosListado } from "@/lib/seo"

const totalPaginas = (total: number) => Math.max(1, Math.ceil(total / POR_PAGINA))

// ── Para ti (inicio) ──
export const textosInicio = {
  titulo: `${sitio.nombre}: noticias del agro colombiano`,
  descripcion: sitio.descripcion,
}

export const metadatosInicio = (pagina: number) =>
  metadatosListado({ ...textosInicio, ruta: rutas.inicio(pagina), pagina, tituloAbsoluto: true })

export async function VistaInicio({ pagina }: { pagina: number }) {
  const { items, total } = await (await almacen()).listar({ pagina, porPagina: POR_PAGINA })
  if (pagina > 1 && !items.length) notFound()
  return (
    <>
      <Listado
        encabezado={<TituloListado titulo={pagina > 1 ? `Últimas noticias del agro, página ${pagina}` : textosInicio.titulo} oculto />}
        noticias={items}
        pagina={pagina}
        totalPaginas={totalPaginas(total)}
        rutaPagina={rutas.inicio}
      />
      <JsonLd
        datos={jsonLdColeccion({ nombre: textosInicio.titulo, descripcion: textosInicio.descripcion, ruta: rutas.inicio(pagina), noticias: items })}
      />
    </>
  )
}

// ── Destacados: las más vistas de los últimos 7 días primero; sin vistas, el mismo orden de Para ti ──
export const textosDestacados = {
  titulo: "Destacados",
  descripcion: `Las noticias del agro más leídas de la semana en ${sitio.nombre}.`,
}

export const metadatosDestacados = (pagina: number) =>
  metadatosListado({ ...textosDestacados, ruta: rutas.destacados(pagina), pagina })

export async function VistaDestacados({ pagina }: { pagina: number }) {
  const { items, total } = await (await almacen()).destacados({ pagina, porPagina: POR_PAGINA })
  if (pagina > 1 && !items.length) notFound()
  return (
    <>
      <Listado
        encabezado={<TituloListado titulo={`Destacados: ${textosDestacados.descripcion}`} oculto />}
        noticias={items}
        pagina={pagina}
        totalPaginas={totalPaginas(total)}
        rutaPagina={rutas.destacados}
      />
      <JsonLd
        datos={[
          jsonLdColeccion({
            nombre: textosDestacados.titulo,
            descripcion: textosDestacados.descripcion,
            ruta: rutas.destacados(pagina),
            noticias: items,
          }),
          jsonLdMigas([
            { nombre: "Inicio", ruta: "/" },
            { nombre: "Destacados", ruta: rutas.destacados() },
          ]),
        ]}
      />
    </>
  )
}

// ── Tema ──
async function buscarTema(slug: string) {
  const temas = await (await almacen()).temas()
  return temas.find((t) => t.slug === slug) ?? null
}

const descripcionTema = (nombre: string) => `Últimas noticias de ${nombre.toLowerCase()} en el agro colombiano, con sus fuentes.`

export async function metadatosTema(slug: string, pagina: number) {
  const tema = await buscarTema(slug)
  if (!tema) return {}
  const { total } = await (await almacen()).listar({ tema: slug, pagina: 1, porPagina: 1 })
  return {
    ...metadatosListado({ titulo: tema.nombre, descripcion: descripcionTema(tema.nombre), ruta: rutas.tema(slug, pagina), pagina }),
    // Un tema sin noticias es una página vacía: no se indexa hasta que tenga.
    ...(total === 0 ? { robots: { index: false, follow: true } } : {}),
  }
}

export async function VistaTema({ slug, pagina }: { slug: string; pagina: number }) {
  const tema = await buscarTema(slug)
  if (!tema) notFound()
  const { items, total } = await (await almacen()).listar({ tema: slug, pagina, porPagina: POR_PAGINA })
  if (pagina > 1 && !items.length) notFound()
  return (
    <>
      <Listado
        encabezado={
          <>
            <nav aria-label="Ruta de navegación" className="mb-2 text-xs font-medium text-secondary">
              <Link href={rutas.temas()} className="hover:text-primary">
                Temas
              </Link>
            </nav>
            <TituloListado
              titulo={pagina > 1 ? `${tema.nombre}, página ${pagina}` : tema.nombre}
              descripcion={descripcionTema(tema.nombre)}
            />
          </>
        }
        noticias={items}
        pagina={pagina}
        totalPaginas={totalPaginas(total)}
        rutaPagina={(n) => rutas.tema(slug, n)}
        vacio={`Todavía no hay noticias de ${tema.nombre.toLowerCase()}.`}
      />
      <JsonLd
        datos={[
          jsonLdColeccion({ nombre: tema.nombre, descripcion: descripcionTema(tema.nombre), ruta: rutas.tema(slug, pagina), noticias: items }),
          jsonLdMigas([
            { nombre: "Inicio", ruta: "/" },
            { nombre: "Temas", ruta: rutas.temas() },
            { nombre: tema.nombre, ruta: rutas.tema(slug) },
          ]),
        ]}
      />
    </>
  )
}
