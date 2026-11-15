import { obtenerMercado, type PrecioProducto } from "@/lib/mercado"

const entero = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 })
const porcentajeFmt = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function ItemCinta({ p }: { p: PrecioProducto }) {
  const sube = p.porcentaje > 0
  const baja = p.porcentaje < 0
  const color = sube ? "text-positivo" : baja ? "text-negativo" : "text-tertiary"
  const signo = sube ? "▲ +" : baja ? "▼ -" : ""

  return (
    <span className="inline-flex shrink-0 items-center gap-2 px-5 text-xs whitespace-nowrap">
      <span className="font-semibold text-primary">{p.nombre}</span>
      <span className="text-secondary tabular-nums">$ {entero.format(p.precioKilo)}/kg</span>
      <span className={`font-semibold tabular-nums ${color}`}>
        {signo}
        {porcentajeFmt.format(Math.abs(p.porcentaje))}%
      </span>
      <span className="ml-3 h-3.5 w-px bg-borde-fuerte" aria-hidden="true" />
    </span>
  )
}

export async function BarraPrecios() {
  const mercado = await obtenerMercado()
  if (!mercado?.productos.length) return null

  return (
    <div
      role="region"
      aria-label="Precios mayoristas del agro"
      className="w-full overflow-hidden border-b border-borde bg-raised/90 py-2"
    >
      <div className="cinta-precios">
        <div className="flex items-center">
          {mercado.productos.map((p) => (
            <ItemCinta key={p.slug} p={p} />
          ))}
        </div>
        <div className="flex items-center" aria-hidden="true">
          {mercado.productos.map((p) => (
            <ItemCinta key={`dup-${p.slug}`} p={p} />
          ))}
        </div>
      </div>
    </div>
  )
}
