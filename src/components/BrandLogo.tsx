export default function BrandLogo({ size = 52, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="N&Mstudio Human Anatomy Logo"
      width={size}
      height={size}
      className={`brandLogoImg ${className}`}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        flexShrink: 0,
        display: 'block',
      }}
    />
  );
}
