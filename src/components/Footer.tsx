export default function Footer() {
  return (
    <footer className="footerPro">
      <div className="footerCols">
        <div className="footerCol brandCol">
          <div className="footerBrandHead">
            <img src="/logo.png" alt="N&Mstudio Logo" className="footerLogo" />
            <div>
              <div className="footerBrandTitle">N&Mstudio Human Anatomy</div>
              <div className="footerBrandSub">Interactive 3D Medical Visualization Platform</div>
            </div>
          </div>
          <p className="footerDesc">
            Nền tảng ứng dụng đồ họa 3D WebGL và dữ liệu sinh học thực tế nhằm mang lại trải nghiệm học tập, thấu hiểu cấu trúc thân thể và nâng cao nhận thức y khoa thường thức cho cộng đồng.
          </p>
          <div className="footerContact">
            <span className="footerContactLabel">Hỗ trợ kỹ thuật & Hợp tác chuyên môn:</span>
            <a
              href="https://zalo.me/0985578385"
              target="_blank"
              rel="noreferrer"
              className="footerContactBtn"
              title="Liên hệ Zalo: 0985578385"
            >
              <span className="zaloPill">Zalo</span>
              <span className="footerPhone">+84 985 578 385</span>
            </a>
          </div>
        </div>

        <div className="footerCol">
          <h4>Nguồn Dữ Liệu & Bản Quyền</h4>
          <ul className="footerList">
            <li>
              <b>Dữ liệu 3D:</b> BodyParts3D 4.0 © DBCLS (Đại học Tokyo, Nhật Bản) — Giấy phép quốc tế CC BY 4.0.
            </li>
            <li>
              <b>Khối hình học:</b> 2.234 mesh giải phẫu quét thực nghiệm, đóng gói nhị phân tối ưu bởi <code>ashemag/human-atlas</code>.
            </li>
            <li>
              <b>Biên soạn tiếng Việt:</b> N&Mstudio tham chiếu theo Atlas Giải Phẫu Người (Frank H. Netter) và Gray's Anatomy.
            </li>
          </ul>
        </div>

        <div className="footerCol">
          <h4>Khuyến Cáo & Giới Hạn</h4>
          <ul className="footerList">
            <li>
              <b>Phạm vi:</b> Mô hình chuẩn tham chiếu nam giới trưởng thành. Các cấu trúc tuyến giáp, mạc cơ và hệ sinh dục nữ được minh họa tại tab Bóc lớp 2D.
            </li>
            <li>
              <b>Miễn trừ trách nhiệm:</b> Tài liệu phục vụ mục đích học thuật và giáo dục thường thức. Mọi triệu chứng cần được thăm khám tại các cơ sở y tế.
            </li>
          </ul>
        </div>
      </div>

      <div className="footerBottom">
        <span>© 2026 <b>N&Mstudio Human Anatomy</b>. Bản quyền thuộc về N&Mstudio.</span>
        <span className="footerBottomContact">
          Hotline / Zalo: <a href="https://zalo.me/0985578385" target="_blank" rel="noreferrer">+84 985 578 385</a>
        </span>
      </div>
    </footer>
  );
}
