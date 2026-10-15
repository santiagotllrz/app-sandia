import { ImageResponse } from "next/og"
import { MarcaOg } from "@/components/MarcaOg"
import { sitio } from "@/lib/config"

export const dynamic = "force-static"

const size = { width: 1200, height: 630 }

// Imagen para compartir del sitio y los listados (cada noticia usa su propia foto).
export function GET() {
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
          color: "#171717",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <MarcaOg tam={96} />
          <div style={{ fontSize: 56, fontWeight: 700 }}>{sitio.nombre}</div>
        </div>
        <div style={{ fontSize: 44, lineHeight: 1.25, maxWidth: 980, color: "rgba(23,23,23,.64)" }}>{sitio.descripcion}</div>
      </div>
    ),
    size,
  )
}
