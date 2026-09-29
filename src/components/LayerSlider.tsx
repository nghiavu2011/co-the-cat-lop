import { useLocale } from '../locale/useLocale';

export interface LayerSliderProps {
  peelDepth: number; // 0..100
  onChangePeelDepth: (val: number) => void;
  gender: 'male' | 'female';
  onToggleGender: () => void;
}

export default function LayerSlider({
  peelDepth,
  onChangePeelDepth,
  gender,
  onToggleGender,
}: LayerSliderProps) {
  const { t, locale } = useLocale();

  const layers = [
    {
      id: 'skin',
      val: 100,
      label: locale === 'en' ? 'Skin & Fat' : 'Da & Mô mỡ',
      // SVG Icon người / da
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <circle cx="12" cy="7" r="4" />
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        </svg>
      ),
    },
    {
      id: 'muscle',
      val: 75,
      label: locale === 'en' ? 'Muscular System' : 'Hệ Cơ bắp',
      // SVG Icon cơ bắp
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M7 11c1.5-3 5-3 6.5 0 2 0 4 2 4 4.5 0 2.5-2 4.5-4.5 4.5H8C5.5 20 4 18 4 15.5 4 13 5.5 11 7 11z" />
          <path d="M13 11v9" />
        </svg>
      ),
    },
    {
      id: 'skeleton',
      val: 50,
      label: locale === 'en' ? 'Skeletal Frame' : 'Khung Xương',
      // SVG Icon xương
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <circle cx="6" cy="6" r="2.5" />
          <circle cx="6" cy="18" r="2.5" />
          <circle cx="18" cy="6" r="2.5" />
          <circle cx="18" cy="18" r="2.5" />
          <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" strokeWidth={2.2} />
          <line x1="8.5" y1="15.5" x2="15.5" y2="8.5" strokeWidth={2.2} />
        </svg>
      ),
    },
    {
      id: 'organs',
      val: 25,
      label: locale === 'en' ? 'Internal Organs' : 'Nội Tạng',
      // SVG Icon nội tạng / dạ dày
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M12 4c-3.5 0-6 2.5-6 6 0 5 6 10 6 10s6-5 6-10c0-3.5-2.5-6-6-6z" />
          <circle cx="12" cy="10" r="2" />
        </svg>
      ),
    },
    {
      id: 'circulatory',
      val: 12,
      label: locale === 'en' ? 'Circulatory (Heart)' : 'Tuần Hoàn (Tim mạch)',
      // SVG Icon quả tim
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ),
    },
    {
      id: 'nervous',
      val: 0,
      label: locale === 'en' ? 'Nervous (Brain)' : 'Thần Kinh (Não bộ)',
      // SVG Icon não / tia chớp
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M12 2a5 5 0 0 0-5 5c0 1.5.7 2.9 1.8 3.8A5 5 0 0 0 7 15a5 5 0 0 0 8.5 3.5A5 5 0 0 0 17 15c0-1.6-.7-3-1.8-4A5 5 0 0 0 17 7a5 5 0 0 0-5-5z" />
          <path d="M12 6v12" />
        </svg>
      ),
    },
  ];

  return (
    <div className="zygoteCapsuleSlider" aria-label={t('slider.title')}>
      {/* 1. Track trượt dọc thanh mảnh */}
      <div className="zygoteCapsuleTrack">
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={peelDepth}
          onChange={(e) => onChangePeelDepth(Number(e.target.value))}
          className="zygoteVerticalInput"
          aria-label={t('slider.title')}
        />
        {/* Vệt tiến trình sáng */}
        <div
          className="zygoteTrackProgress"
          style={{ height: `${peelDepth}%` }}
        />
      </div>

      {/* 2. Cột Icon đại diện từng tầng */}
      <div className="zygoteIconColumn">
        {layers.map((layer) => {
          const isActive = peelDepth >= layer.val - 8;
          return (
            <button
              key={layer.id}
              type="button"
              className={`zygoteIconBtn ${isActive ? 'active' : ''}`}
              onClick={() => onChangePeelDepth(layer.val)}
              title={`${layer.label} (${layer.val}%)`}
              aria-label={layer.label}
            >
              <span className="zygoteSvgWrap">{layer.svg}</span>
            </button>
          );
        })}

        {/* Nút chuyển đổi Nam / Nữ ở chân thanh Zygote */}
        <button
          type="button"
          className="zygoteGenderToggle"
          onClick={onToggleGender}
          title={gender === 'female' ? 'Chuyển sang Cơ thể Nam' : 'Chuyển sang Cơ thể Nữ'}
          aria-label="Toggle gender"
        >
          <span className="zygoteGenderSymbol">
            {gender === 'female' ? '♀' : '♂'}
          </span>
        </button>
      </div>
    </div>
  );
}
