import "server-only"
import { promises as fs } from "node:fs"
import path from "node:path"
import type { Almacen, RegistroEvento } from "./almacen"
import type { NoticiaCompleta, NoticiaPayload, NoticiaResumen, Tema } from "./tipos"

// Solo para desarrollo sin credenciales de Supabase: replica la lógica de las funciones SQL
// sobre un archivo .data/portal.json para poder probar el webhook y el diseño localmente.

interface Fila extends NoticiaCompleta {
  numero: number
  estado: "publicada" | "retirada"
  vistas: Record<string, number>
}

interface Estado {
  temas: (Tema & { orden: number })[]
  noticias: Fila[]
  eventos: Record<string, RegistroEvento>
  secuencia: number
}

const ARCHIVO = path.join(process.cwd(), ".data", "portal.json")

const TEMAS_INICIALES: [string, string][] = [
  ["cultivos-principales", "Cultivos principales"],
  ["frutas-y-exportacion-no-tradicional", "Frutas y exportación no tradicional"],
  ["ganaderia-y-pecuario", "Ganadería y pecuario"],
  ["sanidad-y-plagas", "Sanidad y plagas"],
  ["clima-y-agua", "Clima y agua"],
  ["insumos-y-maquinaria", "Insumos y maquinaria"],
  ["politica-y-mercado", "Política y mercado"],
  ["agtech-e-innovacion", "Agtech e innovación"],
  ["sostenibilidad-y-ambiente", "Sostenibilidad y ambiente"],
  ["gremios-y-ruralidad", "Gremios y ruralidad"],
]

async function leer(): Promise<Estado> {
  try {
    return JSON.parse(await fs.readFile(ARCHIVO, "utf8"))
  } catch {
    return { temas: TEMAS_INICIALES.map(([slug, nombre], i) => ({ slug, nombre, orden: i + 1 })), noticias: [], eventos: {}, secuencia: 0 }
  }
}

async function guardar(e: Estado) {
  await fs.mkdir(path.dirname(ARCHIVO), { recursive: true })
  await fs.writeFile(ARCHIVO, JSON.stringify(e, null, 2))
}

function dominios(n: NoticiaPayload) {
  const vistos = new Set<string>()
  return [...(n.fuentes ?? [])]
    .sort((a, b) => Number(!!b.principal) - Number(!!a.principal))
    .map((f) => {
      try {
        return new URL(f.url).hostname.replace(/^www\./, "")
      } catch {
        return null
      }
    })
    .filter((d): d is string => !!d && !vistos.has(d) && !!vistos.add(d))
}

function aResumen({ numero, estado, vistas, version, etiquetas, minutos_lectura, palabras, datos, ...r }: Fila): NoticiaResumen {
  return r
}

const hoy = () => new Date().toISOString().slice(0, 10)
const publicadas = (e: Estado) =>
  e.noticias.filter((n) => n.estado === "publicada").sort((a, b) => b.publicada_at.localeCompare(a.publicada_at))

export function almacenLocal(): Almacen {
  return {
    async temas() {
      return (await leer()).temas.sort((a, b) => a.orden - b.orden).map(({ slug, nombre }) => ({ slug, nombre }))
    },

    async listar({ tema, pagina, porPagina }) {
      const todas = publicadas(await leer()).filter((n) => !tema || n.tema_slug === tema)
      const desde = (pagina - 1) * porPagina
      return { items: todas.slice(desde, desde + porPagina).map(aResumen), total: todas.length }
    },

    async destacados({ pagina, porPagina, dias = 7 }) {
      const limite = new Date(Date.now() - dias * 864e5).toISOString().slice(0, 10)
      const suma = (n: Fila) => Object.entries(n.vistas).reduce((s, [d, v]) => (d >= limite ? s + v : s), 0)
      const todas = publicadas(await leer()).sort((a, b) => suma(b) - suma(a))
      const desde = (pagina - 1) * porPagina
      return { items: todas.slice(desde, desde + porPagina).map(aResumen), total: todas.length }
    },

    async porSlug(slug) {
      const n = (await leer()).noticias.find((x) => x.slug === slug && x.estado === "publicada")
      if (!n) return null
      const { numero, estado, vistas, ...completa } = n
      return completa
    },

    async todas(limite) {
      return publicadas(await leer()).slice(0, limite).map(aResumen)
    },

    async eventoYaProcesado(id) {
      const ev = (await leer()).eventos[id]
      return !!ev && ev.resultado !== "error"
    },

    async registrarEvento(ev) {
      const e = await leer()
      e.eventos[ev.id] = ev
      await guardar(e)
    },

    async upsertNoticia(_empresa, n) {
      const e = await leer()
      const tema = e.temas.find((t) => t.slug === n.nicho.slug)
      if (!tema) e.temas.push({ slug: n.nicho.slug, nombre: n.nicho.nombre, orden: 100 })
      else tema.nombre = n.nicho.nombre

      const actual = e.noticias.find((x) => x.id === n.id)
      if (actual && n.version <= actual.version) {
        return { resultado: "ignorada_version", numero: actual.numero, slug: actual.slug, tema_slug: actual.tema_slug }
      }
      const slug = actual?.slug ?? n.slug
      const fila: Fila = {
        id: n.id,
        numero: actual?.numero ?? ++e.secuencia,
        estado: "publicada",
        vistas: actual?.vistas ?? {},
        version: n.version,
        slug,
        titular: n.titular,
        resumen: n.resumen,
        tema_slug: n.nicho.slug,
        imagen: n.imagen?.url ?? null,
        imagen_ancho: n.imagen?.ancho ?? null,
        imagen_alto: n.imagen?.alto ?? null,
        imagen_alt: n.imagen?.alt ?? null,
        fuentes_total: n.fuentes?.length ?? 0,
        fuentes_dominios: dominios(n),
        etiquetas: n.etiquetas ?? [],
        minutos_lectura: n.minutos_lectura ?? null,
        palabras: n.palabras ?? null,
        publicada_at: n.publicada_at ?? actual?.publicada_at ?? new Date().toISOString(),
        actualizada_at: new Date().toISOString(),
        datos: { ...n, slug },
      }
      e.noticias = [...e.noticias.filter((x) => x.id !== n.id), fila]
      await guardar(e)
      return { resultado: actual ? "actualizada" : "creada", numero: fila.numero, slug, tema_slug: fila.tema_slug }
    },

    async retirarNoticia(id, version) {
      const e = await leer()
      const n = e.noticias.find((x) => x.id === id)
      if (!n) return { resultado: "no_existe", slug: null, tema_slug: null }
      if (version != null && version <= n.version) return { resultado: "ignorada_version", slug: n.slug, tema_slug: n.tema_slug }
      n.estado = "retirada"
      n.version = version ?? n.version
      await guardar(e)
      return { resultado: "retirada", slug: n.slug, tema_slug: n.tema_slug }
    },

    async registrarVista(id) {
      const e = await leer()
      const n = e.noticias.find((x) => x.id === id && x.estado === "publicada")
      if (!n) return
      n.vistas[hoy()] = (n.vistas[hoy()] ?? 0) + 1
      await guardar(e)
    },

    async copiarImagen() {},
  }
}

/** Producción sin credenciales: el sitio compila y responde, pero vacío. */
export function almacenVacio(): Almacen {
  const sinDb = () => Promise.reject(new Error("Base de datos no configurada"))
  return {
    temas: async () => TEMAS_INICIALES.map(([slug, nombre]) => ({ slug, nombre })),
    listar: async () => ({ items: [], total: 0 }),
    destacados: async () => ({ items: [], total: 0 }),
    porSlug: async () => null,
    todas: async () => [],
    eventoYaProcesado: sinDb,
    registrarEvento: async () => {},
    upsertNoticia: sinDb,
    retirarNoticia: sinDb,
    registrarVista: async () => {},
    copiarImagen: async () => {},
  }
}
