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
}: TopBarZygoteProps) {
  const { t, locale } = useLocale();

  return (
    <header className="zygoteTopBar" role="banner">
      {/* 1. GÓC TRÁI: LOGO N&M HUMAN ANATOMY TINH TẾ */}
      <div className="zygoteBrandGroup">
        <BrandLogo size={36} className="zygoteLogoImg" />
        <div className="zygoteBrandMeta">
          <span className="zygoteBrandTitle">N&amp;M Human Anatomy</span>
          <span className="zygoteBrandSub">3D Medical Atlas</span>
        </div>
      </div>

      {/* 2. GÓC PHẢI: TÌM KIẾM + CÔNG CỤ TỐI GIẢN */}
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

        {/* Nút bật danh mục hệ thống */}
        <button
          type="button"
          className={`zygotePillBtn ${isSidebarOpen ? 'active' : ''}`}
          onClick={onOpenSidebar}
          title={locale === 'en' ? 'Toggle Anatomy Hierarchy' : 'Bật/tắt Cây phân cấp hệ thống'}
        >
          {locale === 'en' ? 'Hierarchy' : 'Hệ cơ quan'}
        </button>

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
