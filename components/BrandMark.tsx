export default function BrandMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0f172a" />
      <path
        d="M21.5 10.5a6 6 0 1 0 0 11"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <rect x="20" y="13.5" width="4.5" height="4.5" rx="1.2" fill="#5eead4" />
    </svg>
  );
}
