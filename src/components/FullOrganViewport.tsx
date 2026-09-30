import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ORGAN_BY_ID,
  ORGANS,
  getOrganImages,
  type HotspotDef,
  type OrganDef,
  type OrganId,
} from '../organs/organData';
import { OrganDetailViewer } from '../organs/OrganViewer';
import { useLocale } from '../locale/useLocale';

export interface FullOrganViewportProps {
  organId: OrganId;
  selectedHotspot?: HotspotDef | null;
  onSelectHotspot?: (hotspot: HotspotDef | null) => void;
  externalAxis?: number; // 0: axial, 1: coronal, 2: sagittal
  externalSliceT?: number; // 0..100
}

export default function FullOrganViewport({
  organId,
  selectedHotspot,
  onSelectHotspot,
}: FullOrganViewportProps) {
  const { locale } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<OrganDetailViewer | null>(null);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [crossSection, setCrossSection] = useState(false);
  const [cutAxis, setCutAxis] = useState<'coronal' | 'sagittal' | 'axial'>('coronal');
  const [cutOffset, setCutOffset] = useState(0);
  const [cavityOpen, setCavityOpen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showTools, setShowTools] = useState(false);
  const [showHistology, setShowHistology] = useState(false);

  const organDef: OrganDef = ORGAN_BY_ID[organId] ?? ORGANS[0];

  const onSelectHotspotRef = useRef(onSelectHotspot);
  useEffect(() => {
    onSelectHotspotRef.current = onSelectHotspot;
  }, [onSelectHotspot]);

  // Khởi tạo viewer 3D toàn màn hình - Chạy duy nhất 1 lần khi mount để không bao giờ bị hủy nhầm
  useEffect(() => {
    if (!containerRef.current) return;
    const viewer = new OrganDetailViewer(containerRef.current, {
      onLoading: (l, p) => {
        setLoading(l);
        setProgress(p);
      },
      onSelect: (h) => {
        onSelectHotspotRef.current?.(h);
      },
    });
    viewerRef.current = viewer;

    if (organDef) {
      viewer.setOrgan(organDef.model, organDef.hotspots, organDef.accent, organDef.companionModel);
    }

    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đồng bộ điểm giải phẫu được chọn với 3D viewer
  useEffect(() => {
    if (!viewerRef.current) return;
    viewerRef.current.selectHotspot(selectedHotspot?.id ?? null);
  }, [selectedHotspot]);

  // Nạp mô hình 3D của cơ quan khi organId thay đổi
  const prevOrganIdRef = useRef<string>(organDef.id);
  useEffect(() => {
    if (!viewerRef.current || !organDef) return;
    if (prevOrganIdRef.current === organDef.id) return;
    prevOrganIdRef.current = organDef.id;
    setCrossSection(false);
    setCavityOpen(false);
    setCutOffset(0);
    setShowHistology(false);
    viewerRef.current.setOrgan(organDef.model, organDef.hotspots, organDef.accent, organDef.companionModel);
  }, [organDef]);

  const onToggleCrossSection = useCallback(() => {
    if (!viewerRef.current) return;
    setCrossSection(viewerRef.current.toggleCrossSection());
  }, []);

  const onToggleCavity = useCallback(() => {
    if (!viewerRef.current) return;
    setCavityOpen(viewerRef.current.toggleAnteriorWall());
  }, []);

  const onChangeCutAxis = useCallback((axis: 'coronal' | 'sagittal' | 'axial') => {
    setCutAxis(axis);
    if (!viewerRef.current) return;
    viewerRef.current.setCutAxis(axis);
    if (!crossSection) {
      setCrossSection(viewerRef.current.toggleCrossSection(axis));
    }
  }, [crossSection]);

  const onChangeCutOffset = useCallback((val: number) => {
    setCutOffset(val);
    if (!viewerRef.current) return;
    viewerRef.current.setCutOffset(val);
  }, []);

  const onToggleAutoRotate = useCallback(() => {
    if (!viewerRef.current) return;
    setAutoRotate((prev) => {
      const next = !prev;
      viewerRef.current?.setAutoRotate(next);
      return next;
    });
  }, []);

  const onResetCamera = useCallback(() => {
    viewerRef.current?.reset();
    onSelectHotspot?.(null);
  }, [onSelectHotspot]);

  return (
    <div className="fullOrganViewportRoot" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Khung vẽ 3D chính */}
      <div ref={containerRef} className="fullOrganCanvasContainer" style={{ width: '100%', height: '100%' }} />

      {/* Hiệu ứng tải mô hình */}
      {loading && (
        <div className="loading3d" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="load3d">
            <div className="msg" style={{ letterSpacing: '0.08em' }}>
              {locale === 'en'
                ? `LOADING HIGH-DEF 3D ${organDef.nameEn.toUpperCase()}…`
                : `ĐANG TẢI MÔ HÌNH 3D VI THỂ: ${organDef.name.toUpperCase()}…`}
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--fg-muted)' }}>
              {Math.round(progress * 100)}%
            </div>
          </div>
        </div>
      )}

      {/* Thanh công cụ giải phẫu vi thể nổi tinh gọn (Floating Organ Capsule) */}
      <div className="fullOrganFloatingTools" role="toolbar" aria-label="Organ controls">
        <button
          type="button"
          className={`organToolBtn ${crossSection ? 'active' : ''}`}
          onClick={onToggleCrossSection}
          title={locale === 'en' ? 'Toggle Cross-Section Cut' : 'Mặt cắt giải phẫu vi thể'}
        >
          ✂ {locale === 'en' ? 'Cross-Section' : 'Mặt cắt'}
        </button>

        <button
          type="button"
          className={`organToolBtn ${cavityOpen ? 'active' : ''}`}
          onClick={onToggleCavity}
          title={locale === 'en' ? 'Open Internal Chambers' : 'Mở buồng nội tạng'}
        >
          🫀 {locale === 'en' ? 'Chambers' : 'Mở buồng'}
        </button>

        <button
          type="button"
          className={`organToolBtn ${showHistology ? 'active' : ''}`}
          onClick={() => setShowHistology((v) => !v)}
          title={locale === 'en' ? 'Microscopic Histology Slide' : 'Tiêu bản hiển vi & Lát cắt vi thể'}
        >
          🔬 {locale === 'en' ? 'Histology' : 'Tiêu bản vi thể'}
        </button>

        <button
          type="button"
          className={`organToolBtn ${autoRotate ? 'active' : ''}`}
          onClick={onToggleAutoRotate}
          title={locale === 'en' ? 'Toggle Auto-Rotation' : 'Tự động xoay'}
        >
          🔄 {locale === 'en' ? 'Rotate' : 'Tự xoay'}
        </button>

        <button
          type="button"
          className="organToolBtn"
          onClick={onResetCamera}
          title={locale === 'en' ? 'Reset View Target' : 'Đặt lại góc nhìn'}
        >
          🎯 {locale === 'en' ? 'Reset' : 'Trọng tâm'}
        </button>

        <button
          type="button"
          className={`organToolBtn ${showTools ? 'active' : ''}`}
          onClick={() => setShowTools((v) => !v)}
          title={locale === 'en' ? 'Advanced Slicing Axis' : 'Tuỳ chỉnh trục cắt sâu'}
        >
          ⚙️
        </button>
      </div>

      {/* Hàng nút chọn nhanh điểm giải phẫu (Landmark Chips) */}
      {organDef.hotspots && organDef.hotspots.length > 0 && (
        <div className="fullOrganHotspotChips" role="tablist" aria-label="Mốc giải phẫu">
          <span className="hotspotChipsLabel">
            {locale === 'en' ? 'Landmarks:' : 'Mốc vi thể:'}
          </span>
          {organDef.hotspots.map((h) => {
            const isSelected = selectedHotspot?.id === h.id;
            return (
              <button
                key={h.id}
                type="button"
                className={`hotspotChipBtn ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  if (isSelected) {
                    onSelectHotspot?.(null);
                  } else {
                    onSelectHotspot?.(h);
                  }
                }}
                title={h.detail}
              >
                <span className="chipDot" style={{ background: h.color }} />
                {h.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Panel điều chỉnh trục cắt chi tiết khi bật cross-section hoặc mở cài đặt */}
      {(crossSection || showTools) && (
        <div className="fullOrganSliceDrawer">
          <div className="sliceAxisRow">
            <span className="sliceAxisLabel">{locale === 'en' ? 'Cut Plane:' : 'Mặt phẳng:'}</span>
            <button
              type="button"
              className={`sliceAxisChip ${cutAxis === 'coronal' ? 'active' : ''}`}
              onClick={() => onChangeCutAxis('coronal')}
            >
              Coronal ({locale === 'en' ? 'Frontal' : 'Đứng ngang'})
            </button>
            <button
              type="button"
              className={`sliceAxisChip ${cutAxis === 'sagittal' ? 'active' : ''}`}
              onClick={() => onChangeCutAxis('sagittal')}
            >
              Sagittal ({locale === 'en' ? 'Side' : 'Đứng dọc'})
            </button>
            <button
              type="button"
              className={`sliceAxisChip ${cutAxis === 'axial' ? 'active' : ''}`}
              onClick={() => onChangeCutAxis('axial')}
            >
              Axial ({locale === 'en' ? 'Cross' : 'Ngang'})
            </button>
          </div>
          <div className="sliceSliderRow">
            <span className="sliceAxisLabel">{locale === 'en' ? 'Depth:' : 'Độ sâu cắt:'}</span>
            <input
              type="range"
              min={-2.2}
              max={2.2}
              step={0.02}
              value={cutOffset}
              onChange={(e) => onChangeCutOffset(parseFloat(e.target.value))}
              className="sliceRangeInput"
            />
            <span className="sliceValText">{cutOffset > 0 ? `+${cutOffset.toFixed(2)}` : cutOffset.toFixed(2)}m</span>
          </div>
        </div>
      )}

      {/* Thẻ chú thích nổi giải phẫu vi thể khi người dùng bấm vào mốc trên mô hình */}
      {selectedHotspot && (
        <div className="fullOrganHotspotCard" role="region" aria-label="Thông tin điểm giải phẫu">
          <div className="hotspotCardHeader">
            <div className="hotspotCardTitleGroup">
              <span className="hotspotCardDot" style={{ background: selectedHotspot.color }} />
              <strong className="hotspotCardLabel">{selectedHotspot.label}</strong>
            </div>
            <button
              type="button"
              className="hotspotCardCloseBtn"
              onClick={() => onSelectHotspot?.(null)}
              title={locale === 'en' ? 'Deselect' : 'Bỏ chọn'}
            >
              ✕
            </button>
          </div>
          <p className="hotspotCardDetail">{selectedHotspot.detail}</p>
          <div className="hotspotCardFooter">
            <span className="hotspotCardPos">
              📍 [{selectedHotspot.position.map((v) => v.toFixed(2)).join(', ')}]
            </span>
            <span className="hotspotCardSideNote">
              {locale === 'en' ? 'Full anatomy in right panel →' : 'Hồ sơ đầy đủ ở cột phải →'}
            </span>
          </div>
        </div>
      )}

      {/* Thẻ nổi xem tiêu bản hiển vi / lát cắt vi thể không che lấp mô hình 3D */}
      {showHistology && (
        <div className="fullOrganHistologyModal" role="dialog" aria-label="Tiêu bản hiển vi">
          <div className="histologyModalHeader">
            <div className="histologyModalTitleGroup">
              <span>🔬</span>
              <strong>
                {locale === 'en'
                  ? `Histology & Microscopic Slide: ${organDef.nameEn}`
                  : `Tiêu bản hiển vi: ${organDef.name}`}
              </strong>
            </div>
            <button
              type="button"
              className="histologyModalClose"
              onClick={() => setShowHistology(false)}
              title={locale === 'en' ? 'Close' : 'Đóng'}
            >
              ✕
            </button>
          </div>
          <div className="histologyModalBody">
            <img
              src={getOrganImages(organDef.id).microscopic}
              alt={`Tiêu bản hiển vi ${organDef.name}`}
              className="histologySlideImg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getOrganImages(organDef.id).organ;
              }}
            />
            <div className="histologyCaption">
              <span className="histologyBadge">{organDef.system}</span>
              <p>{organDef.description}</p>
              <small style={{ color: 'var(--muted)' }}>
                {locale === 'en'
                  ? 'High-magnification histological sample (H&E stain)'
                  : 'Lát cắt mô học hiển vi nhuộm HE độ phân giải cao'}
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
