import { sitio } from "@/lib/config"

export const runtime = "nodejs"

// Clima real de Open-Meteo (sin clave). La ubicación sale de la geolocalización por IP de Vercel;
// sin ella se usa la ciudad por defecto.
export async function GET(req: Request) {
  const h = req.headers
  const lat = Number(h.get("x-vercel-ip-latitude"))
  const lon = Number(h.get("x-vercel-ip-longitude"))
  const conIp = Number.isFinite(lat) && Number.isFinite(lon) && (lat !== 0 || lon !== 0) && h.has("x-vercel-ip-latitude")
  const ciudadIp = h.get("x-vercel-ip-city")
  const punto = conIp
    ? { ciudad: ciudadIp ? decodeURIComponent(ciudadIp) : "Tu ubicación", lat, lon }
    : sitio.climaPorDefecto

  const url = new URL("https://api.open-meteo.com/v1/forecast")
  url.search = new URLSearchParams({
    latitude: punto.lat.toFixed(2),
    longitude: punto.lon.toFixed(2),
    current: "temperature_2m,weather_code,is_day,relative_humidity_2m,precipitation,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum",
    timezone: "auto",
    forecast_days: "5",
  }).toString()

  try {
    const r = await fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(6000) })
    if (!r.ok) throw new Error(`open-meteo ${r.status}`)
    const d = await r.json()
    return Response.json(
      {
        ciudad: punto.ciudad,
        actual: {
          temperatura: d.current.temperature_2m,
          codigo: d.current.weather_code,
          esDia: d.current.is_day === 1,
          humedad: d.current.relative_humidity_2m,
          precipitacion: d.current.precipitation,
          viento: d.current.wind_speed_10m,
        },
        dias: (d.daily.time as string[]).map((fecha, i) => ({
          fecha,
          codigo: d.daily.weather_code[i],
          max: d.daily.temperature_2m_max[i],
          min: d.daily.temperature_2m_min[i],
          lluviaProb: d.daily.precipitation_probability_max[i],
          lluviaMm: d.daily.precipitation_sum[i],
        })),
      },
      { headers: { "Cache-Control": "private, max-age=900" } },
    )
  } catch (e) {
    console.error("[clima]", e)
    return Response.json({ error: "clima no disponible" }, { status: 502 })
  }
}
