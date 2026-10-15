export function LogoMarca({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <path d="M16 25V14" stroke="var(--bg-base)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M16 16.5c0-4.2 2.9-7 7.5-7.2-.1 4.6-3 7.2-7.5 7.2Z" fill="var(--bg-base)" />
      <path d="M16 19c0-3.6-2.5-6-6.4-6.2.1 3.9 2.6 6.2 6.4 6.2Z" fill="var(--bg-base)" opacity=".75" />
    </svg>
  )
}
