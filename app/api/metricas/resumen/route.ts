import { resumen } from "@/lib/metricas"
import { verificarFirma } from "@/lib/webhook"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const FECHA = /^\d{4}-\d{2}-\d{2}$/
const MAX_DIAS = 120

/**
 * El resumen de métricas por día que lee Hancel cada hora.
 *
 * Va firmado con el mismo secreto del webhook (HANCEL_WEBHOOK_SECRET), en la otra dirección:
 * X-Hancel-Signature: t=<unix>,v1=HMAC-SHA256(secreto, `${t}.${query}`), donde query es la parte
 * `?desde=…&hasta=…&zona=…` de la URL tal cual. Así el portal no depende de Hancel: solo responde
 * a quien conoce el secreto.
 */
export async function GET(req: Request) {
  const secreto = process.env.HANCEL_WEBHOOK_SECRET
  if (!secreto) return new Response("métricas no configuradas", { status: 503 })

  const url = new URL(req.url)
  const firma = verificarFirma(req.headers.get("x-hancel-signature"), url.search, secreto)
  if (!firma.ok) return new Response(firma.motivo, { status: 401 })

  const desde = url.searchParams.get("desde") ?? ""
  const hasta = url.searchParams.get("hasta") ?? ""
  const zona = url.searchParams.get("zona") || "America/Bogota"
  if (!FECHA.test(desde) || !FECHA.test(hasta) || desde > hasta) return new Response("desde/hasta inválidos", { status: 400 })
  if ((Date.parse(hasta) - Date.parse(desde)) / 86_400_000 > MAX_DIAS) return new Response("rango demasiado largo", { status: 400 })
  if (!/^[A-Za-z_]+(\/[A-Za-z_]+)*$/.test(zona)) return new Response("zona inválida", { status: 400 })

  try {
    return Response.json(await resumen(desde, hasta, zona), { headers: { "Cache-Control": "no-store" } })
  } catch (e) {
    console.error("[metricas:resumen]", e)
    return new Response("no se pudo armar el resumen", { status: 500 })
  }
}
