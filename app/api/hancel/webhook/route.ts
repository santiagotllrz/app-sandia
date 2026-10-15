import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { almacen } from "@/lib/almacen"
import { rutas, urlAbsoluta } from "@/lib/config"
import type { EventoWebhook, NoticiaPayload } from "@/lib/tipos"
import { normalizarNoticia, validarNoticia, verificarFirma } from "@/lib/webhook"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60 // el trabajo en after() (copiar la imagen) corre después de responder

const MAX_BYTES = 5 * 1024 * 1024

const json = (cuerpo: unknown, status = 200) => Response.json(cuerpo, { status })
const texto = (cuerpo: string, status: number) => new Response(cuerpo, { status })

/** Todo el portal muestra noticias (inicio, temas, destacados, sitemaps, RSS, menú de temas). */
function regenerarPortal() {
  revalidatePath("/", "layout")
}

export async function POST(req: Request) {
  const secreto = process.env.HANCEL_WEBHOOK_SECRET
  if (!secreto) return texto("webhook no configurado", 503)

  if (Number(req.headers.get("content-length") ?? 0) > MAX_BYTES) return texto("cuerpo demasiado grande", 413)
  const crudo = await req.text()
  if (crudo.length > MAX_BYTES) return texto("cuerpo demasiado grande", 413)

  const firma = verificarFirma(req.headers.get("x-hancel-signature"), crudo, secreto)
  if (!firma.ok) return texto(firma.motivo, 401)

  let evento: EventoWebhook
  try {
    evento = JSON.parse(crudo)
  } catch {
    return texto("JSON inválido", 400)
  }

  const tipo = evento.evento?.tipo ?? req.headers.get("x-hancel-event") ?? ""
  if (tipo === "ping") return json({ ok: true })

  const eventoId = evento.evento?.id ?? req.headers.get("x-hancel-delivery")
  if (!eventoId) return texto("falta evento.id", 400)
  const intento = Number(req.headers.get("x-hancel-attempt")) || null

  const db = await almacen()
  const registro = {
    id: eventoId,
    tipo,
    noticia_id: evento.noticia?.id ?? null,
    noticia_version: evento.noticia?.version ?? null,
    intento,
  }

  try {
    if (await db.eventoYaProcesado(eventoId)) {
      const slug = evento.noticia?.slug
      return json({ ok: true, duplicado: true, ...(slug && tipo !== "noticia.retirada" ? { url: urlAbsoluta(rutas.noticia(slug)) } : {}) })
    }

    if (tipo === "noticia.publicada" || tipo === "noticia.actualizada") {
      const motivo = validarNoticia(evento.noticia)
      if (motivo) {
        await db.registrarEvento({ ...registro, resultado: "rechazado", error: motivo })
        return texto(motivo, 422)
      }
      const noticia = normalizarNoticia(evento.noticia as NoticiaPayload)
      const r = await db.upsertNoticia(evento.empresa?.slug ?? null, noticia)
      await db.registrarEvento({ ...registro, resultado: r.resultado })

      if (r.resultado !== "ignorada_version") {
        regenerarPortal()
        const imagen = noticia.imagen?.url
        if (imagen) {
          after(async () => {
            try {
              await db.copiarImagen(noticia.id, noticia.version, imagen)
              regenerarPortal()
            } catch (e) {
              console.error("[webhook] no se pudo copiar la imagen; se sigue usando la del motor", noticia.id, e)
            }
          })
        }
      }
      return json({ ok: true, url: urlAbsoluta(rutas.noticia(r.slug)), ...(r.numero ? { id_externo: String(r.numero) } : {}) })
    }

    if (tipo === "noticia.retirada") {
      const n = evento.noticia
      if (!n?.id) {
        await db.registrarEvento({ ...registro, resultado: "rechazado", error: "falta noticia.id" })
        return texto("falta noticia.id", 422)
      }
      const r = await db.retirarNoticia(n.id, n.version ?? null, n.motivo ?? null)
      await db.registrarEvento({ ...registro, resultado: r.resultado })
      if (r.resultado === "retirada") regenerarPortal()
      return json({ ok: true })
    }

    // Tipo que el portal aún no maneja: 200 para que el motor no reintente.
    await db.registrarEvento({ ...registro, resultado: "ignorado" })
    return json({ ok: true, ignorado: true })
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e)
    console.error("[webhook] error procesando", eventoId, mensaje)
    await db.registrarEvento({ ...registro, resultado: "error", error: mensaje.slice(0, 2000) }).catch(() => {})
    return texto("error interno; reintentar", 500)
  }
}

export function GET() {
  return texto("Método no permitido", 405)
}

