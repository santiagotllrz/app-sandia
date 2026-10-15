import { favicon, plural } from "@/lib/formato"

/** Favicons superpuestos + "N fuentes", como en las tarjetas de Discover. */
export function PilaFuentes({ dominios, total }: { dominios: string[]; total: number }) {
  if (!total) return null
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <div className="ml-[5px] flex shrink-0">
        {dominios.slice(0, 3).map((d) => (
          <span key={d} className="relative -ml-[5px] inline-flex size-[14px] overflow-hidden rounded-full bg-raised ring-1 ring-base">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={favicon(d)} alt="" width={14} height={14} loading="lazy" decoding="async" className="size-full" />
          </span>
        ))}
      </div>
      <span className="truncate text-xs font-medium text-secondary">{plural(total, "fuente", "fuentes")}</span>
    </div>
  )
}
