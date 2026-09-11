import type { AtlasJSON, AtlasPart, RawSystem } from './types';

export interface PartSpec {
  /** tên khái niệm (concept) trong atlas.concepts, không phân biệt hoa/thường */
  concept?: string;
  /** lọc theo tên part (regex, luôn không phân biệt hoa/thường) */
  rx?: string;
  /** chỉ giữ part thuộc các hệ gốc này */
  systems?: RawSystem[];
  /** loại bỏ part có tên khớp regex này */
  exclude?: string;
  /** khớp chính xác theo danh sách tên (khi có, bỏ qua concept) */
  names?: string[];
}

let conceptIndex: Map<string, string[]> | null = null;
function buildConceptIndex(atlas: AtlasJSON): Map<string, string[]> {
  if (!conceptIndex) {
    conceptIndex = new Map(atlas.concepts.map((c) => [c.name.toLowerCase(), c.elements]));
  }
  return conceptIndex;
}

let partIndex: Map<string, AtlasPart> | null = null;
function buildPartIndex(atlas: AtlasJSON): Map<string, AtlasPart> {
  if (!partIndex) {
    partIndex = new Map(atlas.parts.map((p) => [p.id, p]));
  }
  return partIndex;
}

/** Chọn các AtlasPart khớp một spec — cùng logic với scripts/build_mesh.py (bước 1). */
export function selectParts(atlas: AtlasJSON, spec: PartSpec): AtlasPart[] {
  const byId = buildPartIndex(atlas);
  let ps: AtlasPart[];
  if (spec.names) {
    const set = new Set(spec.names);
    ps = atlas.parts.filter((p) => set.has(p.name));
  } else if (spec.concept) {
    const elements = buildConceptIndex(atlas).get(spec.concept.toLowerCase()) ?? [];
    ps = elements.map((id) => byId.get(id)).filter((p): p is AtlasPart => !!p);
  } else {
    ps = atlas.parts;
  }
  if (spec.rx) {
    const r = new RegExp(spec.rx, 'i');
    ps = ps.filter((p) => r.test(p.name));
  }
  if (spec.systems) {
    const set = new Set(spec.systems);
    ps = ps.filter((p) => set.has(p.system));
  }
  if (spec.exclude) {
    const r = new RegExp(spec.exclude, 'i');
    ps = ps.filter((p) => !r.test(p.name));
  }
  return ps;
}
