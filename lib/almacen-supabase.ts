import "server-only"
import { createClient } from "@supabase/supabase-js"
import type { Almacen, ResultadoRetiro, ResultadoUpsert } from "./almacen"
import type { NoticiaCompleta, NoticiaResumen } from "./tipos"

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

    async listar({ tema, pagina, porPagina }) {
      const [desde, hasta] = rango(pagina, porPagina)
      let q = db.from("noticias").select(COLUMNAS_RESUMEN, { count: "exact" }).eq("estado", "publicada")
      if (tema) q = q.eq("tema_slug", tema)
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
      const tipo = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg"
      const ext = tipo === "image/png" ? "png" : tipo === "image/webp" ? "webp" : "jpg"
      const ruta = `${id}/v${version}.${ext}`
      const { error } = await db.storage
        .from("noticias")
        .upload(ruta, await res.arrayBuffer(), { contentType: tipo, upsert: true, cacheControl: "31536000" })
      falla("storage", error)
      const publica = db.storage.from("noticias").getPublicUrl(ruta).data.publicUrl
      // Solo si la noticia sigue apuntando a esa imagen (no llegó otra versión mientras tanto).
      const upd = await db.from("noticias").update({ imagen_url_propia: publica }).eq("id", id).eq("imagen_url", url)
      falla("imagen_url_propia", upd.error)
    },
  }
}
