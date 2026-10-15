const ENTIDADES: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }

export function escaparXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ENTIDADES[c])
}
