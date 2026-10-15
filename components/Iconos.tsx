import type { SVGProps } from "react"

type P = SVGProps<SVGSVGElement>

function Base({ children, className = "size-4", ...p }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...p}
    >
      {children}
    </svg>
  )
}

export const IconoReloj = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Base>
)

export const IconoCompartir = (p: P) => (
  <Base {...p}>
    <path d="M12 15V3.5M7.5 8 12 3.5 16.5 8" />
    <path d="M5 12.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5.5" />
  </Base>
)

export const IconoFlechaAbajo = (p: P) => (
  <Base {...p}>
    <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />
  </Base>
)

export const IconoFlechaDerecha = (p: P) => (
  <Base {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
)

export const IconoFlechaIzquierda = (p: P) => (
  <Base {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Base>
)

export const IconoEnlace = (p: P) => (
  <Base {...p}>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </Base>
)

export const IconoCheck = (p: P) => (
  <Base {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Base>
)

export const IconoLibro = (p: P) => (
  <Base {...p}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5Z" />
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5Z" />
  </Base>
)

export const IconoGota = (p: P) => (
  <Base {...p}>
    <path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5Z" />
  </Base>
)

export const IconoRss = (p: P) => (
  <Base {...p}>
    <path d="M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14" />
    <circle cx="6" cy="18" r="1" fill="currentColor" />
  </Base>
)

// ── Clima ──
const sol = (
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </>
)
const nube = <path d="M7 18.5h10a4 4 0 0 0 .6-8 5.5 5.5 0 0 0-10.6 1.2A3.4 3.4 0 0 0 7 18.5Z" />

export function IconoClima({ codigo, esDia = true, className = "size-6" }: { codigo: number; esDia?: boolean; className?: string }) {
  const p = { className }
  if (codigo === 0 || codigo === 1)
    return esDia ? (
      <Base {...p}>{sol}</Base>
    ) : (
      <Base {...p}>
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
      </Base>
    )
  if (codigo === 2)
    return (
      <Base {...p}>
        <path d="M8 4.5v1.2M3.8 8.6H5M5 5.6l.8.8M11 5.6l-.8.8" />
        <path d="M5.6 11.2a3 3 0 0 1 4.8-3.3" />
        <path d="M8.5 20h9a3.5 3.5 0 0 0 .5-7 4.8 4.8 0 0 0-9.2 1A3 3 0 0 0 8.5 20Z" />
      </Base>
    )
  if (codigo === 3) return <Base {...p}>{nube}</Base>
  if (codigo === 45 || codigo === 48)
    return (
      <Base {...p}>
        <path d="M4 9h16M3 13h18M5 17h14" />
      </Base>
    )
  if (codigo >= 95)
    return (
      <Base {...p}>
        <path d="M7 15.5h10a4 4 0 0 0 .6-8 5.5 5.5 0 0 0-10.6 1.2A3.4 3.4 0 0 0 7 15.5Z" />
        <path d="m12.5 15-2 3.5h3l-2 3.5" />
      </Base>
    )
  if ((codigo >= 71 && codigo <= 77) || codigo === 85 || codigo === 86)
    return (
      <Base {...p}>
        <path d="M7 15.5h10a4 4 0 0 0 .6-8 5.5 5.5 0 0 0-10.6 1.2A3.4 3.4 0 0 0 7 15.5Z" />
        <path d="M8 19h.01M12 20.5h.01M16 19h.01" strokeWidth={2.5} />
      </Base>
    )
  if (codigo >= 51)
    return (
      <Base {...p}>
        <path d="M7 15.5h10a4 4 0 0 0 .6-8 5.5 5.5 0 0 0-10.6 1.2A3.4 3.4 0 0 0 7 15.5Z" />
        <path d="m8.5 18-1 2.5M12.5 18l-1 2.5M16.5 18l-1 2.5" />
      </Base>
    )
  return <Base {...p}>{nube}</Base>
}
