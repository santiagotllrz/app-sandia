import { obtenerMercado, type PrecioProducto } from "@/lib/mercado"

const entero = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const fechaDia = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "America/Bogota" })

function formatearFecha(isoFecha: string) {
  const d = new Date(`${isoFecha}T12:00:00-05:00`)
  return Number.isNaN(d.getTime()) ? isoFecha : fechaDia.format(d).replace(/\./g, "").replace(/ de /g, " ")
}

function FilaProducto({ p, tipo }: { p: PrecioProducto; tipo: "alza" | "baja" }) {
  const esAlza = tipo === "alza"
  const color = esAlza ? "text-positivo" : "text-negativo"
  const signo = esAlza ? "+" : "−"

  return (
    <li className="flex items-center gap-2 px-2.5 py-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.imagen}
        alt=""
        width={28}
        height={28}
        loading="lazy"
        className="size-7 shrink-0 rounded-lg bg-subtle p-1 object-contain"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium leading-tight text-primary" title={p.nombre}>
          {p.nombre}
        </div>
        <div className="mt-0.5 flex items-baseline justify-between gap-1 text-[11px] tabular-nums">
          <span className="truncate text-secondary">${entero.format(p.precioKilo)}/kg</span>
          <span className={`shrink-0 font-medium ${color}`}>
            {signo}
            {decimal.format(Math.abs(p.porcentaje))}%
          </span>
        </div>
      </div>
    </li>
  )
}

export async function WidgetMercado() {
  const mercado = await obtenerMercado()
  if (!mercado || (!mercado.subieron.length && !mercado.bajaron.length)) return null

  return (
    <section aria-labelledby="titulo-mercado" className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="titulo-mercado" className="text-sm font-medium">
          Perspectiva del mercado
        </h2>
        <span className="text-[11px] text-tertiary">
          {formatearFecha(mercado.fecha)} · {mercado.central}
        </span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-borde overflow-hidden rounded-xl border border-borde bg-raised">
        <div className="min-w-0">
          <div className="flex items-center justify-between border-b border-borde bg-subtle px-2.5 py-1.5 text-[11px] font-medium">
            <span className="text-secondary">Más subieron</span>
            <span className="text-positivo" aria-hidden="true">
              ↗
            </span>
          </div>
          <ul className="divide-y divide-borde" aria-label="Productos que más subieron">
            {mercado.subieron.map((p) => (
              <FilaProducto key={p.slug} p={p} tipo="alza" />
            ))}
          </ul>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between border-b border-borde bg-subtle px-2.5 py-1.5 text-[11px] font-medium">
            <span className="text-secondary">Más bajaron</span>
            <span className="text-negativo" aria-hidden="true">
              ↘
            </span>
          </div>
          <ul className="divide-y divide-borde" aria-label="Productos que más bajaron">
            {mercado.bajaron.map((p) => (
              <FilaProducto key={p.slug} p={p} tipo="baja" />
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
