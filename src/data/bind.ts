import type { AtlasJSON, AtlasPart } from './types';
import { selectParts } from './select';
import { MATCH_3D } from '../content/match3d';

export interface AtlasBinding {
  /** part.id -> id của Note đã biên soạn (nếu có) */
  partToNote: Map<string, string>;
  /** id Note -> danh sách part thật thuộc note đó */
  noteToParts: Map<string, AtlasPart[]>;
}

let cached: AtlasBinding | null = null;

/** Ghép mỗi Note đã biên soạn với các AtlasPart thật tương ứng (chỉ tính một lần). */
export function buildBinding(atlas: AtlasJSON): AtlasBinding {
  if (cached) return cached;
  const partToNote = new Map<string, string>();
  const noteToParts = new Map<string, AtlasPart[]>();
  for (const [noteId, spec] of Object.entries(MATCH_3D)) {
    const parts = selectParts(atlas, spec);
    noteToParts.set(noteId, parts);
    for (const p of parts) {
      if (!partToNote.has(p.id)) partToNote.set(p.id, noteId);
    }
  }
  cached = { partToNote, noteToParts };
  return cached;
}
