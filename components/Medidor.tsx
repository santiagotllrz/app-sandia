"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

/**
 * El medidor del portal. Sin cookies ni terceros: guarda en localStorage un id anónimo de
 * visitante (para estimar personas) y uno de sesión (30 minutos sin actividad la cierran), y manda
 * a /api/m cada página abierta, cuánto tiempo estuvo a la vista y en uso, hasta dónde se bajó y
 * los clics que interesan (portadas de /enlaces, alertas, compartir, fuentes).
 */

const RUTA = "/api/m"
const VISITANTE = "ia:v"
const SESION = "ia:s"
const SESION_MS = 30 * 60_000
/** Sin tocar, mover ni bajar en este tiempo, deja de contar: la pestaña quedó abierta y nadie lee. */
const INACTIVO_MS = 90_000
const LATIDOS = [10, 30, 60, 120, 240, 420, 600, 900]

type Sesion = { id: string; ultimo: number; cs?: string }

function nuevoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16),
  )
}

function leer<T>(clave: string): T | null {
  try {
    const v = localStorage.getItem(clave)
    return v ? (JSON.parse(v) as T) : null
  } catch {
    return null
  }
}

function guardar(clave: string, valor: unknown) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
  } catch {
    /* sin almacenamiento: cada página cuenta como visitante nuevo */
  }
}

function visitante(): { id: string; nuevo: boolean } {
  const id = leer<string>(VISITANTE)
  if (id) return { id, nuevo: false }
  const nuevo = nuevoId()
  guardar(VISITANTE, nuevo)
  return { id: nuevo, nuevo: true }
}

function sesion(): { s: Sesion; nueva: boolean } {
  const s = leer<Sesion>(SESION)
  if (s?.id && Date.now() - s.ultimo < SESION_MS) {
    s.ultimo = Date.now()
    guardar(SESION, s)
    return { s, nueva: false }
  }
  const nueva: Sesion = { id: nuevoId(), ultimo: Date.now() }
  guardar(SESION, nueva)
  return { s: nueva, nueva: true }
}

function tocarSesion() {
  const s = leer<Sesion>(SESION)
  if (s) guardar(SESION, { ...s, ultimo: Date.now() })
}

function enviar(cuerpo: object) {
  const datos = JSON.stringify(cuerpo)
  try {
    if (navigator.sendBeacon?.(RUTA, datos)) return
  } catch {
    /* sigue con fetch */
  }
  fetch(RUTA, { method: "POST", body: datos, keepalive: true }).catch(() => {})
}

export function Medidor({ activo }: { activo: boolean }) {
  const ruta = usePathname()
  const anterior = useRef<string | null>(null)
  const vistaActual = useRef<string | null>(null)

  // Una vista por página: al cambiar de ruta se cierra la anterior (su tiempo) y se abre otra.
  useEffect(() => {
    if (!activo || !ruta) return
    const id = nuevoId()
    vistaActual.current = id
    const v = visitante()
    const { s, nueva } = sesion()
    const params = new URLSearchParams(location.search)
    const ref = anterior.current ?? (document.referrer || null)
    anterior.current = location.href

    fetch(RUTA, {
      method: "POST",
      keepalive: true,
      body: JSON.stringify({
        t: "v",
        id,
        u: v.id,
        nv: v.nuevo,
        ss: s.id,
        n: nueva,
        cs: s.cs,
        r: ruta,
        ref,
        us: params.get("utm_source"),
        um: params.get("utm_medium"),
        uc: params.get("utm_campaign"),
      }),
    })
      .then((r) => (r.status === 200 ? r.json() : null))
      .then((d: { cs?: string } | null) => {
        if (!d?.cs) return
        const actual = leer<Sesion>(SESION)
        if (actual?.id === s.id) guardar(SESION, { ...actual, cs: d.cs })
      })
      .catch(() => {})

    // Tiempo a la vista y en uso, y el scroll más profundo.
    let segundos = 0
    let scroll = 0
    let ultimaActividad = Date.now()
    let enviado = -1
    const medirScroll = () => {
      const alto = document.documentElement.scrollHeight - window.innerHeight
      const p = alto > 0 ? Math.min(100, Math.round((window.scrollY / alto) * 100)) : 100
      if (p > scroll) scroll = p
    }
    const actividad = () => {
      ultimaActividad = Date.now()
    }
    const alScroll = () => {
      actividad()
      medirScroll()
    }
    const mandarTiempo = () => {
      if (segundos === enviado) return
      enviado = segundos
      enviar({ t: "t", id, s: segundos, p: scroll })
    }
    const reloj = window.setInterval(() => {
      if (document.visibilityState !== "visible" || Date.now() - ultimaActividad > INACTIVO_MS) return
      segundos++
      if (LATIDOS.includes(segundos) || (segundos > 900 && segundos % 300 === 0)) {
        tocarSesion()
        mandarTiempo()
      }
    }, 1000)
    const alOcultar = () => {
      if (document.visibilityState === "hidden") mandarTiempo()
      else actividad()
    }

    medirScroll()
    window.addEventListener("scroll", alScroll, { passive: true })
    for (const ev of ["pointerdown", "pointermove", "keydown", "touchstart"]) window.addEventListener(ev, actividad, { passive: true })
    document.addEventListener("visibilitychange", alOcultar)
    window.addEventListener("pagehide", mandarTiempo)

    return () => {
      mandarTiempo()
      window.clearInterval(reloj)
      window.removeEventListener("scroll", alScroll)
      for (const ev of ["pointerdown", "pointermove", "keydown", "touchstart"]) window.removeEventListener(ev, actividad)
      document.removeEventListener("visibilitychange", alOcultar)
      window.removeEventListener("pagehide", mandarTiempo)
    }
  }, [activo, ruta])

  // Los clics que interesan, por delegación: cualquier elemento con data-medir, y en una noticia
  // los enlaces que salen del portal (sus fuentes).
  useEffect(() => {
    if (!activo) return
    const alClic = (e: MouseEvent) => {
      const objetivo = e.target instanceof Element ? e.target : null
      if (!objetivo) return
      const marcado = objetivo.closest<HTMLElement>("[data-medir]")
      const enlace = objetivo.closest<HTMLAnchorElement>("a[href]")
      let tipo = marcado?.dataset.medir ?? null
      if (!tipo && enlace && location.pathname.startsWith("/noticias/")) {
        try {
          if (new URL(enlace.href).host !== location.host) tipo = "fuente"
        } catch {
          /* enlace raro: no se mide */
        }
      }
      if (!tipo) return
      const v = leer<string>(VISITANTE)
      const s = leer<Sesion>(SESION)
      if (!v || !s) return
      enviar({
        t: "c",
        k: tipo,
        u: v,
        ss: s.id,
        id: vistaActual.current,
        r: location.pathname,
        slug: marcado?.dataset.slug ?? null,
        d: enlace?.href ?? null,
      })
    }
    document.addEventListener("click", alClic, { capture: true })
    return () => document.removeEventListener("click", alClic, { capture: true })
  }, [activo])

  return null
}
