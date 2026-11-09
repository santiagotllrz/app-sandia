import {
  CANALES,
  clasificarCanal,
  dispositivo,
  guardarClic,
  guardarTiempo,
  guardarVista,
  noticiaPorSlug,
  tipoDePagina,
  type Canal,
} from "@/lib/metricas"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|lighthouse|headless|python|curl|wget|whatsapp\//i
const TIPOS_CLIC = new Set(["portada", "alertas", "compartir", "fuente"])

const nada = (status = 204) => new Response(null, { status })
const uuid = (x: unknown): string | null => (typeof x === "string" && UUID.test(x) ? x : null)
const texto = (x: unknown, max = 200): string | null => (typeof x === "string" && x.trim() ? x.trim().slice(0, max) : null)

function ciudad(req: Request): string | null {
  const c = req.headers.get("x-vercel-ip-city")
  if (!c) return null
  try {
    return decodeURIComponent(c).slice(0, 80)
  } catch {
    return c.slice(0, 80)
  }
}

/**
 * El medidor del navegador manda aquí tres cosas:
 * - `v`: se abrió una página (una vez por página; el id lo pone el navegador).
 * - `t`: tiempo a la vista y scroll de esa página (varias veces; solo crecen).
 * - `c`: un clic que interesa (portada de /enlaces, alertas, compartir, fuente).
 * Responde 204 siempre que pueda: medir nunca debe romper la página.
 */
export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") ?? ""
  if (BOT.test(ua)) return nada()
  if (Number(req.headers.get("content-length") ?? 0) > 4096) return nada(413)

  let e: Record<string, unknown>
  try {
    const crudo = await req.text()
    if (crudo.length > 4096) return nada(413)
    e = JSON.parse(crudo)
  } catch {
    return nada(400)
  }

  try {
    if (e.t === "t") {
      const id = uuid(e.id)
      if (!id) return nada(400)
      await guardarTiempo(id, Number(e.s) || 0, Number(e.p) || 0)
      return nada()
    }

    const visitante = uuid(e.u)
    const sesion = uuid(e.ss)
    if (!visitante || !sesion) return nada(400)

    if (e.t === "c") {
      const tipo = texto(e.k, 20)
      if (!tipo || !TIPOS_CLIC.has(tipo)) return nada(400)
      const slug = texto(e.slug, 200)
      const ruta = texto(e.r, 300)
      const deRuta = ruta ? tipoDePagina(ruta).slug : null
      // La portada es de la noticia a la que lleva; compartir y fuentes, de la noticia donde se tocó.
      const noticia = slug ?? deRuta
      await guardarClic({
        visitante,
        sesion,
        vista_id: uuid(e.id),
        tipo,
        ruta,
        noticia_id: noticia ? await noticiaPorSlug(noticia) : null,
        destino: texto(e.d, 300),
      })
      return nada()
    }

    if (e.t !== "v") return nada(400)
    const id = uuid(e.id)
    const ruta = texto(e.r, 300)
    if (!id || !ruta || !ruta.startsWith("/")) return nada(400)

    const pagina = tipoDePagina(ruta)
    const host = new URL(req.url).host
    const utmSource = texto(e.us, 100)
    const { canal, host: referente } = clasificarCanal({ referente: texto(e.ref, 500), utmSource, ua, hostPropio: host })
    const entrada = e.n === true
    // La sesión hereda el canal de su página de entrada; el navegador lo guarda y lo devuelve.
    const recordado = texto(e.cs, 20) as Canal | null
    const canalSesion: Canal = entrada || !recordado || !CANALES.includes(recordado) ? (canal === "interno" ? "directo" : canal) : recordado

    let desdeEnlaces = false
    try {
      desdeEnlaces = typeof e.ref === "string" && new URL(e.ref).pathname === "/enlaces" && canal === "interno"
    } catch {
      desdeEnlaces = false
    }

    await guardarVista({
      id,
      visitante,
      sesion,
      nuevo: e.nv === true,
      entrada,
      tipo_pagina: pagina.tipo,
      ruta,
      noticia_id: pagina.slug ? await noticiaPorSlug(pagina.slug) : null,
      canal,
      canal_sesion: canalSesion,
      referente,
      desde_enlaces: desdeEnlaces,
      utm_source: utmSource,
      utm_medium: texto(e.um, 100),
      utm_campaign: texto(e.uc, 100),
      dispositivo: dispositivo(ua),
      pais: texto(req.headers.get("x-vercel-ip-country"), 2),
      ciudad: ciudad(req),
    })
    return Response.json({ cs: canalSesion })
  } catch (error) {
    console.error("[metricas]", error)
    return nada()
  }
}
