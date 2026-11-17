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
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/favicon.ico", type: "image/x-icon", sizes: "48x48 96x96 256x256" },
      { src: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
  }
}
