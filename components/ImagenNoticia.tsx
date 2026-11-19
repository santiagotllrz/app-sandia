export function ImagenNoticia({
  src,
  alt,
  sizes,
  prioridad = false,
  className = "",
}: {
  src: string | null
  alt: string
  sizes?: string
  prioridad?: boolean
  className?: string
}) {
  return (
    <div className={`relative overflow-hidden bg-subtle ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading={prioridad ? "eager" : "lazy"}
          fetchPriority={prioridad ? "high" : "auto"}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
        />
      ) : null}
    </div>
  )
}
