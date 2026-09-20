import type { AtlasJSON } from './types';

const MODELS_BASE = `${import.meta.env.BASE_URL}models`;

const ATLAS_VERSION = '2287';

let atlasPromise: Promise<AtlasJSON> | null = null;
export function loadAtlasJSON(): Promise<AtlasJSON> {
  if (!atlasPromise) {
    atlasPromise = fetch(`${MODELS_BASE}/atlas.json?v=${ATLAS_VERSION}`).then((r) => {
      if (!r.ok) throw new Error(`Không tải được atlas.json (HTTP ${r.status})`);
      return r.json();
    });
  }
  return atlasPromise;
}

let atlasFemalePromise: Promise<AtlasJSON> | null = null;
export function loadAtlasFemaleJSON(): Promise<AtlasJSON> {
  if (!atlasFemalePromise) {
    atlasFemalePromise = fetch(`${MODELS_BASE}/atlas-female.json?v=${ATLAS_VERSION}`).then((r) => {
      if (!r.ok) throw new Error(`Không tải được atlas-female.json (HTTP ${r.status})`);
      return r.json();
    });
  }
  return atlasFemalePromise;
}

export const supportsGzipStream = typeof DecompressionStream !== 'undefined';

/** true nếu 2 byte đầu là chữ ký gzip (0x1f 0x8b) — tức đây vẫn là bytes nén,
 * trình duyệt CHƯA tự giải nén qua header Content-Encoding. */
function looksGzipped(buf: ArrayBuffer): boolean {
  const b = new Uint8Array(buf, 0, Math.min(2, buf.byteLength));
  return b.length === 2 && b[0] === 0x1f && b[1] === 0x8b;
}

const chunkCache = new Map<string, Promise<ArrayBuffer>>();

/** Tải và giải nén một chunk hình học theo yêu cầu, có cache. */
export function loadChunk(atlas: AtlasJSON, chunkIndex: number): Promise<ArrayBuffer> {
  const meta = atlas.chunks[chunkIndex];
  const cacheKey = meta.gzip;
  let p = chunkCache.get(cacheKey);
  if (p) return p;
  p = (async () => {
    const res = await fetch(`${import.meta.env.BASE_URL}${meta.gzip.replace(/^\//, '')}`);
    if (!res.ok) throw new Error(`Không tải được ${meta.gzip} (HTTP ${res.status})`);
    const buf = await res.arrayBuffer();
    if (!looksGzipped(buf)) return buf; // trình duyệt đã tự giải nén qua Content-Encoding
    if (!supportsGzipStream) {
      // Trình duyệt không hỗ trợ giải nén trực tiếp: thử tải bản .bin gốc
      // (chỉ có nếu được sao chép thủ công vào public/models).
      const raw = await fetch(`${import.meta.env.BASE_URL}${meta.url.replace(/^\//, '')}`);
      if (!raw.ok) {
        throw new Error(
          'Trình duyệt này không hỗ trợ giải nén gzip trực tiếp (DecompressionStream). ' +
            'Hãy dùng Chrome, Edge hoặc Firefox bản mới để xem mô hình 3D.',
        );
      }
      return raw.arrayBuffer();
    }
    const ds = new DecompressionStream('gzip');
    const stream = new Blob([buf]).stream().pipeThrough(ds);
    return new Response(stream).arrayBuffer();
  })();
  chunkCache.set(cacheKey, p);
  return p;
}

export interface LoadProgress {
  loadedChunks: number;
  totalChunks: number;
  loadedBytes: number;
  totalBytes: number;
}

/** Tải toàn bộ 15 chunk hình học, báo tiến độ qua callback. */
export async function loadAllChunks(
  atlas: AtlasJSON,
  onProgress?: (p: LoadProgress) => void,
): Promise<ArrayBuffer[]> {
  const totalBytes = atlas.chunks.reduce((s, c) => s + c.bytes, 0);
  let loadedBytes = 0;
  let loadedChunks = 0;
  const buffers = new Array<ArrayBuffer>(atlas.chunks.length);
  await Promise.all(
    atlas.chunks.map(async (meta, i) => {
      buffers[i] = await loadChunk(atlas, i);
      loadedChunks += 1;
      loadedBytes += meta.bytes;
      onProgress?.({ loadedChunks, totalChunks: atlas.chunks.length, loadedBytes, totalBytes });
    }),
  );
  return buffers;
}
