import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { JsonLd } from "@/components/JsonLd"
import { Medidor } from "@/components/Medidor"
import { indexable, sitio } from "@/lib/config"
import { IMAGEN_OG, jsonLdOrganizacion, jsonLdSitio } from "@/lib/seo"
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

// Lo común a todo el sitio. El encabezado y el pie viven en app/(portal)/layout.tsx;
// la página de enlaces (app/enlaces) queda fuera de ese grupo y no los lleva.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={sitio.idioma} className={`${sans.variable} ${editorial.variable}`}>
      <body className="min-h-dvh bg-base text-primary" suppressHydrationWarning>
        {children}
        {/* Mide solo en producción: ni las vistas previas de Vercel ni el desarrollo local ensucian las cifras. */}
        <Medidor activo={process.env.VERCEL_ENV === "production"} />
        <JsonLd datos={[jsonLdOrganizacion(), jsonLdSitio()]} />
      </body>
    </html>
  )
}
