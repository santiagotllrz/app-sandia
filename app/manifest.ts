import type { MetadataRoute } from "next"
import { sitio } from "@/lib/config"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: sitio.nombre,
    short_name: sitio.nombreCorto,
    description: sitio.descripcion,
    lang: sitio.idioma,
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#fafafa",
    icons: [
      { src: "/icon.png", type: "image/png", sizes: "180x180" },
    ],
  }
}
