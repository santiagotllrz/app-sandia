// Formato del webhook de Hancel (version_esquema "1"). Los campos desconocidos se ignoran.

export type TipoEvento = "noticia.publicada" | "noticia.actualizada" | "noticia.retirada" | "ping"

export interface Fuente {
  id: string
  medio: string
  titulo: string
  url: string
  fecha?: string | null
  tipo?: "primaria" | "parte_interesada" | "medio" | string
  principal?: boolean
}

export interface BloqueTexto {
  parrafos: string[]
  fuentes: string[]
}

export interface Seccion extends BloqueTexto {
  subtitulo: string
}

export interface NoticiaPayload {
  id: string
  version: number
  slug: string
  idioma?: string
  titular: string
  resumen: string
  nicho: { slug: string; nombre: string }
  etiquetas?: string[]
  entrada: BloqueTexto
  secciones: Seccion[]
  cuerpo_html?: string
  imagen?: {
    url: string
    ancho?: number
    alto?: number
    alt?: string
    credito?: { texto?: string; medio?: string; autor?: string | null; url_origen?: string }
  }
  fuentes: Fuente[]
  palabras?: number
  minutos_lectura?: number
  redactada_at?: string
  publicada_at?: string
  url_original?: string
}

export interface EventoWebhook {
  evento: { id: string; tipo: TipoEvento | string; creado_at?: string; version_esquema?: string }
  empresa?: { id?: string; slug?: string; nombre?: string }
  noticia?: Partial<NoticiaPayload> & { motivo?: string }
}

// Lo que leen las páginas.

export interface Tema {
  slug: string
  nombre: string
}

export interface NoticiaResumen {
  id: string
  slug: string
  titular: string
  resumen: string | null
  tema_slug: string | null
  imagen: string | null
  imagen_ancho: number | null
  imagen_alto: number | null
  imagen_alt: string | null
  fuentes_total: number
  fuentes_dominios: string[]
  publicada_at: string
  actualizada_at: string
}

export interface NoticiaCompleta extends NoticiaResumen {
  version: number
  etiquetas: string[]
  minutos_lectura: number | null
  palabras: number | null
  datos: NoticiaPayload
}

export interface Pagina<T> {
  items: T[]
  total: number
}
