import { WidgetClima } from "./WidgetClima"
import { WidgetMercado } from "./WidgetMercado"

export function BarraLateral() {
  return (
    <aside className="hidden min-[860px]:sticky min-[860px]:top-20 min-[860px]:flex min-[860px]:flex-col min-[860px]:gap-6 min-[860px]:self-start" aria-label="Clima y mercado">
      <WidgetClima />
      <WidgetMercado />
    </aside>
  )
}
