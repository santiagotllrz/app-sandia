import { almacen } from "@/lib/almacen"

export const runtime = "nodejs"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|lighthouse|headless|python|curl|wget/i

// Cuenta una vista. Lo llama el navegador con sendBeacon al abrir una noticia (una vez por día por noticia).
export async function POST(req: Request) {
  if (BOT.test(req.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 })
  let id: unknown
  try {
    id = JSON.parse(await req.text()).id
  } catch {
    return new Response(null, { status: 400 })
  }
  if (typeof id !== "string" || !UUID.test(id)) return new Response(null, { status: 400 })
  try {
    await (await almacen()).registrarVista(id)
  } catch (e) {
    console.error("[vistas]", e)
  }
  return new Response(null, { status: 204 })
}
