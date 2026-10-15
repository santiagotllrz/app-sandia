// Indicadores del widget "Perspectiva del mercado". Por ahora sin datos: valor y variación en null
// se muestran como "—". Cuando exista la fuente, basta con llenar estos campos (o traerlos de una API).
export interface Indicador {
  nombre: string
  unidad: string
  valor: number | null
  variacion: number | null // porcentaje
  cambio: number | null
}

export const indicadoresMercado: Indicador[] = [
  { nombre: "Café", unidad: "COP/carga", valor: null, variacion: null, cambio: null },
  { nombre: "Cacao", unidad: "USD/t", valor: null, variacion: null, cambio: null },
  { nombre: "Maíz", unidad: "USD/bu", valor: null, variacion: null, cambio: null },
  { nombre: "Dólar (TRM)", unidad: "COP", valor: null, variacion: null, cambio: null },
]
