import { useState, useMemo } from 'react';
import { NOTES, NOTE_BY_ID } from '../content/notes';
import { KEY } from '../content/constants';
import { SYSTEMS } from '../data/systems';
import { buildBinding } from '../data/bind';
import { BODY_INSIGHTS } from '../content/insights';
import { translateAnatomyName } from '../content/anatomyDict';
import { sanitizeInput } from '../security';
import { useLocale } from '../locale/useLocale';
import type { AtlasJSON, SystemId } from '../data/types';
import type { Selection } from '../selection';

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export interface SidebarProps {
  atlas: AtlasJSON | null;
  activeSystem: SystemId | null;
  onSystemChange: (s: SystemId | null) => void;
  query: string;
  onQueryChange: (q: string) => void;
  selection: Selection | null;
  onPick: (sel: Selection) => void;
  /** Bắt buộc chuyển sang tab 3D khi người dùng chọn một cấu trúc thật chưa có chú thích. */
  onNeeds3D: () => void;
}

export default function Sidebar({
  atlas,
  activeSystem,
  onSystemChange,
  query,
  onQueryChange,
  selection,
  onPick,
  onNeeds3D,
}: SidebarProps) {
  const { t, locale } = useLocale();
  const [railTab, setRailTab] = useState<'systems' | 'insights'>('systems');
  const [collapsed, setCollapsed] = useState(false);
  const q = stripAccents(query.trim());

  const noteMatches = useMemo(() => {
    if (q) return NOTES.filter((n) => stripAccents(n.n).includes(q) || stripAccents(n.e).includes(q));
    if (activeSystem) return NOTES.filter((n) => n.s === activeSystem);
    return NOTES.filter((n) => KEY.has(n.i));
  }, [q, activeSystem]);

  const rawMatches = useMemo(() => {
    if (!q || !atlas) return [];
    const { partToNote } = buildBinding(atlas);
    return atlas.parts
      .filter((p) => {
        if (partToNote.has(p.id)) return false;
        const vi = stripAccents(translateAnatomyName(p.name));
        const en = stripAccents(p.name);
        return en.includes(q) || vi.includes(q);
      })
      .slice(0, 100);
  }, [q, atlas]);

  const insightMatches = useMemo(() => {
    if (!q) return BODY_INSIGHTS;
    return BODY_INSIGHTS.filter(
      (ins) =>
        stripAccents(ins.question).includes(q) ||
        stripAccents(ins.tag).includes(q) ||
        stripAccents(ins.cause).includes(q) ||
        stripAccents(ins.mechanism).includes(q),
    );
  }, [q]);

  const headText = q
    ? `${t('sidebar.results')} · ${noteMatches.length + rawMatches.length}`
    : activeSystem
      ? `${SYSTEMS.find((s) => s.id === activeSystem)?.name} · ${noteMatches.length}`
      : `${t('sidebar.keyParts')} · ${noteMatches.length}`;

  if (collapsed) {
    return (
      <div className="railCollapsedDock">
        <button
          type="button"
          className="railExpandBtn"
          onClick={() => setCollapsed(false)}
          title={locale === 'en' ? 'Expand Anatomy Sidebar' : 'Mở thanh danh mục giải phẫu'}
        >
          <span className="railExpandIcon">☰</span>
          <span className="railExpandText">{locale === 'en' ? 'CATALOG' : 'DANH MỤC'}</span>
        </button>
      </div>
    );
  }

  return (
    <aside className="rail spatialRail">
      <div className="railTopRow">
        <div className="searchbox">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <circle cx="11" cy="11" r="7" />
            <path d="M16.5 16.5 21 21" />
          </svg>
          <input
            type="search"
            placeholder={t('sidebar.searchPlaceholder')}
            autoComplete="off"
            value={query}
            onChange={(e) => onQueryChange(sanitizeInput(e.target.value))}
          />
        </div>
        <button
          type="button"
          className="railCollapseBtn"
          onClick={() => setCollapsed(true)}
          title={locale === 'en' ? 'Collapse sidebar for full 3D' : 'Thu gọn sidebar để mở rộng không gian 3D'}
        >
          ◀
        </button>
      </div>

      <div className="railtabs" role="tablist">
        <button
          className="railtab"
          role="tab"
          aria-selected={railTab === 'systems'}
          onClick={() => setRailTab('systems')}
        >
          {t('sidebar.systems')}
        </button>
        <button
          className="railtab"
          role="tab"
          aria-selected={railTab === 'insights'}
          onClick={() => setRailTab('insights')}
        >
          {t('sidebar.insights')} ({BODY_INSIGHTS.length})
        </button>
      </div>

      {railTab === 'systems' ? (
        <div>
          <div className="railhead" style={{ marginBottom: 5 }}>
            {t('sidebar.systems')}
          </div>
          <div className="syslist" role="group" aria-label="Chọn hệ cơ quan">
            {SYSTEMS.map((s) => {
              const n = NOTES.filter((note) => note.s === s.id).length;
              return (
                <button
                  key={s.id}
                  className="sysbtn"
                  aria-pressed={activeSystem === s.id}
                  onClick={() => onSystemChange(activeSystem === s.id ? null : s.id)}
                >
                  <span className="dot" style={{ background: `var(${s.color})` }} />
                  {s.name}
                  <span className="n">{n}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <div className="railhead" style={{ marginBottom: 5 }}>
            {t('sidebar.insightsLabel')} ({insightMatches.length})
          </div>
          <div className="insightList">
            {insightMatches.map((ins) => {
              const isSelected = selection?.kind === 'note' && selection.id === ins.noteId;
              return (
                <button
                  key={ins.id}
                  className={`insightBtn${isSelected ? ' isSelected' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    onPick({ kind: 'note', id: ins.noteId });
                    const targetNote = NOTE_BY_ID[ins.noteId];
                    if (targetNote) onSystemChange(targetNote.s);
                  }}
                >
                  <span className="insightTag">{ins.tag}</span>
                  <span className="insightQText">{ins.question}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="railhead" style={{ marginBottom: 5 }}>
          {headText}
        </div>
        <div className="partlist">
          {noteMatches.length === 0 && rawMatches.length === 0 && q && (
            <div style={{ padding: 10, color: 'var(--faint)', fontSize: 12.5 }}>
              {t('sidebar.noMatch')} "{query}".
            </div>
          )}
          {noteMatches.map((n, i) => (
            <button
              key={n.i}
              aria-pressed={selection?.kind === 'note' && selection.id === n.i}
              onClick={() => onPick({ kind: 'note', id: n.i })}
            >
              <span className="idx">{String(i + 1).padStart(2, '0')}</span>
              {locale === 'en' ? n.e : n.n}
              {(q || !activeSystem) && (
                <span className="sysname">{SYSTEMS.find((s) => s.id === n.s)?.name}</span>
              )}
            </button>
          ))}
          {rawMatches.length > 0 && (
            <div
              style={{
                padding: '6px 10px',
                fontFamily: 'var(--f-mono)',
                fontSize: 10,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                color: 'var(--faint)',
                borderBottom: '1px solid var(--line)',
              }}
            >
              {t('sidebar.rawParts')} · {rawMatches.length}
            </div>
          )}
          {rawMatches.map((p) => {
            const vi = translateAnatomyName(p.name);
            return (
              <button
                key={p.id}
                aria-pressed={selection?.kind === 'part' && selection.id === p.id}
                onClick={() => {
                  onPick({ kind: 'part', id: p.id });
                  onNeeds3D();
                }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '6px 10px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <span className="idx" style={{ fontSize: 9 }}>·</span>
                  <span style={{ fontWeight: 500 }}>{locale === 'en' ? p.name : vi}</span>
                </div>
                <span style={{ fontSize: 10.5, color: 'var(--faint)', marginLeft: 16 }}>
                  {locale === 'en' ? (vi !== p.name ? `VN: ${vi}` : '') : p.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
