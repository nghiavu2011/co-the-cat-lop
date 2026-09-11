export default function BrandLogo({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 80"
      width={size}
      height={size}
      fill="none"
      className={className}
      style={{ flexShrink: 0, display: 'block' }}
      aria-label="N&Mstudio Human Anatomy Logo"
    >
      <defs>
        <linearGradient id="nmBgGrad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10141C" />
          <stop offset="100%" stopColor="#1A222E" />
        </linearGradient>
        <linearGradient id="nmGoldGrad" x1="16" y1="16" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F6E6C4" />
          <stop offset="45%" stopColor="#D8AE4E" />
          <stop offset="100%" stopColor="#9E7322" />
        </linearGradient>
        <linearGradient id="nmPulseGrad" x1="20" y1="60" x2="60" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E26D5C" />
          <stop offset="100%" stopColor="#F5A89C" />
        </linearGradient>
        <filter id="nmSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#D8AE4E" floodOpacity="0.32" />
        </filter>
      </defs>

      {/* Khung viền Badge cao cấp bo góc */}
      <rect x="2.5" y="2.5" width="75" height="75" rx="18" fill="url(#nmBgGrad)" stroke="url(#nmGoldGrad)" strokeWidth="1.6" />
      
      {/* Vòng tròn tọa độ sinh học */}
      <circle cx="40" cy="40" r="28" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />
      <circle cx="40" cy="40" r="18" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />

      {/* Monogram N & M cách điệu dải ruy-băng giải phẫu */}
      <g filter="url(#nmSoftGlow)">
        {/* Chữ N */}
        <path d="M22 56V24L38 48V24" stroke="url(#nmGoldGrad)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Chữ M */}
        <path d="M42 56V32L50 44L58 32V56" stroke="url(#nmGoldGrad)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Điểm xung động nhịp tim sinh học */}
        <circle cx="38" cy="24" r="3.2" fill="url(#nmPulseGrad)" />
        <circle cx="58" cy="24" r="3.2" fill="url(#nmGoldGrad)" />
      </g>
    </svg>
  );
}
