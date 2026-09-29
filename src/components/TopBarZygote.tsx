import { useState } from 'react';
import BrandLogo from './BrandLogo';
import { useLocale } from '../locale/useLocale';
import LocaleToggle from '../locale/LocaleToggle';

export interface TopBarZygoteProps {
  query: string;
  onQueryChange: (q: string) => void;
  hasHiddenObjects: boolean;
  onUnhideAll: () => void;
  theme: 'system' | 'light' | 'dark';
  onCycleTheme: () => void;
  onOpenSidebar: () => void;
  isSidebarOpen: boolean;
  onShare: () => void;
  // Các công cụ giải phẫu (Tools)
  explode: number;
  onExplodeChange: (val: number) => void;
  showBodyParams: boolean;
  onToggleBodyParams: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onStartTour?: (tourId: string) => void;
  // Tác vụ ngữ cảnh khi chọn bộ phận (Đưa lên khung trên)
  selectedName?: string | null;
  onHideSelected?: () => void;
  onGhostSelected?: () => void;
  onIsolateSelected?: () => void;
  onOpenInfoSelected?: () => void;
  onDeselect?: () => void;
}

export default function TopBarZygote({
  query,
  onQueryChange,
  hasHiddenObjects,
  onUnhideAll,
  theme,
  onCycleTheme,
  onOpenSidebar,
  isSidebarOpen,
  onShare,
  explode,
  onExplodeChange,
  showBodyParams,
  onToggleBodyParams,
  isFullscreen,
  onToggleFullscreen,
  onStartTour,
  selectedName,
  onHideSelected,
  onGhostSelected,
  onIsolateSelected,
  onOpenInfoSelected,
  onDeselect,
}: TopBarZygoteProps) {
  const { t, locale } = useLocale();
  const [showTools, setShowTools] = useState(false);

  return (
    <header className="zygoteTopBar" role="banner">
      {/* 1. GÓC TRÁI: LOGO N&M HUMAN ANATOMY TINH TẾ */}
      <div className="zygoteBrandGroup">
        <BrandLogo size={34} className="zygoteLogoImg" />
        <div className="zygoteBrandMeta">
          <span className="zygoteBrandTitle">N&amp;M Human Anatomy</span>
          <span className="zygoteBrandSub">3D Medical Atlas</span>
        </div>
      </div>

      {/* 2. CỤM TÁC VỤ NGỮ CẢNH CƠ QUAN ĐƯỢC CHỌN (TỐI GIẢN TRÊN KHUNG TRÊN) */}
      {selectedName && (
        <div className="zygoteTopContextPill">
          <span className="contextPillDot" />
          <span className="contextPillName" title={selectedName}>
            {selectedName}
          </span>
          <span className="contextPillSep">|</span>
          <button type="button" className="contextPillBtn" onClick={onHideSelected} title="Ẩn bộ phận này">
            Ẩn
          </button>
          <button type="button" className="contextPillBtn" onClick={onGhostSelected} title="Làm mờ bộ phận này">
            Mờ
          </button>
          <button type="button" className="contextPillBtn" onClick={onIsolateSelected} title="Cô lập chỉ xem bộ phận này">
            Cô lập
          </button>
          <button type="button" className="contextPillBtn info" onClick={onOpenInfoSelected} title="Xem hồ sơ giải phẫu">
            Hồ sơ
          </button>
          <button type="button" className="contextPillBtn close" onClick={onDeselect} title="Bỏ chọn">
            ✕
          </button>
        </div>
      )}

      {/* 3. GÓC PHẢI: TÌM KIẾM + CÔNG CỤ TỐI GIẢN CHUẨN ZYGOTE */}
      <div className="zygoteToolsGroup">
        {/* Ô tìm kiếm Capsule giống hệt Zygote */}
        <div className="zygoteSearchBox">
          <svg className="zygoteSearchIcon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <circle cx="11" cy="11" r="7" />
            <path d="M16.5 16.5 21 21" />
          </svg>
          <input
            type="search"
            placeholder={locale === 'en' ? 'Search anatomy...' : 'Tìm bộ phận, cơ, xương...'}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="zygoteSearchInput"
          />
          {query && (
            <button
              type="button"
              className="zygoteSearchClear"
              onClick={() => onQueryChange('')}
              title="Clear"
            >
              ✕
            </button>
          )}
        </div>

        {/* Nút Unhide All nếu có khối bị ẩn */}
        {hasHiddenObjects && (
          <button
            type="button"
            className="zygotePillBtn alert"
            onClick={onUnhideAll}
            title={locale === 'en' ? 'Unhide All Hidden Structures' : 'Hiện lại tất cả bộ phận đã ẩn'}
          >
            ↺ {locale === 'en' ? 'Unhide All' : 'Hiện tất cả'}
          </button>
        )}

        {/* Nút bật danh mục hệ thống (Hierarchy) */}
        <button
          type="button"
          className={`zygotePillBtn ${isSidebarOpen ? 'active' : ''}`}
          onClick={onOpenSidebar}
          title={locale === 'en' ? 'Toggle Anatomy Hierarchy' : 'Bật/tắt Cây phân cấp hệ thống'}
        >
          {locale === 'en' ? 'Hierarchy' : 'Hệ cơ quan'}
        </button>

        {/* Menu Công cụ (Tools Popover) chứa Tách lớp, Thể trạng BMI, Toàn màn hình */}
        <div className="zygoteToolsWrap">
          <button
            type="button"
            className={`zygotePillBtn ${showTools ? 'active' : ''}`}
            onClick={() => setShowTools((v) => !v)}
            title={locale === 'en' ? 'Anatomical Tools' : 'Công cụ giải phẫu'}
          >
            🛠️ {locale === 'en' ? 'Tools' : 'Công cụ'} ▾
          </button>

          {showTools && (
            <div className="zygoteToolsDropdown">
              {/* Bóc tách không gian (Exploded View) */}
              <div className="zygoteToolItem">
                <div className="zygoteToolRow">
                  <span className="zygoteToolLabel">⤢ {locale === 'en' ? 'Exploded View:' : 'Tách lớp:'}</span>
                  <b className="zygoteToolVal">{explode}%</b>
                  {explode > 0 && (
                    <button
                      type="button"
                      className="zygoteToolResetBtn"
                      onClick={() => onExplodeChange(0)}
                      title="Đặt lại 0%"
                    >
                      ↺
                    </button>
                  )}
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={explode}
                  onChange={(e) => onExplodeChange(Number(e.target.value))}
                  className="zygoteToolRange"
                />
              </div>

              <div className="zygoteToolDivider" />

              {/* Mô phỏng thể trạng & BMI */}
              <button
                type="button"
                className={`zygoteToolActionBtn ${showBodyParams ? 'active' : ''}`}
                onClick={() => {
                  onToggleBodyParams();
                  setShowTools(false);
                }}
              >
                ⚖ {locale === 'en' ? 'Body Simulator (BMI)' : 'Mô phỏng thể trạng (BMI)'}
              </button>

              {/* Toàn màn hình */}
              <button
                type="button"
                className="zygoteToolActionBtn"
                onClick={() => {
                  onToggleFullscreen();
                  setShowTools(false);
                }}
              >
                {isFullscreen
                  ? (locale === 'en' ? '✕ Exit Fullscreen' : '✕ Thu nhỏ màn hình')
                  : (locale === 'en' ? '⛶ Fullscreen Mode' : '⛶ Toàn màn hình')}
              </button>

              {/* Các tour giải phẫu dẫn dắt */}
              {onStartTour && (
                <>
                  <div className="zygoteToolDivider" />
                  <div style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--zygote-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {locale === 'en' ? 'Interactive Tours' : 'Tour học tập tương tác'}
                  </div>
                  <button
                    type="button"
                    className="zygoteToolActionBtn"
                    onClick={() => {
                      onStartTour('tuanhoan');
                      setShowTools(false);
                    }}
                  >
                    ▶ {locale === 'en' ? 'Circulatory System' : 'Hệ tuần hoàn máu'}
                  </button>
                  <button
                    type="button"
                    className="zygoteToolActionBtn"
                    onClick={() => {
                      onStartTour('tho');
                      setShowTools(false);
                    }}
                  >
                    ▶ {locale === 'en' ? 'Respiratory System' : 'Hệ hô hấp & Phổi'}
                  </button>
                  <button
                    type="button"
                    className="zygoteToolActionBtn"
                    onClick={() => {
                      onStartTour('tieuhoa');
                      setShowTools(false);
                    }}
                  >
                    ▶ {locale === 'en' ? 'Digestive System' : 'Hệ tiêu hóa & Dạ dày'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Nút Song ngữ */}
        <LocaleToggle />

        {/* Nút Theme Sáng/Tối */}
        <button
          type="button"
          className="zygoteIconBtnTop"
          onClick={onCycleTheme}
          title={`Theme: ${theme}`}
        >
          {theme === 'light' ? '☀️' : '🌙'}
        </button>

        {/* Nút Share */}
        <button
          type="button"
          className="zygoteIconBtnTop"
          onClick={onShare}
          title={t('nav.share')}
        >
          🔗
        </button>
      </div>
    </header>
  );
}
