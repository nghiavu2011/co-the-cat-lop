import { useState } from 'react';
import { useLocale } from '../locale/useLocale';

export interface UnifiedLeftControlsProps {
  // 1. Camera Navigation
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetCamera: () => void;
  onOrbit: (dir: 'up' | 'down' | 'left' | 'right') => void;
  onPresetAngle: (angle: 'front' | 'back' | 'left' | 'right' | 'top') => void;

  // 2. Layer Slider
  peelDepth: number; // 0..100
  onChangePeelDepth: (val: number) => void;
  gender: 'male' | 'female';
  onToggleGender: () => void;

  // 3. Consolidated Mode & Tools (Sát nhập từ thanh đáy cũ)
  mode: '3d' | '2d' | 'detail';
  onChangeMode: (m: '3d' | '2d' | 'detail') => void;
  showSlice: boolean;
  onToggleSlice: () => void;
  sliceAxis: number;
  onCycleAxis: () => void;
  sliceT: number;
  onChangeSliceT: (t: number) => void;
  sliceName: string;
  sliceHeightCm: number;

  // 4. Exploded View (Tách lớp không gian)
  explode: number;
  onChangeExplode: (exp: number) => void;

  // 5. Sound
  soundOn: boolean;
  onToggleSound: () => void;
}

export default function UnifiedLeftControls({
  onZoomIn,
  onZoomOut,
  onResetCamera,
  onOrbit,
  onPresetAngle,
  peelDepth,
  onChangePeelDepth,
  gender,
  onToggleGender,
  mode,
  onChangeMode,
  showSlice,
  onToggleSlice,
  sliceAxis,
  onCycleAxis,
  sliceT,
  onChangeSliceT,
  sliceName,
  sliceHeightCm,
  explode,
  onChangeExplode,
  soundOn,
  onToggleSound,
}: UnifiedLeftControlsProps) {
  const { t, locale } = useLocale();
  const [showAngles, setShowAngles] = useState(false);
  const [showExplodePop, setShowExplodePop] = useState(false);

  const angles = [
    { id: 'front' as const, label: locale === 'en' ? 'Front' : 'Trước' },
    { id: 'back' as const, label: locale === 'en' ? 'Back' : 'Sau' },
    { id: 'left' as const, label: locale === 'en' ? 'Left' : 'Trái' },
    { id: 'right' as const, label: locale === 'en' ? 'Right' : 'Phải' },
    { id: 'top' as const, label: locale === 'en' ? 'Top' : 'Đỉnh' },
  ];

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
      {/* KHỐI 1: ĐIỀU HƯỚNG CAMERA (D-PAD & ZOOM) */}
      <div className="railCard cameraCard">
        <div className="railDpad">
          <button
            type="button"
            className="railDpadBtn up"
            onClick={() => onOrbit('up')}
            title="Nghiêng lên"
          >
            ▲
          </button>
          <div className="railDpadRow">
            <button
              type="button"
              className="railDpadBtn left"
              onClick={() => onOrbit('left')}
              title="Xoay trái"
            >
              ◀
            </button>
            <button
              type="button"
              className="railDpadBtn home"
              onClick={onResetCamera}
              title="Đặt lại góc nhìn chuẩn (Home)"
            >
              ⌂
            </button>
            <button
              type="button"
              className="railDpadBtn right"
              onClick={() => onOrbit('right')}
              title="Xoay phải"
            >
              ▶
            </button>
          </div>
          <button
            type="button"
            className="railDpadBtn down"
            onClick={() => onOrbit('down')}
            title="Nghiêng xuống"
          >
            ▼
          </button>
        </div>

        <div className="railZoomRow">
          <button type="button" className="railZoomBtn" onClick={onZoomIn} title="Phóng to (+)">
            +
          </button>
          <button type="button" className="railZoomBtn" onClick={onZoomOut} title="Thu nhỏ (−)">
            −
          </button>
          <button
            type="button"
            className={`railAngleBtn ${showAngles ? 'active' : ''}`}
            onClick={() => setShowAngles((v) => !v)}
            title="Góc nhìn chuẩn y khoa"
          >
            📐
          </button>
        </div>

        {/* Menu góc nhìn thả sang phải */}
        {showAngles && (
          <div className="railFlyoutMenu">
            <div className="railFlyoutTitle">Góc nhìn</div>
            {angles.map((a) => (
              <button
                key={a.id}
                type="button"
                className="railFlyoutItem"
                onClick={() => {
                  onPresetAngle(a.id);
                  setShowAngles(false);
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* KHỐI 2: THANH BÓC TÁCH TẦNG CƠ THỂ ZYGOTE CAPSULE */}
      {mode === '3d' && (
        <div className="railCard layerCard" aria-label={t('slider.title')}>
          <div className="railCapsuleInner">
            {/* Track trượt mượt mà */}
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

              {/* Nút đổi Giới tính Nam / Nữ */}
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
            </div>
          </div>
        </div>
      )}

      {/* KHỐI 3: THANH CÔNG CỤ TÍCH HỢP (SÁT NHẬP TỪ ĐÁY: 3D/2D, CẮT LỚP, TÁCH LỚP, ÂM THANH) */}
      <div className="railCard toolsCard">
        {/* Nhóm chọn View Mode */}
        <div className="railModeGroup">
          <button
            type="button"
            className={`railModeBtn ${mode === '3d' ? 'active' : ''}`}
            onClick={() => onChangeMode('3d')}
            title="Chế độ giải phẫu không gian 3D"
          >
            3D
          </button>
          <button
            type="button"
            className={`railModeBtn ${mode === '2d' ? 'active' : ''}`}
            onClick={() => onChangeMode('2d')}
            title="Chế độ sơ đồ mặt phẳng 2D"
          >
            2D
          </button>
        </div>

        {/* Nút Cắt lớp CT/MRI */}
        <button
          type="button"
          className={`railActionPill ${showSlice ? 'active' : ''}`}
          onClick={onToggleSlice}
          title="Mặt phẳng cắt lớp CT/MRI không gian"
        >
          ✂️ <span className="pillText">{locale === 'en' ? 'Slice' : 'Cắt lớp'}</span>
        </button>

        {/* Nút Bóc tách không gian (Exploded View) */}
        {mode === '3d' && (
          <button
            type="button"
            className={`railActionPill ${explode > 0 || showExplodePop ? 'active' : ''}`}
            onClick={() => setShowExplodePop((v) => !v)}
            title="Bóc tách / Tách rời các hệ cơ quan ra xa nhau theo không gian"
          >
            ⤢ <span className="pillText">{locale === 'en' ? 'Explode' : 'Tách lớp'}</span>
            {explode > 0 && <span className="pillBadge">{explode}%</span>}
          </button>
        )}

        {/* Nút Âm thanh sinh học */}
        <button
          type="button"
          className={`railActionPill ${soundOn ? 'active' : ''}`}
          onClick={onToggleSound}
          title="Âm thanh nhịp tim & hơi thở sinh học"
        >
          {soundOn ? '🔊' : '🔇'}
        </button>

        {/* Popover điều khiển thanh trượt Cắt lớp (hiển thị bay ra cạnh phải) */}
        {showSlice && mode === '3d' && (
          <div className="railFlyoutPanel slicePanel">
            <div className="railFlyoutHead">
              <span>{sliceName}: <b>{sliceHeightCm.toFixed(0)} cm</b></span>
              <button type="button" className="railMiniBtn" onClick={onCycleAxis}>
                Trục ({sliceAxis === 0 ? 'Z' : sliceAxis === 1 ? 'Y' : 'X'})
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
            />
          </div>
        )}

        {/* Popover điều khiển Tách lớp không gian (Exploded View) */}
        {showExplodePop && mode === '3d' && (
          <div className="railFlyoutPanel explodePanel">
            <div className="railFlyoutHead">
              <span>Tách rời không gian: <b>{explode}%</b></span>
              {explode > 0 && (
                <button type="button" className="railMiniBtn" onClick={() => onChangeExplode(0)}>
                  0% (Gom lại)
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
    </aside>
  );
}
