import { useLocale } from '../locale/useLocale';

export interface OnboardingHintProps {
  mode: '2d' | '3d';
  onDismiss: () => void;
}

/** Lớp hướng dẫn thao tác hiện một lần cho người mới, tự ẩn khi tương tác hoặc bấm "Đã hiểu". */
export default function OnboardingHint({ mode, onDismiss }: OnboardingHintProps) {
  const { t, locale } = useLocale();

  return (
    <div className="onboard" role="dialog" aria-label={t('onboarding.title') || 'Hướng dẫn sử dụng'} onClick={onDismiss}>
      <div className="onboardCard" onClick={(e) => e.stopPropagation()}>
        <h3>{locale === 'en' ? 'Quick Guide' : 'Cách xem & thao tác'}</h3>
        {mode === '3d' ? (
          <ul>
            <li>{locale === 'en' ? 'Left click & drag to rotate 360°' : 'Kéo chuột để xoay mô hình 360°'}</li>
            <li>{locale === 'en' ? 'Scroll wheel to zoom in / out' : 'Lăn chuột để phóng to / thu nhỏ'}</li>
            <li>{locale === 'en' ? 'Click any structure to open context action (Hide, Ghost, Isolate)' : 'Bấm vào một khối để xem chú thích & thanh công cụ (Ẩn, Mờ, Cô lập)'}</li>
            <li>{locale === 'en' ? 'Slide the left bar to peel layers (Skin → Muscle → Skeleton → Organs)' : 'Kéo thanh trượt bên trái để bóc tách từng tầng cơ thể (Zygote Layer Peel)'}</li>
          </ul>
        ) : (
          <ul>
            <li>{locale === 'en' ? 'Drag slider to peel: skin → fat → muscle → skeleton → organs → vessels/nerves' : 'Kéo thanh trượt để bóc từng lớp: da → mỡ → cơ → xương → nội tạng → mạch/thần kinh'}</li>
            <li>{locale === 'en' ? 'Click a part or name in catalog to view anatomy profile' : 'Bấm vào một bộ phận hoặc tên trong danh sách để xem chú thích'}</li>
            <li>{locale === 'en' ? 'Switch to "Real 3D Slice" for full biometric models' : 'Đổi sang tab "Cắt lát 3D thật" để xem mô hình ba chiều'}</li>
          </ul>
        )}
        <button className="onboardOk" onClick={onDismiss}>
          {locale === 'en' ? 'Got it, start exploring' : 'Đã hiểu, bắt đầu khám phá'}
        </button>
      </div>
    </div>
  );
}
