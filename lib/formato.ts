const ZONA = "America/Bogota"

const fechaCorta = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: ZONA })
const fechaLarga = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: ZONA,
})

/** "15 oct 2026" (sin el punto que Intl agrega a los meses abreviados). */
export function formatoFechaCorta(iso: string) {
  return fechaCorta.format(new Date(iso)).replace(/\./g, "").replace(/ de /g, " ")
}

export function formatoFechaLarga(iso: string) {
  return fechaLarga.format(new Date(iso))
}

const relativo = new Intl.RelativeTimeFormat("es", { numeric: "auto" })

/** "hace 17 horas" durante el primer día; después, la fecha corta. Igual que Discover. */
export function formatoRelativo(iso: string, ahora = Date.now()) {
  const seg = Math.round((ahora - new Date(iso).getTime()) / 1000)
  if (seg < 0 || seg >= 86400) return formatoFechaCorta(iso)
  if (seg < 60) return "hace un momento"
  if (seg < 3600) return relativo.format(-Math.round(seg / 60), "minute")
  return relativo.format(-Math.round(seg / 3600), "hour")
}

export function dominio(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export function favicon(dominio: string, tam = 32) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(dominio)}&sz=${tam}`
}

export function plural(n: number, uno: string, varios: string) {
  return `${n} ${n === 1 ? uno : varios}`
}

/**
 * Meta descripción para Google y redes: frases completas del primer párrafo hasta ~160 caracteres.
 * El resumen del motor llega cortado con "...", así que no se usa tal cual.
 */
export function descripcionMeta(n: { resumen?: string | null; entrada?: { parrafos?: string[] } }, max = 160) {
  const base = (n.entrada?.parrafos?.[0] ?? n.resumen ?? "").replace(/s*(...|…)s*$/, "").trim()
  if (base.length <= max) return base
  let texto = ""
  for (const frase of base.match(/[^.!?]+[.!?]+(s|$)/g) ?? []) {
    if ((texto + frase).trim().length > max) break
    texto += frase
  }
  if (texto.trim()) return texto.trim()
  // Primera frase más larga que el límite: se deja completa (Google la acorta al mostrarla) si no es excesiva.
  const primera = base.match(/^[^.!?]+[.!?]/)?.[0]
  if (primera && primera.length <= 300) return primera
  const corte = base.slice(0, max - 1)
  return `${corte.slice(0, corte.lastIndexOf(" ")).replace(/[,;:]$/, "")}…`
}
