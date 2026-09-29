import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar';
import Peel2D from './components/Peel2D';
import View3D from './components/View3D';
import InfoPanel from './components/InfoPanel';
import TourBar from './components/TourBar';
import QuickOrganDock, { type QuickOrganDef } from './components/QuickOrganDock';
import CoffeeModal from './components/CoffeeModal';
import SideDonateWidget from './components/SideDonateWidget';
import AdminDashboard from './components/AdminDashboard';
import UnifiedLeftControls from './components/UnifiedLeftControls';
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
import { useAtlas } from './data/useAtlas';
import { NOTE_BY_ID } from './content/notes';
import { TOURS, type Tour } from './content/tours';
import { playBreath, playHeartbeat, stopBodySound } from './audio/bodySounds';
import { readUrlState, writeUrlState } from './urlState';
import type { SystemId } from './data/types';
import type { Selection } from './selection';

const LUNG_NOTE_IDS = new Set(['phoiphai', 'phoitrai']);

type Mode = '2d' | '3d';

interface ActiveTour {
  tour: Tour;
  stepIndex: number;
}

function AppInner() {
  const { t, locale } = useLocale();
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const { atlas, error: atlasError } = useAtlas(gender);

  const initialUrl = useMemo(() => readUrlState(), []);
  const [mode, setMode] = useState<Mode>(initialUrl.mode === '2d' ? '2d' : '3d');
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
  const [focusKey, setFocusKey] = useState(0);

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
      setIsSidebarOpen(false);
      setShowBodyParams(false);
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
    setIsInfoOpen(false); // Ưu tiên thẻ Tour Card nổi tinh gọn, không mở tràn bảng hồ sơ
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

  const handleSelectQuickOrgan = (organ: QuickOrganDef) => {
    setActiveTour(null);
    if (organ.noteId === null) {
      // Toàn thân (Full Body Reset)
      setSelection(null);
      setPeelDepth(100);
      setActiveSystem(null);
      setIsolatedTargetId(null);
      setHiddenPartIds(new Set());
      setGhostPartIds(new Set());
      setSliceT(0);
      setIsInfoOpen(false);
      setFocusKey((k) => k + 1);
    } else {
      // Chọn cơ quan cụ thể (Tim, Não, Phổi, Thận, Gan, Dạ dày...)
      setSelection({ kind: 'note', id: organ.noteId });
      setPeelDepth(organ.peel);
      if (organ.system) setActiveSystem(organ.system as SystemId);
      setIsolatedTargetId(null);
      setIsInfoOpen(true);
      setFocusKey((k) => k + 1);
    }
  };

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
        onOpenSidebar={() => {
          setIsSidebarOpen((v) => {
            const next = !v;
            if (next) {
              setIsInfoOpen(false);
              setShowBodyParams(false);
            }
            return next;
          });
        }}
        isSidebarOpen={isSidebarOpen}
        onShare={onShare}
        explode={explode}
        onExplodeChange={setExplode}
        showBodyParams={showBodyParams}
        onToggleBodyParams={() => {
          setShowBodyParams((v) => {
            const next = !v;
            if (next) {
              setIsSidebarOpen(false);
              setIsInfoOpen(false);
            }
            return next;
          });
        }}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onStartTour={startTour}
        selectedName={selectedDisplayName}
        onHideSelected={handleHideSelected}
        onGhostSelected={handleGhostSelected}
        onIsolateSelected={handleIsolateSelected}
        onOpenInfoSelected={() => {
          setIsInfoOpen((v) => {
            const next = !v;
            if (next) {
              setIsSidebarOpen(false);
              setShowBodyParams(false);
            }
            return next;
          });
        }}
        onDeselect={() => setSelection(null)}
      />

      {/* 2. THANH ĐIỀU KHIỂN BÊN TRÁI DUY NHẤT (CAPSULE BÓC TÁCH & CÔNG CỤ LIỀN MẠCH, KHÔNG CÒN CỤM CAMERA) */}
      <UnifiedLeftControls
        peelDepth={peelDepth}
        onChangePeelDepth={setPeelDepth}
        gender={gender}
        onToggleGender={() => setGender((g) => (g === 'male' ? 'female' : 'male'))}
        mode={mode}
        onChangeMode={(m) => setMode(m)}
        explode={explode}
        onChangeExplode={setExplode}
        axis={axis}
        onChangeAxis={setAxis}
        sliceT={sliceT}
        onChangeSliceT={setSliceT}
        soundOn={soundOn}
        onToggleSound={toggleSound}
      />

      {/* 3. DẢI TAB CHỌN NHANH CƠ QUAN DƯỚI CÙNG BÊN TRÁI (TIM, NÃO, PHỔI, THẬN, GAN, TOÀN THÂN...) */}
      <QuickOrganDock
        activeNoteId={selection?.kind === 'note' ? selection.id : null}
        onSelectOrgan={handleSelectQuickOrgan}
      />

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
              onToggleBodyParams={(show) => {
                setShowBodyParams(show);
                if (show) {
                  setIsSidebarOpen(false);
                  setIsInfoOpen(false);
                }
              }}
              onPick={onPick}
              onCounts={(visible, total) => setCounts({ visible, total })}
              peelDepth={peelDepth}
              hiddenPartIds={hiddenPartIds}
              ghostPartIds={ghostPartIds}
              isolatedTargetId={isolatedTargetId}
              explode={explode}
              focusKey={focusKey}
            />
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

      {/* 6. SIDEBAR DANH MỤC DẠNG DRAWER (CHỈ MỞ KHI BẤM 'HIERARCHY' VÀ TỰ ĐÓNG KHI MỞ BẢNG KHÁC) */}
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
            onClose={() => setIsSidebarOpen(false)}
          />
        </aside>
      )}

      {/* 7. BẢNG HỒ SƠ GIẢI PHẪU TRƯỢT NỔI (SLIDE-OVER SHEET - KHÔNG CHỒNG LẤN VỚI SIDEBAR) */}
      {isInfoOpen && (
        <aside className="slideOverPanel isOpen" aria-label="Anatomical Profile">
          <InfoPanel
            selection={selection}
            atlas={atlas}
            mode={mode === '2d' ? '2d' : '3d'}
            onClose={() => setIsInfoOpen(false)}
            onOpenSidebar={() => {
              setIsSidebarOpen(true);
              setIsInfoOpen(false);
              setShowBodyParams(false);
            }}
            onFocusOrgan={() => {
              setFocusKey((k) => k + 1);
            }}
          />
        </aside>
      )}

      {/* Dòng chữ bản quyền nhỏ gọn ở góc đáy */}
      <footer className="zygoteFineCorner" role="contentinfo">
        <span>N&amp;M Anatomy &copy; 2026</span>
        <span className="sep">&middot;</span>
        <button type="button" className="zygoteLinkBtn" onClick={() => setShowCoffee(true)}>
          ☕ Mời cà phê
        </button>
        <span className="sep">&middot;</span>
        <a href="https://zalo.me/0985578385" target="_blank" rel="noreferrer" className="zygoteLink">
          Zalo: 0985 578 385
        </a>
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
