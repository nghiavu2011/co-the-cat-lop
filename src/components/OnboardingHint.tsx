export interface OnboardingHintProps {
  mode: '2d' | '3d';
  onDismiss: () => void;
}

/** Lớp hướng dẫn thao tác hiện một lần cho người mới, tự ẩn khi tương tác hoặc bấm "Đã hiểu". */
export default function OnboardingHint({ mode, onDismiss }: OnboardingHintProps) {
  return (
    <div className="onboard" role="dialog" aria-label="Hướng dẫn sử dụng" onClick={onDismiss}>
      <div className="onboardCard" onClick={(e) => e.stopPropagation()}>
        <h3>Cách xem</h3>
        {mode === '3d' ? (
          <ul>
            <li>Kéo chuột để xoay mô hình</li>
            <li>Lăn chuột để phóng to / thu nhỏ</li>
            <li>Bấm vào một khối để xem chú thích</li>
            <li>Kéo thanh trượt bên dưới để cắt lớp</li>
          </ul>
        ) : (
          <ul>
            <li>Kéo thanh trượt để bóc từng lớp: da → mỡ → cơ → xương → nội tạng → mạch/thần kinh</li>
            <li>Bấm vào một bộ phận hoặc tên trong danh sách để xem chú thích</li>
            <li>Đổi sang tab "Cắt lát 3D thật" để xem mô hình ba chiều</li>
          </ul>
        )}
        <button className="onboardOk" onClick={onDismiss}>
          Đã hiểu, bắt đầu khám phá
        </button>
      </div>
    </div>
  );
}
