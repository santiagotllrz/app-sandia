import Image from "next/image"
import { LogoMarca } from "./Logo"

export function ImagenNoticia({
  src,
  alt,
  sizes,
  prioridad = false,
  className = "",
}: {
  src: string | null
  alt: string
  sizes: string
  prioridad?: boolean
  className?: string
}) {
  return (
    <div className={`relative overflow-hidden bg-subtle ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={prioridad}
          className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-tertiary">
          <LogoMarca className="size-10 opacity-40" />
        </div>
      )}
    </div>
  )
}
