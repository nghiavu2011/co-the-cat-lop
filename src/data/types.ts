// Kiểu dữ liệu cho gói hình học BodyParts3D (do ashemag/human-atlas đóng gói).
// Xem public/ATTRIBUTION.md để biết đầy đủ nguồn và giấy phép (CC BY 4.0).

export type RawSystem =
  | 'arterial' | 'venous' | 'muscular' | 'skeletal' | 'nervous'
  | 'respiratory' | 'digestive' | 'sensory' | 'connective' | 'cardiac'
  | 'reproductive' | 'urinary' | 'integumentary' | 'endocrine' | 'lymphatic'
  | 'pregnancy';

export interface AtlasPart {
  id: string;
  name: string;
  conceptId: string;
  system: RawSystem;
  chunk: number;
  positions: number; // byte offset trong chunk đã giải nén
  normals: number;
  indices: number;
  vertexCount: number;
  indexCount: number;
  bounds: [[number, number, number], [number, number, number]];
}

export interface AtlasConcept {
  id: string;
  name: string;
  elements: string[]; // danh sách AtlasPart.id
}

export interface AtlasChunk {
  url: string;
  bytes: number;
  gzip: string;
  gzipBytes: number;
}

export interface AtlasJSON {
  version: string;
  parts: AtlasPart[];
  chunks: AtlasChunk[];
  triangles: number;
  concepts: AtlasConcept[];
  sourceTriangles: number;
  optimized: { method: string; maximumRelativeError: number; preservedMeshes: number };
  sex: string;
  source: string;
  scope: string;
}

// 11 hệ cơ quan tiếng Việt dùng xuyên suốt ứng dụng.
export type SystemId =
  | 'da' | 'co' | 'xuong' | 'tuanhoan' | 'hohap' | 'tieuhoa'
  | 'tietnieu' | 'noitiet' | 'sinhduc' | 'lympho' | 'thankinh';
