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
    <header className="top">
      <div className="mark">
        <span className="eyebrow">Atlas giải phẫu tương tác · Tiếng Việt · dữ liệu 3D thật</span>
        <h1>Cơ Thể Cắt Lớp</h1>
        <p className="tagline">
          Bóc từng lớp da – cơ – xương – nội tạng, hoặc xoay và cắt lát mô hình giải phẫu ba chiều thật của
          BodyParts3D — 2.234 cấu trúc, 11 hệ cơ quan, chú thích viết cho người không học y.
        </p>
        <div className="headerActions">
          <button className="hdrBtn" onClick={onCycleTheme}>
            {THEME_LABEL[theme]}
          </button>
          <button className="hdrBtn" onClick={onShare}>
            {shareStatus ?? 'Chia sẻ góc nhìn này'}
          </button>
        </div>
      </div>
      <div className="disc">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.5v.5" />
        </svg>
        <span>
          <b>Đây là tài liệu giáo dục.</b> Mô hình là giải phẫu tham chiếu (nam giới trưởng thành), không phải ảnh
          chụp của riêng bạn, và không dùng để tự chẩn đoán. Mọi triệu chứng cần bác sĩ trực tiếp thăm khám.
        </span>
      </div>
    </header>
  );
}
