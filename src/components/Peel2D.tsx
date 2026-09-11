import { useEffect, useRef } from 'react';
import { NOTES, BODY_SILHOUETTE, type Note } from '../content/notes';
import { MICRO, KEY } from '../content/constants';
import { SYSTEM_BY_ID } from '../data/systems';
import type { SystemId } from '../data/types';
import { bbox, drawShapes, esc } from './svgGeometry';

export interface Peel2DProps {
  depth: number;
  activeSystem: SystemId | null;
  onlySystem: boolean;
  showLabels: boolean;
  showGhost: boolean;
  selectedId: string | null;
  onPick: (id: string) => void;
}

/** Tab "Bóc lớp 2D": sơ đồ cơ thể vẽ bằng SVG, bóc từng tầng độ sâu. */
export default function Peel2D({
  depth,
  activeSystem,
  onlySystem,
  showLabels,
  showGhost,
  selectedId,
  onPick,
}: Peel2DProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const parts = NOTES.filter(
      (p) =>
        p.l >= depth &&
        (!onlySystem || !activeSystem || p.s === activeSystem) &&
        (!MICRO.has(p.i) || p.s === activeSystem),
    );
    const byLayer = new Map<number, Note[]>();
    parts.forEach((p) => {
      const arr = byLayer.get(p.l) ?? [];
      arr.push(p);
      byLayer.set(p.l, arr);
    });

    let g = '';
    for (let l = 5; l >= depth; l--) {
      const arr = (byLayer.get(l) ?? []).slice().sort((a, b) => bbox(b.sh).a - bbox(a.sh).a);
      g +=
        `<g data-layer="${l}">` +
        arr
          .map((p) => {
            const dim = activeSystem && p.s !== activeSystem ? ' dim' : '';
            const sel = p.i === selectedId ? ' sel' : '';
            return `<g class="hit${dim}${sel}" data-id="${p.i}" role="button" tabindex="0" aria-label="${esc(
              p.n,
            )}">${drawShapes(p.sh, SYSTEM_BY_ID[p.s].color)}</g>`;
          })
          .join('') +
        `</g>`;
    }

    let lab = '';
    if (showLabels) {
      const show = parts.filter((p) => p.i === selectedId || (activeSystem ? p.s === activeSystem : KEY.has(p.i)));
      lab = show
        .map((p) => {
          const b = bbox(p.sh);
          const [lx, ly] = p.lp;
          const an = lx < 200 ? 'end' : 'start';
          const d = Math.hypot(lx - b.cx, ly - b.cy);
          const ld = d > 26 ? `<path class="leader" d="M${lx + (an === 'end' ? 4 : -4)},${ly - 3} L${b.cx},${b.cy}"/>` : '';
          const w = p.i === selectedId ? 'font-weight:600;fill:var(--ink)' : '';
          return `${ld}<text class="lbl" x="${lx}" y="${ly}" text-anchor="${an}" style="${w}">${esc(p.n)}</text>`;
        })
        .join('');
    }

    const micro = parts.filter((p) => MICRO.has(p.i));
    let frame = '';
    if (micro.length) {
      let x0 = 1e9;
      let y0 = 1e9;
      let x1 = -1e9;
      let y1 = -1e9;
      micro.forEach((p) => {
        const b = bbox(p.sh);
        x0 = Math.min(x0, b.x0);
        y0 = Math.min(y0, b.y0);
        x1 = Math.max(x1, b.x1);
        y1 = Math.max(y1, b.y1);
      });
      frame =
        `<g><rect x="${x0 - 14}" y="${y0 - 22}" width="${x1 - x0 + 28}" height="${y1 - y0 + 36}" rx="3" ` +
        `style="fill:none;stroke:var(--line-strong);stroke-width:1;stroke-dasharray:4 3"/>` +
        `<text class="lbl" x="${x0 - 14}" y="${y0 - 28}" style="letter-spacing:.12em">PHÓNG TO</text></g>`;
    }

    const ghost = showGhost
      ? `<g class="ghost">${BODY_SILHOUETTE.map((s) => drawShapes([s], '--nil')).join('')}</g>`
      : '';

    el.innerHTML = `<svg id="body" viewBox="-6 8 482 886" role="img" aria-label="Sơ đồ cơ thể, đã bóc tới tầng ${depth}">
      <style>
        .ghost *{fill:none!important;stroke:var(--line-strong);stroke-width:1.1;opacity:.85}
        .hit.dim{opacity:.16}
        .hit.sel>*{stroke:var(--ink);stroke-width:1.5;paint-order:stroke}
      </style>
      ${ghost}${frame}${g}${lab}
    </svg>`;
  }, [depth, activeSystem, onlySystem, showLabels, showGhost, selectedId]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      const hit = target.closest<HTMLElement>('[data-id]');
      if (hit?.dataset.id) onPick(hit.dataset.id);
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const target = e.target as HTMLElement;
      const hit = target.closest<HTMLElement>('[data-id]');
      if (hit?.dataset.id) {
        e.preventDefault();
        onPick(hit.dataset.id);
      }
    };
    el.addEventListener('click', handler);
    el.addEventListener('keydown', keyHandler);
    return () => {
      el.removeEventListener('click', handler);
      el.removeEventListener('keydown', keyHandler);
    };
  }, [onPick]);

  return <div id="svgwrap" ref={wrapRef} />;
}
