import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NOTE_TO_ORGAN,
  ORGAN_BY_ID,
  ORGAN_TO_NOTE,
  ORGANS,
  getOrganImages,
  type HotspotDef,
  type OrganDef,
  type OrganId,
} from '../organs/organData';
import { PHYSICAL_MECHANISMS } from '../content/insights';
import { OrganDetailViewer } from '../organs/OrganViewer';

interface Props {
  /** noteId from co-the-cat-lop selection system */
  noteId: string | null;
  onSelectNote?: (noteId: string) => void;
}

type GalleryView = '3d' | 'organ' | 'location' | 'microscopic' | 'compare' | 'simulation';

export default function OrganDetail({ noteId, onSelectNote }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<OrganDetailViewer | null>(null);

  // Determine active organId: from noteId if matched, otherwise default to 'heart'
  const matchedOrganId = useMemo(() => {
    if (noteId && noteId in NOTE_TO_ORGAN) {
      return NOTE_TO_ORGAN[noteId];
    }
    return 'heart' as OrganId;
  }, [noteId]);

  const [currentOrganId, setCurrentOrganId] = useState<OrganId>(matchedOrganId);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotDef | null>(null);
  const [crossSection, setCrossSection] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [cavityOpen, setCavityOpen] = useState(false);
  const [cutAxis, setCutAxis] = useState<'coronal' | 'sagittal' | 'axial'>('coronal');
  const [cutOffset, setCutOffset] = useState(0);
  const [activeTab, setActiveTab] = useState<GalleryView>('3d');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  // Update currentOrganId when noteId changes externally
  useEffect(() => {
    if (noteId && noteId in NOTE_TO_ORGAN) {
      setCurrentOrganId(NOTE_TO_ORGAN[noteId]);
    }
  }, [noteId]);

  const organDef: OrganDef = ORGAN_BY_ID[currentOrganId] ?? ORGANS[0];
  const images = useMemo(() => getOrganImages(currentOrganId), [currentOrganId]);
  const primaryNoteId = ORGAN_TO_NOTE[currentOrganId];
  const mech = primaryNoteId ? PHYSICAL_MECHANISMS[primaryNoteId] : null;

  // Handle Esc to exit fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        setLeftDrawerOpen(false);
        setRightDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  // Init 3D viewer
  useEffect(() => {
    if (!containerRef.current) return;
    const viewer = new OrganDetailViewer(containerRef.current, {
      onLoading: (l, p) => {
        setLoading(l);
        setProgress(p);
      },
      onSelect: (h) => setSelectedHotspot(h),
    });
    viewerRef.current = viewer;

    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
  }, []);

  // Load organ into 3D viewer when currentOrganId changes
  useEffect(() => {
    if (!viewerRef.current || !organDef) return;
    setSelectedHotspot(null);
    setCrossSection(false);
    setWireframe(false);
    setCavityOpen(false);
    setCutOffset(0);
    viewerRef.current.setOrgan(organDef.model, organDef.hotspots, organDef.accent);
  }, [organDef]);

  const handleOrganSelect = (id: OrganId) => {
    setCurrentOrganId(id);
    const linkedNote = ORGAN_TO_NOTE[id];
    if (linkedNote && onSelectNote) {
      onSelectNote(linkedNote);
    }
  };

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

  const onChangeCutOffset = useCallback((offset: number) => {
    setCutOffset(offset);
    if (!viewerRef.current) return;
    viewerRef.current.setCutOffset(offset);
  }, []);

  const onToggleWireframe = useCallback(() => {
    if (!viewerRef.current) return;
    setWireframe(viewerRef.current.toggleWireframe());
  }, []);

  const onToggleAutoRotate = useCallback(() => {
    if (!viewerRef.current) return;
    const next = !autoRotate;
    setAutoRotate(next);
    viewerRef.current.setAutoRotate(next);
  }, [autoRotate]);

  const onReset = useCallback(() => {
    viewerRef.current?.reset();
    setCrossSection(false);
    setWireframe(false);
    setCavityOpen(false);
    setCutOffset(0);
    setSelectedHotspot(null);
  }, []);

  const onHotspotClick = (h: HotspotDef) => {
    if (selectedHotspot?.id === h.id) {
      setSelectedHotspot(null);
      viewerRef.current?.selectHotspot(null);
    } else {
      setSelectedHotspot(h);
      viewerRef.current?.selectHotspot(h.id);
      if (activeTab !== '3d') setActiveTab('3d');
    }
  };

  // Touch gesture swipe detection in fullscreen
  const touchStartRef = useRef({ x: 0, y: 0 });
  const onFsTouchStart = (e: React.TouchEvent) => {
    if (!isFullscreen || e.touches.length !== 1) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onFsTouchEnd = (e: React.TouchEvent) => {
    if (!isFullscreen) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx > 0) {
        // Swipe left to right
        if (touchStartRef.current.x < 120) setLeftDrawerOpen(true);
        if (rightDrawerOpen) setRightDrawerOpen(false);
      } else {
        // Swipe right to left
        if (touchStartRef.current.x > window.innerWidth - 120) setRightDrawerOpen(true);
        if (leftDrawerOpen) setLeftDrawerOpen(false);
      }
    }
  };

  // Mouse hover detection near screen edges in fullscreen
  const onFsMouseMove = (e: React.MouseEvent) => {
    if (!isFullscreen) return;
    const x = e.clientX;
    const w = window.innerWidth;
    if (x < 24) setLeftDrawerOpen(true);
    if (x > w - 24) setRightDrawerOpen(true);
  };

  // Medical Info Card component (reused in both standard and fullscreen drawer)
  const renderInfoContent = () => (
    <>
      <div className="organDetailHeader">
        <span className="organDetailIcon" style={{ color: organDef.accent }}>
          {organDef.icon}
        </span>
        <div>
          <h3>{organDef.name}</h3>
          <span className="organDetailSys">
            {organDef.system} · <em>{organDef.nameEn}</em>
          </span>
        </div>
      </div>

      <p className="organDetailDesc">{organDef.description}</p>

      {mech && (
        <div className="organDetailMech">
          <div className="mechHead">
            <span className="mechBadge">⚙️ Cơ chế vật lý</span>
            <span className="mechRole">{mech.role}</span>
          </div>
          <p className="mechPrinciple">{mech.principle}</p>
        </div>
      )}

      {/* Key Facts */}
      <div className="organDetailSectionTitle">📊 Thông số & Đặc điểm sinh học</div>
      <dl className="organDetailFacts">
        <div>
          <dt>Kích thước</dt>
          <dd>{organDef.size}</dd>
        </div>
        <div>
          <dt>Trọng lượng</dt>
          <dd>{organDef.weight}</dd>
        </div>
        <div>
          <dt>Vị trí</dt>
          <dd>{organDef.location}</dd>
        </div>
        <div>
          <dt>Chức năng chính</dt>
          <dd>{organDef.function}</dd>
        </div>
        <div>
          <dt>Hoạt động mỗi ngày</dt>
          <dd>{organDef.dailyFact}</dd>
        </div>
        <div>
          <dt>Cấp máu nuôi dưỡng</dt>
          <dd>{organDef.bloodSupply}</dd>
        </div>
      </dl>

      {/* Fun Fact */}
      <div className="organDetailFun">
        <strong>💡 Bạn có biết?</strong>
        <p>{organDef.funFact}</p>
      </div>

      {/* Common Medical Conditions */}
      <div className="organDetailConditions">
        <div className="organDetailSectionTitle">🏥 Bệnh lý thường gặp ({organDef.conditions.length})</div>
        <div className="organConditionsList">
          {organDef.conditions.map((c) => (
            <span key={c} className="organConditionTag">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Hotspot Markers List */}
      <div className="organDetailHotspots">
        <div className="organDetailSectionTitle">
          📍 Mốc cấu trúc giải phẫu ({organDef.hotspots.length})
        </div>
        <div className="organDetailHotspotList">
          {organDef.hotspots.map((h) => {
            const isActive = selectedHotspot?.id === h.id;
            return (
              <button
                key={h.id}
                type="button"
                className={`organDetailHotspotItem${isActive ? ' active' : ''}`}
                onClick={() => onHotspotClick(h)}
              >
                <span className="organDetailHotspotDot" style={{ background: h.color }} />
                <span className="organHotspotLabel">{h.label}</span>
                <small className="organHotspotDetail">{h.detail}</small>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <div
      className={`organDetailContainer${isFullscreen ? ' isFullscreen' : ''}`}
      onTouchStart={onFsTouchStart}
      onTouchEnd={onFsTouchEnd}
      onMouseMove={onFsMouseMove}
    >
      {/* Standard Organ Selector Bar (hidden in fullscreen) */}
      {!isFullscreen && (
        <div className="organSelectorBar" role="tablist" aria-label="Danh sách 11 cơ quan 3D">
          {ORGANS.map((item) => {
            const isSelected = item.id === currentOrganId;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`organPill${isSelected ? ' isSelected' : ''}`}
                style={{ '--organ-accent': item.accent } as React.CSSProperties}
                onClick={() => handleOrganSelect(item.id)}
              >
                <span className="organPillIcon">{item.icon}</span>
                <span className="organPillName">{item.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Floating Header & Edge Trigger Handles */}
      {isFullscreen && (
        <>
          <div className="fsTopBar">
            <div className="fsOrganBadge" style={{ borderColor: organDef.accent }}>
              <span style={{ color: organDef.accent }}>{organDef.icon}</span>
              <strong>{organDef.name}</strong>
              <small>({organDef.nameEn})</small>
            </div>
            <button
              type="button"
              className="fsExitBtn"
              onClick={() => {
                setIsFullscreen(false);
                setLeftDrawerOpen(false);
                setRightDrawerOpen(false);
              }}
              title="Thoát toàn màn hình (Phím Esc)"
            >
              ✕ Thu nhỏ (Esc)
            </button>
          </div>

          {/* Left Edge Tab Trigger */}
          <button
            type="button"
            className={`fsEdgeTrigger fsTriggerLeft${leftDrawerOpen ? ' active' : ''}`}
            onClick={() => setLeftDrawerOpen(!leftDrawerOpen)}
            onMouseEnter={() => setLeftDrawerOpen(true)}
            title="Mở danh sách 11 cơ quan"
          >
            <span>◀ 11 Cơ quan</span>
          </button>

          {/* Right Edge Tab Trigger */}
          <button
            type="button"
            className={`fsEdgeTrigger fsTriggerRight${rightDrawerOpen ? ' active' : ''}`}
            onClick={() => setRightDrawerOpen(!rightDrawerOpen)}
            onMouseEnter={() => setRightDrawerOpen(true)}
            title="Mở bảng thông tin giải phẫu"
          >
            <span>Thông tin ▶</span>
          </button>

          {/* Left Sliding Drawer */}
          <div
            className={`fsDrawer fsDrawerLeft${leftDrawerOpen ? ' isOpen' : ''}`}
            onMouseLeave={() => setLeftDrawerOpen(false)}
          >
            <div className="fsDrawerHead">
              <span>11 Cơ quan & Hệ sinh dục</span>
              <button type="button" className="fsDrawerClose" onClick={() => setLeftDrawerOpen(false)}>
                ✕
              </button>
            </div>
            <div className="fsDrawerOrgansList">
              {ORGANS.map((item) => {
                const isSelected = item.id === currentOrganId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`fsOrganItem${isSelected ? ' isSelected' : ''}`}
                    style={{ '--organ-accent': item.accent } as React.CSSProperties}
                    onClick={() => {
                      handleOrganSelect(item.id);
                      setLeftDrawerOpen(false);
                    }}
                  >
                    <span className="fsOrganIcon">{item.icon}</span>
                    <div className="fsOrganNames">
                      <strong>{item.name}</strong>
                      <small>{item.system}</small>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Sliding Drawer */}
          <div
            className={`fsDrawer fsDrawerRight${rightDrawerOpen ? ' isOpen' : ''}`}
            onMouseLeave={() => setRightDrawerOpen(false)}
          >
            <div className="fsDrawerHead">
              <span>Giải phẫu & Bệnh lý: {organDef.name}</span>
              <button type="button" className="fsDrawerClose" onClick={() => setRightDrawerOpen(false)}>
                ✕
              </button>
            </div>
            <div className="fsDrawerContent">{renderInfoContent()}</div>
          </div>

          {/* Backdrop overlay to close drawers on mobile tap */}
          {(leftDrawerOpen || rightDrawerOpen) && (
            <div
              className="fsDrawerBackdrop"
              onClick={() => {
                setLeftDrawerOpen(false);
                setRightDrawerOpen(false);
              }}
            />
          )}
        </>
      )}

      <div className="organDetailLayout">
        {/* Left / Center: Interactive 3D Visualizer + Visual Gallery */}
        <div className="organDetailStage">
          {/* Gallery View Switcher */}
          <div className="organViewSwitch">
            <button
              type="button"
              className={`organViewTab${activeTab === '3d' ? ' active' : ''}`}
              onClick={() => setActiveTab('3d')}
            >
              🧊 Mô hình 3D xoay 360°
            </button>
            {currentOrganId === 'uterus' && (
              <button
                type="button"
                className={`organViewTab${activeTab === 'simulation' ? ' active' : ''}`}
                onClick={() => setActiveTab('simulation')}
                style={{
                  background: activeTab === 'simulation' ? 'rgba(233, 30, 99, 0.18)' : undefined,
                  borderColor: activeTab === 'simulation' ? '#e91e63' : undefined,
                  color: activeTab === 'simulation' ? '#f06292' : undefined,
                  fontWeight: 600,
                }}
              >
                👶 Mô phỏng sinh đường âm đạo (3D)
              </button>
            )}
            <button
              type="button"
              className={`organViewTab${activeTab === 'organ' ? ' active' : ''}`}
              onClick={() => setActiveTab('organ')}
            >
              🖼️ Giải phẫu
            </button>
            <button
              type="button"
              className={`organViewTab${activeTab === 'location' ? ' active' : ''}`}
              onClick={() => setActiveTab('location')}
            >
              📍 Vị trí
            </button>
            <button
              type="button"
              className={`organViewTab${activeTab === 'microscopic' ? ' active' : ''}`}
              onClick={() => setActiveTab('microscopic')}
            >
              🔬 Vi thể tế bào
            </button>
            <button
              type="button"
              className={`organViewTab${activeTab === 'compare' ? ' active' : ''}`}
              onClick={() => setActiveTab('compare')}
            >
              ⚖️ So sánh
            </button>
          </div>

          <div
            className="organViewportWrapper"
            onClick={() => {
              if (isFullscreen) {
                setLeftDrawerOpen(false);
                setRightDrawerOpen(false);
              }
            }}
          >
            {/* 3D Canvas */}
            <div
              className="organDetailViewer"
              ref={containerRef}
              style={{ display: activeTab === '3d' ? 'block' : 'none' }}
            >
              {loading && (
                <div className="organDetailLoading">
                  <div className="organDetailLoadBar" style={{ width: `${Math.round(progress * 100)}%` }} />
                  <span>ĐANG TẢI 3D ({Math.round(progress * 100)}%)…</span>
                </div>
              )}
            </div>

            {/* BioDigital 3D Vaginal Delivery Simulation */}
            {activeTab === 'simulation' && (
              <div
                className="organSimulationDisplay"
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#0a0a0c',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '8px 14px',
                    background: 'rgba(233, 30, 99, 0.12)',
                    borderBottom: '1px solid rgba(233, 30, 99, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: '#f06292', fontWeight: 600 }}>
                    👶 Demo Mô phỏng 3D: Sinh đường âm đạo (Vaginal Delivery) · BioDigital Human & Cẩm nang MSD
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: 11 }}>
                    Chuột trái: xoay 360° · Lăn chuột: zoom · Nút Dissect: bóc tách lớp
                  </span>
                </div>
                <iframe
                  src="https://human.biodigital.com/widget/?m=production/femaleAdult/vaginal_birth_v02.json&s=female&camera=-21.329,5.256,8.685,1.877,11.005,7.57,-0.24,0.971,0.011&initial.hand-hint=true&ui-fullscreen=true&ui-center=false&ui-dissect=true&ui-zoom=true&ui-help=true&ui-tools-display=primary&ui-info=true&uaid=3YgUf"
                  title="Sinh đường âm đạo - 3D BioDigital Human"
                  style={{ width: '100%', height: 'calc(100% - 37px)', border: 'none' }}
                  loading="lazy"
                  allow="fullscreen"
                  sandbox="allow-modals allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
                />
              </div>
            )}

            {/* Medical Image Previews */}
            {activeTab !== '3d' && activeTab !== 'simulation' && (
              <div className="organImageDisplay">
                <img
                  src={images[activeTab]}
                  alt={`${organDef.name} - ${activeTab}`}
                  className="organDisplayImg"
                  loading="lazy"
                />
                <div className="organImgCaption">
                  {activeTab === 'organ' && `Hình minh họa giải phẫu chi tiết: ${organDef.name} (${organDef.nameEn})`}
                  {activeTab === 'location' && `Vị trí và tương quan giải phẫu không gian: ${organDef.name}`}
                  {activeTab === 'microscopic' && `Hình ảnh vi thể mô học và cấu trúc tế bào: ${organDef.name}`}
                  {activeTab === 'compare' && `Tương quan tỷ lệ kích thước và hình thái so sánh: ${organDef.name}`}
                </div>
              </div>
            )}

            {/* 3D Control overlay */}
            {activeTab === '3d' && (
              <div className="organDetailTools">
                {currentOrganId === 'uterus' && (
                  <button
                    type="button"
                    className={`tg${cavityOpen ? ' active' : ''}`}
                    aria-pressed={cavityOpen}
                    onClick={onToggleCavity}
                    style={{
                      borderColor: cavityOpen ? '#e91e63' : undefined,
                      color: cavityOpen ? '#f06292' : undefined,
                      fontWeight: 600,
                    }}
                    title="Bóc thành trước để nhìn thấy toàn bộ buồng tử cung, nội mạc và kênh cổ tử cung"
                  >
                    🩺 {cavityOpen ? 'Đóng thành trước' : 'Mở lòng tử cung'}
                  </button>
                )}
                <button
                  type="button"
                  className={`tg${crossSection ? ' active' : ''}`}
                  aria-pressed={crossSection}
                  onClick={onToggleCrossSection}
                  title="Cắt mặt phẳng để nhìn cấu trúc bên trong"
                >
                  ✂️ {crossSection ? `Mặt cắt (${cutAxis === 'coronal' ? 'Đứng ngang' : cutAxis === 'sagittal' ? 'Dọc giữa' : 'Ngang'})` : 'Mặt cắt 3D'}
                </button>
                {crossSection && (
                  <div className="organCutControls">
                    <button
                      type="button"
                      className={`tgMini${cutAxis === 'coronal' ? ' active' : ''}`}
                      onClick={() => onChangeCutAxis('coronal')}
                      title="Mặt phẳng đứng ngang (Coronal) - trước/sau"
                    >
                      Đứng ngang
                    </button>
                    <button
                      type="button"
                      className={`tgMini${cutAxis === 'sagittal' ? ' active' : ''}`}
                      onClick={() => onChangeCutAxis('sagittal')}
                      title="Mặt phẳng dọc giữa (Sagittal) - trái/phải"
                    >
                      Dọc giữa
                    </button>
                    <button
                      type="button"
                      className={`tgMini${cutAxis === 'axial' ? ' active' : ''}`}
                      onClick={() => onChangeCutAxis('axial')}
                      title="Mặt phẳng cắt ngang (Axial) - trên/dưới"
                    >
                      Ngang
                    </button>
                    <input
                      type="range"
                      min={-1.5}
                      max={1.5}
                      step={0.05}
                      value={cutOffset}
                      onChange={(e) => onChangeCutOffset(parseFloat(e.target.value))}
                      style={{ width: '65px', cursor: 'pointer' }}
                      title="Độ sâu mặt phẳng cắt"
                    />
                  </div>
                )}
                <button
                  type="button"
                  className="tg"
                  aria-pressed={wireframe}
                  onClick={onToggleWireframe}
                  title="Hiển thị lưới đa giác 3D"
                >
                  🕸️ Khung dây
                </button>
                <button
                  type="button"
                  className="tg"
                  aria-pressed={autoRotate}
                  onClick={onToggleAutoRotate}
                  title="Tự động xoay quanh trục"
                >
                  🔄 {autoRotate ? 'Dừng xoay' : 'Tự xoay'}
                </button>
                <button
                  type="button"
                  className="tg"
                  onClick={onReset}
                  title="Đặt lại góc nhìn ban đầu"
                >
                  ↺ Đặt lại
                </button>
                <button
                  type="button"
                  className={`tg fsToggleBtn${isFullscreen ? ' active' : ''}`}
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? 'Thu nhỏ lại (Esc)' : 'Xem toàn màn hình không bị che chắn'}
                >
                  {isFullscreen ? '✕ Thu nhỏ' : '⛶ Toàn màn hình'}
                </button>
              </div>
            )}

            {/* Hotspot callout info popup */}
            {activeTab === '3d' && selectedHotspot && (
              <div className="organDetailCallout" style={{ borderLeftColor: selectedHotspot.color }}>
                <div className="organCalloutHead">
                  <span className="organCalloutDot" style={{ background: selectedHotspot.color }} />
                  <strong>{selectedHotspot.label}</strong>
                </div>
                <p>{selectedHotspot.detail}</p>
                <button
                  type="button"
                  className="organCalloutClose"
                  onClick={() => {
                    setSelectedHotspot(null);
                    viewerRef.current?.selectHotspot(null);
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="organHintText">
            {'ontouchstart' in window ? (
              <>1 ngón: <b>xoay 360°</b> · 2 ngón: <b>zoom & kéo Pan</b> · Chạm điểm sáng: <b>xem cấu trúc</b> · Bấm <b>⛶</b> để xem toàn màn hình</>
            ) : (
              <>Chuột trái: <b>xoay 360°</b> · Chuột phải / Shift: <b>kéo Pan</b> · Lăn chuột: <b>phóng to/thu nhỏ</b> · Nhấp điểm sáng: <b>xem cấu trúc</b> · Bấm <b>⛶ Toàn màn hình</b></>
            )}
          </div>
        </div>

        {/* Right: Comprehensive Medical & Functional Info (visible in standard mode) */}
        {!isFullscreen && <div className="organDetailInfo">{renderInfoContent()}</div>}
      </div>
    </div>
  );
}
