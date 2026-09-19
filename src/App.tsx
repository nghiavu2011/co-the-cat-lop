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

export default function App() {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const { atlas, error: atlasError } = useAtlas(gender);

  const initialUrl = useMemo(() => readUrlState(), []);
  const [mode, setMode] = useState<Mode>(initialUrl.mode ?? '2d');
  const [depth, setDepth] = useState(4);
  const [axis, setAxis] = useState(0);
  const [sliceT, setSliceT] = useState(0);
  const [activeSystem, setActiveSystem] = useState<SystemId | null>(initialUrl.activeSystem ?? 'tuanhoan');
  const [selection, setSelection] = useState<Selection | null>(initialUrl.selection ?? { kind: 'note', id: 'tim' });
  const [query, setQuery] = useState('');
  const [showLabels, setShowLabels] = useState(true);
  const [showGhost, setShowGhost] = useState(true);
  const [onlySystem, setOnlySystem] = useState(false);
  const [counts, setCounts] = useState<{ visible: number; total: number } | null>(null);
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
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return localStorage.getItem('cotecatlop.onboarded') !== '1';
    } catch {
      return true;
    }
  });
  const [activeTour, setActiveTour] = useState<ActiveTour | null>(null);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    try {
      localStorage.setItem('cotecatlop.onboarded', '1');
    } catch {
      /* trình duyệt chặn localStorage — bỏ qua */
    }
  }, []);

  const onPick = useCallback(
    (sel: Selection) => {
      setSelection(sel);
      setActiveTour(null);
      dismissOnboarding();
    },
    [dismissOnboarding],
  );

  // ---------- giao diện sáng/tối thủ công ----------
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('cotecatlop.theme', theme);
    } catch {
      /* trình duyệt chặn localStorage — bỏ qua */
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
      setShareStatus('Đã copy liên kết!');
    } catch {
      setShareStatus('Không copy được — hãy tự chép địa chỉ trên trình duyệt');
    }
    window.setTimeout(() => setShareStatus(null), 2500);
  }, []);

  // ---------- hành trình dẫn dắt có kịch bản ----------
  const applyTourStep = useCallback((tour: Tour, idx: number) => {
    const step = tour.steps[idx];
    const note = NOTE_BY_ID[step.noteId];
    setSelection({ kind: 'note', id: step.noteId });
    if (note) setActiveSystem(note.s);
  }, []);

  const startTour = (tourId: string) => {
    const tour = TOURS.find((t) => t.id === tourId);
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

  // ---------- âm thanh nhẹ: tim đập khi chọn "Tim", hơi thở khi chọn phổi ----------
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
        /* trình duyệt chặn localStorage — bỏ qua, không ảnh hưởng tính năng */
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
        ? ' · chưa cắt'
        : axis !== 0
          ? ''
          : h > 1.58
            ? ' · vùng đầu'
            : h > 1.42
              ? ' · cổ'
              : h > 1.15
                ? ' · ngực'
                : h > 0.95
                  ? ' · ổ bụng'
                  : h > 0.8
                    ? ' · chậu'
                    : ' · chi dưới';
  const sliceName = AXES[axis].label + zone;
  const readout =
    mode === 'detail'
      ? `Chi tiết nội tạng${selection?.kind === 'note' && NOTE_BY_ID[selection.id] ? ' · ' + NOTE_BY_ID[selection.id].n : ''}`
      : mode === '2d'
        ? `Lớp ${depth + 1}/6 · ${LAYERS[depth].d}`
        : full
          ? 'Toàn thân · kéo thanh trượt để cắt'
          : axis === 0
            ? `Mặt cắt ngang · ${(h * 100).toFixed(0)} cm từ gót`
            : `Mặt cắt ${AXES[axis].label.split(' ')[0].toLowerCase()} · ${(h * 100).toFixed(1)} cm từ trục giữa`;

  return (
    <div className="wrap">
      <Header theme={theme} onCycleTheme={cycleTheme} onShare={onShare} shareStatus={shareStatus} />
      <div className={`app${mode === 'detail' ? ' isDetailMode' : ''}`}>
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

        <main className="stage">
          <div className="tabs" role="tablist" aria-label="Chế độ xem">
            <button
              className="tab"
              role="tab"
              aria-selected={mode === '2d'}
              onClick={() => {
                setMode('2d');
                setActiveTour(null);
              }}
            >
              Bóc lớp 2D
            </button>
            <button
              className="tab"
              role="tab"
              aria-selected={mode === '3d'}
              onClick={() => setMode('3d')}
            >
              Cắt lát 3D thật
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
              Chi tiết cơ quan (11 cơ quan)
            </button>
            {!activeTour && (
              <div className="tourpicker" role="group" aria-label="Hành trình dẫn dắt chu trình">
                <span className="tourpickerLabel">Chu trình:</span>
                {TOURS.map((t) => {
                  const shortName =
                    t.id === 'tuanhoan'
                      ? 'Vòng máu'
                      : t.id === 'tho'
                        ? 'Hơi thở'
                        : t.id === 'an'
                          ? 'Bữa ăn'
                          : t.id === 'locthai'
                            ? 'Lọc bài tiết'
                            : t.id === 'cotsong'
                              ? 'Cột sống'
                              : t.title;
                  return (
                    <button
                      key={t.id}
                      className="tourstart"
                      onClick={() => startTour(t.id)}
                      title={`${t.title}: ${t.intro}`}
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
            <TourBar tour={activeTour.tour} stepIndex={activeTour.stepIndex} onNext={tourNext} onPrev={tourPrev} onExit={tourExit} />
          )}

          <div className={`plate${mode === '3d' ? ' is3d' : ''}${mode === 'detail' ? ' isDetail' : ''}`}>
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
                  axis={axis}
                  sliceT={sliceT}
                  selection={selection}
                  gender={gender}
                  onGenderChange={setGender}
                  onPick={onPick}
                  onCounts={(visible, total) => setCounts({ visible, total })}
                />
                <span className="hint3d">
                  {'ontouchstart' in window
                    ? <>1 ngón: <b>xoay</b> · 2 ngón: <b>zoom + kéo</b> · Chạm đúp: <b>zoom vào bộ phận</b></>
                    : <>Chuột trái: <b>xoay 360°</b> · Chuột phải / Shift: <b>kéo Pan</b> · Click đúp: <b>zoom vào bộ phận</b> · Lăn chuột: phóng to/thu nhỏ</>}
                  {counts ? ` · ${counts.visible.toLocaleString('vi-VN')}/${counts.total.toLocaleString('vi-VN')} cấu trúc` : ''}
                </span>
              </>
            ) : (
              <div className="loading3d">
                <div className="load3d">
                  <div className="msg">ĐANG TẢI DANH MỤC GIẢI PHẪU…</div>
                </div>
              </div>
            )}
            {showOnboarding && !activeTour && mode !== 'detail' && <OnboardingHint mode={mode} onDismiss={dismissOnboarding} />}
          </div>

          {mode !== 'detail' && (
          <div className="ctrls">
            {mode === '2d' ? (
              <div className="depth">
                <div className="row">
                  <label htmlFor="depth">Độ sâu bóc lớp</label>
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
                  {gender === 'female' ? '♀ Cơ thể Nữ' : '♂ Cơ thể Nam'}
                </button>
              )}
              <button className="tg" aria-pressed={showGhost} onClick={() => setShowGhost((v) => !v)}>
                {mode === '3d' ? 'Lớp da' : 'Bóng cơ thể'}
              </button>
              <button className="tg" aria-pressed={onlySystem} onClick={() => setOnlySystem((v) => !v)}>
                Chỉ hệ đang chọn
              </button>
              <button className="tg" aria-pressed={soundOn} onClick={toggleSound} title="Tiếng tim đập / hơi thở khi chọn đúng bộ phận">
                Âm thanh {soundOn ? 'bật' : 'tắt'}
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

        {mode !== 'detail' && (
          <aside className="panel">
            <InfoPanel
              selection={selection}
              atlas={atlas}
              mode={mode}
              onOpenDetail={() => {
                setMode('detail');
                setActiveTour(null);
              }}
            />
          </aside>
        )}
      </div>
      <Footer />
    </div>
  );
}
