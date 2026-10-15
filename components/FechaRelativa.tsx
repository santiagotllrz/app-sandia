"use client"

import { useEffect, useState } from "react"
import { formatoFechaCorta, formatoRelativo } from "@/lib/formato"

// El HTML cacheado lleva la fecha absoluta; en el navegador se cambia a "hace N horas".
export function FechaRelativa({ iso, className }: { iso: string; className?: string }) {
  const [texto, setTexto] = useState(() => formatoFechaCorta(iso))
  useEffect(() => {
    setTexto(formatoRelativo(iso))
    const t = setInterval(() => setTexto(formatoRelativo(iso)), 60_000)
    return () => clearInterval(t)
  }, [iso])
  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {texto}
    </time>
  )
}
