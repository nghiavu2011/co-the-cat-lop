import raw from './notes.json';
import layersRaw from './layers.json';
import bodyRaw from './body-silhouette.json';
import type { SystemId } from '../data/types';

/** Một hình khối SVG thô dùng cho tab bóc lớp 2D. Xem SvgShape trong svg.ts. */
export type Shape = readonly (string | number)[];

export interface Note {
  /** id nội bộ, cũng là khoá tra cứu spec ghép mesh 3D thật (xem match3d.ts) */
  i: string;
  /** hệ cơ quan (SystemId) */
  s: SystemId;
  /** tên tiếng Việt */
  n: string;
  /** tên khoa học / tiếng Anh */
  e: string;
  /** tầng bóc lớp 2D: 0 da · 1 mỡ · 2 cơ · 3 xương · 4 nội tạng · 5 mạch–thần kinh */
  l: number;
  /** hình khối SVG (tab 2D) */
  sh: Shape[];
  /** vị trí đặt nhãn trên SVG [x,y] */
  lp: number[];
  vt: string; // vị trí nằm ở đâu
  cn: string; // chức năng
  sl: string; // số liệu đáng nhớ
  dh: string; // dấu hiệu bất thường
  gg: string; // điều nên lưu ý / khi nào cần khám
}

export const NOTES: Note[] = raw as Note[];
export const NOTE_BY_ID: Record<string, Note> = Object.fromEntries(NOTES.map((n) => [n.i, n]));

export interface LayerDef {
  k: string;
  n: string; // tên tầng
  d: string; // mô tả ngắn
}
export const LAYERS: LayerDef[] = layersRaw as LayerDef[];

export const BODY_SILHOUETTE: Shape[] = bodyRaw as Shape[];
