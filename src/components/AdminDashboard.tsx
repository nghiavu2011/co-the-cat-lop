import { useEffect, useState } from 'react';
import {
  loadTelemetry,
  resetTelemetry,
  type TelemetryData,
} from '../telemetry';
import {
  isAdminAuthenticated,
  logoutAdmin,
  verifyAdminPasscode,
} from '../security';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminDashboard({ isOpen, onClose }: AdminDashboardProps) {
  const [authed, setAuthed] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);

  // Kiểm tra trạng thái đăng nhập khi mở modal
  useEffect(() => {
    if (isOpen) {
      const isAuth = isAdminAuthenticated();
      setAuthed(isAuth);
      if (isAuth) {
        setTelemetry(loadTelemetry());
      }
      setErrorMsg('');
      setPasscode('');
    }
  }, [isOpen]);

  // Phím tắt đóng modal bằng Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;
    setLoading(true);
    setErrorMsg('');
    const ok = await verifyAdminPasscode(passcode);
    setLoading(false);
    if (ok) {
      setAuthed(true);
      setTelemetry(loadTelemetry());
    } else {
      setErrorMsg('Mật mã quản trị không chính xác. Quyền truy cập bị từ chối.');
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    setAuthed(false);
    setPasscode('');
  };

  const handleResetData = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu thống kê tích lũy? Thao tác này không thể hoàn tác.')) {
      resetTelemetry();
      setTelemetry(loadTelemetry());
    }
  };

  const handleExportJSON = () => {
    if (!telemetry) return;
    const blob = new Blob([JSON.stringify(telemetry, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nmstudio-anatomy-analytics-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!telemetry) return;
    let csv = '\uFEFF'; // BOM cho tiếng Việt Unicode trong Excel
    csv += 'MỤC THỐNG KÊ,GIÁ TRỊ,CHI TIẾT\n';
    csv += `Lượt truy cập,${telemetry.totalVisits},Phiên duyệt\n`;
    csv += `Lượt tương tác,${telemetry.totalInteractions},Thao tác 2D/3D\n`;
    csv += `Lần đầu ghi nhận,${telemetry.firstSeen},\n`;
    csv += `Cập nhật cuối,${telemetry.lastSeen},\n\n`;

    csv += 'THIẾT BỊ,SỐ LƯỢNG,\n';
    csv += `Máy tính (Desktop),${telemetry.devices.desktop || 0},\n`;
    csv += `Di động (Mobile),${telemetry.devices.mobile || 0},\n`;
    csv += `Máy tính bảng (Tablet),${telemetry.devices.tablet || 0},\n\n`;

    csv += 'CƠ QUAN QUAN TÂM NHẤT,LƯỢT XEM,\n';
    Object.entries(telemetry.organViews)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, v]) => {
        csv += `"${k}",${v},\n`;
      });
    csv += '\n';

    csv += 'ĐỐI TƯỢNG / NGHỀ NGHIỆP,SỐ LƯỢNG,\n';
    Object.entries(telemetry.demographics?.roles || {}).forEach(([k, v]) => {
      csv += `"${k}",${v},\n`;
    });
    csv += '\n';

    csv += 'ĐỘ TUỔI,SỐ LƯỢNG,\n';
    Object.entries(telemetry.demographics?.ageGroups || {}).forEach(([k, v]) => {
      csv += `"${k}",${v},\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nmstudio-anatomy-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="adminBackdrop" onClick={onClose}>
      <div className="adminModal" onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div className="adminModalHeader">
          <div className="adminHeaderTitleGroup">
            <span className="adminShieldIcon">🛡️</span>
            <div>
              <h2 className="adminTitle">Bảng Quản Trị Hệ Thống (Admin Dashboard)</h2>
              <p className="adminSubtitle">N&Mstudio Human Anatomy · Giám sát telemetry & Thấu hiểu người dùng</p>
            </div>
          </div>
          <button className="adminCloseBtn" onClick={onClose} title="Đóng bảng quản trị (Esc)">
            ✕
          </button>
        </div>

        {/* NẾU CHƯA XÁC THỰC: FORM NHẬP PASSCODE */}
        {!authed ? (
          <form className="adminLoginForm" onSubmit={handleLogin}>
            <div className="adminLoginLockVisual">
              <span className="adminBigLock">🔒</span>
              <h3>Xác Thực Quyền Quản Trị</h3>
              <p>Khu vực bảo mật nội bộ. Vui lòng nhập mã truy cập của quản trị viên để tiếp tục.</p>
            </div>

            <div className="adminPassInputWrap">
              <input
                type={showPass ? 'text' : 'password'}
                className="adminPassInput"
                placeholder="Nhập Passcode Quản trị..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
                required
              />
              <button
                type="button"
                className="adminEyeBtn"
                onClick={() => setShowPass((v) => !v)}
                title={showPass ? 'Ẩn mật mã' : 'Hiện mật mã'}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>

            {errorMsg && <div className="adminErrorMsg">⚠️ {errorMsg}</div>}

            <div className="adminLoginActions">
              <button type="submit" className="adminSubmitBtn" disabled={loading}>
                {loading ? 'Đang xác thực...' : '🔓 Mở Khóa Dashboard'}
              </button>
              <button type="button" className="adminCancelBtn" onClick={onClose}>
                Hủy bỏ
              </button>
            </div>

            <div className="adminLegalNote">
              ⚖️ Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân. Mọi dữ liệu thu thập hoàn toàn phi định danh, phục vụ tối ưu trải nghiệm học thuật y khoa.
            </div>
          </form>
        ) : (
          /* NẾU ĐÃ XÁC THỰC: DASHBOARD CHI TIẾT */
          <div className="adminBodyScroll">
            {/* THANH ĐIỀU HƯỚNG QUẢN TRỊ TRÊN CÙNG */}
            <div className="adminTopBar">
              <div className="adminSessionStatus">
                <span className="adminPulseDot" />
                <span>Phiên làm việc: <b>Quản Trị Viên (Root)</b></span>
              </div>
              <div className="adminActionButtons">
                <button className="adminBtnSecondary" onClick={handleExportCSV} title="Xuất file Excel CSV">
                  📊 Xuất Excel (CSV)
                </button>
                <button className="adminBtnSecondary" onClick={handleExportJSON} title="Xuất file JSON nguyên bản">
                  💾 Xuất JSON
                </button>
                <button className="adminBtnDanger" onClick={handleResetData} title="Đặt lại bộ đếm">
                  🗑️ Xóa Dữ Liệu
                </button>
                <button className="adminBtnLogout" onClick={handleLogout} title="Đăng xuất quyền quản trị">
                  🔒 Đăng Xuất
                </button>
              </div>
            </div>

            {telemetry && (
              <>
                {/* 1. THẺ KPI TỔNG QUAN */}
                <div className="adminKpiGrid">
                  <div className="adminKpiCard">
                    <span className="kpiLabel">Tổng Lượt Truy Cập</span>
                    <span className="kpiVal">{(telemetry.totalVisits || 1).toLocaleString('vi-VN')}</span>
                    <span className="kpiSub">Phiên hoạt động</span>
                  </div>
                  <div className="adminKpiCard">
                    <span className="kpiLabel">Tổng Tương Tác 3D/2D</span>
                    <span className="kpiVal">{(telemetry.totalInteractions || 0).toLocaleString('vi-VN')}</span>
                    <span className="kpiSub">Clicks & Zoom sâu</span>
                  </div>
                  <div className="adminKpiCard">
                    <span className="kpiLabel">Chế Độ Xem 3D</span>
                    <span className="kpiVal">{telemetry.modes?.['3d'] || 0}</span>
                    <span className="kpiSub">Lượt trải nghiệm 3D</span>
                  </div>
                  <div className="adminKpiCard">
                    <span className="kpiLabel">Chi Tiết Từng Cơ Quan</span>
                    <span className="kpiVal">{telemetry.modes?.detail || 0}</span>
                    <span className="kpiSub">Chế độ giải phẫu sâu</span>
                  </div>
                </div>

                {/* 2. CƠ QUAN ĐƯỢC QUAN TÂM NHẤT */}
                <div className="adminSection">
                  <h3 className="adminSecTitle">🫀 Mức Độ Quan Tâm Theo Cơ Quan Nội Tạng</h3>
                  <div className="adminBarChart">
                    {Object.entries(telemetry.organViews || {}).length === 0 ? (
                      <p className="adminEmpty">Chưa có dữ liệu lượt xem cơ quan.</p>
                    ) : (
                      Object.entries(telemetry.organViews)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 8)
                        .map(([organ, count]) => {
                          const max = Math.max(...Object.values(telemetry.organViews), 1);
                          const pct = Math.round((count / max) * 100);
                          return (
                            <div key={organ} className="adminBarItem">
                              <div className="adminBarHeader">
                                <span className="adminBarName">{organ.toUpperCase()}</span>
                                <span className="adminBarCount">{count} lượt xem</span>
                              </div>
                              <div className="adminBarTrack">
                                <div className="adminBarFill" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* 3. NHÂN KHẨU HỌC & ĐỐI TƯỢNG (Tuân thủ pháp luật) */}
                <div className="adminGrid2">
                  {/* VAI TRÒ / NGHỀ NGHIỆP */}
                  <div className="adminSection">
                    <h3 className="adminSecTitle">🎓 Đối Tượng Người Dùng (Nghề Nghiệp / Mục Tiêu)</h3>
                    <div className="adminDemographicsList">
                      {Object.entries(telemetry.demographics?.roles || {}).map(([role, count]) => (
                        <div key={role} className="adminDemoRow">
                          <span className="adminDemoRole">{role}</span>
                          <span className="adminDemoBadge">{count} phản hồi</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ĐỘ TUỔI */}
                  <div className="adminSection">
                    <h3 className="adminSecTitle">🎂 Phân Bố Nhóm Tuổi</h3>
                    <div className="adminDemographicsList">
                      {Object.entries(telemetry.demographics?.ageGroups || {}).map(([age, count]) => (
                        <div key={age} className="adminDemoRow">
                          <span className="adminDemoRole">Nhóm tuổi {age}</span>
                          <span className="adminDemoBadge">{count} người</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. ĐỊA LÝ & THIẾT BỊ */}
                <div className="adminGrid2">
                  {/* ĐỊA LÝ */}
                  <div className="adminSection">
                    <h3 className="adminSecTitle">📍 Phân Bố Địa Lý & Khu Vực</h3>
                    <div className="adminDemographicsList">
                      {Object.entries(telemetry.geo || {}).length === 0 ? (
                        <p className="adminEmpty">Chưa có dữ liệu địa phương.</p>
                      ) : (
                        Object.entries(telemetry.geo).map(([region, count]) => (
                          <div key={region} className="adminDemoRow">
                            <span className="adminDemoRole">{region}</span>
                            <span className="adminDemoBadge">{count} lượt</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* THIẾT BỊ TRUY CẬP */}
                  <div className="adminSection">
                    <h3 className="adminSecTitle">📱 Thiết Bị Sử Dụng</h3>
                    <div className="adminDeviceGrid">
                      <div className="adminDeviceBox">
                        <span className="deviceIcon">💻</span>
                        <span className="deviceType">Máy tính (Desktop)</span>
                        <span className="deviceCount">{telemetry.devices?.desktop || 0}</span>
                      </div>
                      <div className="adminDeviceBox">
                        <span className="deviceIcon">📱</span>
                        <span className="deviceType">Điện thoại (Mobile)</span>
                        <span className="deviceCount">{telemetry.devices?.mobile || 0}</span>
                      </div>
                      <div className="adminDeviceBox">
                        <span className="deviceIcon">📟</span>
                        <span className="deviceType">Máy tính bảng (Tablet)</span>
                        <span className="deviceCount">{telemetry.devices?.tablet || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. TỪ KHÓA TÌM KIẾM NHIỀU NHẤT */}
                <div className="adminSection">
                  <h3 className="adminSecTitle">🔍 Từ Khóa Tìm Kiếm Nổi Bật</h3>
                  <div className="adminSearchChips">
                    {Object.entries(telemetry.searchTerms || {}).length === 0 ? (
                      <p className="adminEmpty">Chưa có lượt tra cứu từ khóa nào.</p>
                    ) : (
                      Object.entries(telemetry.searchTerms)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 15)
                        .map(([term, count]) => (
                          <span key={term} className="adminSearchChip">
                            {term} <span className="chipCount">({count})</span>
                          </span>
                        ))
                    )}
                  </div>
                </div>

                {/* FOOTER BẢN QUYỀN TRONG DASHBOARD */}
                <div className="adminModalFooter">
                  <span>Hệ thống bảo vệ bản quyền & telemetry chuẩn hóa cho <b>N&Mstudio</b>.</span>
                  <span>Thời gian cập nhật: {new Date(telemetry.lastSeen).toLocaleString('vi-VN')}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
