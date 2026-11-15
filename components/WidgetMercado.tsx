import { obtenerMercado, type PrecioProducto } from "@/lib/mercado"

const entero = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fechaDia = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "America/Bogota" })

function formatearFecha(isoFecha: string) {
  const d = new Date(`${isoFecha}T12:00:00-05:00`)
  return Number.isNaN(d.getTime()) ? isoFecha : fechaDia.format(d).replace(/\./g, "").replace(/ de /g, " ")
}

function FilaProducto({ p, tipo }: { p: PrecioProducto; tipo: "alza" | "baja" }) {
  const esAlza = tipo === "alza"
  const color = esAlza ? "text-positivo" : "text-negativo"
  const signo = esAlza ? "+" : "-"

  return (
    <li className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.imagen}
          alt=""
          width={36}
          height={36}
          loading="lazy"
          className="size-9 shrink-0 rounded-lg bg-subtle p-1 object-contain"
        />
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium leading-snug text-primary">{p.nombre}</div>
          <div className="truncate text-[11px] leading-snug text-tertiary">{p.central} · kg</div>
        </div>
      </div>

      <div className="shrink-0 text-right tabular-nums">
        <div className="text-[13px] leading-snug text-secondary">$ {entero.format(p.precioKilo)}</div>
        <div className={`text-xs font-medium leading-snug ${color}`}>
          {signo}
          {decimal.format(Math.abs(p.porcentaje))}%
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
        <span className="text-[11px] text-tertiary">{formatearFecha(mercado.fecha)}</span>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-borde bg-raised p-4">
        {mercado.subieron.length > 0 && (
          <div>
            <div className="mb-2.5 text-[11px] font-medium text-tertiary">Más subieron</div>
            <ul className="flex flex-col gap-3" aria-label="Productos que más subieron">
              {mercado.subieron.map((p) => (
                <FilaProducto key={p.slug} p={p} tipo="alza" />
              ))}
            </ul>
          </div>
        )}

        {mercado.bajaron.length > 0 && (
          <div className={mercado.subieron.length > 0 ? "border-t border-borde pt-3.5" : ""}>
            <div className="mb-2.5 text-[11px] font-medium text-tertiary">Más bajaron</div>
            <ul className="flex flex-col gap-3" aria-label="Productos que más bajaron">
              {mercado.bajaron.map((p) => (
                <FilaProducto key={p.slug} p={p} tipo="baja" />
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
