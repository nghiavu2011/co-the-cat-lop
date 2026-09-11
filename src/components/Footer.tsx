export default function Footer() {
  return (
    <footer>
      <span>
        <b>Hình học 3D:</b> BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0
        International — giải phẫu người trưởng thành nam, toàn bộ 2.234 mesh gốc, không giảm chất lượng. Gói dữ
        liệu lấy từ dự án mã nguồn mở <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11 }}>ashemag/human-atlas</span>.
        Công bố gốc: Mitsuhashi et al. (2009), <em>Nucleic Acids Research</em>. Xem đầy đủ tại{' '}
        <code>public/ATTRIBUTION.md</code>.
      </span>
      <span>
        <b>Giới hạn của dữ liệu:</b> đây là mô hình nam giới trưởng thành nên không có tử cung, buồng trứng, vòi
        trứng, cổ tử cung. Tuyến giáp, cơ thẳng bụng, cơ chéo bụng, amidan, hạch – mạch lympho và nhiều dây thần
        kinh ngoại vi cũng không có mesh riêng — các mục này chỉ xuất hiện ở tab bóc lớp 2D.
      </span>
      <span>
        <b>Số liệu y khoa</b> tham chiếu Gray's Anatomy và Atlas Giải phẫu người (Frank H. Netter, bản dịch tiếng
        Việt). Trang này phục vụ giáo dục, không phải công cụ chẩn đoán.
      </span>
    </footer>
  );
}
