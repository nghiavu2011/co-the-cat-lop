import { useCallback, useEffect, useMemo, useState } from 'react';
import Header, { type ThemeChoice } from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import Peel2D from './components/Peel2D';
import View3D, { AXES, sliceValue } from './components/View3D';
import InfoPanel from './components/InfoPanel';
import OnboardingHint from './components/OnboardingHint';
import TourBar from './components/TourBar';
import OrganDetail from './components/OrganDetail';
import CoffeeModal from './components/CoffeeModal';
import SideDonateWidget from './components/SideDonateWidget';
import AdminDashboard from './components/AdminDashboard';
import DemographicsSurvey from './components/DemographicsSurvey';
import LayerSlider from './components/LayerSlider';
import ContextActionHUD from './components/ContextActionHUD';
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
import { LAYERS, NOTE_BY_ID } from './content/notes';
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
  const [depth, setDepth] = useState(4);
  const [axis, setAxis] = useState(0);
  const [sliceT, setSliceT] = useState(0);
  const [activeSystem, setActiveSystem] = useState<SystemId | null>(initialUrl.activeSystem ?? null);
  const [selection, setSelection] = useState<Selection | null>(
    initialUrl.selection ?? { kind: 'note', id: 'tim' },
  );
  const [query, setQuery] = useState('');
  const [showLabels, setShowLabels] = useState(true);
  const [showGhost, setShowGhost] = useState(true);
  const [onlySystem, setOnlySystem] = useState(false);
  const [counts, setCounts] = useState<{ visible: number; total: number } | null>(null);

  // Zygote & Visible Body features
  const [peelDepth, setPeelDepth] = useState(100);
  const [hiddenPartIds, setHiddenPartIds] = useState<Set<string>>(new Set());
  const [ghostPartIds, setGhostPartIds] = useState<Set<string>>(new Set());
  const [isolatedTargetId, setIsolatedTargetId] = useState<string | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const [soundOn, setSoundOn] = useState(() => {
    try {
      return localStorage.getItem('cotecatlop.sound') === '1';
    } catch {
      return false;
    }
  });
  const [theme, setTheme] = useState<ThemeChoice>(() => {
    try {
      return (localStorage.getItem('cotecatlop.theme') as ThemeChoice) || 'system';
    } catch {
      return 'system';
    }
  });
  const [showBodyParams, setShowBodyParams] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return localStorage.getItem('cotecatlop.onboarded') !== '1';
    } catch {
      return true;
    }
  });
  const [activeTour, setActiveTour] = useState<ActiveTour | null>(null);
  const [showCoffee, setShowCoffee] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // ---------- khởi tạo telemetry & lắng nghe phím tắt admin ----------
  useEffect(() => {
    initTelemetrySession();

    const checkHash = () => {
      if (window.location.hash.toLowerCase() === '#admin') {
        setShowAdmin(true);
      }
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

  // ---------- theo dõi tương tác người dùng ----------
  useEffect(() => {
    if (selection?.kind === 'note' && selection.id) {
      trackOrganView(selection.id);
    }
  }, [selection]);

  useEffect(() => {
    trackMode(mode);
  }, [mode]);

  useEffect(() => {
    trackGenderChoice(gender);
  }, [gender]);

  useEffect(() => {
    if (!query.trim()) return;
    const timer = setTimeout(() => {
      trackSearch(query);
    }, 1200);
    return () => clearTimeout(timer);
  }, [query]);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    try {
      localStorage.setItem('cotecatlop.onboarded', '1');
    } catch {
      /* ignore */
    }
  }, []);

  const onPick = useCallback(
    (sel: Selection) => {
      setSelection(sel);
      setActiveTour(null);
      dismissOnboarding();
      setIsInfoOpen(true);
    },
    [dismissOnboarding],
  );

  // Context Actions: Hide, Ghost, Isolate, Info, Unhide
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

  // ---------- giao diện sáng/tối thủ công ----------
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
  const cycleTheme = () => setTheme((t) => (t === 'system' ? 'light' : t === 'light' ? 'dark' : 'system'));

  // ---------- chia sẻ góc nhìn hiện tại qua URL ----------
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

  // ---------- hành trình dẫn dắt có kịch bản ----------
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
    dismissOnboarding();
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

  // ---------- âm thanh nhẹ: tim đập / hơi thở ----------
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
  const full = axis === 0 && h >= 1.73;
  const zone =
    mode !== '3d'
      ? ''
      : full
        ? ' · full'
        : axis !== 0
          ? ''
          : h > 1.58
            ? ' · head'
            : h > 1.42
              ? ' · neck'
              : h > 1.15
                ? ' · thorax'
                : h > 0.95
                  ? ' · abdomen'
                  : h > 0.8
                    ? ' · pelvis'
                    : ' · lower limb';
  const sliceName = AXES[axis].label + zone;
  const readout =
    mode === 'detail'
      ? `3D Detail${selection?.kind === 'note' && NOTE_BY_ID[selection.id] ? ' · ' + (locale === 'en' ? NOTE_BY_ID[selection.id].e : NOTE_BY_ID[selection.id].n) : ''}`
      : mode === '2d'
        ? `Layer ${depth + 1}/6 · ${LAYERS[depth].d}`
        : full
          ? 'Full Body 3D'
          : `Slice: ${(h * 100).toFixed(0)} cm`;

  // Tên bộ phận đang chọn để hiển thị trên Context HUD
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
    <div className="wrap fullViewportWrap">
      <Header
        theme={theme}
        onCycleTheme={cycleTheme}
        onShare={onShare}
        shareStatus={shareStatus}
      />

      <div className={`app spatialApp${mode === 'detail' ? ' isDetailMode' : ''}`}>
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

        <main className="stage spatialStage">
          {/* Thanh Tab Chế Độ Xem Nổi */}
          <div className="tabs floatingTabs" role="tablist" aria-label="Chế độ xem">
            <button
              className="tab"
              role="tab"
              aria-selected={mode === '2d'}
              onClick={() => {
                setMode('2d');
                setActiveTour(null);
              }}
            >
              {t('nav.mode2d')}
            </button>
            <button
              className="tab"
              role="tab"
              aria-selected={mode === '3d'}
              onClick={() => setMode('3d')}
            >
              {t('nav.mode3d')}
            </button>
            <button
              className="tab"
              role="tab"
              aria-selected={mode === 'detail'}
              onClick={() => {
                setMode('detail');
                setActiveTour(null);
                if (!selection || selection.kind !== 'note' || !(selection.id in NOTE_TO_ORGAN)) {
                  setSelection({ kind: 'note', id: 'tim' });
                }
              }}
              title="Khám phá mô hình 3D chi tiết & vi thể 11 cơ quan nội tạng & hệ sinh dục nữ"
            >
              {t('nav.modeDetail')}
            </button>

            {!activeTour && (
              <div className="tourpicker" role="group" aria-label="Hành trình dẫn dắt chu trình">
                <span className="tourpickerLabel">Chu trình:</span>
                {TOURS.map((tourItem) => {
                  const shortName =
                    tourItem.id === 'tuanhoan'
                      ? 'Vòng máu'
                      : tourItem.id === 'tho'
                        ? 'Hơi thở'
                        : tourItem.id === 'an'
                          ? 'Bữa ăn'
                          : tourItem.id === 'locthai'
                            ? 'Lọc bài tiết'
                            : tourItem.id === 'cotsong'
                              ? 'Cột sống'
                              : tourItem.title;
                  return (
                    <button
                      key={tourItem.id}
                      className="tourstart"
                      onClick={() => startTour(tourItem.id)}
                      title={`${tourItem.title}: ${tourItem.intro}`}
                    >
                      ▶ {shortName}
                    </button>
                  );
                })}
              </div>
            )}
            <span className="readout">{readout}</span>
          </div>

          {activeTour && (
            <TourBar
              tour={activeTour.tour}
              stepIndex={activeTour.stepIndex}
              onNext={tourNext}
              onPrev={tourPrev}
              onExit={tourExit}
            />
          )}

          {/* VÙNG CANVAS 3D HOẶC 2D */}
          <div className={`plate spatialPlate${mode === '3d' ? ' is3d' : ''}${mode === 'detail' ? ' isDetail' : ''}`}>
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
                />

                {/* THANH TRƯỢT BÓC TÁCH ZYGOTE (MÉP TRÁI) */}
                <LayerSlider
                  peelDepth={peelDepth}
                  onChangePeelDepth={setPeelDepth}
                  onReset={() => setPeelDepth(100)}
                />

                {/* CỤM NÚT NGỮ CẢNH VISIBLE BODY (HIỆN KHI CHỌN CẤU TRÚC) */}
                {selection && (
                  <ContextActionHUD
                    selectedName={selectedDisplayName}
                    hasHiddenObjects={hiddenPartIds.size > 0 || ghostPartIds.size > 0 || isolatedTargetId !== null}
                    onHide={handleHideSelected}
                    onGhost={handleGhostSelected}
                    onIsolate={handleIsolateSelected}
                    onOpenInfo={() => setIsInfoOpen((v) => !v)}
                    onUnhideAll={handleUnhideAll}
                  />
                )}

                <span className="hint3d spatialHint">
                  {'ontouchstart' in window
                    ? <>1 ngón: <b>xoay</b> · 2 ngón: <b>zoom + kéo</b></>
                    : <>Chuột trái: <b>xoay</b> · Chuột phải: <b>Pan</b> · Double-click: <b>zoom</b> · Lăn chuột: <b>zoom</b></>}
                  {counts ? ` · ${counts.visible.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')}/${counts.total.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')} ${locale === 'en' ? 'structures' : 'cấu trúc'}` : ''}
                </span>
              </>
            ) : (
              <div className="loading3d">
                <div className="load3d">
                  <div className="msg">{locale === 'en' ? 'LOADING ANATOMICAL CATALOG…' : 'ĐANG TẢI DANH MỤC GIẢI PHẪU…'}</div>
                </div>
              </div>
            )}
            {showOnboarding && !activeTour && mode !== 'detail' && <OnboardingHint mode={mode} onDismiss={dismissOnboarding} />}
          </div>

          {/* THANH ĐIỀU KHIỂN CẮT LÁT & CÔNG CỤ ĐÁY */}
          {mode !== 'detail' && (
            <div className="ctrls spatialBottomDock">
              {mode === '2d' ? (
                <div className="depth">
                  <div className="row">
                    <label htmlFor="depth">{t('controls.depth') || 'Độ sâu bóc lớp'}</label>
                    <span className="cur">{LAYERS[depth].n}</span>
                  </div>
                  <input
                    id="depth"
                    type="range"
                    min={0}
                    max={5}
                    step={1}
                    value={depth}
                    onChange={(e) => setDepth(Number(e.target.value))}
                  />
                  <div className="ticks">
                    <span>Da</span>
                    <span>Mỡ</span>
                    <span>Cơ</span>
                    <span>Xương</span>
                    <span>Nội tạng</span>
                    <span>Mạch·TK</span>
                  </div>
                </div>
              ) : (
                <div className="depth">
                  <div className="row">
                    <label htmlFor="slice">Mặt phẳng cắt</label>
                    <span className="cur">{sliceName}</span>
                  </div>
                  <input
                    id="slice"
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={sliceT}
                    onChange={(e) => setSliceT(Number(e.target.value))}
                  />
                  <div className="ticks">
                    <span>Đỉnh đầu</span>
                    <span>Ngực</span>
                    <span>Bụng</span>
                    <span>Chậu</span>
                    <span>Bàn chân</span>
                  </div>
                </div>
              )}

              <div className="toggles">
                {mode === '2d' && (
                  <button className="tg" aria-pressed={showLabels} onClick={() => setShowLabels((v) => !v)}>
                    Nhãn tên
                  </button>
                )}
                {mode === '3d' && (
                  <>
                    <button
                      className="tg"
                      style={{
                        fontWeight: 600,
                        borderColor: gender === 'female' ? '#e91e63' : undefined,
                        color: gender === 'female' ? '#f06292' : undefined,
                      }}
                      onClick={() => setGender((g) => (g === 'male' ? 'female' : 'male'))}
                      title="Chuyển đổi cấu trúc cơ thể Nam / Nữ (Khung chậu & Hệ sinh dục)"
                    >
                      {gender === 'female' ? '♀ Nữ' : '♂ Nam'}
                    </button>
                    <button
                      className="tg"
                      style={{
                        fontWeight: 600,
                        borderColor: 'var(--brass)',
                        color: showBodyParams ? '#fff' : 'var(--brass)',
                        background: showBodyParams ? 'var(--brass)' : undefined,
                      }}
                      onClick={() => setShowBodyParams((v) => !v)}
                      title="Mô phỏng thể trạng & BMI"
                    >
                      ⚖ BMI
                    </button>
                  </>
                )}
                <button className="tg" aria-pressed={showGhost} onClick={() => setShowGhost((v) => !v)}>
                  {mode === '3d' ? 'Da' : 'Bóng'}
                </button>
                <button className="tg" aria-pressed={onlySystem} onClick={() => setOnlySystem((v) => !v)}>
                  Chỉ hệ chọn
                </button>
                <button className="tg" aria-pressed={soundOn} onClick={toggleSound} title="Tiếng tim / hơi thở">
                  🔊 {soundOn ? 'Bật' : 'Tắt'}
                </button>
                {mode === '3d' && (
                  <button className="tg" onClick={() => setAxis((a) => ((a + 1) % 3) as 0 | 1 | 2)}>
                    Đổi hướng cắt
                  </button>
                )}
              </div>
            </div>
          )}
        </main>

        {/* THẺ HỒ SƠ GIẢI PHẪU DẠNG SLIDE-OVER SHEET (CẠNH PHẢI) */}
        {mode !== 'detail' && isInfoOpen && (
          <aside className="panel slideOverPanel isOpen" aria-label="Anatomical Profile">
            <InfoPanel
              selection={selection}
              atlas={atlas}
              mode={mode}
              onClose={() => setIsInfoOpen(false)}
              onOpenDetail={() => {
                setMode('detail');
                setActiveTour(null);
              }}
            />
          </aside>
        )}
      </div>

      <DemographicsSurvey />
      <Footer
        onOpenCoffee={() => setShowCoffee(true)}
        onOpenAdmin={() => setShowAdmin(true)}
      />

      {/* WIDGET ỦNG HỘ DỰ ÁN BÊN HÔNG (GIỮ NGUYÊN 100% CẢ 2 QR TECHCOMBANK & MOMO) */}
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
