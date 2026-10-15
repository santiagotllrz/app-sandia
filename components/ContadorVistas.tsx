"use client"

import { useEffect } from "react"

// Suma una vista por noticia, por navegador y por día. Alimenta el orden de Destacados.
export function ContadorVistas({ id }: { id: string }) {
  useEffect(() => {
    const clave = `vista:${id}:${new Date().toISOString().slice(0, 10)}`
    try {
      if (localStorage.getItem(clave)) return
      localStorage.setItem(clave, "1")
    } catch {
      /* sin almacenamiento: se cuenta igual */
    }
    const cuerpo = JSON.stringify({ id })
    if (!navigator.sendBeacon?.("/api/vistas", cuerpo)) {
      fetch("/api/vistas", { method: "POST", body: cuerpo, keepalive: true }).catch(() => {})
    }
  }, [id])
  return null
}
