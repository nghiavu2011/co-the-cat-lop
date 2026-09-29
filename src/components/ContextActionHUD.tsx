import { useLocale } from '../locale/useLocale';

export interface ContextActionHUDProps {
  selectedName: string;
  hasHiddenObjects: boolean;
  onHide: () => void;
  onGhost: () => void;
  onIsolate: () => void;
  onOpenInfo: () => void;
  onUnhideAll: () => void;
  onDeselect?: () => void;
}

export default function ContextActionHUD({
  selectedName,
  hasHiddenObjects,
  onHide,
  onGhost,
  onIsolate,
  onOpenInfo,
  onUnhideAll,
  onDeselect,
}: ContextActionHUDProps) {
  const { t } = useLocale();

  return (
    <div className="contextHudContainer" role="toolbar" aria-label="Anatomical Action Controls">
      {/* 1. TÊN BỘ PHẬN ĐANG CHỌN */}
      <div className="contextHudTarget">
        <span className="contextHudTargetDot" />
        <span className="contextHudTargetName" title={selectedName}>
          {selectedName}
        </span>
      </div>

      <span className="contextHudDivider" />

      {/* 2. CÁC HÀNH ĐỘNG TƯƠNG TÁC Y KHOA CHUẨN VISIBLE BODY */}
      <div className="contextHudButtons">
        {/* Nút Ẩn */}
        <button
          type="button"
          className="contextHudBtn"
          onClick={onHide}
          title={t('contextAction.hide')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
          <span>{t('contextAction.hide')}</span>
        </button>

        {/* Nút Làm mờ (Ghost / Translucent) */}
        <button
          type="button"
          className="contextHudBtn"
          onClick={onGhost}
          title={t('contextAction.ghost')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span>{t('contextAction.ghost')}</span>
        </button>

        {/* Nút Cô lập (Isolate) */}
        <button
          type="button"
          className="contextHudBtn"
          onClick={onIsolate}
          title={t('contextAction.isolate')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
          <span>{t('contextAction.isolate')}</span>
        </button>

        {/* Nút Xem hồ sơ giải phẫu */}
        <button
          type="button"
          className="contextHudBtn primary"
          onClick={onOpenInfo}
          title={t('contextAction.info')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span>{t('contextAction.info')}</span>
        </button>

        {/* Nút Hiện lại tất cả nếu có khối đang bị ẩn */}
        {hasHiddenObjects && (
          <button
            type="button"
            className="contextHudBtn unhide"
            onClick={onUnhideAll}
            title={t('contextAction.unhideAll')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>{t('contextAction.unhideAll')}</span>
          </button>
        )}

        {/* Nút Bỏ chọn (Deselect / Close) */}
        {onDeselect && (
          <button
            type="button"
            className="contextHudCloseBtn"
            onClick={onDeselect}
            title="Đóng / Bỏ chọn"
            aria-label="Deselect"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
