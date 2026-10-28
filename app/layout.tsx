import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Encabezado } from "@/components/Encabezado"
import { JsonLd } from "@/components/JsonLd"
import { PiePagina } from "@/components/PiePagina"
import { almacen } from "@/lib/almacen"
import { indexable, sitio } from "@/lib/config"
import { IMAGEN_OG, jsonLdOrganizacion, jsonLdSitio } from "@/lib/seo"
import type { Tema } from "@/lib/tipos"
import "./globals.css"

// Fuentes guardadas en el proyecto (variables, solo latín): el build no depende de Google Fonts.
const sans = localFont({ src: "./fonts/geist.woff2", variable: "--fuente-sans", display: "swap", weight: "100 900" })
const editorial = localFont({ src: "./fonts/newsreader.woff2", variable: "--fuente-editorial", display: "swap", weight: "200 800" })

export const metadata: Metadata = {
  metadataBase: new URL(sitio.url),
  title: { default: `${sitio.nombre}: noticias del agro colombiano`, template: `%s | ${sitio.nombre}` },
  description: sitio.descripcion,
  applicationName: sitio.nombre,
  category: "news",
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": [{ url: "/rss.xml", title: `${sitio.nombre} (RSS)` }] },
  },
  openGraph: { type: "website", siteName: sitio.nombre, locale: sitio.locale, url: "/", images: [IMAGEN_OG] },
  twitter: { card: "summary_large_image", images: [IMAGEN_OG.url] },
  robots: indexable
    ? {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
      }
    : { index: false, follow: false },
  formatDetection: { telephone: false, address: false, email: false },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
  colorScheme: "light dark",
}

async function cargarTemas(): Promise<Tema[]> {
  try {
    return await (await almacen()).temas()
  } catch (e) {
    console.error("[layout] temas", e)
    return []
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const temas = await cargarTemas()
  return (
    <html lang={sitio.idioma} className={`${sans.variable} ${editorial.variable}`}>
      <body className="min-h-dvh bg-base text-primary" suppressHydrationWarning>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-raised focus:px-3 focus:py-2 focus:text-sm"
        >
          Saltar al contenido
        </a>
        <Encabezado temas={temas} />
        <main id="contenido">{children}</main>
        <PiePagina temas={temas} />
        <JsonLd datos={[jsonLdOrganizacion(), jsonLdSitio()]} />
      </body>
    </html>
  )
}
