import { WidgetClima } from "./WidgetClima"
import { WidgetMercado } from "./WidgetMercado"

export function BarraLateral() {
  return (
    <aside className="flex flex-col gap-6 min-[860px]:sticky min-[860px]:top-20 min-[860px]:self-start" aria-label="Clima y mercado">
      <WidgetClima />
      <WidgetMercado />
    </aside>
  )
}
