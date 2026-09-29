import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar';
import Peel2D from './components/Peel2D';
import View3D, { AXES, sliceValue } from './components/View3D';
import InfoPanel from './components/InfoPanel';
import TourBar from './components/TourBar';
import OrganDetail from './components/OrganDetail';
import CoffeeModal from './components/CoffeeModal';
import SideDonateWidget from './components/SideDonateWidget';
import AdminDashboard from './components/AdminDashboard';
import LayerSlider from './components/LayerSlider';
import ContextActionHUD from './components/ContextActionHUD';
import CameraControlsHUD from './components/CameraControlsHUD';
import TopBarZygote from './components/TopBarZygote';
import LocaleProvider from './locale/LocaleProvider';
import { useLocale } from './locale/useLocale';
import {
  initTelemetrySession,
  trackGenderChoice,
  trackMode,
  trackOrganView,
  trackSearch,
} from './telemetry';
import { NOTE_TO_ORGAN } from './organs/organData';
import { useAtlas } from './data/useAtlas';
import { NOTE_BY_ID } from './content/notes';
import { TOURS, type Tour } from './content/tours';
import { playBreath, playHeartbeat, stopBodySound } from './audio/bodySounds';
import { readUrlState, writeUrlState } from './urlState';
import type { SystemId } from './data/types';
import type { Selection } from './selection';

const LUNG_NOTE_IDS = new Set(['phoiphai', 'phoitrai']);

type Mode = '2d' | '3d' | 'detail';

interface ActiveTour {
  tour: Tour;
  stepIndex: number;
}

function AppInner() {
  const { t, locale } = useLocale();
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const { atlas, error: atlasError } = useAtlas(gender);

  const initialUrl = useMemo(() => readUrlState(), []);
  const [mode, setMode] = useState<Mode>(initialUrl.mode ?? '3d');
  const [axis, setAxis] = useState(0);
  const [sliceT, setSliceT] = useState(0);
  const [activeSystem, setActiveSystem] = useState<SystemId | null>(initialUrl.activeSystem ?? null);
  const [selection, setSelection] = useState<Selection | null>(
    initialUrl.selection ?? { kind: 'note', id: 'tim' },
  );
  const [query, setQuery] = useState('');
  const depth = 4;
  const showLabels = true;
  const showGhost = true;
  const onlySystem = false;
  const [, setShareStatus] = useState<string | null>(null);
  const [, setCounts] = useState<{ visible: number; total: number } | null>(null);

  // Zygote Pure Features
  const [peelDepth, setPeelDepth] = useState(100);
  const [hiddenPartIds, setHiddenPartIds] = useState<Set<string>>(new Set());
  const [ghostPartIds, setGhostPartIds] = useState<Set<string>>(new Set());
  const [isolatedTargetId, setIsolatedTargetId] = useState<string | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSliceDock, setShowSliceDock] = useState(false);

  const [soundOn, setSoundOn] = useState(() => {
    try {
      return localStorage.getItem('cotecatlop.sound') === '1';
    } catch {
      return false;
    }
  });

  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem('cotecatlop.theme') as 'system' | 'light' | 'dark') || 'light';
    } catch {
      return 'light';
    }
  });

  const [showBodyParams, setShowBodyParams] = useState(false);
  const [activeTour, setActiveTour] = useState<ActiveTour | null>(null);
  const [showCoffee, setShowCoffee] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // ---------- khởi tạo telemetry & admin ----------
  useEffect(() => {
    initTelemetrySession();
    const checkHash = () => {
      if (window.location.hash.toLowerCase() === '#admin') setShowAdmin(true);
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    const onKeyAdmin = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toUpperCase() === 'A') {
        e.preventDefault();
        setShowAdmin((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyAdmin);
    return () => {
      window.removeEventListener('hashchange', checkHash);
      window.removeEventListener('keydown', onKeyAdmin);
    };
  }, []);

  useEffect(() => {
    if (selection?.kind === 'note' && selection.id) trackOrganView(selection.id);
  }, [selection]);

  useEffect(() => {
    trackMode(mode);
  }, [mode]);

  useEffect(() => {
    trackGenderChoice(gender);
  }, [gender]);

  useEffect(() => {
    if (!query.trim()) return;
    const timer = setTimeout(() => trackSearch(query), 1200);
    return () => clearTimeout(timer);
  }, [query]);

  const onPick = useCallback(
    (sel: Selection) => {
      setSelection(sel);
      setActiveTour(null);
      setIsInfoOpen(true);
    },
    [],
  );

  // Exploded view & Fullscreen
  const [explode, setExplode] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Camera Navigation trigger
  const triggerCamera = (act: string) => {
    window.dispatchEvent(new CustomEvent('zygote-camera-action', { detail: act }));
  };

  // Context Actions: Hide, Ghost, Isolate, Unhide
  const handleHideSelected = () => {
    if (!selection) return;
    const target = selection.kind === 'part' ? selection.id : selection.id;
    setHiddenPartIds((prev) => {
      const next = new Set(prev);
      next.add(target);
      return next;
    });
  };

  const handleGhostSelected = () => {
    if (!selection) return;
    const target = selection.kind === 'part' ? selection.id : selection.id;
    setGhostPartIds((prev) => {
      const next = new Set(prev);
      if (next.has(target)) next.delete(target);
      else next.add(target);
      return next;
    });
  };

  const handleIsolateSelected = () => {
    if (!selection) return;
    const target = selection.kind === 'part' ? selection.id : selection.id;
    setIsolatedTargetId((prev) => (prev === target ? null : target));
  };

  const handleUnhideAll = () => {
    setHiddenPartIds(new Set());
    setGhostPartIds(new Set());
    setIsolatedTargetId(null);
  };

  // Theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('cotecatlop.theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const cycleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  // URL State
  useEffect(() => {
    writeUrlState({ mode, activeSystem, selection });
  }, [mode, activeSystem, selection]);

  const onShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus(t('nav.copied'));
    } catch {
      setShareStatus('Copy manual');
    }
    window.setTimeout(() => setShareStatus(null), 2500);
  }, [t]);

  // Tours
  const applyTourStep = useCallback((tour: Tour, idx: number) => {
    const step = tour.steps[idx];
    const note = NOTE_BY_ID[step.noteId];
    setSelection({ kind: 'note', id: step.noteId });
    if (note) setActiveSystem(note.s);
    setIsInfoOpen(true);
  }, []);

  const startTour = (tourId: string) => {
    const tour = TOURS.find((item) => item.id === tourId);
    if (!tour) return;
    setMode('3d');
    setAxis(0);
    setSliceT(0);
    setActiveTour({ tour, stepIndex: 0 });
    applyTourStep(tour, 0);
  };
  const tourNext = () => {
    if (!activeTour) return;
    const next = Math.min(activeTour.tour.steps.length - 1, activeTour.stepIndex + 1);
    setActiveTour({ tour: activeTour.tour, stepIndex: next });
    applyTourStep(activeTour.tour, next);
  };
  const tourPrev = () => {
    if (!activeTour) return;
    const prev = Math.max(0, activeTour.stepIndex - 1);
    setActiveTour({ tour: activeTour.tour, stepIndex: prev });
    applyTourStep(activeTour.tour, prev);
  };
  const tourExit = () => setActiveTour(null);

  // Sound
  useEffect(() => {
    if (!soundOn || selection?.kind !== 'note') {
      stopBodySound();
      return;
    }
    if (selection.id === 'tim') playHeartbeat();
    else if (LUNG_NOTE_IDS.has(selection.id)) playBreath();
    else stopBodySound();
  }, [soundOn, selection]);

  useEffect(() => {
    return () => stopBodySound();
  }, []);

  const toggleSound = () => {
    setSoundOn((v) => {
      const next = !v;
      try {
        localStorage.setItem('cotecatlop.sound', next ? '1' : '0');
      } catch {
        /* ignore */
      }
      if (!next) stopBodySound();
      return next;
    });
  };

  const h = sliceValue(axis, sliceT);
  const sliceName = AXES[axis].label;

  const selectedDisplayName = useMemo(() => {
    if (!selection) return '';
    if (selection.kind === 'note') {
      const note = NOTE_BY_ID[selection.id];
      if (!note) return selection.id;
      return locale === 'en' ? note.e : note.n;
    }
    const part = atlas?.parts.find((p) => p.id === selection.id);
    return part ? part.name : selection.id;
  }, [selection, atlas, locale]);

  return (
    <div className="zygotePureViewport">
      {/* 1. TOP BAR TINH GIẢN KIỂU ZYGOTE BODY */}
      <TopBarZygote
        query={query}
        onQueryChange={setQuery}
        hasHiddenObjects={hiddenPartIds.size > 0 || ghostPartIds.size > 0 || isolatedTargetId !== null}
        onUnhideAll={handleUnhideAll}
        theme={theme}
        onCycleTheme={cycleTheme}
        onOpenSidebar={() => setIsSidebarOpen((v) => !v)}
        isSidebarOpen={isSidebarOpen}
        onShare={onShare}
        explode={explode}
        onExplodeChange={setExplode}
        showBodyParams={showBodyParams}
        onToggleBodyParams={() => setShowBodyParams((v) => !v)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* 2. CỤM ĐIỀU HƯỚNG CAMERA (ZOOM IN/OUT / HOME / DPAD / GÓC NHÌN) DƯỚI LOGO */}
      <CameraControlsHUD
        onZoomIn={() => triggerCamera('zoom-in')}
        onZoomOut={() => triggerCamera('zoom-out')}
        onResetCamera={() => triggerCamera('reset')}
        onOrbit={(dir) => triggerCamera(`orbit-${dir}`)}
        onPresetAngle={(angle) => triggerCamera(angle)}
      />

      {/* 3. THANH TRƯỢT CAPSULE BÓC TÁCH ZYGOTE (MÉP TRÁI) */}
      {mode === '3d' && (
        <LayerSlider
          peelDepth={peelDepth}
          onChangePeelDepth={setPeelDepth}
          gender={gender}
          onToggleGender={() => setGender((g) => (g === 'male' ? 'female' : 'male'))}
        />
      )}

      {/* 4. TOÀN BỘ KHUNG NHÌN 3D KHÔNG GIAN RỘNG THÊNH THANG */}
      <main className="zygoteMainCanvas">
        {mode === '2d' ? (
          <Peel2D
            depth={depth}
            activeSystem={activeSystem}
            onlySystem={onlySystem}
            showLabels={showLabels}
            showGhost={showGhost}
            selectedId={selection?.kind === 'note' ? selection.id : null}
            onPick={(id) => onPick({ kind: 'note', id })}
          />
        ) : mode === 'detail' ? (
          <OrganDetail
            noteId={selection?.kind === 'note' ? selection.id : null}
            onSelectNote={(noteId) => onPick({ kind: 'note', id: noteId })}
          />
        ) : atlasError ? (
          <div style={{ padding: 26, color: 'var(--alert)', fontSize: 13 }}>{atlasError}</div>
        ) : atlas ? (
          <>
            <View3D
              atlas={atlas}
              activeSystem={activeSystem}
              onlySystem={onlySystem}
              showGhost={showGhost}
              showLabels={showLabels}
              axis={axis}
              sliceT={sliceT}
              selection={selection}
              gender={gender}
              onGenderChange={setGender}
              showBodyParams={showBodyParams}
              onToggleBodyParams={setShowBodyParams}
              onPick={onPick}
              onCounts={(visible, total) => setCounts({ visible, total })}
              peelDepth={peelDepth}
              hiddenPartIds={hiddenPartIds}
              ghostPartIds={ghostPartIds}
              isolatedTargetId={isolatedTargetId}
              explode={explode}
            />

            {/* CỤM NÚT NGỮ CẢNH VISIBLE BODY KHI CHỌN KHỐI (DOCK Ở ĐÁY) */}
            {selection && (
              <ContextActionHUD
                selectedName={selectedDisplayName}
                hasHiddenObjects={hiddenPartIds.size > 0 || ghostPartIds.size > 0 || isolatedTargetId !== null}
                onHide={handleHideSelected}
                onGhost={handleGhostSelected}
                onIsolate={handleIsolateSelected}
                onOpenInfo={() => setIsInfoOpen((v) => !v)}
                onUnhideAll={handleUnhideAll}
                onDeselect={() => setSelection(null)}
              />
            )}
          </>
        ) : (
          <div className="loading3d">
            <div className="load3d">
              <div className="msg">{locale === 'en' ? 'LOADING ANATOMICAL CATALOG…' : 'ĐANG TẢI DANH MỤC GIẢI PHẪU…'}</div>
            </div>
          </div>
        )}
      </main>

      {/* 5. TOUR DẪN DẮT (NẾU ĐANG CHẠY) */}
      {activeTour && (
        <TourBar
          tour={activeTour.tour}
          stepIndex={activeTour.stepIndex}
          onNext={tourNext}
          onPrev={tourPrev}
          onExit={tourExit}
        />
      )}

      {/* 6. SIDEBAR DANH MỤC DẠNG DRAWER (CHỈ MỞ KHI BẤM 'HIERARCHY') */}
      {isSidebarOpen && (
        <aside className="zygoteDrawerSidebar">
          <Sidebar
            atlas={atlas}
            activeSystem={activeSystem}
            onSystemChange={(s) => {
              setActiveSystem(s);
              setQuery('');
              setActiveTour(null);
            }}
            query={query}
            onQueryChange={setQuery}
            selection={selection}
            onPick={onPick}
            onNeeds3D={() => setMode('3d')}
          />
        </aside>
      )}

      {/* 7. BẢNG HỒ SƠ GIẢI PHẪU TRƯỢT NỔI (SLIDE-OVER SHEET) */}
      {isInfoOpen && (
        <aside className="slideOverPanel isOpen" aria-label="Anatomical Profile">
          <InfoPanel
            selection={selection}
            atlas={atlas}
            mode={mode === '2d' ? '2d' : '3d'}
            onClose={() => setIsInfoOpen(false)}
            onOpenDetail={() => {
              setMode('detail');
              setActiveTour(null);
            }}
          />
        </aside>
      )}

      {/* 8. THANH DOCK TỐI GIẢN Ở ĐÁY MÀN HÌNH */}
      <footer className="zygoteMinimalDock">
        <div className="zygoteDockPill">
          {/* Nút đổi Mode (3D / 2D / Vi thể) */}
          <button
            type="button"
            className={`zygoteDockBtn ${mode === '3d' ? 'active' : ''}`}
            onClick={() => setMode('3d')}
          >
            3D
          </button>
          <button
            type="button"
            className={`zygoteDockBtn ${mode === '2d' ? 'active' : ''}`}
            onClick={() => setMode('2d')}
          >
            2D
          </button>
          <button
            type="button"
            className={`zygoteDockBtn ${mode === 'detail' ? 'active' : ''}`}
            onClick={() => {
              setMode('detail');
              if (!selection || selection.kind !== 'note' || !(selection.id in NOTE_TO_ORGAN)) {
                setSelection({ kind: 'note', id: 'tim' });
              }
            }}
          >
            {locale === 'en' ? 'Organs' : 'Vi thể'}
          </button>

          <span className="zygoteDockSep">|</span>

          {/* Nút bật/tắt thanh cắt lớp */}
          <button
            type="button"
            className={`zygoteDockBtn ${showSliceDock ? 'active' : ''}`}
            onClick={() => setShowSliceDock((v) => !v)}
            title="Mặt phẳng cắt lớp CT/MRI"
          >
            ✂️ {locale === 'en' ? 'Slice' : 'Cắt lớp'}
          </button>

          {/* Âm thanh */}
          <button
            type="button"
            className={`zygoteDockBtn ${soundOn ? 'active' : ''}`}
            onClick={toggleSound}
            title="Âm thanh nhịp tim / hơi thở"
          >
            {soundOn ? '🔊' : '🔇'}
          </button>

          {/* Tours menu rút gọn */}
          <div className="zygoteMiniTourList">
            {TOURS.slice(0, 3).map((item) => (
              <button
                key={item.id}
                type="button"
                className="zygoteMiniTourBtn"
                onClick={() => startTour(item.id)}
                title={item.title}
              >
                ▶ {item.id === 'tuanhoan' ? 'Máu' : item.id === 'tho' ? 'Thở' : 'Ăn'}
              </button>
            ))}
          </div>
        </div>

        {/* Thanh trượt cắt lớp hiện ra khi bấm nút Cắt lớp */}
        {showSliceDock && mode === '3d' && (
          <div className="zygoteSliceControlPop">
            <div className="zygoteSliceHead">
              <span>{sliceName}: <b>{(h * 100).toFixed(0)} cm</b></span>
              <button
                type="button"
                className="zygoteAxisBtn"
                onClick={() => setAxis((a) => ((a + 1) % 3) as 0 | 1 | 2)}
              >
                Đổi trục
              </button>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={sliceT}
              onChange={(e) => setSliceT(Number(e.target.value))}
              className="zygoteSliceRange"
            />
          </div>
        )}

        {/* Dòng copyright mờ phong cách Zygote */}
        <div className="zygoteFineCopyright">
          <span>N&amp;M Human Anatomy &copy; 2026</span>
          <span className="sep">&middot;</span>
          <button type="button" className="zygoteLinkBtn" onClick={() => setShowCoffee(true)}>
            ☕ Mời cà phê
          </button>
          <span className="sep">&middot;</span>
          <a href="https://zalo.me/0985578385" target="_blank" rel="noreferrer" className="zygoteLink">
            Zalo: 0985 578 385
          </a>
        </div>
      </footer>

      {/* 9. WIDGET ỦNG HỘ DỰ ÁN BÊN HÔNG (2 MÃ QR) */}
      <SideDonateWidget onOpenModal={() => setShowCoffee(true)} />
      <CoffeeModal isOpen={showCoffee} onClose={() => setShowCoffee(false)} />
      <AdminDashboard isOpen={showAdmin} onClose={() => setShowAdmin(false)} />
    </div>
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <AppInner />
    </LocaleProvider>
  );
}
