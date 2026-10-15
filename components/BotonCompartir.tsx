"use client"

import { useState } from "react"
import { IconoCheck, IconoCompartir } from "./Iconos"

export function BotonCompartir({ titulo, url, compacto = false }: { titulo?: string; url?: string; compacto?: boolean }) {
  const [copiado, setCopiado] = useState(false)

  async function compartir() {
    const enlace = url ?? window.location.href
    const datos = { title: titulo ?? document.title, url: enlace }
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share(datos)
        return
      } catch {
        /* cancelado: se copia el enlace */
      }
    }
    try {
      await navigator.clipboard.writeText(enlace)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch {
      /* sin permisos de portapapeles */
    }
  }

  return (
    <button
      type="button"
      onClick={compartir}
      className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-borde-fuerte text-sm font-medium text-primary transition-colors duration-300 hover:bg-subtle ${
        compacto ? "aspect-[9/8] justify-center" : "px-3"
      }`}
      aria-label={compacto ? "Compartir" : undefined}
    >
      {copiado ? <IconoCheck className="size-4 text-primary" /> : <IconoCompartir className="size-4" />}
      {!compacto && <span>{copiado ? "Enlace copiado" : "Compartir"}</span>}
    </button>
  )
}
