// Marca dibujada para next/og (Satori): solo estilos en línea y flexbox.
export function MarcaOg({ tam }: { tam: number }) {
  return (
    <div
      style={{
        width: tam,
        height: tam,
        borderRadius: tam * 0.28,
        background: "#171717",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={tam * 0.75} height={tam * 0.75} viewBox="0 0 32 32">
        <path d="M16 25V14" stroke="#fafafa" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M16 16.5c0-4.2 2.9-7 7.5-7.2-.1 4.6-3 7.2-7.5 7.2Z" fill="#fafafa" />
        <path d="M16 19c0-3.6-2.5-6-6.4-6.2.1 3.9 2.6 6.2 6.4 6.2Z" fill="#fafafa" opacity=".75" />
      </svg>
    </div>
  )
}
