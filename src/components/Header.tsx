export type ThemeChoice = 'system' | 'light' | 'dark';

const THEME_LABEL: Record<ThemeChoice, string> = {
  system: 'Giao diện: Theo máy',
  light: 'Giao diện: Sáng',
  dark: 'Giao diện: Tối',
};

export interface HeaderProps {
  theme: ThemeChoice;
  onCycleTheme: () => void;
  onShare: () => void;
  shareStatus: string | null;
}

export default function Header({ theme, onCycleTheme, onShare, shareStatus }: HeaderProps) {
  return (
    <header className="topPro">
      <div className="topMain">
        <div className="brandGroup">
          <img src="/logo.png" alt="N&Mstudio Logo" className="brandLogo" />
          <div className="brandText">
            <div className="brandMeta">
              <span className="brandTag">Interactive 3D Atlas</span>
              <span className="brandDot">·</span>
              <span className="brandVer">BodyParts3D v4.0</span>
            </div>
            <h1 className="brandTitle">N&Mstudio Human Anatomy</h1>
            <p className="brandTagline">
              Bóc từng lớp da – cơ – xương – nội tạng, xoay cắt lát mô hình 3D thật 2.234 cấu trúc và giải mã các hiện tượng sinh lý thường nhật.
            </p>
          </div>
        </div>

        <div className="headerSide">
          <div className="contactBadge">
            <span className="contactLabel">Tư vấn & Hợp tác chuyên môn:</span>
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
            <button className="hdrBtn" onClick={onCycleTheme} title="Chuyển đổi giao diện">
              {THEME_LABEL[theme]}
            </button>
            <button className="hdrBtn" onClick={onShare} title="Chia sẻ liên kết trực tiếp">
              {shareStatus ?? '🔗 Chia sẻ góc nhìn'}
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
          <b>Lưu ý y khoa:</b> Mô hình chuẩn tham chiếu nam giới trưởng thành (TARO MRI) phục vụ mục đích giáo dục, trực quan hóa và nghiên cứu sinh học — không dùng thay thế chẩn đoán lâm sàng của bác sĩ chuyên khoa.
        </span>
      </div>
    </header>
  );
}
