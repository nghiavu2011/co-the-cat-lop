import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ORGAN_BY_ID,
  ORGANS,
  type HotspotDef,
  type OrganDef,
  type OrganId,
} from '../organs/organData';
import { OrganDetailViewer } from '../organs/OrganViewer';
import { useLocale } from '../locale/useLocale';

export interface FullOrganViewportProps {
  organId: OrganId;
  onSelectHotspot?: (hotspot: HotspotDef | null) => void;
  externalAxis?: number; // 0: axial, 1: coronal, 2: sagittal
  externalSliceT?: number; // 0..100
}

export default function FullOrganViewport({
  organId,
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

  const organDef: OrganDef = ORGAN_BY_ID[organId] ?? ORGANS[0];

  // Khởi tạo viewer 3D toàn màn hình
  useEffect(() => {
    if (!containerRef.current) return;
    const viewer = new OrganDetailViewer(containerRef.current, {
      onLoading: (l, p) => {
        setLoading(l);
        setProgress(p);
      },
      onSelect: (h) => {
        onSelectHotspot?.(h);
      },
    });
    viewerRef.current = viewer;

    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
  }, [onSelectHotspot]);

  // Nạp mô hình 3D của cơ quan khi organId thay đổi
  useEffect(() => {
    if (!viewerRef.current || !organDef) return;
    setCrossSection(false);
    setCavityOpen(false);
    setCutOffset(0);
    viewerRef.current.setOrgan(organDef.model, organDef.hotspots, organDef.accent);
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
  }, []);

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
    </div>
  );
}
