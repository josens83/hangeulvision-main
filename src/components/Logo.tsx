export function Logo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        className="drop-shadow"
        aria-hidden
      >
        <defs>
          <linearGradient id="hv" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#2fc3b0" />
            <stop offset="100%" stopColor="#0c8a7b" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#hv)" />
        <text
          x="32"
          y="42"
          textAnchor="middle"
          fontFamily="'Noto Serif KR', serif"
          fontSize="32"
          fontWeight="700"
          fill="white"
        >
          ㅎ
        </text>
      </svg>
      <span className="font-semibold text-[15px] leading-tight">
        HangeulVision <span className="text-brand-600">AI</span>
      </span>
    </div>
  );
}
