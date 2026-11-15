import { sitio } from "@/lib/config"

/** Logo oficial (SVG negro sobre transparente). */
export function Logo({ className = "h-7" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.svg" alt={sitio.nombre} width={346} height={166} className={`w-auto ${className}`} />
  )
}
