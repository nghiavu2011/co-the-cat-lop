import { useLocale } from '../locale/useLocale';

export interface LayerSliderProps {
  peelDepth: number; // 0 (sâu nhất - chỉ còn mạch/TK) đến 100 (đầy đủ da ngoài cùng)
  onChangePeelDepth: (val: number) => void;
  onReset: () => void;
}

export default function LayerSlider({
  peelDepth,
  onChangePeelDepth,
  onReset,
}: LayerSliderProps) {
  const { t } = useLocale();

  const layers = [
    { label: t('slider.skin'), val: 100, icon: '🧴' },
    { label: t('slider.muscle'), val: 75, icon: '💪' },
    { label: t('slider.skeleton'), val: 50, icon: '🦴' },
    { label: t('slider.organs'), val: 25, icon: '🫀' },
    { label: t('slider.vessels'), val: 0, icon: '⚡' },
  ];

  return (
    <div className="zygoteSliderContainer" aria-label={t('slider.title')}>
      <div className="zygoteSliderHeader">
        <span className="zygoteSliderBadge">{t('slider.title')}</span>
      </div>

      <div className="zygoteSliderTrackWrap">
        {/* Track dọc */}
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={peelDepth}
          onChange={(e) => onChangePeelDepth(Number(e.target.value))}
          className="zygoteSliderRange"
          aria-label={t('slider.title')}
        />

        {/* Các mốc điểm tương ứng */}
        <div className="zygoteSliderMarks">
          {layers.map((l) => {
            const active = peelDepth >= l.val - 12;
            return (
              <button
                key={l.val}
                type="button"
                className={`zygoteMarkItem ${active ? 'isActive' : ''}`}
                onClick={() => onChangePeelDepth(l.val)}
                title={`${l.label} (${l.val}%)`}
              >
                <span className="zygoteMarkIcon">{l.icon}</span>
                <span className="zygoteMarkText">{l.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="zygoteSliderResetBtn"
        onClick={onReset}
        title={t('slider.reset')}
      >
        ↺ {t('slider.reset')}
      </button>
    </div>
  );
}
