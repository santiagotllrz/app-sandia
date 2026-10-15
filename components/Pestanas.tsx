"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { rutas } from "@/lib/config"
import type { Tema } from "@/lib/tipos"
import { IconoFlechaAbajo } from "./Iconos"

const base =
  "relative flex h-full items-center whitespace-nowrap text-sm font-medium text-primary transition-opacity duration-300 hover:opacity-100"
const subrayado = "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-inverse after:content-['']"

export function Pestanas({ temas }: { temas: Tema[] }) {
  const ruta = usePathname()
  const menu = useRef<HTMLDetailsElement>(null)

  const activa = ruta.startsWith("/destacados")
    ? "destacados"
    : ruta.startsWith("/temas")
      ? "temas"
      : ruta === "/" || ruta.startsWith("/pagina")
        ? "inicio"
        : null

  // Cierra el menú de temas al navegar o al hacer clic fuera.
  useEffect(() => {
    if (menu.current) menu.current.open = false
  }, [ruta])
  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (menu.current?.open && !menu.current.contains(e.target as Node)) menu.current.open = false
    }
    document.addEventListener("click", cerrar)
    return () => document.removeEventListener("click", cerrar)
  }, [])

  const estilo = (clave: string) => `${base} ${activa === clave ? `opacity-100 ${subrayado}` : "opacity-70"}`

  return (
    <nav aria-label="Secciones" className="h-full">
      <ul className="flex h-full items-stretch gap-5">
        <li>
          <Link href={rutas.inicio()} className={estilo("inicio")} aria-current={activa === "inicio" ? "page" : undefined}>
            Para ti
          </Link>
        </li>
        <li>
          <Link href={rutas.destacados()} className={estilo("destacados")} aria-current={activa === "destacados" ? "page" : undefined}>
            Destacados
          </Link>
        </li>
        <li className="relative">
          <details ref={menu} className="group h-full">
            <summary className={`${estilo("temas")} cursor-pointer select-none gap-1`}>
              Temas
              <IconoFlechaAbajo className="size-3.5 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="z-30 rounded-xl border border-borde bg-raised p-1.5 shadow-hover max-md:fixed max-md:inset-x-4 max-md:top-[104px] md:absolute md:left-1/2 md:top-full md:mt-1 md:w-72 md:-translate-x-1/2">
              <ul>
                {temas.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={rutas.tema(t.slug)}
                      className={`block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-soft ${
                        ruta === rutas.tema(t.slug) ? "font-semibold text-primary bg-subtle" : "text-primary"
                      }`}
                    >
                      {t.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-1 border-t border-borde pt-1">
                <Link href={rutas.temas()} className="block rounded-lg px-3 py-2 text-sm text-secondary hover:bg-soft hover:text-primary">
                  Ver todos los temas
                </Link>
              </div>
            </div>
          </details>
        </li>
      </ul>
    </nav>
  )
}
