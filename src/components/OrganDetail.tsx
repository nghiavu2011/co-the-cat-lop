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

type GalleryView = '3d' | 'organ' | 'location' | 'microscopic' | 'compare';

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
  const [activeTab, setActiveTab] = useState<GalleryView>('3d');

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

  return (
    <div className="organDetailContainer">
      {/* Selector Pills for all 9 organs */}
      <div className="organSelectorBar" role="tablist" aria-label="Danh sách 9 nội tạng 3D">
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

          <div className="organViewportWrapper">
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

            {/* Medical Image Previews */}
            {activeTab !== '3d' && (
              <div className="organImageDisplay">
                <img
                  src={images[activeTab]}
                  alt={`${organDef.name} - ${activeTab}`}
                  className="organDisplayImg"
                  loading="lazy"
                />
                <div className="organImgCaption">
                  {activeTab === 'organ' && `Hình minh họa giải phẫu chi tiết: ${organDef.name} (${organDef.nameEn})`}
                  {activeTab === 'location' && `Vị trí và tương quan giải phẫu trong lồng ngực/khoang bụng: ${organDef.name}`}
                  {activeTab === 'microscopic' && `Hình ảnh vi thể mô học và cấu trúc tế bào: ${organDef.name}`}
                  {activeTab === 'compare' && `Tương quan tỷ lệ kích thước so với các cơ quan lân cận`}
                </div>
              </div>
            )}

            {/* 3D Control overlay */}
            {activeTab === '3d' && (
              <div className="organDetailTools">
                <button
                  type="button"
                  className="tg"
                  aria-pressed={crossSection}
                  onClick={onToggleCrossSection}
                  title="Cắt mặt phẳng dọc để nhìn bên trong"
                >
                  ✂️ Cắt dọc
                </button>
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
            💡 Dùng chuột hoặc 1 ngón tay để xoay 360° · Cuộn chuột hoặc chụm 2 ngón để phóng to/thu nhỏ · Nhấp vào điểm phát sáng để xem cấu trúc
          </div>
        </div>

        {/* Right: Comprehensive Medical & Functional Info */}
        <div className="organDetailInfo">
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
        </div>
      </div>
    </div>
  );
}
