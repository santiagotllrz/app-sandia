import "server-only"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Métricas propias del portal: lo que manda el medidor del navegador (components/Medidor.tsx)
 * y el resumen por día que lee Hancel. Sin Supabase (desarrollo local) no se guarda nada.
 */

let db: SupabaseClient | null | undefined

function cliente(): SupabaseClient | null {
  if (db !== undefined) return db
  db =
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null
  return db
}

export const CANALES = [
  "google",
  "facebook",
  "instagram",
  "directo",
  "sandia",
  "whatsapp",
  "x",
  "buscadores",
  "referidos",
  "interno",
] as const
export type Canal = (typeof CANALES)[number]

const SANDIA = /(^|\.)usesandia\.com$/i

/**
 * De dónde viene una página. Los navegadores de Instagram y Facebook a menudo no mandan referente,
 * pero se delatan en el user agent; las campañas con utm_source mandan sobre todo lo demás.
 */
export function clasificarCanal(opts: {
  referente: string | null
  utmSource: string | null
  ua: string
  hostPropio: string
}): { canal: Canal; host: string | null } {
  const utm = opts.utmSource?.toLowerCase().trim() || ""
  if (utm) {
    if (/^(ig|instagram)/.test(utm)) return { canal: "instagram", host: null }
    if (/^(fb|facebook|meta)/.test(utm)) return { canal: "facebook", host: null }
    if (/^google/.test(utm)) return { canal: "google", host: null }
    if (/^(whatsapp|wa)$/.test(utm)) return { canal: "whatsapp", host: null }
    if (/^sandia/.test(utm)) return { canal: "sandia", host: null }
  }

  let host: string | null = null
  try {
    host = opts.referente ? new URL(opts.referente).hostname.toLowerCase().replace(/^www\./, "") : null
  } catch {
    host = null
  }

  if (host) {
    const propio = opts.hostPropio.toLowerCase().replace(/^www\./, "")
    if (host === propio || host.endsWith(".vercel.app") || host === "localhost") return { canal: "interno", host: null }
    if (/(^|\.)instagram\.com$/.test(host)) return { canal: "instagram", host }
    if (/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/.test(host)) return { canal: "facebook", host }
    if (/(^|\.)google\.[a-z.]+$/.test(host) || host === "news.google.com" || host.endsWith("googleapis.com") || host === "android-app") return { canal: "google", host }
    if (SANDIA.test(host)) return { canal: "sandia", host }
    if (/(^|\.)(whatsapp\.com|wa\.me)$/.test(host)) return { canal: "whatsapp", host }
    if (/(^|\.)(t\.co|x\.com|twitter\.com)$/.test(host)) return { canal: "x", host }
    if (/(^|\.)(bing\.com|duckduckgo\.com|yahoo\.com|ecosia\.org|search\.brave\.com|yandex\.[a-z]+)$/.test(host)) return { canal: "buscadores", host }
    return { canal: "referidos", host }
  }

  if (/Instagram/i.test(opts.ua)) return { canal: "instagram", host: null }
  if (/FBAN|FBAV|FB_IAB|FBIOS|FB4A/i.test(opts.ua)) return { canal: "facebook", host: null }
  return { canal: "directo", host: null }
}

export function dispositivo(ua: string): "movil" | "tableta" | "escritorio" {
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return "tableta"
  if (/Mobi|iPhone|iPod|Android|BlackBerry|Opera Mini|IEMobile/i.test(ua)) return "movil"
  return "escritorio"
}

export function tipoDePagina(ruta: string): { tipo: string; slug: string | null } {
  const noticia = /^\/noticias\/([a-z0-9-]+)\/?$/.exec(ruta)
  if (noticia) return { tipo: "noticia", slug: noticia[1] }
  if (ruta === "/enlaces") return { tipo: "enlaces", slug: null }
  if (ruta === "/" || /^\/pagina\/\d+$/.test(ruta)) return { tipo: "inicio", slug: null }
  if (ruta.startsWith("/temas")) return { tipo: "tema", slug: null }
  if (ruta.startsWith("/destacados")) return { tipo: "destacados", slug: null }
  return { tipo: "otra", slug: null }
}

const idsPorSlug = new Map<string, { id: string | null; hasta: number }>()

export async function noticiaPorSlug(slug: string): Promise<string | null> {
  const db = cliente()
  if (!db) return null
  const guardado = idsPorSlug.get(slug)
  if (guardado && guardado.hasta > Date.now()) return guardado.id
  const { data } = await db.from("noticias").select("id").eq("slug", slug).maybeSingle()
  const id = (data as { id: string } | null)?.id ?? null
  idsPorSlug.set(slug, { id, hasta: Date.now() + (id ? 3_600_000 : 60_000) })
  if (idsPorSlug.size > 2000) idsPorSlug.clear()
  return id
}

export type NuevaVista = {
  id: string
  visitante: string
  sesion: string
  nuevo: boolean
  entrada: boolean
  tipo_pagina: string
  ruta: string
  noticia_id: string | null
  canal: Canal
  canal_sesion: Canal
  referente: string | null
  desde_enlaces: boolean
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  dispositivo: string
  pais: string | null
  ciudad: string | null
}

export async function guardarVista(v: NuevaVista): Promise<void> {
  const db = cliente()
  if (!db) return
  const { error } = await db.from("metricas_vistas").upsert(v, { onConflict: "id", ignoreDuplicates: true })
  if (error) throw new Error(`[metricas:vista] ${error.message}`)
}

export async function guardarTiempo(id: string, segundos: number, scroll: number): Promise<void> {
  const db = cliente()
  if (!db) return
  const { error } = await db.rpc("metricas_tiempo", { p_id: id, p_segundos: Math.round(segundos), p_scroll: Math.round(scroll) })
  if (error) throw new Error(`[metricas:tiempo] ${error.message}`)
}

export async function guardarClic(c: {
  visitante: string
  sesion: string
  vista_id: string | null
  tipo: string
  ruta: string | null
  noticia_id: string | null
  destino: string | null
}): Promise<void> {
  const db = cliente()
  if (!db) return
  const { error } = await db.from("metricas_clics").insert(c)
  if (error) throw new Error(`[metricas:clic] ${error.message}`)
}

export async function resumen(desde: string, hasta: string, zona: string): Promise<unknown> {
  const db = cliente()
  if (!db) return { desde, hasta, zona, dias: [], noticias: [], acumulado: [], visitantes_ventana: {} }
  const { data, error } = await db.rpc("metricas_resumen", { p_desde: desde, p_hasta: hasta, p_tz: zona })
  if (error) throw new Error(`[metricas:resumen] ${error.message}`)
  return data
}
