import type { Shape } from '../content/notes';

export interface BBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  cx: number;
  cy: number;
  a: number;
}

function nums(d: string): number[] {
  return (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
}

export function bbox(sh: readonly Shape[]): BBox {
  let x0 = 1e9;
  let y0 = 1e9;
  let x1 = -1e9;
  let y1 = -1e9;
  const add = (x: number, y: number) => {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  };
  for (const s of sh) {
    const t = s[0];
    if (t === 'e') {
      const [, cx, cy, rx, ry] = s as [string, number, number, number, number];
      add(cx - rx, cy - ry);
      add(cx + rx, cy + ry);
    } else if (t === 'c') {
      const [, cx, cy, r] = s as [string, number, number, number];
      add(cx - r, cy - r);
      add(cx + r, cy + r);
    } else if (t === 'r') {
      const [, x, y, w, h] = s as [string, number, number, number, number];
      add(x, y);
      add(x + w, y + h);
    } else {
      const n = nums(String(s[1]));
      for (let i = 0; i + 1 < n.length; i += 2) add(n[i], n[i + 1]);
    }
  }
  return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, a: (x1 - x0) * (y1 - y0) };
}

export function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Vẽ danh sách hình khối thành chuỗi SVG markup, tô theo biến màu CSS `col`. */
export function drawShapes(sh: readonly Shape[], col: string): string {
  return sh
    .map((s) => {
      const t = s[0];
      if (t === 'e') {
        const [, cx, cy, rx, ry, rot] = s as [string, number, number, number, number, number?];
        return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${
          rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''
        } style="fill:var(${col})"/>`;
      }
      if (t === 'c') {
        const [, cx, cy, r] = s as [string, number, number, number];
        return `<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:var(${col})"/>`;
      }
      if (t === 'r') {
        const [, x, y, w, h, rx] = s as [string, number, number, number, number, number?];
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx ?? 2}" style="fill:var(${col})"/>`;
      }
      if (t === 's') {
        const [, d, w] = s as [string, string, number?];
        return `<path d="${d}" style="fill:none;stroke:var(${col});stroke-width:${w ?? 3};stroke-linecap:round"/>`;
      }
      const [, d] = s as [string, string];
      return `<path d="${d}" style="fill:var(${col})"/>`;
    })
    .join('');
}
