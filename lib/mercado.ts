import "server-only"
import { cache } from "react"

const API_URL = (process.env.SANDIA_API_URL || "https://usesandia.com/api/v1").replace(/\/$/, "")
const API_KEY = process.env.SANDIA_API_KEY || "sk_sandia_df0e2ecd1643e126f40af8731dc94ef950eaf32836eb2649"

export interface PrecioProducto {
  slug: string
  nombre: string
  imagen: string
  central: string
  ciudad: string
  fecha: string
  precioKilo: number
  diferencia: number
  porcentaje: number
}

export interface DatosMercado {
  fecha: string
  central: string
  /** Los 36 productos del catálogo para la cinta superior. */
  productos: PrecioProducto[]
  /** Los 4 que más subieron en el último día hábil registrado. */
  subieron: PrecioProducto[]
  /** Los 4 que más bajaron en el último día hábil registrado. */
  bajaron: PrecioProducto[]
}

interface FilaUltimos {
  fecha: string
  producto: string
  producto_nombre: string
  producto_imagen: string
  ciudad: string
  ciudad_nombre: string
  central: string
  central_nombre: string
  precio_kilo: number
  variacion: { diferencia: number; porcentaje: number } | null
}

function normalizar(f: FilaUltimos): PrecioProducto {
  return {
    slug: f.producto,
    nombre: f.producto_nombre,
    imagen: f.producto_imagen,
    central: f.central_nombre,
    ciudad: f.ciudad_nombre,
    fecha: f.fecha,
    precioKilo: f.precio_kilo,
    diferencia: f.variacion?.diferencia ?? 0,
    porcentaje: f.variacion?.porcentaje ?? 0,
  }
}

export const obtenerMercado = cache(async (): Promise<DatosMercado | null> => {
  if (!API_KEY) return null
  try {
    const res = await fetch(`${API_URL}/precios/ultimos`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`sandia api ${res.status}`)
    const json = (await res.json()) as { datos?: FilaUltimos[]; actualizado?: string }
    const filas = json.datos ?? []
    if (!filas.length) return null

    // 1. Cinta superior: los 36 productos únicos, priorizando Corabastos como referencia nacional
    // y completando cualquier producto que no cotice allí con su reporte más reciente.
    const porProducto = new Map<string, FilaUltimos>()
    for (const f of filas) {
      const actual = porProducto.get(f.producto)
      if (!actual) {
        porProducto.set(f.producto, f)
      } else if (f.central === "corabastos" && actual.central !== "corabastos") {
        porProducto.set(f.producto, f)
      } else if (actual.central !== "corabastos" && f.fecha > actual.fecha) {
        porProducto.set(f.producto, f)
      }
    }

    const productos = [...porProducto.values()]
      .map(normalizar)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es-CO"))

    // 2. Movimientos del último día hábil registrado (viernes durante fin de semana o lunes festivo).
    const corabastos = filas.filter((f) => f.central === "corabastos")
    const base = corabastos.length ? corabastos : filas
    const fechaMax = base.reduce((max, f) => (f.fecha > max ? f.fecha : max), base[0].fecha)
    const delUltimoDia = base.filter((f) => f.fecha === fechaMax && f.variacion != null).map(normalizar)

    const subieron = delUltimoDia
      .filter((p) => p.porcentaje > 0)
      .sort((a, b) => b.porcentaje - a.porcentaje)
      .slice(0, 4)

    const bajaron = delUltimoDia
      .filter((p) => p.porcentaje < 0)
      .sort((a, b) => a.porcentaje - b.porcentaje)
      .slice(0, 4)

    return {
      fecha: fechaMax,
      central: corabastos.length ? "Corabastos" : base[0].central_nombre,
      productos,
      subieron,
      bajaron,
    }
  } catch (e) {
    console.error("[mercado]", e)
    return null
  }
})
