import "server-only"
import type { NoticiaCompleta, NoticiaPayload, NoticiaResumen, Pagina, Tema } from "./tipos"

export interface ResultadoUpsert {
  resultado: "creada" | "actualizada" | "ignorada_version"
  numero: number | null
  slug: string
  tema_slug: string | null
}

export interface ResultadoRetiro {
  resultado: "retirada" | "ignorada_version" | "no_existe"
  slug: string | null
  tema_slug: string | null
}

export interface RegistroEvento {
  id: string
  tipo: string
  noticia_id?: string | null
  noticia_version?: number | null
  intento?: number | null
  resultado: string
  error?: string | null
}

/** Acceso a datos. Producción usa Supabase; en desarrollo sin credenciales, un archivo JSON local. */
export interface Almacen {
  temas(): Promise<Tema[]>
  listar(opts: { tema?: string; pagina: number; porPagina: number }): Promise<Pagina<NoticiaResumen>>
  destacados(opts: { pagina: number; porPagina: number; dias?: number }): Promise<Pagina<NoticiaResumen>>
  porSlug(slug: string): Promise<NoticiaCompleta | null>
  todas(limite: number): Promise<NoticiaResumen[]>

  eventoYaProcesado(id: string): Promise<boolean>
  registrarEvento(e: RegistroEvento): Promise<void>
  upsertNoticia(empresaSlug: string | null, noticia: NoticiaPayload): Promise<ResultadoUpsert>
  retirarNoticia(id: string, version: number | null, motivo: string | null): Promise<ResultadoRetiro>
  registrarVista(id: string): Promise<void>
  copiarImagen(id: string, version: number, url: string): Promise<void>
}

let instancia: Promise<Almacen> | null = null

export function almacen(): Promise<Almacen> {
  instancia ??= (async () => {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { almacenSupabase } = await import("./almacen-supabase")
      return almacenSupabase()
    }
    if (process.env.NODE_ENV !== "production") {
      const { almacenLocal } = await import("./almacen-local")
      return almacenLocal()
    }
    console.error("[almacen] Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY: el portal se muestra vacío.")
    const { almacenVacio } = await import("./almacen-local")
    return almacenVacio()
  })()
  return instancia
}

export function baseDeDatosConfigurada() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) || process.env.NODE_ENV !== "production"
}
