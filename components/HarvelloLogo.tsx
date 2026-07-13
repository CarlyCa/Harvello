type HarvelloLogoProps = {
  className?: string;
  markOnly?: boolean;
};

export function HarvelloLogo({ className = "", markOnly = false }: HarvelloLogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`} aria-label="Harvello">
      <svg
        width="38"
        height="38"
        viewBox="0 0 64 64"
        role="img"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="harvello-left" x1="8" x2="56" y1="56" y2="8" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#00513e" />
            <stop offset="1" stopColor="#2fa451" />
          </linearGradient>
          <linearGradient id="harvello-right" x1="16" x2="58" y1="54" y2="8" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0b7047" />
            <stop offset="1" stopColor="#79d06b" />
          </linearGradient>
        </defs>
        <path d="M12 10h9c9 0 16 7 16 16v28h-9c-9 0-16-7-16-16V10Z" fill="url(#harvello-left)" />
        <path d="M43 10h9v44h-9c-9 0-16-7-16-16V26c0-9 7-16 16-16Z" fill="url(#harvello-right)" />
        <path
          d="M17 45c5-15 18-25 33-19 4 2 8 5 12 10"
          fill="none"
          stroke="#fff"
          strokeLinecap="round"
          strokeWidth="5"
        />
        <path d="M16 45c9-17 22-23 34-19-7 11-17 18-34 19Z" fill="url(#harvello-left)" opacity=".88" />
        <path
          d="M17 45c5-15 18-25 33-19 4 2 8 5 12 10"
          fill="none"
          stroke="#fff"
          strokeLinecap="round"
          strokeWidth="5"
        />
      </svg>
      {markOnly ? null : (
        <span className="text-2xl font-bold tracking-normal text-[#004634]">
          Harvello
        </span>
      )}
    </span>
  );
}
