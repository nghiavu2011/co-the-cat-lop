// Đồng bộ trạng thái xem hiện tại (chế độ, hệ đang chọn, bộ phận đang chọn)
// vào URL bằng history.replaceState — để người dùng chia sẻ đúng góc nhìn
// đang xem cho người khác (dán link, người nhận mở ra thấy đúng bộ phận đó).
import { SYSTEM_BY_ID } from './data/systems';
import { NOTE_BY_ID } from './content/notes';
import type { SystemId } from './data/types';
import type { Selection } from './selection';

export interface UrlState {
  mode: '2d' | '3d' | 'detail' | null;
  activeSystem: SystemId | null;
  selection: Selection | null;
}

/** Đọc trạng thái ban đầu từ URL hiện tại (nếu có) — dùng khi khởi tạo state. */
export function readUrlState(): UrlState {
  if (typeof window === 'undefined') return { mode: null, activeSystem: null, selection: null };
  const p = new URLSearchParams(window.location.search);

  const modeRaw = p.get('mode');
  const mode: UrlState['mode'] = modeRaw === '2d' || modeRaw === '3d' || modeRaw === 'detail' ? modeRaw : null;

  const sysRaw = p.get('he');
  const activeSystem: SystemId | null = sysRaw && sysRaw in SYSTEM_BY_ID ? (sysRaw as SystemId) : null;

  const selRaw = p.get('bp');
  let selection: Selection | null = null;
  if (selRaw) {
    const [kind, ...rest] = selRaw.split(':');
    const id = rest.join(':');
    if (kind === 'note' && id in NOTE_BY_ID) selection = { kind: 'note', id };
    else if (kind === 'part' && id) selection = { kind: 'part', id };
  }
  return { mode, activeSystem, selection };
}

/** Ghi trạng thái hiện tại vào URL (không tạo mục lịch sử mới). */
export function writeUrlState(state: UrlState): void {
  if (typeof window === 'undefined') return;
  const p = new URLSearchParams();
  if (state.mode) p.set('mode', state.mode);
  if (state.activeSystem) p.set('he', state.activeSystem);
  if (state.selection) p.set('bp', `${state.selection.kind}:${state.selection.id}`);
  const qs = p.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', url);
}
