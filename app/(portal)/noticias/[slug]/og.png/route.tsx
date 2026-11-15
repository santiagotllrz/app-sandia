import { readFile } from "node:fs/promises"
import path from "node:path"
import { ImageResponse } from "next/og"
import { almacen } from "@/lib/almacen"
import { sitio } from "@/lib/config"

export const revalidate = 3600

const size = { width: 1200, height: 630 }

type Props = { params: Promise<{ slug: string }> }

export async function GET(_req: Request, { params }: Props) {
  const { slug } = await params
  const db = await almacen()
  const [noticia, temas, logo] = await Promise.all([
    db.porSlug(slug),
    db.temas(),
    readFile(path.join(process.cwd(), "public", "logo.svg")),
  ])
  const src = `data:image/svg+xml;base64,${logo.toString("base64")}`
  const titular = noticia?.titular ?? sitio.nombre
  const tema = noticia?.tema_slug ? temas.find((t) => t.slug === noticia.tema_slug)?.nombre : null
  const fuentes = noticia?.fuentes_total ?? 0

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 76px",
          background: "#fafafa",
          color: "#171717",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} width={310} height={101} alt="" />
          {tema ? (
            <div
              style={{
                display: "flex",
                padding: "10px 22px",
                borderRadius: 999,
                background: "#ededed",
                fontSize: 24,
                fontWeight: 600,
                color: "#383838",
              }}
            >
              {tema}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: titular.length > 110 ? 44 : 52,
            fontWeight: 700,
            lineHeight: 1.18,
            color: "#141414",
            maxWidth: 1048,
          }}
        >
          {titular}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid #e5e5e5",
            paddingTop: 24,
            fontSize: 24,
            color: "#666666",
          }}
        >
          <span>{sitio.nombre} · Noticias del agro colombiano</span>
          {fuentes > 0 ? <span>{fuentes === 1 ? "1 fuente citada" : `${fuentes} fuentes citadas`}</span> : null}
        </div>
      </div>
    ),
    size,
  )
}
