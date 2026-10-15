import Image from "next/image"

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
      ) : null}
    </div>
  )
}
