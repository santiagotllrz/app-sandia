import Link from "next/link"
import { sitio } from "@/lib/config"
import type { Tema } from "@/lib/tipos"
import { BotonCompartir } from "./BotonCompartir"
import { LogoMarca } from "./Logo"
import { Pestanas } from "./Pestanas"

export function Encabezado({ temas }: { temas: Tema[] }) {
  return (
    <header className="sticky top-0 z-20 border-b border-borde bg-base/90 backdrop-blur-md supports-[backdrop-filter]:bg-base/80">
      <div className="mx-auto grid h-14 max-w-[1240px] grid-cols-[1fr_auto] items-center gap-x-4 px-4 md:grid-cols-[1fr_auto_1fr] md:px-8">
        <Link href="/" className="flex items-center gap-2 text-primary" aria-label={`${sitio.nombre}, inicio`}>
          <LogoMarca className="size-7 text-primary" />
          <span className="text-[15px] font-semibold tracking-tight">{sitio.nombre}</span>
        </Link>
        <div className="hidden h-full md:block">
          <Pestanas temas={temas} />
        </div>
        <div className="flex items-center justify-end gap-2">
          <BotonCompartir />
        </div>
      </div>
      <div className="h-11 border-t border-borde px-4 md:hidden">
        <Pestanas temas={temas} />
      </div>
    </header>
  )
}
