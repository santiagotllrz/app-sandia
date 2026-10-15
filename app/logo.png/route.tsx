import { ImageResponse } from "next/og"
import { MarcaOg } from "@/components/MarcaOg"

export const dynamic = "force-static"

// Logo raster 512x512 para el JSON-LD de la organización.
export function GET() {
  return new ImageResponse(<MarcaOg tam={512} />, { width: 512, height: 512 })
}
