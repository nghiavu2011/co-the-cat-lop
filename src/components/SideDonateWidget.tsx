import { useState } from 'react';
import { useLocale } from '../locale/useLocale';

interface SideDonateWidgetProps {
  onOpenModal: () => void;
}

export default function SideDonateWidget({ onOpenModal }: SideDonateWidgetProps) {
  const { t } = useLocale();

  const [minimized, setMinimized] = useState(() => {
    try {
      const stored = localStorage.getItem('cotecatlop.side_donate_min');
      if (stored !== null) return stored === '1';
      return true; // Mặc định thu nhỏ thành pill badge tinh tế
    } catch {
      return true;
    }
  });

  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedMomo, setCopiedMomo] = useState(false);

  const toggleMinimize = (val: boolean) => {
    setMinimized(val);
    try {
      localStorage.setItem('cotecatlop.side_donate_min', val ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  const copyBank = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText('19077215974018');
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    } catch {
      /* fallback */
    }
  };

  const copyMomo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText('0985578385');
      setCopiedMomo(true);
      setTimeout(() => setCopiedMomo(false), 2000);
    } catch {
      /* fallback */
    }
  };

  // Khi đang thu nhỏ
  if (minimized) {
    return (
      <div
        className="sideDonateMinimized"
        onClick={() => toggleMinimize(false)}
        title={t('donate.minTitle')}
        role="button"
        tabIndex={0}
      >
        <span className="sideDonateMinIcon">☕</span>
        <span className="sideDonateMinText">{t('donate.minText')}</span>
        <span className="sideDonateMinBadge">2 QR</span>
      </div>
    );
  }

  return (
    <aside className="sideDonateContainer" aria-label={t('donate.title')}>
      {/* Nút thu nhỏ góc trên */}
      <div className="sideDonateHeader">
        <div className="sideDonateTitleRow">
          <span className="sideDonateCoffeeIcon">☕</span>
          <span className="sideDonateHeaderTitle">{t('donate.title')}</span>
        </div>
        <button
          type="button"
          className="sideDonateMinBtn"
          onClick={() => toggleMinimize(true)}
          title={t('donate.closeTitle')}
          aria-label={t('donate.closeTitle')}
        >
          ✕
        </button>
      </div>

      <p className="sideDonatePrompt">{t('donate.prompt')}</p>

      {/* KHUNG ĐỎ 1: TECHCOMBANK QR */}
      <div className="sideQrCard tcbCard" onClick={onOpenModal} title="Click to view details">
        <div className="sideQrCardHeader">
          <span className="bankBadge tcb">TCB</span>
          <span className="bankName">Techcombank</span>
          <span className="napasBadge">Napas 247</span>
        </div>
        <div className="sideQrImgWrapper">
          <img
            src="/donate/Techcom.jpg"
            alt="Techcombank QR 19077215974018"
            className="sideQrImage"
            loading="lazy"
          />
        </div>
        <div className="sideQrStkRow">
          <span className="sideQrStk">19077215974018</span>
          <button
            type="button"
            className={`sideQrCopyBtn ${copiedBank ? 'copied' : ''}`}
            onClick={copyBank}
            title={copiedBank ? t('donate.copied') : t('donate.copy')}
          >
            {copiedBank ? t('donate.copied') : t('donate.copy')}
          </button>
        </div>
        <span className="sideQrSub">{t('donate.tcbSub')}</span>
      </div>

      {/* KHUNG ĐỎ 2: MOMO QR */}
      <div className="sideQrCard momoCard" onClick={onOpenModal} title="Click to view details">
        <div className="sideQrCardHeader">
          <span className="bankBadge momo">MoMo</span>
          <span className="bankName">Ví MoMo</span>
          <span className="napasBadge momoSub">VietQR</span>
        </div>
        <div className="sideQrImgWrapper">
          <img
            src="/donate/MOMO.jpg"
            alt="MoMo QR 0985578385"
            className="sideQrImage"
            loading="lazy"
          />
        </div>
        <div className="sideQrStkRow">
          <span className="sideQrStk">0985 578 385</span>
          <button
            type="button"
            className={`sideQrCopyBtn ${copiedMomo ? 'copied' : ''}`}
            onClick={copyMomo}
            title={copiedMomo ? t('donate.copied') : t('donate.copy')}
          >
            {copiedMomo ? t('donate.copied') : t('donate.copy')}
          </button>
        </div>
        <span className="sideQrSub">{t('donate.momoSub')}</span>
      </div>

      {/* Nút xem chi tiết / thư gửi gắm */}
      <button type="button" className="sideDonateFullBtn" onClick={onOpenModal}>
        {t('donate.fullBtn')}
      </button>
    </aside>
  );
}
