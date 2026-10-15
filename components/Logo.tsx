import { sitio } from "@/lib/config"

/** Logo oficial (SVG negro sobre transparente); en modo oscuro se invierte a blanco. */
export function Logo({ className = "h-7" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.svg" alt={sitio.nombre} width={724} height={236} className={`w-auto dark:invert ${className}`} />
  )
}
