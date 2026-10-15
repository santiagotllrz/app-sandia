import { indicadoresMercado } from "@/lib/mercado"

const numero = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 })

export function WidgetMercado() {
  return (
    <section aria-labelledby="titulo-mercado" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="titulo-mercado" className="text-sm font-medium">
          Perspectiva del mercado
        </h2>
        <span className="rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-tertiary">Próximamente</span>
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {indicadoresMercado.map((i) => {
          const sube = (i.variacion ?? 0) >= 0
          const color = i.variacion == null ? "text-tertiary" : sube ? "text-positivo" : "text-negativo"
          return (
            <li key={i.nombre} className="flex flex-col gap-1 rounded-xl border border-borde bg-raised p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium">{i.nombre}</span>
                <span className={`text-xs font-medium tabular-nums ${color}`}>
                  {i.variacion == null ? "—" : `${sube ? "▲" : "▼"} ${numero.format(Math.abs(i.variacion))}%`}
                </span>
              </div>
              <span className="text-sm font-medium tabular-nums">{i.valor == null ? "—" : numero.format(i.valor)}</span>
              <span className="flex justify-between text-[11px] text-tertiary">
                <span>{i.unidad}</span>
                <span className={`tabular-nums ${color}`}>{i.cambio == null ? "" : `${i.cambio >= 0 ? "+" : "−"}${numero.format(Math.abs(i.cambio))}`}</span>
              </span>
              <svg viewBox="0 0 100 24" className="mt-1 h-6 w-full text-borde-fuerte" aria-hidden="true">
                <path d="M0 14 Q 12 10 24 13 T 48 12 T 72 14 T 100 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
