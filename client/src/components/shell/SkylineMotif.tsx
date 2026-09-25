/** Decorative skyline reused by the passport and footer bands. */
export function SkylineMotif({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 300 60" preserveAspectRatio="none" fill="currentColor" aria-hidden="true">
    <rect x="0" y="30" width="18" height="30" /><rect x="22" y="18" width="14" height="42" />
    <rect x="40" y="34" width="20" height="26" /><circle cx="80" cy="14" r="10" />
    <rect x="100" y="10" width="8" height="50" /><rect x="112" y="24" width="16" height="36" />
    <rect x="132" y="16" width="10" height="44" /><rect x="150" y="36" width="22" height="24" />
    <path d="M180 60 Q186 28 195 20 Q198 34 192 60Z" /><path d="M200 60 Q206 30 216 22 Q218 36 210 60Z" />
    <rect x="230" y="20" width="12" height="40" /><rect x="246" y="32" width="18" height="28" />
    <rect x="268" y="14" width="10" height="46" /><rect x="282" y="28" width="16" height="32" />
  </svg>;
}
