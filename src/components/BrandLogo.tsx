export default function BrandLogo({ size = 52, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      className={className}
      style={{ flexShrink: 0, display: 'block' }}
      role="img"
      aria-label="N&Mstudio Human Anatomy Logo"
    >
      <defs>
        {/* Nền badge chiều sâu không gian y khoa */}
        <linearGradient id="nmBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0c121e" />
          <stop offset="50%" stopColor="#141c2b" />
          <stop offset="100%" stopColor="#0a0f18" />
        </linearGradient>

        {/* Viền vàng đồng giải phẫu học cổ điển (Brass/Gold) */}
        <linearGradient id="nmBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f7e7c4" />
          <stop offset="35%" stopColor="#dfb76c" />
          <stop offset="70%" stopColor="#b88628" />
          <stop offset="100%" stopColor="#e8c87e" />
        </linearGradient>

        {/* Gradient dải monogram N&M */}
        <linearGradient id="nmGoldStroke" x1="20%" y1="20%" x2="80%" y2="80%">
          <stop offset="0%" stopColor="#fff2d6" />
          <stop offset="25%" stopColor="#f0ca7d" />
          <stop offset="60%" stopColor="#d49e35" />
          <stop offset="100%" stopColor="#a06e1a" />
        </linearGradient>

        {/* Điểm xung động nhịp đập sinh học (Pulse Red) */}
        <radialGradient id="nmPulseGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff5252" stopOpacity="1" />
          <stop offset="60%" stopColor="#d32f2f" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#b71c1c" stopOpacity="0" />
        </radialGradient>

        {/* Đổ bóng viền tinh tế */}
        <filter id="nmShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.45" />
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#dfb76c" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Khung Badge bo góc tinh xảo */}
      <rect x="4" y="4" width="92" height="92" rx="22" fill="url(#nmBg)" stroke="url(#nmBorder)" strokeWidth="2.2" filter="url(#nmShadow)" />

      {/* Vòng tròn định vị giải phẫu học (Vitruvian coordinates) */}
      <circle cx="50" cy="50" r="36" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx="50" cy="50" r="24" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />
      <line x1="50" y1="9" x2="50" y2="17" stroke="url(#nmBorder)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="50" y1="83" x2="50" y2="91" stroke="url(#nmBorder)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="9" y1="50" x2="17" y2="50" stroke="url(#nmBorder)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="83" y1="50" x2="91" y2="50" stroke="url(#nmBorder)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

      {/* Monogram N & M liền mạch đan xen như chuỗi xoắn sinh học */}
      <g strokeLinecap="round" strokeLinejoin="round">
        {/* Chữ N (Trái) */}
        <path d="M25 68 V32 L46 64 V32" stroke="url(#nmGoldStroke)" strokeWidth="5.5" />
        
        {/* Chữ M (Phải liên kết) */}
        <path d="M46 64 L59 44 L72 64 V32" stroke="url(#nmGoldStroke)" strokeWidth="5.5" />

        {/* Điểm nhịp đập sinh học tại đỉnh trung tâm */}
        <circle cx="50" cy="23" r="5" fill="url(#nmPulseGlow)" />
        <circle cx="50" cy="23" r="2.2" fill="#ffffff" opacity="0.9" />

        {/* Nút điểm vàng giải phẫu tại các đầu mút */}
        <circle cx="25" cy="32" r="3" fill="url(#nmBorder)" />
        <circle cx="72" cy="32" r="3" fill="url(#nmBorder)" />
      </g>
    </svg>
  );
}
