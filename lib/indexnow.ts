import "server-only"
import { indexable, sitio } from "./config"

// IndexNow (https://www.indexnow.org): avisa al instante a Bing, Yandex, Seznam y otros buscadores
// que una URL se creó, cambió o se retiró. Google no lo usa; para Google está el sitemap de noticias.
// La clave es pública por diseño: el buscador la verifica leyendo public/<clave>.txt en el dominio.
export const CLAVE_INDEXNOW = "9ceba40daabc767cbdb4299a27ec5408"

/** Envía las URLs (absolutas, del dominio del sitio). Solo en producción; nunca lanza error. */
export async function avisarIndexNow(urls: string[]) {
  if (!indexable || process.env.VERCEL_ENV !== "production" || !urls.length) return
  const host = new URL(sitio.url).host
  try {
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: CLAVE_INDEXNOW,
        keyLocation: `${sitio.url}/${CLAVE_INDEXNOW}.txt`,
        urlList: [...new Set(urls)].slice(0, 10_000),
      }),
      signal: AbortSignal.timeout(10_000),
    })
    // 200 y 202 son éxito; 422/403 suelen ser clave o host mal configurados.
    if (!r.ok) console.error("[indexnow]", r.status, await r.text().catch(() => ""))
  } catch (e) {
    console.error("[indexnow]", e)
  }
}
