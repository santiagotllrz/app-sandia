"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { rutas } from "@/lib/config"
import type { PortadaEnlace } from "@/lib/tipos"

/** Grilla 3 columnas de portadas, estilo Instagram, que carga más al llegar al final. */
export function GrillaPortadas({ iniciales, hayMasInicial }: { iniciales: PortadaEnlace[]; hayMasInicial: boolean }) {
  const [portadas, setPortadas] = useState(iniciales)
  const [hayMas, setHayMas] = useState(hayMasInicial)
  const [cargando, setCargando] = useState(false)
  const fin = useRef<HTMLDivElement>(null)

  const cargarMas = useCallback(async () => {
    if (cargando || !hayMas) return
    setCargando(true)
    try {
      const r = await fetch(`/api/portadas?desde=${portadas.length}`)
      if (!r.ok) throw new Error(String(r.status))
      const d: { items: PortadaEnlace[]; hayMas: boolean } = await r.json()
      setPortadas((actuales) => {
        const vistos = new Set(actuales.map((p) => p.slug))
        return [...actuales, ...d.items.filter((p) => !vistos.has(p.slug))]
      })
      setHayMas(d.hayMas)
    } catch {
      setHayMas(false)
    } finally {
      setCargando(false)
    }
  }, [cargando, hayMas, portadas.length])

  useEffect(() => {
    const el = fin.current
    if (!el || !hayMas) return
    const obs = new IntersectionObserver((e) => e[0]?.isIntersecting && cargarMas(), { rootMargin: "800px 0px" })
    obs.observe(el)
    return () => obs.disconnect()
  }, [cargarMas, hayMas])

  return (
    <>
      <ul className="grid grid-cols-3 gap-[3px] overflow-hidden rounded-lg">
        {portadas.map((p, i) => (
          <li key={p.slug}>
            <Link href={rutas.noticia(p.slug)} data-medir="portada" data-slug={p.slug} className="group block aspect-[4/5] overflow-hidden bg-subtle" title={p.titular}>
              {/* Ya viene comprimida desde el motor (WebP de ~40 KB): pasarla por el optimizador no gana nada. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imagen}
                alt={p.titular}
                width={p.ancho}
                height={p.alto}
                loading={i < 9 ? "eager" : "lazy"}
                fetchPriority={i < 3 ? "high" : "auto"}
                decoding="async"
                className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-85"
              />
            </Link>
          </li>
        ))}
      </ul>
      <div ref={fin} aria-hidden="true" />
      {cargando && (
        <div className="mt-6 flex justify-center" role="status" aria-label="Cargando más noticias">
          <span className="size-5 animate-spin rounded-full border-2 border-borde-fuerte border-t-primary" />
        </div>
      )}
    </>
  )
}
