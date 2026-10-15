# Índice Agro: portal de noticias

Next.js 16 (App Router) + Supabase, desplegado en Vercel. Las noticias no se escriben aquí: las envía el motor de Hancel por webhook.

## Puesta en marcha

1. **Base de datos**: ejecuta `supabase/migrations/20261015000000_portal_noticias.sql` en el proyecto de Supabase (SQL Editor, o `supabase db push`). Crea las tablas `temas` (con los 10 nichos de Agro), `noticias`, `noticia_vistas_diarias`, `webhook_eventos`, sus funciones y el bucket público `noticias` para las imágenes.
2. **Variables de entorno** (en Vercel → Settings → Environment Variables; ver `.env.example`):
   - `NEXT_PUBLIC_SITE_URL`: dominio final, sin barra al final.
   - `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`: solo servidor.
   - `HANCEL_WEBHOOK_SECRET`: se copia desde Conexiones en el motor.
   - `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION` (opcional).
3. **Motor**: en Configuración → Conexiones → "Web de noticias", URL `https://<dominio>/api/hancel/webhook`. Pulsa "Enviar prueba": debe responder 200.
4. **Search Console**: envía `/sitemap.xml` y `/news-sitemap.xml`.

## Desarrollo local

```bash
npm install
npm run dev
```

Sin credenciales de Supabase, en desarrollo los datos se guardan en `.data/portal.json`, así que el webhook se puede probar completo:

```bash
# .env.local necesita HANCEL_WEBHOOK_SECRET
npm run webhook:prueba -- ping
npm run webhook:prueba -- scripts/ejemplo-noticia.json
npm run webhook:prueba -- scripts/ejemplo-noticia.json --url https://<dominio>/api/hancel/webhook
```

## Cómo funciona

| Ruta | Qué es |
|---|---|
| `/` y `/pagina/N` | Para ti: lo más reciente |
| `/destacados` | Lo más visto en 7 días; sin vistas, el mismo orden de Para ti |
| `/temas`, `/temas/<nicho>` | Un tema por cada `noticia.nicho` (se crean solos si llega uno nuevo) |
| `/noticias/<slug>` | La noticia, con crédito de foto, citas por bloque y lista de fuentes |
| `/api/hancel/webhook` | Receptor: firma HMAC con 5 min de vigencia, duplicados por `evento.id`, upsert por `noticia.id` ignorando versiones viejas, slug fijo, retiradas → 404 |
| `/api/vistas` | Cuenta una vista por noticia, navegador y día (ignora bots) |
| `/api/clima` | Open-Meteo según la ubicación por IP de Vercel; Bogotá si no hay |

- Las páginas son estáticas con ISR (5 min) y el webhook las regenera al momento con `revalidatePath`.
- La imagen se copia al storage propio después de responder (`after()`); mientras tanto se usa la URL del motor.
- Cada evento queda en `webhook_eventos` (id, tipo, resultado, error) para revisar fallos.
- SEO: metadatos y canonical por página, Open Graph/Twitter, JSON-LD (`NewsArticle`, `BreadcrumbList`, `CollectionPage`, `NewsMediaOrganization`, `WebSite`), `sitemap.xml`, sitemap de Google News (48 h), RSS general y por tema, `robots.txt`, temas vacíos con `noindex`.
- El widget de mercado usa datos de muestra: se llena en `lib/mercado.ts`.
- Colores y tipografías: tokens en `app/globals.css`.
