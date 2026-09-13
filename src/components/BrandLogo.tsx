// ponytail: replaced SVG monogram with actual brand logo PNG
export default function BrandLogo({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="N&Mstudio Human Anatomy Logo"
      width={size}
      height={size}
      className={className}
      style={{ flexShrink: 0, display: 'block', objectFit: 'contain' }}
    />
  );
}
