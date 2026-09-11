// ponytail: minimal client-side guard against casual cloning, devtools inspection, and frame hijacking
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

  // 2. Vô hiệu hóa chuột phải (context menu) để ngăn tải asset / view source dễ dàng
  window.addEventListener(
    'contextmenu',
    (e) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      e.preventDefault();
    },
    { capture: true }
  );

  // 3. Vô hiệu hóa phím tắt mở DevTools (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S)
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
}
