// Simula al motor de Hancel: firma un evento y lo envía al webhook del portal.
//
//   node scripts/enviar-prueba.mjs ping
//   node scripts/enviar-prueba.mjs scripts/ejemplo-noticia.json
//   node scripts/enviar-prueba.mjs scripts/ejemplo-noticia.json --url https://tuweb.com/api/hancel/webhook
//
// El secreto se toma de HANCEL_WEBHOOK_SECRET (o de .env.local).

import crypto from "node:crypto"
import { existsSync, readFileSync } from "node:fs"

const args = process.argv.slice(2)
const iUrl = args.indexOf("--url")
const url = iUrl >= 0 ? args[iUrl + 1] : "http://localhost:3000/api/hancel/webhook"
const entrada = args.find((a, i) => !a.startsWith("--") && (iUrl < 0 || i !== iUrl + 1)) ?? "ping"

let secreto = process.env.HANCEL_WEBHOOK_SECRET
if (!secreto && existsSync(".env.local")) {
  secreto = readFileSync(".env.local", "utf8").match(/^HANCEL_WEBHOOK_SECRET=(.*)$/m)?.[1]?.trim()
}
if (!secreto) {
  console.error("Falta HANCEL_WEBHOOK_SECRET")
  process.exit(1)
}

const evento =
  entrada === "ping"
    ? { evento: { id: `evt_${crypto.randomBytes(8).toString("hex")}`, tipo: "ping", creado_at: new Date().toISOString(), version_esquema: "1" } }
    : JSON.parse(readFileSync(entrada, "utf8"))

const cuerpo = JSON.stringify(evento)
const t = Math.floor(Date.now() / 1000)
const v1 = crypto.createHmac("sha256", secreto).update(`${t}.${cuerpo}`).digest("hex")

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "User-Agent": "Hancel-Webhooks/1.0",
    "X-Hancel-Event": evento.evento.tipo,
    "X-Hancel-Delivery": evento.evento.id,
    "X-Hancel-Attempt": "1",
    "X-Hancel-Signature": `t=${t},v1=${v1}`,
  },
  body: cuerpo,
})
console.log(res.status, await res.text())
