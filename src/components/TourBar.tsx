import type { Tour } from '../content/tours';

export interface TourBarProps {
  tour: Tour;
  stepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
}

export default function TourBar({ tour, stepIndex, onNext, onPrev, onExit }: TourBarProps) {
  const step = tour.steps[stepIndex];
  const isLast = stepIndex === tour.steps.length - 1;
  return (
    <div className="tourbar">
      <div className="tourbarHead">
        <span className="tourbarTitle">{tour.title}</span>
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
            Bước {stepIndex + 1}/{tour.steps.length}
          </span>
        </div>
      </div>
      <p className="tourbarText">{step.caption}</p>
      <div className="tourbarBtns">
        <button onClick={onPrev} disabled={stepIndex === 0}>
          Quay lại
        </button>
        {isLast ? (
          <button className="primary" onClick={onExit}>
            Hoàn tất hành trình
          </button>
        ) : (
          <button className="primary" onClick={onNext}>
            Chặng tiếp theo
          </button>
        )}
        <button className="quit" onClick={onExit}>
          Thoát
        </button>
      </div>
    </div>
  );
}
