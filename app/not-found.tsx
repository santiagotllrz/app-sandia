import Link from "next/link"

export default function NoEncontrado() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-sm font-medium text-tertiary">404</p>
      <h1 className="font-editorial text-3xl">No encontramos esta página</h1>
      <p className="text-secondary">Puede que la noticia se haya retirado o que el enlace esté mal escrito.</p>
      <Link href="/" className="mt-2 inline-flex h-9 items-center rounded-lg border border-borde-fuerte px-4 text-sm font-medium hover:bg-subtle">
        Volver al inicio
      </Link>
    </div>
  )
}
