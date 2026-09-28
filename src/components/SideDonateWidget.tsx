import { useState } from 'react';

interface SideDonateWidgetProps {
  onOpenModal: () => void;
}

export default function SideDonateWidget({ onOpenModal }: SideDonateWidgetProps) {
  const [minimized, setMinimized] = useState(() => {
    try {
      return localStorage.getItem('cotecatlop.side_donate_min') === '1';
    } catch {
      return false;
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

  // Khi đang thu nhỏ (hoặc trên màn hình nhỏ nếu người dùng bấm thu nhỏ)
  if (minimized) {
    return (
      <div className="sideDonateMinimized" onClick={() => toggleMinimize(false)} title="Mở mã QR ủng hộ dự án">
        <span className="sideDonateMinIcon">☕</span>
        <span className="sideDonateMinText">Ủng hộ / Mời cà phê</span>
        <span className="sideDonateMinBadge">2 QR</span>
      </div>
    );
  }

  return (
    <aside className="sideDonateContainer" aria-label="Khu vực ủng hộ dự án">
      {/* Nút thu nhỏ góc trên */}
      <div className="sideDonateHeader">
        <div className="sideDonateTitleRow">
          <span className="sideDonateCoffeeIcon">☕</span>
          <span className="sideDonateHeaderTitle">Ủng Hộ Dự Án</span>
        </div>
        <button
          type="button"
          className="sideDonateMinBtn"
          onClick={() => toggleMinimize(true)}
          title="Thu gọn khung QR"
          aria-label="Thu gọn"
        >
          ✕
        </button>
      </div>

      <p className="sideDonatePrompt">
        Quét mã trực tiếp để tiếp sức duy trì máy chủ & phát triển mô hình 3D:
      </p>

      {/* KHUNG ĐỎ 1: TECHCOMBANK QR */}
      <div className="sideQrCard tcbCard" onClick={onOpenModal} title="Click để phóng to thông tin">
        <div className="sideQrCardHeader">
          <span className="bankBadge tcb">TCB</span>
          <span className="bankName">Techcombank</span>
          <span className="napasBadge">Napas 247</span>
        </div>
        <div className="sideQrImgWrapper">
          <img
            src="/donate/Techcom.jpg"
            alt="Mã QR Techcombank 19077215974018"
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
            title="Sao chép số tài khoản"
          >
            {copiedBank ? '✓ Đã chép' : '📋 Chép'}
          </button>
        </div>
        <span className="sideQrSub">Mọi App Ngân Hàng quét được</span>
      </div>

      {/* KHUNG ĐỎ 2: MOMO QR */}
      <div className="sideQrCard momoCard" onClick={onOpenModal} title="Click để phóng to thông tin">
        <div className="sideQrCardHeader">
          <span className="bankBadge momo">MoMo</span>
          <span className="bankName">Ví MoMo</span>
          <span className="napasBadge momoSub">VietQR</span>
        </div>
        <div className="sideQrImgWrapper">
          <img
            src="/donate/MOMO.jpg"
            alt="Mã QR Ví MoMo 0985578385"
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
            title="Sao chép số điện thoại MoMo"
          >
            {copiedMomo ? '✓ Đã chép' : '📋 Chép'}
          </button>
        </div>
        <span className="sideQrSub">Quét nhanh qua App MoMo</span>
      </div>

      {/* Nút xem chi tiết / thư gửi gắm */}
      <button type="button" className="sideDonateFullBtn" onClick={onOpenModal}>
        ☕ Mời tách cà phê chi tiết
      </button>
    </aside>
  );
}
