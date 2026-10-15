import Link from "next/link"
import { rutas, sitio } from "@/lib/config"
import type { Tema } from "@/lib/tipos"
import { IconoRss } from "./Iconos"
import { Logo } from "./Logo"

export function PiePagina({ temas }: { temas: Tema[] }) {
  return (
    <footer className="mt-8 border-t border-borde">
      <div className="mx-auto grid max-w-[1240px] gap-8 px-4 py-10 md:grid-cols-[1fr_2fr] md:px-8">
        <div className="flex flex-col gap-3">
          <Link href="/" className="w-fit" aria-label={`${sitio.nombre}, inicio`}>
            <Logo className="h-8" />
          </Link>
          <p className="max-w-xs text-sm text-secondary">{sitio.descripcion}</p>
          <a href="/rss.xml" className="inline-flex w-fit items-center gap-1.5 text-sm text-secondary hover:text-primary">
            <IconoRss className="size-4" /> RSS
          </a>
        </div>
        <nav aria-label="Temas">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-tertiary">Temas</h2>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {temas.map((t) => (
              <li key={t.slug}>
                <Link href={rutas.tema(t.slug)} className="text-sm text-secondary hover:text-primary">
                  {t.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-borde">
        <p className="mx-auto max-w-[1240px] px-4 py-4 text-xs text-tertiary md:px-8">
          © {new Date().getFullYear()} {sitio.nombre}. Cada noticia enlaza a sus fuentes originales.
        </p>
      </div>
    </footer>
  )
}
