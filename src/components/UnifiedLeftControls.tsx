import { useState } from 'react';
import { useLocale } from '../locale/useLocale';

export interface UnifiedLeftControlsProps {
  // 1. Tall Layer Peeling Slider (Bóc tách tầng cơ thể)
  peelDepth: number; // 0..100
  onChangePeelDepth: (val: number) => void;
  gender: 'male' | 'female';
  onToggleGender: () => void;

  // 2. Merged Tools (3D/2D, Cắt lớp, Tách lớp, Âm thanh)
  mode: '3d' | '2d';
  onChangeMode: (m: '3d' | '2d') => void;
  axis: number;
  onChangeAxis: (axis: number) => void;
  sliceT: number;
  onChangeSliceT: (sliceT: number) => void;
  explode: number;
  onChangeExplode: (exp: number) => void;
  soundOn: boolean;
  onToggleSound: () => void;
}

export default function UnifiedLeftControls({
  peelDepth,
  onChangePeelDepth,
  gender,
  onToggleGender,
  mode,
  onChangeMode,
  axis,
  onChangeAxis,
  sliceT,
  onChangeSliceT,
  explode,
  onChangeExplode,
  soundOn,
  onToggleSound,
}: UnifiedLeftControlsProps) {
  const { t, locale } = useLocale();
  const [showExplodePop, setShowExplodePop] = useState(false);
  const [showSlicePop, setShowSlicePop] = useState(false);

  const layers = [
    {
      id: 'skin',
      val: 100,
      label: locale === 'en' ? 'Skin & Fat' : 'Da & Mô mỡ',
      svg: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <circle cx="12" cy="7" r="4" />
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        </svg>
      ),
    },
    {
      id: 'muscle',
      val: 75,
      label: locale === 'en' ? 'Muscular System' : 'Hệ Cơ bắp',
      svg: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M7 11c1.5-3 5-3 6.5 0 2 0 4 2 4 4.5 0 2.5-2 4.5-4.5 4.5H8C5.5 20 4 18 4 15.5 4 13 5.5 11 7 11z" />
          <path d="M13 11v9" />
        </svg>
      ),
    },
    {
      id: 'skeleton',
      val: 50,
      label: locale === 'en' ? 'Skeletal Frame' : 'Khung Xương',
      svg: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
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
      svg: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M12 4c-3.5 0-6 2.5-6 6 0 5 6 10 6 10s6-5 6-10c0-3.5-2.5-6-6-6z" />
          <circle cx="12" cy="10" r="2" />
        </svg>
      ),
    },
    {
      id: 'circulatory',
      val: 12,
      label: locale === 'en' ? 'Circulatory (Heart)' : 'Tuần Hoàn (Tim mạch)',
      svg: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ),
    },
    {
      id: 'nervous',
      val: 0,
      label: locale === 'en' ? 'Nervous (Brain)' : 'Thần Kinh (Não bộ)',
      svg: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M12 2a5 5 0 0 0-5 5c0 1.5.7 2.9 1.8 3.8A5 5 0 0 0 7 15a5 5 0 0 0 8.5 3.5A5 5 0 0 0 17 15c0-1.6-.7-3-1.8-4A5 5 0 0 0 17 7a5 5 0 0 0-5-5z" />
          <path d="M12 6v12" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="unifiedLeftRail" aria-label="Anatomical Workspace Navigation">
      <div className="unifiedRailCapsule">
        {/* NÚT ĐỔI GIỚI TÍNH Ở ĐỈNH KHỐI CAPSULE */}
        <button
          type="button"
          className="railGenderBtn"
          onClick={onToggleGender}
          title={gender === 'female' ? 'Chuyển sang Cơ thể Nam' : 'Chuyển sang Cơ thể Nữ'}
        >
          <span style={{ color: gender === 'female' ? '#ec4899' : '#3b82f6', fontWeight: 800 }}>
            {gender === 'female' ? '♀' : '♂'}
          </span>
        </button>

        <div className="railSectionDivider" />

        {/* PHẦN BÓC TÁCH TẦNG CƠ THỂ DÀI (TALL LAYER SLIDER) */}
        {mode === '3d' && (
          <div className="railSection layerSection" aria-label={t('slider.title')}>
            <div className="railCapsuleInner">
              {/* Track trượt kéo dài 270px */}
              <div className="railCapsuleTrack">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={peelDepth}
                  onChange={(e) => onChangePeelDepth(Number(e.target.value))}
                  className="railVerticalRange"
                  aria-label={t('slider.title')}
                />
                <div className="railTrackFill" style={{ height: `${peelDepth}%` }} />
              </div>

              {/* Cột Icon các tầng */}
              <div className="railIconCol">
                {layers.map((layer) => {
                  const isActive = peelDepth >= layer.val - 8;
                  return (
                    <button
                      key={layer.id}
                      type="button"
                      className={`railLayerBtn ${isActive ? 'active' : ''}`}
                      onClick={() => onChangePeelDepth(layer.val)}
                      title={`${layer.label} (${layer.val}%)`}
                    >
                      {layer.svg}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="railSectionDivider" />

        {/* PHẦN CÔNG CỤ TÍCH HỢP TRỰC TIẾP TRONG CAPSULE DUY NHẤT */}
        <div className="railSection toolsSection">
          {/* Chế độ 3D / 2D */}
          <div className="railModeGroup">
            <button
              type="button"
              className={`railModeBtn ${mode === '3d' ? 'active' : ''}`}
              onClick={() => onChangeMode('3d')}
              title="Chế độ 3D"
            >
              3D
            </button>
            <button
              type="button"
              className={`railModeBtn ${mode === '2d' ? 'active' : ''}`}
              onClick={() => onChangeMode('2d')}
              title="Chế độ 2D"
            >
              2D
            </button>
          </div>

          {/* Nút Cắt lớp giải phẫu 3D (Mặt phẳng cắt) - Đặt TRÊN tính năng Tách */}
          {mode === '3d' && (
            <button
              type="button"
              className={`railActionPill ${sliceT > 0 || showSlicePop ? 'active' : ''}`}
              onClick={() => {
                setShowSlicePop((v) => !v);
                setShowExplodePop(false);
              }}
              title="Cắt lớp giải phẫu 3D (Mặt phẳng cắt)"
            >
              ✂ <span className="pillText">{locale === 'en' ? 'Slice' : 'Cắt'}</span>
              {sliceT > 0 && <span className="pillBadge">{sliceT}%</span>}
            </button>
          )}

          {/* Nút Tách lớp không gian (Exploded View) */}
          {mode === '3d' && (
            <button
              type="button"
              className={`railActionPill ${explode > 0 || showExplodePop ? 'active' : ''}`}
              onClick={() => {
                setShowExplodePop((v) => !v);
                setShowSlicePop(false);
              }}
              title="Tách rời không gian các hệ"
            >
              ⤢ <span className="pillText">{locale === 'en' ? 'Explode' : 'Tách'}</span>
              {explode > 0 && <span className="pillBadge">{explode}%</span>}
            </button>
          )}

          {/* Âm thanh */}
          <button
            type="button"
            className={`railActionPill ${soundOn ? 'active' : ''}`}
            onClick={onToggleSound}
            title="Âm thanh nhịp tim & hơi thở"
          >
            {soundOn ? '🔊' : '🔇'}
          </button>

          {/* Popover Cắt lớp */}
          {showSlicePop && mode === '3d' && (
            <div className="railFlyoutPanel slicePanel">
              <div className="railFlyoutHead">
                <span>Cắt lớp 3D: <b>{sliceT}%</b></span>
                {sliceT > 0 && (
                  <button type="button" className="railMiniBtn" onClick={() => onChangeSliceT(0)}>
                    0% (Tắt)
                  </button>
                )}
              </div>
              {/* Chọn mặt phẳng cắt */}
              <div className="railSliceAxes">
                <button
                  type="button"
                  className={axis === 0 ? 'active' : ''}
                  onClick={() => onChangeAxis(0)}
                  title="Cắt lát ngang từ đỉnh đầu xuống chân"
                >
                  Ngang
                </button>
                <button
                  type="button"
                  className={axis === 1 ? 'active' : ''}
                  onClick={() => onChangeAxis(1)}
                  title="Cắt lát dọc giữa trái - phải"
                >
                  Dọc
                </button>
                <button
                  type="button"
                  className={axis === 2 ? 'active' : ''}
                  onClick={() => onChangeAxis(2)}
                  title="Cắt lát đứng trước - sau"
                >
                  Đứng
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={sliceT}
                onChange={(e) => onChangeSliceT(Number(e.target.value))}
                className="railRangeInput"
                aria-label="Vị trí mặt phẳng cắt"
              />
              <div className="railExplodePresets">
                <button type="button" onClick={() => onChangeSliceT(0)} className={sliceT === 0 ? 'active' : ''}>0%</button>
                <button type="button" onClick={() => onChangeSliceT(25)} className={sliceT === 25 ? 'active' : ''}>25%</button>
                <button type="button" onClick={() => onChangeSliceT(50)} className={sliceT === 50 ? 'active' : ''}>50%</button>
                <button type="button" onClick={() => onChangeSliceT(75)} className={sliceT === 75 ? 'active' : ''}>75%</button>
              </div>
            </div>
          )}

          {/* Popover Tách lớp */}
          {showExplodePop && mode === '3d' && (
            <div className="railFlyoutPanel explodePanel">
              <div className="railFlyoutHead">
                <span>Tách không gian: <b>{explode}%</b></span>
                {explode > 0 && (
                  <button type="button" className="railMiniBtn" onClick={() => onChangeExplode(0)}>
                    0%
                  </button>
                )}
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={explode}
                onChange={(e) => onChangeExplode(Number(e.target.value))}
                className="railRangeInput"
              />
              <div className="railExplodePresets">
                <button type="button" onClick={() => onChangeExplode(0)} className={explode === 0 ? 'active' : ''}>0%</button>
                <button type="button" onClick={() => onChangeExplode(35)} className={explode === 35 ? 'active' : ''}>35%</button>
                <button type="button" onClick={() => onChangeExplode(70)} className={explode === 70 ? 'active' : ''}>70%</button>
                <button type="button" onClick={() => onChangeExplode(100)} className={explode === 100 ? 'active' : ''}>100%</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
