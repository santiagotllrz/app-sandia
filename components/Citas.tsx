import { dominio, favicon } from "@/lib/formato"
import type { Fuente } from "@/lib/tipos"

/** Chip de cita al final de un bloque: "Portafolio +2". Al pasar el cursor muestra las fuentes del bloque. */
export function ChipCita({ fuentes }: { fuentes: Fuente[] }) {
  if (!fuentes.length) return null
  const [primera, ...resto] = fuentes
  return (
    <span className="group/cita relative ml-1 inline-block align-baseline">
      <a
        href={primera.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Fuentes: ${fuentes.map((f) => f.medio).join(", ")}`}
        className="inline-flex translate-y-[-1px] items-center gap-1 rounded-full bg-soft px-1.5 py-px align-middle text-[11px] font-medium leading-4 text-secondary no-underline transition-colors hover:bg-acento-suave hover:text-acento"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={favicon(dominio(primera.url))} alt="" width={12} height={12} loading="lazy" className="size-3 rounded-full" />
        {primera.medio}
        {resto.length > 0 && <span className="text-tertiary">+{resto.length}</span>}
      </a>
      {fuentes.length > 1 && (
        <span className="absolute bottom-full left-0 z-20 mb-1.5 hidden w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-borde bg-raised p-1.5 shadow-hover [@media(hover:hover)]:group-focus-within/cita:block [@media(hover:hover)]:group-hover/cita:block">
          {fuentes.map((f) => (
            <a
              key={f.id}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left no-underline hover:bg-soft"
            >
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={favicon(dominio(f.url))} alt="" width={12} height={12} loading="lazy" className="size-3 rounded-full" />
                {f.medio}
              </span>
              <span className="text-xs leading-snug text-primary">{f.titulo}</span>
            </a>
          ))}
        </span>
      )}
    </span>
  )
}

/** Bloque de párrafos con su chip de cita al final del último párrafo. */
export function Parrafos({ parrafos, fuentes }: { parrafos: string[]; fuentes: Fuente[] }) {
  return (
    <>
      {parrafos.map((p, i) => (
        <p key={i}>
          {p}
          {i === parrafos.length - 1 && <ChipCita fuentes={fuentes} />}
        </p>
      ))}
    </>
  )
}
