import { useState } from 'react';
import { useLocale } from '../locale/useLocale';

export interface CameraControlsHUDProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetCamera: () => void;
  onOrbit?: (dir: 'up' | 'down' | 'left' | 'right') => void;
  onPresetAngle?: (angle: 'front' | 'back' | 'left' | 'right' | 'top') => void;
}

export default function CameraControlsHUD({
  onZoomIn,
  onZoomOut,
  onResetCamera,
  onOrbit,
  onPresetAngle,
}: CameraControlsHUDProps) {
  const { locale } = useLocale();
  const [showAngles, setShowAngles] = useState(false);

  const angles = [
    { id: 'front' as const, label: locale === 'en' ? 'Front' : 'Trước' },
    { id: 'back' as const, label: locale === 'en' ? 'Back' : 'Sau' },
    { id: 'left' as const, label: locale === 'en' ? 'Left' : 'Trái' },
    { id: 'right' as const, label: locale === 'en' ? 'Right' : 'Phải' },
    { id: 'top' as const, label: locale === 'en' ? 'Top' : 'Đỉnh' },
  ];

  return (
    <div className="zygoteNavControls" aria-label="Camera Navigation">
      {/* 1. D-PAD ĐIỀU HƯỚNG XOAY GÓC KHÔNG GIAN (ORBIT NAVIGATION) */}
      <div className="zygoteDpadBox">
        <button
          type="button"
          className="zygoteDpadBtn up"
          onClick={() => onOrbit?.('up')}
          title={locale === 'en' ? 'Tilt Up' : 'Nghiêng lên'}
          aria-label="Tilt Up"
        >
          ▲
        </button>

        <div className="zygoteDpadMidRow">
          <button
            type="button"
            className="zygoteDpadBtn left"
            onClick={() => onOrbit?.('left')}
            title={locale === 'en' ? 'Rotate Left' : 'Xoay trái'}
            aria-label="Rotate Left"
          >
            ◀
          </button>
          <button
            type="button"
            className="zygoteDpadBtn home"
            onClick={onResetCamera}
            title={locale === 'en' ? 'Reset Camera View' : 'Đặt lại góc nhìn chuẩn'}
            aria-label="Reset Camera"
          >
            ⌂
          </button>
          <button
            type="button"
            className="zygoteDpadBtn right"
            onClick={() => onOrbit?.('right')}
            title={locale === 'en' ? 'Rotate Right' : 'Xoay phải'}
            aria-label="Rotate Right"
          >
            ▶
          </button>
        </div>

        <button
          type="button"
          className="zygoteDpadBtn down"
          onClick={() => onOrbit?.('down')}
          title={locale === 'en' ? 'Tilt Down' : 'Nghiêng xuống'}
          aria-label="Tilt Down"
        >
          ▼
        </button>
      </div>

      {/* 2. CẶP NÚT PHÓNG TO / THU NHỎ (ZOOM) */}
      <div className="zygoteZoomPair">
        <button
          type="button"
          className="zygoteNavBtn"
          onClick={onZoomIn}
          title={locale === 'en' ? 'Zoom In (+)' : 'Phóng to (+)'}
          aria-label="Zoom In"
        >
          +
        </button>
        <button
          type="button"
          className="zygoteNavBtn"
          onClick={onZoomOut}
          title={locale === 'en' ? 'Zoom Out (−)' : 'Thu nhỏ (−)'}
          aria-label="Zoom Out"
        >
          −
        </button>
      </div>

      {/* 3. NÚT CHỌN GÓC NHÌN CHUẨN (VIEW PRESETS) */}
      <div className="zygotePresetWrapper">
        <button
          type="button"
          className={`zygoteAngleToggleBtn ${showAngles ? 'active' : ''}`}
          onClick={() => setShowAngles((v) => !v)}
          title={locale === 'en' ? 'Camera Angle Presets' : 'Góc nhìn chuẩn Y khoa'}
        >
          📐 <span className="angleLabel">{locale === 'en' ? 'Angles' : 'Góc nhìn'}</span>
        </button>

        {showAngles && (
          <div className="zygoteAngleMenu">
            {angles.map((a) => (
              <button
                key={a.id}
                type="button"
                className="zygoteAngleItem"
                onClick={() => {
                  onPresetAngle?.(a.id);
                  setShowAngles(false);
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
