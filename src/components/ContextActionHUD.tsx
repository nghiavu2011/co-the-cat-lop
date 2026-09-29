import { useLocale } from '../locale/useLocale';

export interface ContextActionHUDProps {
  selectedName: string;
  hasHiddenObjects: boolean;
  onHide: () => void;
  onGhost: () => void;
  onIsolate: () => void;
  onOpenInfo: () => void;
  onUnhideAll: () => void;
}

export default function ContextActionHUD({
  selectedName,
  hasHiddenObjects,
  onHide,
  onGhost,
  onIsolate,
  onOpenInfo,
  onUnhideAll,
}: ContextActionHUDProps) {
  const { t } = useLocale();

  return (
    <div className="contextHudContainer" role="toolbar" aria-label="Anatomical Action Controls">
      <div className="contextHudTarget">
        <span className="contextHudTargetDot" />
        <span className="contextHudTargetName" title={selectedName}>
          {selectedName}
        </span>
      </div>

      <div className="contextHudButtons">
        <button
          type="button"
          className="contextHudBtn"
          onClick={onHide}
          title={t('contextAction.hide')}
        >
          👁️ <span>{t('contextAction.hide')}</span>
        </button>

        <button
          type="button"
          className="contextHudBtn"
          onClick={onGhost}
          title={t('contextAction.ghost')}
        >
          🌫️ <span>{t('contextAction.ghost')}</span>
        </button>

        <button
          type="button"
          className="contextHudBtn"
          onClick={onIsolate}
          title={t('contextAction.isolate')}
        >
          🎯 <span>{t('contextAction.isolate')}</span>
        </button>

        <button
          type="button"
          className="contextHudBtn primary"
          onClick={onOpenInfo}
          title={t('contextAction.info')}
        >
          📖 <span>{t('contextAction.info')}</span>
        </button>

        {hasHiddenObjects && (
          <button
            type="button"
            className="contextHudBtn unhide"
            onClick={onUnhideAll}
            title={t('contextAction.unhideAll')}
          >
            ↺ <span>{t('contextAction.unhideAll')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
