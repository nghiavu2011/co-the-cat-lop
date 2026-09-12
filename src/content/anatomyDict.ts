// ponytail: zero-dep medical dictionary translating Latin/English anatomy names to rich Vietnamese anatomical context
export interface TranslatedPartInfo {
  viName: string;
  enName: string;
  category: string;
  location: string;
  function: string;
  clinicalNote: string;
}

const TERM_MAP: Record<string, string> = {
  // Định hướng / Vị trí
  right: 'phải',
  left: 'trái',
  anterior: 'trước',
  posterior: 'sau',
  superior: 'trên',
  inferior: 'dưới',
  lateral: 'ngoài',
  medial: 'trong',
  middle: 'giữa',
  intermediate: 'trung gian',
  internal: 'trong',
  external: 'ngoài',
  proximal: 'gần',
  distal: 'xa',
  apical: 'đỉnh',
  basal: 'đáy',
  dorsal: 'lưng / mu',
  ventral: 'bụng',
  palmar: 'lòng bàn tay',
  plantar: 'lòng bàn chân',
  superficial: 'nông',
  deep: 'sâu',
  ascending: 'lên',
  descending: 'xuống',
  horizontal: 'ngang',
  transverse: 'ngang',
  vertical: 'dọc',
  common: 'chung',
  proper: 'riêng',
  accessory: 'phụ',
  first: 'thứ nhất',
  second: 'thứ hai',
  third: 'thứ ba',
  fourth: 'thứ tư',
  fifth: 'thứ năm',

  // Cấu trúc mạch máu & thần kinh
  artery: 'Động mạch',
  vein: 'Tĩnh mạch',
  nerve: 'Dây thần kinh',
  arteriolar: 'Tiểu động mạch',
  plexus: 'Đám rối thần kinh',
  ganglion: 'Hạch thần kinh',
  branch: 'Nhánh',
  trunk: 'Thân',
  arch: 'Cung',
  valve: 'Van',
  sinus: 'Xoang',
  capillary: 'Mao mạch',

  // Cơ - Xương - Khớp - Dây chằng
  bone: 'Xương',
  cartilage: 'Sụn',
  ligament: 'Dây chằng',
  tendon: 'Gân',
  muscle: 'Cơ',
  head: 'Đầu',
  neck: 'Cổ',
  shaft: 'Thân xương',
  tubercle: 'Củ',
  tuberosity: 'Lồi củ',
  process: 'Mỏm',
  spine: 'Gai',
  condyle: 'Lồi cầu',
  epicondyle: 'Mỏm trên lồi cầu',
  fossa: 'Hố',
  groove: 'Rãnh',
  sulcus: 'Rãnh',
  gyrus: 'Hồi não',
  lobe: 'Thùy',
  lobule: 'Tiểu thùy',
  vertebra: 'Đốt sống',
  rib: 'Xương sườn',
  clavicle: 'Xương đòn',
  scapula: 'Xương bả vai',
  humerus: 'Xương cánh tay',
  radius: 'Xương quay',
  ulna: 'Xương trụ',
  femur: 'Xương đùi',
  patella: 'Xương bánh chè',
  tibia: 'Xương chày',
  fibula: 'Xương mác',
  pelvis: 'Khung chậu',
  sacrum: 'Xương cùng',
  coccyx: 'Xương cụt',
  phalanx: 'Xương đốt ngón',
  metacarpal: 'Xương đốt bàn tay',
  metatarsal: 'Xương đốt bàn chân',
  carpal: 'Xương cổ tay',
  tarsal: 'Xương cổ chân',
  tooth: 'Răng',
  incisor: 'Răng cửa',
  canine: 'Răng nanh',
  premolar: 'Răng tiền hàm',
  molar: 'Răng hàm',
  mandible: 'Xương hàm dưới',
  maxilla: 'Xương hàm trên',
  gingiva: 'Nướu / Lợi',

  // Cơ quan nội tạng
  heart: 'Tim',
  atrium: 'Tâm nhĩ',
  ventricle: 'Tâm thất / Não thất',
  aorta: 'Động mạch chủ',
  lung: 'Phổi',
  bronchus: 'Phế quản',
  bronchial: 'Thuộc phế quản',
  trachea: 'Khí quản',
  larynx: 'Thanh quản',
  pharynx: 'Hầu họng',
  esophagus: 'Thực quản',
  stomach: 'Dạ dày',
  duodenum: 'Tá tràng',
  jejunum: 'Hỗng tràng',
  ileum: 'Hồi tràng',
  cecum: 'Manh tràng',
  colon: 'Đại tràng (ruột già)',
  rectum: 'Trực tràng',
  anus: 'Hậu môn',
  appendix: 'Ruột thừa',
  liver: 'Gan',
  gallbladder: 'Túi mật',
  pancreas: 'Tuyến tụy',
  spleen: 'Lách',
  kidney: 'Thận',
  ureter: 'Niệu quản',
  bladder: 'Bàng quang',
  urethra: 'Niệu đạo',
  testis: 'Tinh hoàn',
  epididymis: 'Mào tinh hoàn',
  prostate: 'Tuyến tiền liệt',
  penis: 'Dương vật',
  ovary: 'Buồng trứng',
  uterus: 'Tử cung',
  thyroid: 'Tuyến giáp',
  pituitary: 'Tuyến yên',
  adrenal: 'Tuyến thượng thận',
  brain: 'Não bộ',
  cerebrum: 'Đại não',
  cerebellum: 'Tiểu não',
  brainstem: 'Thân não',
  cornea: 'Giác mạc',
  retina: 'Võng mạc',
  sclera: 'Củng mạc',
  lens: 'Thể thủy tinh',
  iris: 'Mống mắt',
  segmental: 'Phân thùy',
};

/**
 * Tự động dịch và chuẩn hoá tên giải phẫu tiếng Anh sang thuật ngữ y khoa tiếng Việt
 */
export function translateAnatomyName(rawName: string): string {
  if (!rawName) return '';
  let text = rawName.trim();

  // Xử lý các tiền tố phổ biến
  const isRight = /\b(right)\b/i.test(text);
  const isLeft = /\b(left)\b/i.test(text);
  const side = isRight ? 'phải' : isLeft ? 'trái' : '';

  // Thay thế các mẫu giải phẫu đặc thù trước
  if (/^segmental bronchus/i.test(text) || /bronchial tree/i.test(text)) {
    return `Phế quản phân thùy ${side}`.trim();
  }
  if (/^intercostal/i.test(text)) {
    return text.toLowerCase().includes('artery') ? `Động mạch gian sườn ${side}`.trim()
      : text.toLowerCase().includes('vein') ? `Tĩnh mạch gian sườn ${side}`.trim()
      : `Gian sườn ${side}`.trim();
  }

  // Tách từ và đối chiếu từ điển
  const tokens = text.split(/[\s,()]+/);
  const translatedTokens: string[] = [];

  for (const tok of tokens) {
    const clean = tok.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (TERM_MAP[clean]) {
      translatedTokens.push(TERM_MAP[clean]);
    } else {
      translatedTokens.push(tok);
    }
  }

  const result = translatedTokens.join(' ');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Tạo mô tả sinh lý y khoa chi tiết theo phân loại hệ cơ quan cho các mesh BodyParts3D
 */
export function getAnatomicalInsight(partName: string, system: string, conceptName?: string): TranslatedPartInfo {
  const viName = translateAnatomyName(partName);
  const lower = (partName + ' ' + (conceptName || '')).toLowerCase();

  let category = 'Cấu trúc giải phẫu sinh học';
  let location = `Tọa lạc trong hệ ${system}, định hình cấu trúc không gian ba chiều của cơ thể người.`;
  let func = 'Tham gia cấu thành mạng lưới liên kết sinh học và duy trì cơ chế sinh lý ổn định của cơ thể.';
  let clinicalNote = 'Mô hình nguyên bản chuẩn BodyParts3D từ Đại học Tokyo. Giữ toàn vẹn giải phẫu học tham chiếu quốc tế.';

  if (lower.includes('artery') || lower.includes('arteriolar')) {
    category = 'Hệ mạch máu động mạch';
    location = `Phân nhánh từ trục động mạch chủ hoặc các thân mạch chính, dẫn máu nuôi dưỡng các tế bào vùng ${viName}.`;
    func = 'Dẫn dòng máu giàu oxy và chất dinh dưỡng dưới áp lực cao từ tim tới nuôi dưỡng các cơ quan mô đích.';
    clinicalNote = 'Thành động mạch có lớp cơ trơn đàn hồi. Nguy cơ xơ vữa động mạch hoặc tắc nghẽn cục bộ gây thiếu máu nuôi.';
  } else if (lower.includes('vein') || lower.includes('venous')) {
    category = 'Hệ mạch máu tĩnh mạch';
    location = `Chạy song hành cùng động mạch, thu hồi máu nghèo oxy từ mô vi tuần hoàn trở về tâm nhĩ tim.`;
    func = 'Thu hồi dòng máu chứa carbon dioxide (CO₂) và các phụ phẩm chuyển hóa về tim và cơ quan lọc bài tiết (gan, thận).';
    clinicalNote = 'Áp lực tĩnh mạch thấp, thành mạch mỏng có van một chiều ngăn trào ngược (đặc biệt ở chi dưới). Cần đề phòng huyết khối.';
  } else if (lower.includes('nerve') || lower.includes('nervous') || lower.includes('ganglion')) {
    category = 'Hệ dẫn truyền thần kinh';
    location = `Tách từ tủy sống hoặc các đôi dây thần kinh sọ não, len lỏi qua các khe cơ và xương đến tận cùng cảm giác / vận động.`;
    func = 'Dẫn truyền xung điện sinh học điều khiển vận động cơ bắp hoặc thu nhận cảm giác (đau, nhiệt, xúc giác, áp lực) về trung ương não bộ.';
    clinicalNote = 'Dây thần kinh dễ bị chèn ép tại các ống hẹp xương hoặc thoát vị đĩa đệm, gây cảm giác tê buốt hoặc yếu cơ.';
  } else if (lower.includes('bone') || lower.includes('vertebra') || lower.includes('rib') || lower.includes('phalanx')) {
    category = 'Hệ xương & khung nâng đỡ';
    location = `Thuộc bộ khung xương người gồm 206 xương, khớp nối với các sụn và gân cơ.`;
    func = 'Tạo khung nâng đỡ cơ thể, bảo vệ các nội tạng sinh tử bên trong, và tủy xương bên trong là nơi sinh các dòng tế bào máu.';
    clinicalNote = 'Mô xương liên tục diễn ra quá trình hủy xương và tạo xương. Cần cung cấp đủ canxi, vitamin D3 và vận động chịu lực để phòng loãng xương.';
  } else if (lower.includes('muscle') || lower.includes('flexor') || lower.includes('extensor') || lower.includes('abductor')) {
    category = 'Hệ thống cơ vận động';
    location = `Bám vào các đầu xương qua hệ thống gân dẻo dai.`;
    func = 'Co rút chuyển hóa năng lượng ATP thành động năng, thực hiện các động tác gập, duỗi, xoay và ổn định tư thế đứng vững.';
    clinicalNote = 'Cơ bắp cần được kéo giãn và khởi động đúng cách; quá tải đột ngột dễ dẫn đến căng cơ hoặc rách sợi vi thể.';
  } else if (lower.includes('tooth') || lower.includes('molar') || lower.includes('incisor') || lower.includes('canine')) {
    category = 'Răng & cung hàm';
    location = `Cắm sâu vào các ổ xương hàm trên hoặc hàm dưới qua dây chằng nha chu.`;
    func = 'Cắt, xé và nghiền nát thức ăn, khởi đầu cho quá trình tiêu hóa cơ học trước khi thức ăn đi xuống thực quản.';
    clinicalNote = 'Men răng là tổ chức cứng nhất cơ thể nhưng không có tế bào sống để tái tạo khi đã thủng men do acid vi khuẩn sâu răng.';
  } else if (lower.includes('bronch') || lower.includes('lung') || lower.includes('trachea')) {
    category = 'Hệ dẫn khí & hô hấp';
    location = `Nằm trong khoang ngực, nối liền từ thanh quản xuống mạng lưới phế nang.`;
    func = 'Dẫn khí, lọc sạch dị vật bằng biểu mô lông chuyển và chuyển giao khí oxy/CO₂ với tuần hoàn mao mạch phổi.';
    clinicalNote = 'Cần tránh khói thuốc lá và bụi mịn PM2.5 vì có thể gây viêm phế quản mạn tính hoặc co thắt đường thở.';
  }

  return {
    viName,
    enName: partName,
    category,
    location,
    function: func,
    clinicalNote,
  };
}

