"use client"

import { useEffect, useState } from "react"
import { IconoClima, IconoGota } from "./Iconos"

interface Clima {
  ciudad: string
  actual: { temperatura: number; codigo: number; esDia: boolean; humedad: number; precipitacion: number; viento: number }
  dias: { fecha: string; codigo: number; max: number; min: number; lluviaProb: number | null; lluviaMm: number | null }[]
}

// Códigos WMO de Open-Meteo.
function descripcion(c: number) {
  if (c === 0) return "Despejado"
  if (c === 1) return "Mayormente despejado"
  if (c === 2) return "Parcialmente nublado"
  if (c === 3) return "Nublado"
  if (c === 45 || c === 48) return "Niebla"
  if (c >= 51 && c <= 57) return "Llovizna"
  if (c >= 61 && c <= 67) return c >= 65 ? "Lluvia fuerte" : "Lluvia"
  if (c >= 71 && c <= 77) return "Nieve"
  if (c >= 80 && c <= 82) return "Chubascos"
  if (c === 85 || c === 86) return "Chubascos de nieve"
  if (c >= 95) return "Tormenta"
  return "—"
}

const diaSemana = new Intl.DateTimeFormat("es-CO", { weekday: "short", timeZone: "UTC" })

const CLAVE_UNIDAD = "clima-unidad"

export function WidgetClima() {
  const [clima, setClima] = useState<Clima | null>(null)
  const [error, setError] = useState(false)
  const [unidad, setUnidad] = useState<"C" | "F">("C")

  useEffect(() => {
    // La columna lateral solo se muestra en escritorio: en móvil no se pide el clima.
    if (!matchMedia("(min-width: 860px)").matches) return
    try {
      if (localStorage.getItem(CLAVE_UNIDAD) === "F") setUnidad("F")
    } catch {}
    fetch("/api/clima")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setClima)
      .catch(() => setError(true))
  }, [])

  function cambiar(u: "C" | "F") {
    setUnidad(u)
    try {
      localStorage.setItem(CLAVE_UNIDAD, u)
    } catch {}
  }

  const t = (c: number) => Math.round(unidad === "C" ? c : (c * 9) / 5 + 32)

  if (error) return null

  return (
    <section aria-label="Clima" className="rounded-xl border border-borde bg-raised p-4">
      {!clima ? (
        <div className="animate-pulse space-y-3" aria-hidden="true">
          <div className="h-10 w-32 rounded bg-soft" />
          <div className="h-3 w-40 rounded bg-soft" />
          <div className="h-14 rounded bg-soft" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <IconoClima codigo={clima.actual.codigo} esDia={clima.actual.esDia} className="size-9 text-primary" />
              <div className="flex items-start">
                <span className="text-[2rem] font-medium leading-none tabular-nums">{t(clima.actual.temperatura)}°</span>
                <div className="ml-1.5 mt-0.5 flex text-xs font-medium text-tertiary" role="group" aria-label="Unidad">
                  <button
                    type="button"
                    onClick={() => cambiar("F")}
                    aria-pressed={unidad === "F"}
                    className={`cursor-pointer ${unidad === "F" ? "text-primary" : "hover:text-secondary"}`}
                  >
                    F
                  </button>
                  <span className="px-0.5">/</span>
                  <button
                    type="button"
                    onClick={() => cambiar("C")}
                    aria-pressed={unidad === "C"}
                    className={`cursor-pointer ${unidad === "C" ? "text-primary" : "hover:text-secondary"}`}
                  >
                    C
                  </button>
                </div>
              </div>
            </div>
            <div className="min-w-0 text-right">
              <div className="truncate text-sm font-medium">{descripcion(clima.actual.codigo)}</div>
              <div className="truncate text-xs text-secondary">{clima.ciudad}</div>
              <div className="text-xs text-secondary tabular-nums">
                Máx: {t(clima.dias[0].max)}° Mín: {t(clima.dias[0].min)}°
              </div>
            </div>
          </div>

          <ul className="mt-4 grid grid-cols-5 gap-1 text-center">
            {clima.dias.map((d) => (
              <li key={d.fecha} className="flex flex-col items-center gap-1">
                <span className="text-xs capitalize text-secondary">{diaSemana.format(new Date(d.fecha)).replace(".", "")}</span>
                <IconoClima codigo={d.codigo} className="size-5 text-secondary" />
                <span className="text-xs font-medium tabular-nums">{t(d.max)}°</span>
                <span className="text-[11px] text-tertiary tabular-nums">{t(d.min)}°</span>
                {d.lluviaProb != null && (
                  <span className="flex items-center gap-0.5 text-[11px] text-secondary tabular-nums" title="Probabilidad de lluvia">
                    <IconoGota className="size-2.5" />
                    {d.lluviaProb}%
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-3 flex justify-between border-t border-borde pt-3 text-[11px] text-secondary">
            <span>Humedad {clima.actual.humedad}%</span>
            <span>Viento {Math.round(clima.actual.viento)} km/h</span>
            <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer nofollow" className="hover:text-primary">
              Open-Meteo
            </a>
          </div>
        </>
      )}
    </section>
  )
}
