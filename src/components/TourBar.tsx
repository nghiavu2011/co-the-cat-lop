import type { Tour } from '../content/tours';
import { useLocale } from '../locale/useLocale';

export interface TourBarProps {
  tour: Tour;
  stepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
}

export default function TourBar({ tour, stepIndex, onNext, onPrev, onExit }: TourBarProps) {
  const { t } = useLocale();
  const step = tour.steps[stepIndex];
  const isLast = stepIndex === tour.steps.length - 1;

  return (
    <div
      className="tourbar"
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      role="region"
      aria-label="Khám phá hành trình giải phẫu"
    >
      <div className="tourbarHead">
        <span className="tourbarTitle">{tour.title}</span>
        <div className="tourbarHeaderRight">
          <div className="tourbarProgress">
            <div className="tourbarDots" aria-hidden="true">
              {tour.steps.map((_, i) => (
                <span
                  key={i}
                  className={`tourbarDot${i === stepIndex ? ' isCurrent' : i < stepIndex ? ' isDone' : ''}`}
                />
              ))}
            </div>
            <span className="tourbarStep">
              {t('tour.step')} {stepIndex + 1}/{tour.steps.length}
            </span>
          </div>
          <button type="button" className="tourbarCloseBtn" onClick={onExit} title={t('tour.exit')}>
            ✕
          </button>
        </div>
      </div>
      <p className="tourbarText">{step.caption}</p>
      <div className="tourbarBtns">
        <button type="button" onClick={onPrev} disabled={stepIndex === 0} className="tourbarBtn">
          ‹ {t('tour.prev')}
        </button>
        {isLast ? (
          <button type="button" className="tourbarBtn primary" onClick={onExit}>
            {t('tour.finish')} ✓
          </button>
        ) : (
          <button type="button" className="tourbarBtn primary" onClick={onNext}>
            {t('tour.next')} ›
          </button>
        )}
      </div>
    </div>
  );
}
