import "server-only"
import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"
import type { Almacen, ResultadoRetiro, ResultadoUpsert } from "./almacen"
import type { NoticiaCompleta, NoticiaResumen, PortadaEnlace } from "./tipos"

/** Las portadas llegan ya comprimidas (unos 40 KB); esto solo frena algo raro. */
const MAX_PORTADA_BYTES = 2 * 1024 * 1024
/** Ancho máximo al que se muestra una imagen en el portal (720px en artículo, ~960px con holgura retina). */
const MAX_IMAGEN_ANCHO = 960
const CALIDAD_WEBP = 72

/** Comprime la imagen a WebP liviano para ahorrar almacenamiento y ancho de banda en Supabase. */
async function comprimirImagen(entrada: Buffer, tipoOriginal: string) {
  try {
    const { data, info } = await sharp(entrada)
      .rotate()
      .resize({ width: MAX_IMAGEN_ANCHO, height: MAX_IMAGEN_ANCHO, fit: "inside", withoutEnlargement: true })
      .webp({ quality: CALIDAD_WEBP, effort: 4 })
      .toBuffer({ resolveWithObject: true })
    if (data.byteLength < entrada.byteLength) {
      return { bytes: data, tipo: "image/webp", ext: "webp" as const, ancho: info.width, alto: info.height }
    }
  } catch (e) {
    console.warn("[imagen] no se pudo recomprimir con sharp; se guarda el original", e)
  }
  const ext = tipoOriginal === "image/png" ? "png" : tipoOriginal === "image/webp" ? "webp" : "jpg"
  return { bytes: entrada, tipo: tipoOriginal, ext, ancho: null, alto: null }
}

const COLUMNAS_RESUMEN =
  "id,slug,titular,resumen,tema_slug,imagen_url,imagen_url_propia,imagen_ancho,imagen_alto,imagen_alt,fuentes_total,fuentes_dominios,publicada_at,actualizada_at"

type FilaResumen = Omit<NoticiaResumen, "imagen"> & { imagen_url: string | null; imagen_url_propia: string | null }

function aResumen({ imagen_url, imagen_url_propia, ...f }: FilaResumen): NoticiaResumen {
  return { ...f, imagen: imagen_url_propia ?? imagen_url }
}

function rango(pagina: number, porPagina: number) {
  const desde = (Math.max(1, pagina) - 1) * porPagina
  return [desde, desde + porPagina - 1] as const
}

export function almacenSupabase(): Almacen {
  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const falla = (donde: string, error: { message: string } | null) => {
    if (error) throw new Error(`[supabase:${donde}] ${error.message}`)
  }

  return {
    async temas() {
      const { data, error } = await db.from("temas").select("slug,nombre").order("orden").order("nombre")
      falla("temas", error)
      return data ?? []
    },

    async listar({ tema, etiqueta, pagina, porPagina }) {
      const [desde, hasta] = rango(pagina, porPagina)
      let q = db.from("noticias").select(COLUMNAS_RESUMEN, { count: "exact" }).eq("estado", "publicada")
      if (tema) q = q.eq("tema_slug", tema)
      if (etiqueta) q = q.contains("etiquetas", [etiqueta])
      const { data, error, count } = await q.order("publicada_at", { ascending: false }).range(desde, hasta)
      falla("listar", error)
      return { items: (data as FilaResumen[] | null ?? []).map(aResumen), total: count ?? 0 }
    },

    async destacados({ pagina, porPagina, dias = 7 }) {
      const [desde] = rango(pagina, porPagina)
      const [orden, conteo] = await Promise.all([
        db.rpc("ids_destacados", { p_dias: dias, p_limite: porPagina, p_desde: desde }),
        db.from("noticias").select("id", { count: "exact", head: true }).eq("estado", "publicada"),
      ])
      falla("ids_destacados", orden.error)
      const ids = ((orden.data ?? []) as { id: string }[]).map((f) => f.id)
      if (!ids.length) return { items: [], total: conteo.count ?? 0 }
      const { data, error } = await db.from("noticias").select(COLUMNAS_RESUMEN).in("id", ids)
      falla("destacados", error)
      const porId = new Map((data as FilaResumen[]).map((f) => [f.id, aResumen(f)]))
      return { items: ids.map((id) => porId.get(id)).filter((n): n is NoticiaResumen => !!n), total: conteo.count ?? 0 }
    },

    async relacionadas({ id, tema, etiquetas, limite = 9 }) {
      const setEtq = new Set(etiquetas.map((e) => e.toLowerCase()))
      const [porEtiqueta, delTema, recientes] = await Promise.all([
        etiquetas.length
          ? db
              .from("noticias")
              .select(`${COLUMNAS_RESUMEN},etiquetas`)
              .eq("estado", "publicada")
              .neq("id", id)
              .overlaps("etiquetas", etiquetas)
              .order("publicada_at", { ascending: false })
              .limit(limite * 2)
          : Promise.resolve({ data: [], error: null }),
        tema
          ? db
              .from("noticias")
              .select(COLUMNAS_RESUMEN)
              .eq("estado", "publicada")
              .eq("tema_slug", tema)
              .neq("id", id)
              .order("publicada_at", { ascending: false })
              .limit(limite)
          : Promise.resolve({ data: [], error: null }),
        db
          .from("noticias")
          .select(COLUMNAS_RESUMEN)
          .eq("estado", "publicada")
          .neq("id", id)
          .order("publicada_at", { ascending: false })
          .limit(limite),
      ])
      falla("relacionadas:etiquetas", porEtiqueta.error)
      falla("relacionadas:tema", delTema.error)
      falla("relacionadas:recientes", recientes.error)

      const conEtiqueta = ((porEtiqueta.data ?? []) as (FilaResumen & { etiquetas?: string[] })[])
        .sort((a, b) => {
          const ca = (a.etiquetas ?? []).filter((e) => setEtq.has(e.toLowerCase())).length
          const cb = (b.etiquetas ?? []).filter((e) => setEtq.has(e.toLowerCase())).length
          return cb - ca || b.publicada_at.localeCompare(a.publicada_at)
        })
        .map(({ etiquetas: _e, ...f }) => aResumen(f))

      const vistos = new Set<string>([id])
      const unicas: NoticiaResumen[] = []
      for (const n of [
        ...conEtiqueta,
        ...((delTema.data ?? []) as FilaResumen[]).map(aResumen),
        ...((recientes.data ?? []) as FilaResumen[]).map(aResumen),
      ]) {
        if (!vistos.has(n.id)) {
          vistos.add(n.id)
          unicas.push(n)
          if (unicas.length >= limite) break
        }
      }
      return unicas
    },

    async etiquetasIndexables(minNoticias = 2) {
      const { data, error } = await db
        .from("noticias")
        .select("etiquetas,actualizada_at")
        .eq("estado", "publicada")
        .not("etiquetas", "eq", "{}")
        .order("publicada_at", { ascending: false })
        .limit(5000)
      falla("etiquetasIndexables", error)
      const conteo = new Map<string, { total: number; ultima: string }>()
      for (const f of (data ?? []) as { etiquetas: string[]; actualizada_at: string }[]) {
        for (const raw of f.etiquetas ?? []) {
          const e = raw.trim()
          if (!e) continue
          const prev = conteo.get(e)
          if (!prev) conteo.set(e, { total: 1, ultima: f.actualizada_at })
          else {
            prev.total += 1
            if (f.actualizada_at > prev.ultima) prev.ultima = f.actualizada_at
          }
        }
      }
      return [...conteo.entries()]
        .filter(([, v]) => v.total >= minNoticias)
        .map(([etiqueta, v]) => ({ etiqueta, ultima: v.ultima }))
    },

    async porSlug(slug) {
      const { data, error } = await db
        .from("noticias")
        .select(`${COLUMNAS_RESUMEN},version,etiquetas,minutos_lectura,palabras,datos`)
        .eq("slug", slug)
        .eq("estado", "publicada")
        .maybeSingle()
      falla("porSlug", error)
      if (!data) return null
      const { imagen_url, imagen_url_propia, ...resto } = data as FilaResumen & Omit<NoticiaCompleta, keyof NoticiaResumen>
      return { ...resto, imagen: imagen_url_propia ?? imagen_url } as NoticiaCompleta
    },

    async todas(limite) {
      const { data, error } = await db
        .from("noticias")
        .select(COLUMNAS_RESUMEN)
        .eq("estado", "publicada")
        .order("publicada_at", { ascending: false })
        .limit(limite)
      falla("todas", error)
      return (data as FilaResumen[] | null ?? []).map(aResumen)
    },

    async eventoYaProcesado(id) {
      const { data, error } = await db.from("webhook_eventos").select("resultado").eq("id", id).maybeSingle()
      falla("eventoYaProcesado", error)
      return !!data && data.resultado !== "error"
    },

    async registrarEvento(e) {
      const { error } = await db
        .from("webhook_eventos")
        .upsert({ ...e, procesado_at: new Date().toISOString() }, { onConflict: "id" })
      if (error) console.error("[webhook] no se pudo registrar el evento", e.id, error.message)
    },

    async upsertNoticia(empresaSlug, noticia) {
      const { data, error } = await db.rpc("upsert_noticia", { p_empresa_slug: empresaSlug, p_noticia: noticia })
      falla("upsert_noticia", error)
      return (data as ResultadoUpsert[])[0]
    },

    async retirarNoticia(id, version, motivo) {
      const { data, error } = await db.rpc("retirar_noticia", { p_id: id, p_version: version, p_motivo: motivo })
      falla("retirar_noticia", error)
      return (data as ResultadoRetiro[])[0]
    },

    async registrarVista(id) {
      const { error } = await db.rpc("registrar_vista", { p_noticia_id: id })
      falla("registrar_vista", error)
    },

    async copiarImagen(id, version, url) {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
      if (!res.ok) throw new Error(`descarga ${res.status}`)
      const tipoOriginal = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg"
      const original = Buffer.from(await res.arrayBuffer())
      const { bytes, tipo, ext } = await comprimirImagen(original, tipoOriginal)
      const ruta = `${id}/v${version}.${ext}`
      const { error } = await db.storage
        .from("noticias")
        .upload(ruta, bytes, { contentType: tipo, upsert: true, cacheControl: "31536000" })
      falla("storage", error)
      const publica = db.storage.from("noticias").getPublicUrl(ruta).data.publicUrl
      // Solo si la noticia sigue apuntando a esa imagen (no llegó otra versión mientras tanto).
      const upd = await db.from("noticias").update({ imagen_url_propia: publica }).eq("id", id).eq("imagen_url", url)
      falla("imagen_url_propia", upd.error)
    },

    async optimizarImagenesExistentes(limite = 25) {
      const { data, error, count } = await db
        .from("noticias")
        .select("id,version,imagen_url,imagen_url_propia", { count: "exact" })
        .not("imagen_url", "is", null)
        .or("imagen_url_propia.is.null,imagen_url_propia.not.ilike.%.webp")
        .order("publicada_at", { ascending: false })
        .limit(limite)
      falla("optimizarImagenesExistentes", error)

      const filas = (data ?? []) as { id: string; version: number; imagen_url: string; imagen_url_propia: string | null }[]
      let procesadas = 0
      let ahorradoBytes = 0

      for (const f of filas) {
        const origen = f.imagen_url_propia ?? f.imagen_url
        try {
          const res = await fetch(origen, { signal: AbortSignal.timeout(20_000) })
          if (!res.ok) continue
          const original = Buffer.from(await res.arrayBuffer())
          const { data: comprimida } = await sharp(original)
            .rotate()
            .resize({ width: MAX_IMAGEN_ANCHO, height: MAX_IMAGEN_ANCHO, fit: "inside", withoutEnlargement: true })
            .webp({ quality: CALIDAD_WEBP, effort: 4 })
            .toBuffer({ resolveWithObject: true })

          const rutaWebp = `${f.id}/v${f.version}.webp`
          const { error: errSubida } = await db.storage
            .from("noticias")
            .upload(rutaWebp, comprimida, { contentType: "image/webp", upsert: true, cacheControl: "31536000" })
          if (errSubida) continue

          const publica = db.storage.from("noticias").getPublicUrl(rutaWebp).data.publicUrl
          const { error: errUpd } = await db.from("noticias").update({ imagen_url_propia: publica }).eq("id", f.id)
          if (errUpd) continue

          if (f.imagen_url_propia && !f.imagen_url_propia.endsWith(".webp")) {
            const marcador = "/storage/v1/object/public/noticias/"
            const idx = f.imagen_url_propia.indexOf(marcador)
            if (idx !== -1) {
              const rutaVieja = f.imagen_url_propia.slice(idx + marcador.length)
              if (rutaVieja && rutaVieja !== rutaWebp) {
                await db.storage.from("noticias").remove([rutaVieja])
              }
            }
          }

          procesadas += 1
          ahorradoBytes += Math.max(0, original.byteLength - comprimida.byteLength)
        } catch (e) {
          console.warn("[optimizarImagenesExistentes] fallo en noticia", f.id, e)
        }
      }

      const totalPendientes = count ?? filas.length
      return {
        procesadas,
        pendientes: Math.max(0, totalPendientes - procesadas),
        ahorradoBytes,
      }
    },

    async guardarPortada(id, portada) {
      const { data: existe, error: errorExiste } = await db.from("noticias").select("id").eq("id", id).maybeSingle()
      falla("guardarPortada", errorExiste)
      if (!existe) return "no_existe"

      const res = await fetch(portada.url, { signal: AbortSignal.timeout(20_000) })
      if (!res.ok) throw new Error(`descarga de la portada ${res.status}`)
      const tipo = res.headers.get("content-type")?.split(";")[0] ?? "image/webp"
      if (!tipo.startsWith("image/")) throw new Error(`la portada no es una imagen (${tipo})`)
      const bytes = await res.arrayBuffer()
      if (bytes.byteLength > MAX_PORTADA_BYTES) throw new Error("la portada pesa demasiado")

      const ext = tipo === "image/png" ? "png" : tipo === "image/jpeg" ? "jpg" : "webp"
      // Un nombre por portada: la ruta se cachea un año, así que reemplazarla en la misma ruta no se vería.
      const ruta = `${id}/portada-${Date.now().toString(36)}.${ext}`
      const { error } = await db.storage
        .from("noticias")
        .upload(ruta, bytes, { contentType: tipo, upsert: true, cacheControl: "31536000" })
      falla("storage portada", error)

      const upd = await db
        .from("noticias")
        .update({
          portada_url: db.storage.from("noticias").getPublicUrl(ruta).data.publicUrl,
          portada_ancho: portada.ancho ?? null,
          portada_alto: portada.alto ?? null,
          portada_at: portada.publicada_at ?? new Date().toISOString(),
        })
        .eq("id", id)
      falla("portada_url", upd.error)
      return "guardada"
    },

    async portadas(limite, desde = 0) {
      const { data, error } = await db
        .from("noticias")
        .select("slug,titular,portada_url,portada_ancho,portada_alto")
        .eq("estado", "publicada")
        .not("portada_url", "is", null)
        .order("portada_at", { ascending: false })
        .order("id")
        .range(desde, desde + limite - 1)
      falla("portadas", error)
      return ((data ?? []) as { slug: string; titular: string; portada_url: string; portada_ancho: number | null; portada_alto: number | null }[]).map(
        (f): PortadaEnlace => ({ slug: f.slug, titular: f.titular, imagen: f.portada_url, ancho: f.portada_ancho ?? 480, alto: f.portada_alto ?? 600 }),
      )
    },
  }
}
