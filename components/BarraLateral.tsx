import { WidgetClima } from "./WidgetClima"
import { WidgetMercado } from "./WidgetMercado"

export function BarraLateral() {
  return (
    <aside
      className="barra-oculta hidden min-[860px]:sticky min-[860px]:top-20 min-[860px]:flex min-[860px]:max-h-[calc(100dvh-5.5rem)] min-[860px]:flex-col min-[860px]:gap-6 min-[860px]:self-start min-[860px]:overflow-y-auto min-[860px]:pb-6"
      aria-label="Clima y mercado"
    >
      <WidgetClima />
      <WidgetMercado />
    </aside>
  )
}
