import { almacen } from "@/lib/almacen"

export const runtime = "nodejs"

const POR_TANDA = 30 // igual que la primera tanda de app/enlaces/page.tsx

// Siguiente tanda de portadas para el scroll infinito de /enlaces.
export async function GET(req: Request) {
  const desde = Math.max(0, Math.min(10_000, Number(new URL(req.url).searchParams.get("desde")) || 0))
  try {
    // Una de más para saber si queda algo por cargar.
    const filas = await (await almacen()).portadas(POR_TANDA + 1, desde)
    return Response.json(
      { items: filas.slice(0, POR_TANDA), hayMas: filas.length > POR_TANDA },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    )
  } catch (e) {
    console.error("[portadas]", e)
    return Response.json({ error: "no disponible" }, { status: 502 })
  }
}
