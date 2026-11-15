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
    ...metadatosListado({
      titulo: tema.nombre,
      descripcion: descripcionTema(tema.nombre),
      ruta: rutas.tema(slug, pagina),
      pagina,
      rss: { url: rutas.rssTema(slug), titulo: `${tema.nombre} | ${sitio.nombre} (RSS)` },
    }),
    // Un tema sin noticias o una página de archivo > 1 no se indexa (pero se siguen sus enlaces).
    ...(total === 0 || pagina > 1 ? { robots: { index: false, follow: true } } : {}),
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

// ── Etiqueta (entidad / palabra clave) ──
export function decodificarEtiqueta(raw: string) {
  try {
    return decodeURIComponent(raw).trim()
  } catch {
    return raw.trim()
  }
}

const capitalizar = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)
const descripcionEtiqueta = (etiqueta: string) =>
  `Noticias y seguimiento sobre ${etiqueta} en el agro colombiano, con sus fuentes originales.`

export async function metadatosEtiqueta(raw: string, pagina: number) {
  const etiqueta = decodificarEtiqueta(raw)
  if (!etiqueta) return {}
  const { total } = await (await almacen()).listar({ etiqueta, pagina: 1, porPagina: 1 })
  if (total === 0) return { title: "Etiqueta no encontrada", robots: { index: false } }
  const titulo = capitalizar(etiqueta)
  return {
    ...metadatosListado({
      titulo,
      descripcion: descripcionEtiqueta(etiqueta),
      ruta: rutas.etiqueta(etiqueta, pagina),
      pagina,
    }),
    // Solo se indexan clústeres con al menos 2 noticias en su página 1 para evitar thin content.
    ...(total < 2 || pagina > 1 ? { robots: { index: false, follow: true } } : {}),
  }
}

export async function VistaEtiqueta({ etiqueta: raw, pagina }: { etiqueta: string; pagina: number }) {
  const etiqueta = decodificarEtiqueta(raw)
  if (!etiqueta) notFound()
  const { items, total } = await (await almacen()).listar({ etiqueta, pagina, porPagina: POR_PAGINA })
  if (!items.length) notFound()
  const titulo = capitalizar(etiqueta)
  return (
    <>
      <Listado
        encabezado={
          <>
            <nav aria-label="Ruta de navegación" className="mb-2 text-xs font-medium text-secondary">
              <Link href="/" className="hover:text-primary">
                Inicio
              </Link>
            </nav>
            <TituloListado
              titulo={pagina > 1 ? `${titulo}, página ${pagina}` : titulo}
              descripcion={descripcionEtiqueta(etiqueta)}
            />
          </>
        }
        noticias={items}
        pagina={pagina}
        totalPaginas={totalPaginas(total)}
        rutaPagina={(n) => rutas.etiqueta(etiqueta, n)}
      />
      <JsonLd
        datos={[
          jsonLdColeccion({
            nombre: titulo,
            descripcion: descripcionEtiqueta(etiqueta),
            ruta: rutas.etiqueta(etiqueta, pagina),
            noticias: items,
          }),
          jsonLdMigas([
            { nombre: "Inicio", ruta: "/" },
            { nombre: titulo, ruta: rutas.etiqueta(etiqueta) },
          ]),
        ]}
      />
    </>
  )
}
