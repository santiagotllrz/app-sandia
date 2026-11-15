import type { Metadata } from "next"
import Link from "next/link"
import { JsonLd } from "@/components/JsonLd"
import { rutas, sitio, urlAbsoluta } from "@/lib/config"
import { jsonLdMigas, metadatosListado } from "@/lib/seo"

const titulo = `Sobre ${sitio.nombre} y metodología editorial`
const descripcion = `Cómo ${sitio.nombre} cubre el agro colombiano: selección de fuentes primarias, atribución transparente, política de correcciones y contacto editorial.`

export const metadata: Metadata = metadatosListado({
  titulo,
  descripcion,
  ruta: rutas.nosotros(),
})

export default function PaginaNosotros() {
  return (
    <div className="mx-auto my-6 w-full max-w-[760px] px-4 md:my-10 md:px-8">
      <nav aria-label="Ruta de navegación" className="mb-4 text-xs font-medium text-secondary">
        <Link href="/" className="hover:text-primary">
          Inicio
        </Link>
      </nav>

      <article className="cuerpo-noticia">
        <h1 className="font-editorial text-[2rem] leading-[1.15] md:text-[2.5rem]">{titulo}</h1>
        <p className="mt-4 text-lg leading-relaxed text-secondary">
          {sitio.nombre} es un medio digital dedicado al seguimiento diario de la actualidad agropecuaria de Colombia: cultivos,
          ganadería, clima y recursos hídricos, sanidad vegetal y animal, precios, política agraria, innovación y vida rural.
        </p>

        <section id="metodologia" className="scroll-mt-20">
          <h2>Metodología editorial y transparencia de fuentes</h2>
          <p>
            Nuestra cobertura parte de un principio verificable: el lector siempre debe poder consultar de dónde proviene cada
            cifra, declaración o anuncio. Por eso cada nota publicada en {sitio.nombre} muestra desde el encabezado y al pie de
            cada párrafo los enlaces directos a las fuentes utilizadas.
          </p>
          <p>
            Para elaborar cada noticia monitoreamos y contrastamos tres tipos de fuentes:
          </p>
          <ul className="my-4 list-disc space-y-2 pl-6 text-primary">
            <li>
              <strong>Fuentes primarias y entidades oficiales:</strong> boletines técnicos, resoluciones y reportes de entidades
              como el Ministerio de Agricultura y Desarrollo Rural, Ideam, DANE, ICA, UPRA, Finagro y Banco de la República.
            </li>
            <li>
              <strong>Gremios y partes interesadas del sector:</strong> informes económicos y pronunciamientos de federaciones y
              asociaciones productoras del campo colombiano.
            </li>
            <li>
              <strong>Medios nacionales y regionales:</strong> coberturas periodísticas de medios de comunicación reconocidos,
              cuyos artículos originales se enlazan y acreditan explícitamente como origen o contraste de la información.
            </li>
          </ul>
          <p>
            Cuando distintos reportes presentan cifras o plazos que aún no han sido confirmados oficialmente, nuestras notas lo
            señalan de forma explícita para separar los hechos verificados de lo que continúa en desarrollo.
          </p>
        </section>

        <section id="correcciones" className="scroll-mt-20">
          <h2>Política de atribución, imágenes y correcciones</h2>
          <p>
            Todas las fuentes consultadas se listan al inicio y al final de cada artículo indicando el medio o entidad autora, la
            fecha de publicación original y el enlace directo. Los derechos de las fotografías pertenecen a los medios o autores
            acreditados en el pie de foto correspondiente, donde se enlaza a la publicación de origen.
          </p>
          <p>
            Cuando una noticia recibe datos nuevos relevantes o requiere una precisión factual, el artículo se actualiza
            conservando su dirección URL permanente y mostrando públicamente la fecha y hora de última actualización junto al
            encabezado. Si detecta un error, una atribución incompleta o desea solicitar una rectificación, puede escribirnos y
            revisaremos el caso de forma prioritaria.
          </p>
        </section>

        <section id="contacto" className="scroll-mt-20">
          <h2>Contacto editorial y redes oficiales</h2>
          <p>
            Para enviar comunicados de prensa del sector agropecuario, reportar correcciones o comunicarse con el equipo
            editorial de {sitio.nombre}, escríbanos a{" "}
            <a href={`mailto:${sitio.contacto}`} className="underline underline-offset-2 hover:text-acento">
              {sitio.contacto}
            </a>
            .
          </p>
          <p>
            También puede seguir nuestras publicaciones en{" "}
            <a href={sitio.redes.instagram} target="_blank" rel="noopener noreferrer me" className="underline underline-offset-2 hover:text-acento">
              Instagram
            </a>
            ,{" "}
            <a href={sitio.redes.facebook} target="_blank" rel="noopener noreferrer me" className="underline underline-offset-2 hover:text-acento">
              Facebook
            </a>{" "}
            y{" "}
            <a href={sitio.redes.linkedin} target="_blank" rel="noopener noreferrer me" className="underline underline-offset-2 hover:text-acento">
              LinkedIn
            </a>
            , o suscribirse a nuestro canal{" "}
            <a href="/rss.xml" className="underline underline-offset-2 hover:text-acento">
              RSS
            </a>
            .
          </p>
        </section>
      </article>

      <JsonLd
        datos={[
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: titulo,
            description: descripcion,
            url: urlAbsoluta(rutas.nosotros()),
            inLanguage: sitio.idioma,
            mainEntity: { "@id": urlAbsoluta("/#organizacion") },
          },
          jsonLdMigas([
            { nombre: "Inicio", ruta: "/" },
            { nombre: "Sobre nosotros", ruta: rutas.nosotros() },
          ]),
        ]}
      />
    </div>
  )
}
