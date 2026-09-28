import { useState, useEffect } from 'react';

interface CoffeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CoffeeModal({ isOpen, onClose }: CoffeeModalProps) {
  const [activeTab, setActiveTab] = useState<'techcom' | 'momo'>('techcom');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyStk = async () => {
    try {
      await navigator.clipboard.writeText('19077215974018');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="coffeeOverlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="coffeeModalCard" onClick={(e) => e.stopPropagation()}>
        <button className="coffeeCloseBtn" onClick={onClose} title="Đóng modal (Esc)">
          ✕
        </button>

        <div className="coffeeHeader">
          <div className="coffeeIconWrap">
            <span className="coffeeSteam">♨</span>
            <span className="coffeeIcon">☕</span>
          </div>
          <h2 className="coffeeTitle">Mời Tách Cà Phê · Tiếp Sức Dự Án</h2>
          <p className="coffeeSubtitle">
            Đồng hành cùng nền tảng Atlas Giải phẫu học 3D miễn phí cho thế hệ trẻ Việt Nam
          </p>
        </div>

        <div className="coffeeLetter">
          <p className="coffeeLetterParagraph">
            Chào bạn, tụi mình tạo nên nền tảng này với một mong ước giản dị: <b>giải phẫu học và sinh học cơ thể người không nên chỉ nằm khô cứng trong trang sách</b>. Học sinh, sinh viên Y và bất kỳ ai yêu khoa học đều xứng đáng được chạm, xoay và thấu hiểu thân thể kỳ diệu của mình một cách hoàn toàn miễn phí.
          </p>
          <p className="coffeeLetterParagraph">
            Mỗi sự tiếp sức — dù chỉ là một ly trà hay tách cà phê — đều là nguồn năng lượng quý giá giúp duy trì máy chủ, mở rộng thêm các cơ quan 3D mới và giữ cho dự án luôn <b>100% tự do, không quảng cáo rác</b>.
          </p>
        </div>

        {/* Tab lựa chọn ngân hàng / ví điện tử */}
        <div className="coffeeTabs">
          <button
            type="button"
            className={`coffeeTabBtn ${activeTab === 'techcom' ? 'active' : ''}`}
            onClick={() => setActiveTab('techcom')}
          >
            <span className="tabBankIcon techcom">TCB</span>
            Techcombank (Napas 247)
          </button>
          <button
            type="button"
            className={`coffeeTabBtn ${activeTab === 'momo' ? 'active' : ''}`}
            onClick={() => setActiveTab('momo')}
          >
            <span className="tabBankIcon momo">MOMO</span>
            Ví MoMo
          </button>
        </div>

        {/* Nội dung chi tiết theo tab */}
        <div className="coffeeTabBody">
          {activeTab === 'techcom' ? (
            <div className="coffeeBankDetail">
              <div className="coffeeQrBox">
                <img
                  src="/donate/Techcom.jpg"
                  alt="Mã QR Chuyển khoản Techcombank"
                  className="coffeeQrImg"
                  loading="lazy"
                />
                <span className="coffeeQrCaption">Quét bằng ứng dụng Ngân hàng bất kỳ</span>
              </div>

              <div className="coffeeInfoList">
                <div className="coffeeInfoRow">
                  <span className="coffeeInfoLabel">Ngân hàng</span>
                  <span className="coffeeInfoVal highlight">Techcombank (TCB)</span>
                </div>
                <div className="coffeeInfoRow">
                  <span className="coffeeInfoLabel">Số tài khoản</span>
                  <div className="coffeeStkRow">
                    <span className="coffeeInfoVal stk">19077215974018</span>
                    <button
                      type="button"
                      className={`copyStkBtn ${copied ? 'copied' : ''}`}
                      onClick={handleCopyStk}
                      title="Sao chép số tài khoản"
                    >
                      {copied ? '✓ Đã chép' : '📋 Sao chép'}
                    </button>
                  </div>
                </div>
                <div className="coffeeInfoRow">
                  <span className="coffeeInfoLabel">Nội dung gửi gắm</span>
                  <span className="coffeeInfoVal memo">Moi ca phe Giai phau 3D</span>
                </div>
                <div className="coffeeBankPledge">
                  💡 Hệ thống chuyển liên ngân hàng Napas 24/7 nhận được ngay tức thì từ mọi App ngân hàng.
                </div>
              </div>
            </div>
          ) : (
            <div className="coffeeBankDetail">
              <div className="coffeeQrBox">
                <img
                  src="/donate/MOMO.jpg"
                  alt="Mã QR Chuyển khoản MoMo"
                  className="coffeeQrImg"
                  loading="lazy"
                />
                <span className="coffeeQrCaption">Quét trực tiếp qua ứng dụng MoMo / VietQR</span>
              </div>

              <div className="coffeeInfoList">
                <div className="coffeeInfoRow">
                  <span className="coffeeInfoLabel">Phương thức</span>
                  <span className="coffeeInfoVal highlight" style={{ color: '#d82d8b' }}>Ví điện tử MoMo / VietQR</span>
                </div>
                <div className="coffeeInfoRow">
                  <span className="coffeeInfoLabel">Hình thức</span>
                  <span className="coffeeInfoVal">Quét mã QR Napas 247</span>
                </div>
                <div className="coffeeInfoRow">
                  <span className="coffeeInfoLabel">Nội dung gửi gắm</span>
                  <span className="coffeeInfoVal memo">Moi ca phe Giai phau 3D</span>
                </div>
                <div className="coffeeBankPledge">
                  💡 Bạn có thể dùng App MoMo hoặc ứng dụng Mobile Banking bất kỳ để quét mã QR này.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lời cảm ơn chân thành kết bài */}
        <div className="coffeeFooterNote">
          <span>❤️</span>
          <p>
            Dù là một ly cà phê ấm lòng hay chỉ đơn giản là một nút chia sẻ trang web đến bạn bè, tụi mình đều vô cùng biết ơn sự đồng hành của bạn!
          </p>
        </div>
      </div>
    </div>
  );
}
