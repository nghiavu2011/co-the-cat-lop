import type { PartSpec } from '../data/select';

// Ghép mỗi mục chú thích (Note.i) với các cấu trúc THẬT trong BodyParts3D 4.0.
// Đây là bộ chọn dùng để dựng bản artifact "Cơ Thể Cắt Lớp" v2 (xem
// scripts/build_mesh.py trong lịch sử dự án) — ở đây dùng lại y nguyên logic
// chọn lựa, nhưng KHÔNG gộp/giảm tam giác: mỗi part thật giữ nguyên hình học
// gốc, hiển thị như những đối tượng riêng biệt có thể bấm chọn từng cái.
//
// 33 mục còn lại trong content/notes.ts không có trong danh sách này vì
// BodyParts3D 4.0 (giải phẫu nam giới trưởng thành) không có mesh tương ứng —
// xem README.md phần "Giới hạn dữ liệu".
const HAND =
  '(carpal|metacarpal|phalanx).*(finger|thumb)|(scaphoid|lunate|triquetrum|pisiform|trapezium|trapezoid|capitate|hamate)';

export const MATCH_3D: Record<string, PartSpec> = {
  bieubi: { names: ['Skin'] },
  hopso: { concept: 'skull', systems: ['skeletal'] },
  ctsongco: { concept: 'cervical vertebral column' },
  ctsongnguc: { concept: 'thoracic vertebral column' },
  ctsonglung: { concept: 'lumbar vertebral column' },
  suon: { concept: 'rib cage', exclude: 'sternum' },
  xuonguc: { concept: 'sternum' },
  xuongchau: { concept: 'bony pelvis' },
  xuongdui: { concept: 'femur' },
  khopgoi: { rx: '^(left|right) (patella|tibia|fibula)$' },
  bantay: { rx: HAND, systems: ['skeletal'] },
  tim: {
    concept: 'heart',
    systems: ['cardiac', 'muscular'],
    exclude: 'cavity of|lateral ventricle|third ventricle|fourth ventricle|interventricular foramen|valve|cusp|leaflet',
  },
  vantim: { rx: 'valve|cusp of|leaflet of' },
  dmchu: { concept: 'aorta' },
  dmvanh: { concept: 'coronary artery' },
  dmcanh: { rx: 'carotid artery' },
  machphoi: { rx: '^(left|right)? ?pulmonary (artery|vein)|pulmonary trunk' },
  tmchi: { rx: 'saphenous vein' },
  phoiphai: { concept: 'right lung', systems: ['respiratory'] },
  phoitrai: { concept: 'left lung', systems: ['respiratory'] },
  khiquan: { names: ['Trachea'] },
  phequan: { rx: 'main bronchus' },
  thanhquan: { rx: 'thyroid cartilage|cricoid cartilage|epiglottis|hyoid bone|arytenoid' },
  khoangmui: { rx: 'nasal (concha|cartilage)|septal nasal' },
  cohoanh: { names: ['Diaphragm'] },
  gan: { concept: 'liver', rx: 'hepatovenous segment|lobe of liver' },
  tuimat: { names: ['Gallbladder'] },
  tuy: { rx: '^(pancreas|parenchyma of pancreas)$' },
  dsday: { names: ['Stomach'] },
  thucquan: { names: ['Esophagus'] },
  tatrang: { names: ['Duodenum'] },
  ruotnon: { concept: 'small intestine', exclude: 'mesent' },
  daitrang: { concept: 'large intestine', exclude: 'mesocolon' },
  tructrang: { names: ['Rectum'] },
  ruotthua: { names: ['Appendix'] },
  thanphai: { names: ['Right kidney'] },
  thantrai: { names: ['Left kidney'] },
  nieuquan: { rx: '^(left|right) ureter$' },
  bangquang: { names: ['Urinary bladder'] },
  nieudao: { names: ['Urethra'] },
  tuyenyen: { names: ['Pituitary gland'] },
  tuyentung: { names: ['Pineal body'] },
  thuongthan: { rx: 'adrenal gland' },
  tuyenuc: { rx: 'lobe of thymus' },
  lach: { names: ['Spleen'] },
  dainao: {
    concept: 'brain',
    systems: ['nervous'],
    exclude: 'cerebellum|brainstem|medulla oblongata|pons|midbrain|peduncle',
  },
  tieunao: { concept: 'cerebellum' },
  thannao: { concept: 'brainstem' },
  tuysong: { rx: 'spinal cord' },
  mat: { rx: 'sclera|choroid|retina|lens|vitreous|cornea|iris|ciliary body|chamber of' },
  nguclon: { rx: 'pectoralis major' },
  delta: { rx: 'part of (left|right) deltoid' },
  nhidau: { rx: 'biceps brachii' },
  tamdau: { rx: 'triceps brachii' },
  tudaudui: { rx: 'rectus femoris|vastus (lateralis|medialis|intermedius)' },
  bungchan: { rx: 'gastrocnemius|soleus' },
  ucdonchum: { rx: 'sternocleidomastoid' },
  tinhhoan: { rx: '^(left|right) testis$' },
  ongdantinh: { rx: 'deferent duct|epididymis' },
  tienliet: { names: ['Prostate'] },
  duongvat: { rx: 'corpus (cavernosum|spongiosum) of penis|glans penis' },
};
