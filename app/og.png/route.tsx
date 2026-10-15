import { readFile } from "node:fs/promises"
import path from "node:path"
import { ImageResponse } from "next/og"
import { sitio } from "@/lib/config"

export const dynamic = "force-static"

const size = { width: 1200, height: 630 }

// Imagen para compartir del sitio y los listados (cada noticia usa su propia foto).
export async function GET() {
  const logo = await readFile(path.join(process.cwd(), "public", "logo.png"))
  const src = `data:image/png;base64,${logo.toString("base64")}`
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#fafafa",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={434} height={141} alt="" />
        <div style={{ fontSize: 44, lineHeight: 1.25, maxWidth: 980, color: "rgba(23,23,23,.64)" }}>{sitio.descripcion}</div>
      </div>
    ),
    size,
  )
}
