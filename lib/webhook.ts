import "server-only"
import crypto from "node:crypto"
import type { NoticiaPayload } from "./tipos"

export const TOLERANCIA_SEGUNDOS = 300

/** Verifica X-Hancel-Signature (t=…,v1=…) contra HMAC-SHA256(secreto, `${t}.${cuerpoCrudo}`). */
export function verificarFirma(
  cabecera: string | null,
  cuerpoCrudo: string,
  secreto: string,
  ahora = Date.now() / 1000,
): { ok: true } | { ok: false; motivo: string } {
  if (!cabecera) return { ok: false, motivo: "falta X-Hancel-Signature" }
  const partes = new Map(
    cabecera.split(",").map((p) => {
      const i = p.indexOf("=")
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()] as const
    }),
  )
  const t = Number(partes.get("t"))
  if (!Number.isFinite(t) || t <= 0) return { ok: false, motivo: "firma sin marca de tiempo" }
  if (Math.abs(ahora - t) > TOLERANCIA_SEGUNDOS) return { ok: false, motivo: "firma vencida" }

  const esperada = crypto.createHmac("sha256", secreto).update(`${t}.${cuerpoCrudo}`).digest()
  const v1 = partes.get("v1") ?? ""
  const recibida = /^[0-9a-f]{64}$/i.test(v1) ? Buffer.from(v1, "hex") : Buffer.alloc(0)
  if (recibida.length !== esperada.length || !crypto.timingSafeEqual(recibida, esperada)) {
    return { ok: false, motivo: "firma inválida" }
  }
  return { ok: true }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Revisa lo mínimo para poder publicar. Devuelve el motivo del rechazo o null. */
export function validarNoticia(n: Partial<NoticiaPayload> | undefined): string | null {
  if (!n) return "falta el bloque noticia"
  if (!n.id || !UUID.test(n.id)) return "noticia.id debe ser un uuid"
  if (!Number.isInteger(n.version) || n.version! < 1) return "noticia.version debe ser un entero positivo"
  if (!n.slug || !SLUG.test(n.slug) || n.slug.length > 200) return "noticia.slug no es válido"
  if (!n.titular?.trim()) return "falta noticia.titular"
  if (!n.nicho?.slug || !SLUG.test(n.nicho.slug)) return "noticia.nicho.slug no es válido"
  if (!n.nicho.nombre?.trim()) return "falta noticia.nicho.nombre"
  if (!Array.isArray(n.entrada?.parrafos)) return "falta noticia.entrada.parrafos"
  if (n.secciones != null && !Array.isArray(n.secciones)) return "noticia.secciones debe ser una lista"
  if (n.fuentes != null && !Array.isArray(n.fuentes)) return "noticia.fuentes debe ser una lista"
  if (n.imagen?.url && !/^https:\/\//.test(n.imagen.url)) return "noticia.imagen.url debe ser https"
  for (const campo of ["publicada_at", "redactada_at"] as const) {
    if (n[campo] && Number.isNaN(Date.parse(n[campo]!))) return `noticia.${campo} no es una fecha ISO 8601`
  }
  return null
}

/** Normaliza lo que la web pinta, para no depender de campos opcionales. */
export function normalizarNoticia(n: NoticiaPayload): NoticiaPayload {
  return {
    ...n,
    resumen: n.resumen ?? "",
    etiquetas: Array.isArray(n.etiquetas) ? n.etiquetas.filter((e) => typeof e === "string") : [],
    entrada: { parrafos: n.entrada.parrafos ?? [], fuentes: n.entrada.fuentes ?? [] },
    secciones: (n.secciones ?? []).map((s) => ({ subtitulo: s.subtitulo ?? "", parrafos: s.parrafos ?? [], fuentes: s.fuentes ?? [] })),
    fuentes: (n.fuentes ?? []).filter((f) => f && typeof f.url === "string"),
  }
}
