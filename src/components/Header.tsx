import { useState } from 'react';
import BrandLogo from './BrandLogo';
import { useLocale } from '../locale/useLocale';
import LocaleToggle from '../locale/LocaleToggle';

export type ThemeChoice = 'system' | 'light' | 'dark';

export interface HeaderProps {
  theme: ThemeChoice;
  onCycleTheme: () => void;
  onShare: () => void;
  shareStatus: string | null;
}

export default function Header({ theme, onCycleTheme, onShare, shareStatus }: HeaderProps) {
  const { t } = useLocale();
  const [collapsed, setCollapsed] = useState(false);

  const themeLabel: Record<ThemeChoice, string> = {
    system: t('theme.system'),
    light: t('theme.light'),
    dark: t('theme.dark'),
  };

  if (collapsed) {
    return (
      <header className="topProFloating topProCollapsed">
        <button
          type="button"
          className="topExpandBtn"
          onClick={() => setCollapsed(false)}
          title="Mở rộng thanh điều hướng"
        >
          <BrandLogo size={28} className="brandLogoMini" />
          <span className="topExpandTitle">{t('app.title')}</span>
          <span className="topExpandIcon">▼</span>
        </button>
        <div className="topFloatingActions">
          <LocaleToggle />
          <button className="hdrBtn mini" onClick={onCycleTheme} title="Chuyển theme">
            🌓
          </button>
          <button className="hdrBtn mini" onClick={onShare} title={t('nav.share')}>
            🔗
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="topProFloating">
      <div className="topMain">
        <div className="brandGroup">
          <BrandLogo size={46} className="brandLogo" />
          <div className="brandText">
            <div className="brandMeta">
              <span className="brandTag">Interactive 3D Atlas</span>
              <span className="brandDot">·</span>
              <span className="brandVer">BodyParts3D v4.0</span>
            </div>
            <h1 className="brandTitle">{t('app.title')}</h1>
            <p className="brandTagline">{t('app.tagline')}</p>
          </div>
        </div>

        <div className="headerSide">
          <div className="contactBadge">
            <span className="contactLabel">{t('header.contact')}</span>
            <a
              href="https://zalo.me/0985578385"
              target="_blank"
              rel="noreferrer"
              className="contactLink"
              title="Nhắn tin qua Zalo: 0985578385"
            >
              <span className="zaloIcon">Zalo</span>
              <span className="contactPhone">+84 985 578 385</span>
            </a>
          </div>

          <div className="headerActions">
            <LocaleToggle />
            <button className="hdrBtn" onClick={onCycleTheme} title="Chuyển đổi giao diện">
              {themeLabel[theme]}
            </button>
            <button className="hdrBtn" onClick={onShare} title="Chia sẻ liên kết trực tiếp">
              {shareStatus ? t('nav.copied') : t('nav.share')}
            </button>
            <button
              type="button"
              className="hdrBtn mini"
              onClick={() => setCollapsed(true)}
              title="Thu gọn thanh điều hướng để mở rộng 3D"
            >
              ▲
            </button>
          </div>
        </div>
      </div>

      <div className="disc">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.5v.5" />
        </svg>
        <span>
          <b>SGK & Y Khoa:</b> {t('header.disclaimer')}
        </span>
      </div>
    </header>
  );
}
