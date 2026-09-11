import BrandLogo from './BrandLogo';

export default function Footer() {
  return (
    <footer className="footerRefined">
      {/* KHỐI TRỌNG TÂM CHÍNH - TINH TẾ, ĐẲNG CẤP */}
      <div className="footerHero">
        <div className="footerHeroBrand">
          <BrandLogo size={46} className="footerHeroLogo" />
          <div className="footerHeroText">
            <h3 className="footerHeroTitle">N&Mstudio Human Anatomy</h3>
            <p className="footerHeroSubtitle">Interactive 3D Medical Visualization Platform</p>
          </div>
        </div>

        <p className="footerHeroDesc">
          Nền tảng trực quan hoá giải phẫu 3D ứng dụng WebGL và dữ liệu quét sinh học thực tế, kiến tạo trải nghiệm học tập và thấu cảm thân thể chuẩn xác cho cộng đồng.
        </p>

        <div className="footerHeroContact">
          <span className="footerContactNote">Tư vấn kỹ thuật & Hợp tác chuyên môn:</span>
          <a
            href="https://zalo.me/0985578385"
            target="_blank"
            rel="noreferrer"
            className="footerZaloBtn"
            title="Nhắn tin Zalo: 0985578385"
          >
            <span className="zaloBadge">Zalo</span>
            <span className="phoneText">+84 985 578 385</span>
          </a>
        </div>
      </div>

      {/* KHỐI THÔNG TIN BẢN QUYỀN & KHUYẾN CÁO NHỎ XINH (DISCREET & COMPACT) */}
      <div className="footerFinePrint">
        <div className="fineItem">
          <span className="fineTag">Dữ liệu & Bản quyền:</span>
          <span>
            BodyParts3D 4.0 © DBCLS (ĐH Tokyo, CC BY 4.0) · 2.234 mesh qua <code>ashemag/human-atlas</code> · Tham chiếu Gray's Anatomy & Netter Atlas.
          </span>
        </div>
        <div className="fineItem">
          <span className="fineTag">Khuyến cáo y khoa:</span>
          <span>
            Mô hình giải phẫu tham chiếu phục vụ mục đích giáo dục thường thức, không thay thế chẩn đoán lâm sàng của bác sĩ chuyên khoa.
          </span>
        </div>
      </div>

      {/* DÒNG COPYRIGHT CUỐI */}
      <div className="footerCopyright">
        <span>© 2026 <b>N&Mstudio Human Anatomy</b>. All rights reserved.</span>
        <span>
          Hotline / Zalo: <a href="https://zalo.me/0985578385" target="_blank" rel="noreferrer">+84 985 578 385</a>
        </span>
      </div>
    </footer>
  );
}
