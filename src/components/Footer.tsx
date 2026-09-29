import { useRef } from 'react';
import BrandLogo from './BrandLogo';
import { useLocale } from '../locale/useLocale';

interface FooterProps {
  onOpenCoffee?: () => void;
  onOpenAdmin?: () => void;
}

export default function Footer({ onOpenCoffee, onOpenAdmin }: FooterProps) {
  const { t } = useLocale();
  const clickCountRef = useRef(0);
  const lastClickRef = useRef(0);

  const handleSecretAdminTrigger = () => {
    const now = performance.now();
    if (now - lastClickRef.current < 600) {
      clickCountRef.current += 1;
      if (clickCountRef.current >= 5) {
        clickCountRef.current = 0;
        onOpenAdmin?.();
      }
    } else {
      clickCountRef.current = 1;
    }
    lastClickRef.current = now;
  };

  return (
    <footer className="footerRefined">
      {/* KHỐI TRỌNG TÂM CHÍNH - TINH TẾ, ĐẲNG CẤP */}
      <div className="footerHero">
        <div className="footerHeroBrand">
          <BrandLogo size={46} className="footerHeroLogo" />
          <div className="footerHeroText">
            <h3 className="footerHeroTitle">{t('app.title')}</h3>
            <p className="footerHeroSubtitle">{t('app.subtitle')}</p>
          </div>
        </div>

        <p className="footerHeroDesc">{t('footer.desc')}</p>

        <div className="footerHeroContact">
          <span className="footerContactNote">{t('footer.contact')}</span>
          <a
            href="https://zalo.me/0985578385"
            target="_blank"
            rel="noreferrer"
            className="footerZaloBtn"
            title="Nhắn tin Zalo: 0985578385"
          >
            <span className="zaloBadge">Zalo</span>
            <span className="phoneText">+84 985 578 385</span>
          </a>
          {onOpenCoffee && (
            <button
              type="button"
              className="footerCoffeeBtn"
              onClick={onOpenCoffee}
              title={t('footer.coffee')}
            >
              {t('footer.coffee')}
            </button>
          )}
        </div>
      </div>

      {/* KHỐI THÔNG TIN BẢN QUYỀN & KHUYẾN CÁO NHỎ XINH */}
      <div className="footerFinePrint">
        <div className="fineItem">
          <span className="fineTag">{t('footer.dataTag')}</span>
          <span>
            BodyParts3D 4.0 © DBCLS (ĐH Tokyo, CC BY 4.0) · 2.234 mesh qua <code>ashemag/human-atlas</code> · Tham chiếu Gray's Anatomy & Netter Atlas.
          </span>
        </div>
        <div className="fineItem">
          <span className="fineTag">{t('footer.medicalTag')}</span>
          <span>{t('footer.medicalText')}</span>
        </div>
      </div>

      {/* DÒNG COPYRIGHT CUỐI */}
      <div className="footerCopyright">
        <span
          onClick={handleSecretAdminTrigger}
          style={{ cursor: 'pointer', userSelect: 'none' }}
          title={t('app.title')}
        >
          © 2026 <b>{t('app.title')}</b>. All rights reserved.
        </span>
        <span>
          Hotline / Zalo: <a href="https://zalo.me/0985578385" target="_blank" rel="noreferrer">+84 985 578 385</a>
        </span>
      </div>
    </footer>
  );
}
