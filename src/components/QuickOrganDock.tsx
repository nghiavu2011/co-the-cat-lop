import { useLocale } from '../locale/useLocale';

export interface QuickOrganDef {
  id: string;
  noteId: string | null;
  labelVi: string;
  labelEn: string;
  icon: string;
  peel: number;
  system: string | null;
}

export const QUICK_ORGANS: QuickOrganDef[] = [
  { id: 'fullbody', noteId: null, labelVi: 'Toàn thân', labelEn: 'Full Body', icon: '🧍', peel: 100, system: null },
  { id: 'tim', noteId: 'tim', labelVi: 'Tim', labelEn: 'Heart', icon: '❤️', peel: 20, system: 'tuanhoan' },
  { id: 'nao', noteId: 'dainao', labelVi: 'Não bộ', labelEn: 'Brain', icon: '🧠', peel: 0, system: 'thankinh' },
  { id: 'phoi', noteId: 'phoiphai', labelVi: 'Phổi', labelEn: 'Lungs', icon: '🫁', peel: 35, system: 'hohap' },
  { id: 'gan', noteId: 'gan', labelVi: 'Gan', labelEn: 'Liver', icon: '🫀', peel: 25, system: 'tieuhoa' },
  { id: 'than', noteId: 'thanphai', labelVi: 'Thận', labelEn: 'Kidneys', icon: '🩸', peel: 20, system: 'tietnieu' },
  { id: 'daday', noteId: 'dsday', labelVi: 'Dạ dày', labelEn: 'Stomach', icon: '🍽️', peel: 25, system: 'tieuhoa' },
  { id: 'tucung', noteId: 'tucung', labelVi: 'Tử cung & Chậu', labelEn: 'Uterus & Pelvis', icon: '👶', peel: 20, system: 'sinhduc' },
  { id: 'xuong', noteId: 'ctsongnguc', labelVi: 'Khung xương', labelEn: 'Skeleton', icon: '🦴', peel: 50, system: 'xuong' },
];

export interface QuickOrganDockProps {
  activeNoteId: string | null;
  onSelectOrgan: (organ: QuickOrganDef) => void;
}

export default function QuickOrganDock({ activeNoteId, onSelectOrgan }: QuickOrganDockProps) {
  const { locale } = useLocale();

  return (
    <nav
      className="quickOrganDock"
      aria-label="Phím tắt chuyển nhanh cơ quan nội tạng"
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {QUICK_ORGANS.map((item) => {
        const isSelected = item.noteId === null ? activeNoteId === null : activeNoteId === item.noteId;
        return (
          <button
            key={item.id}
            type="button"
            className={`quickOrganBtn ${isSelected ? 'active' : ''}`}
            onClick={() => onSelectOrgan(item)}
            title={locale === 'en' ? item.labelEn : item.labelVi}
          >
            <span className="organIcon">{item.icon}</span>
            <span className="organLabel">{locale === 'en' ? item.labelEn : item.labelVi}</span>
          </button>
        );
      })}
    </nav>
  );
}
