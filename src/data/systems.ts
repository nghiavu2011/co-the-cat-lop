import type { AtlasPart, RawSystem, SystemId } from './types';

export interface SystemDef {
  id: SystemId;
  name: string;
  color: string; // biến CSS, ví dụ "--t-heart"
}

export const SYSTEMS: SystemDef[] = [
  { id: 'da', name: 'Da & mô dưới da', color: '--t-skin' },
  { id: 'co', name: 'Cơ', color: '--t-muscle' },
  { id: 'xuong', name: 'Xương & khớp', color: '--t-bone' },
  { id: 'tuanhoan', name: 'Tuần hoàn', color: '--t-heart' },
  { id: 'hohap', name: 'Hô hấp', color: '--t-lung' },
  { id: 'tieuhoa', name: 'Tiêu hoá', color: '--t-gut' },
  { id: 'tietnieu', name: 'Tiết niệu', color: '--t-urin' },
  { id: 'noitiet', name: 'Nội tiết', color: '--t-endo' },
  { id: 'sinhduc', name: 'Sinh dục', color: '--t-repro' },
  { id: 'lympho', name: 'Miễn dịch – Lympho', color: '--t-lymph' },
  { id: 'thankinh', name: 'Thần kinh', color: '--t-nerve' },
];

export const SYSTEM_BY_ID: Record<SystemId, SystemDef> = Object.fromEntries(
  SYSTEMS.map((s) => [s.id, s]),
) as Record<SystemId, SystemDef>;

// Ánh xạ mặc định từ trường "system" gốc của BodyParts3D sang 11 hệ tiếng Việt.
// Đây là ánh xạ gần đúng cho ~2.170 cấu trúc KHÔNG nằm trong bộ nội dung đã
// biên soạn (xem content/notes.ts) — các cấu trúc đã biên soạn dùng hệ do
// người biên soạn gán, chính xác hơn ánh xạ tự động này.
const RAW_TO_SYSTEM: Record<RawSystem, SystemId> = {
  arterial: 'tuanhoan',
  venous: 'tuanhoan',
  cardiac: 'tuanhoan',
  muscular: 'co',
  skeletal: 'xuong',
  connective: 'xuong', // dây chằng, cân, mạc — gộp tạm cùng nhóm xương & khớp
  nervous: 'thankinh',
  sensory: 'thankinh',
  respiratory: 'hohap',
  digestive: 'tieuhoa',
  reproductive: 'sinhduc',
  urinary: 'tietnieu',
  endocrine: 'noitiet',
  lymphatic: 'lympho',
  integumentary: 'da',
  pregnancy: 'sinhduc',
};

// Lỗi gán hệ có sẵn trong dữ liệu nguồn: các não thất (ventricle) và lỗ gian
// não thất được BodyParts3D gắn nhãn "cardiac" vì cùng dùng từ "ventricle"
// như tâm thất tim — đây rõ ràng là cấu trúc não, không phải tim.
const BRAIN_VENTRICLE = /^(left|right) lateral ventricle$|^(third|fourth) ventricle$|^interventricular foramen$/i;

export function defaultSystemFor(part: AtlasPart): SystemId {
  if (part.system === 'cardiac' && BRAIN_VENTRICLE.test(part.name)) return 'thankinh';
  return RAW_TO_SYSTEM[part.system];
}
