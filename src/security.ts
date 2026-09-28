// ponytail: minimal client-side guard against cloning, devtools tamper, clickjacking, and XSS

// Mã băm SHA-256 của mật mã quản trị viên: 'nmstudio@2026'
const ADMIN_HASH_HEX = '1f2bf29a2c402be8fe625599d046959bd070634e1b3f4a32e80b8786184b9988';
const AUTH_SESSION_KEY = 'cotecatlop.admin_authenticated';

// Kiểm tra mật mã qua Web Crypto API chuẩn (Native, 0 dependency)
export async function verifyAdminPasscode(passcode: string): Promise<boolean> {
  if (!passcode || typeof window === 'undefined' || !window.crypto?.subtle) return false;
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(passcode.trim());
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    const isValid = hashHex === ADMIN_HASH_HEX;
    if (isValid) {
      sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
    }
    return isValid;
  } catch {
    return false;
  }
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function logoutAdmin(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

// Hàm làm sạch chuỗi input phòng chống XSS / chèn script độc hại
export function sanitizeInput(str: string): string {
  if (!str) return '';
  return str
    .replace(/[<>'"&]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case "'": return '&#39;';
        case '"': return '&quot;';
        case '&': return '&amp;';
        default: return char;
      }
    })
    .slice(0, 100); // giới hạn độ dài an toàn
}

export function initSecurityGuards(): void {
  if (typeof window === 'undefined') return;

  // 1. Chống iframe embedding / clickjacking trên client
  try {
    if (window.top && window.top !== window.self) {
      window.top.location.href = window.self.location.href;
    }
  } catch {
    try {
      window.self.document.body.innerHTML =
        '<div style="padding:40px;color:#d9534f;font-family:sans-serif;text-align:center;">Trang web không cho phép hiển thị trong iframe nhúng ngoài.</div>';
    } catch {
      /* ignore */
    }
  }

  // 2. Chống sao chép nội dung & chuột phải (context menu), bảo vệ bản quyền 3D và dữ liệu giải phẫu
  window.addEventListener(
    'contextmenu',
    (e) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      e.preventDefault();
    },
    { capture: true }
  );

  // 3. Vô hiệu hóa phím tắt inspect (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S)
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'F12') {
        e.preventDefault();
        return;
      }
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
        e.preventDefault();
        return;
      }
      if (e.ctrlKey && ['U', 'S'].includes(e.key.toUpperCase())) {
        e.preventDefault();
        return;
      }
    },
    { capture: true }
  );

  // 4. Ngăn chặn kéo thả trực tiếp canvas / hình ảnh ra ngoài
  window.addEventListener(
    'dragstart',
    (e) => {
      e.preventDefault();
    },
    { capture: true }
  );

  // 5. Cảnh báo an ninh Self-XSS trong Console khi người dùng mở DevTools
  try {
    console.log(
      '%c⚠️ CẢNH BÁO AN NINH & BẢN QUYỀN (N&Mstudio Human Anatomy)',
      'font-size: 20px; font-weight: bold; color: #ff3b30; text-shadow: 1px 1px #000;'
    );
    console.log(
      '%cĐây là bảng điều khiển bảo mật dành cho nhà phát triển hệ thống. Việc dán các đoạn mã lạ vào đây có thể khiến bạn bị tấn công chiếm quyền điều khiển (Self-XSS). Mọi hành vi nhân bản, sao chép trái phép dữ liệu 3D và mã nguồn đều bị giám sát.',
      'font-size: 13px; color: #ffcc00; font-style: italic;'
    );
  } catch {
    /* ignore */
  }

  // 6. Cảnh báo nhân bản tên miền trái phép
  try {
    const host = window.location.hostname;
    const isAllowed =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.vercel.app') ||
      host.endsWith('.github.io');
    if (!isAllowed) {
      console.warn('Phát hiện website đang chạy trên domain ngoài danh sách cấp phép:', host);
    }
  } catch {
    /* ignore */
  }
}
