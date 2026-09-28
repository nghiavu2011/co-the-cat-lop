// ponytail: minimal, privacy-compliant client-side telemetry (GDPR & Decree 13/2023/ND-CP safe)
// Không lưu PII (tên, số điện thoại, email, IP cá nhân), chỉ thống kê tần suất tổng hợp ẩn danh

export interface TelemetryData {
  firstSeen: string;
  lastSeen: string;
  totalVisits: number;
  totalInteractions: number;
  devices: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  geo: {
    [cityOrRegion: string]: number;
  };
  organViews: {
    [organId: string]: number;
  };
  searchTerms: {
    [term: string]: number;
  };
  modes: {
    '2d': number;
    '3d': number;
    detail: number;
  };
  genders: {
    male: number;
    female: number;
  };
  // Dữ liệu nhân khẩu học tự nguyện (Voluntary survey/inferred)
  demographics: {
    roles: {
      [role: string]: number; // 'Học sinh / Phổ thông', 'Sinh viên Y / Dược', 'Y Bác sĩ / Y tế', 'Cộng đồng'
    };
    ageGroups: {
      [age: string]: number; // '< 18', '18 - 24', '25 - 40', '41 - 60', '> 60'
    };
  };
}

const STORAGE_KEY = 'cotecatlop.telemetry';

function getInitialData(): TelemetryData {
  const now = new Date().toISOString();
  return {
    firstSeen: now,
    lastSeen: now,
    totalVisits: 1,
    totalInteractions: 0,
    devices: { mobile: 0, tablet: 0, desktop: 0 },
    geo: {},
    organViews: {},
    searchTerms: {},
    modes: { '2d': 0, '3d': 0, detail: 0 },
    genders: { male: 0, female: 0 },
    demographics: {
      roles: {
        'Học sinh / Phổ thông': 0,
        'Sinh viên Y / Dược': 0,
        'Y Bác sĩ / Y tế': 0,
        'Cộng đồng tìm hiểu': 0,
      },
      ageGroups: {
        '< 18': 0,
        '18 - 24': 0,
        '25 - 40': 0,
        '41 - 60': 0,
        '> 60': 0,
      },
    },
  };
}

export function loadTelemetry(): TelemetryData {
  if (typeof window === 'undefined') return getInitialData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = getInitialData();
      saveTelemetry(init);
      return init;
    }
    const parsed = JSON.parse(raw);
    return {
      ...getInitialData(),
      ...parsed,
      devices: { ...getInitialData().devices, ...(parsed.devices || {}) },
      demographics: {
        roles: { ...getInitialData().demographics.roles, ...(parsed.demographics?.roles || {}) },
        ageGroups: { ...getInitialData().demographics.ageGroups, ...(parsed.demographics?.ageGroups || {}) },
      },
    };
  } catch {
    return getInitialData();
  }
}

export function saveTelemetry(data: TelemetryData): void {
  if (typeof window === 'undefined') return;
  try {
    data.lastSeen = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage đầy hoặc bị chặn
  }
}

// Khởi tạo telemetry trong phiên
export function initTelemetrySession(): void {
  if (typeof window === 'undefined') return;
  const data = loadTelemetry();
  data.totalVisits = (data.totalVisits || 0) + 1;

  // Nhận diện loại thiết bị
  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));

  if (isTablet) data.devices.tablet = (data.devices.tablet || 0) + 1;
  else if (isMobile) data.devices.mobile = (data.devices.mobile || 0) + 1;
  else data.devices.desktop = (data.devices.desktop || 0) + 1;

  // Tự động nhận diện khu vực sơ bộ qua Intl.DateTimeFormat (Không cần gửi IP ra bên thứ 3)
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Chưa xác định';
    const regionName = tz.includes('Ho_Chi_Minh') || tz.includes('Saigon') || tz.includes('Bangkok')
      ? 'Việt Nam (Hà Nội / TP.HCM)'
      : tz.replace('_', ' ');
    data.geo[regionName] = (data.geo[regionName] || 0) + 1;
  } catch {
    data.geo['Việt Nam'] = (data.geo['Việt Nam'] || 0) + 1;
  }

  saveTelemetry(data);
}

// Ghi nhận xem cơ quan
export function trackOrganView(organId: string): void {
  if (!organId) return;
  const data = loadTelemetry();
  data.totalInteractions = (data.totalInteractions || 0) + 1;
  data.organViews[organId] = (data.organViews[organId] || 0) + 1;
  saveTelemetry(data);
}

// Ghi nhận tìm kiếm
export function trackSearch(term: string): void {
  const clean = term.trim().toLowerCase();
  if (!clean || clean.length < 2) return;
  const data = loadTelemetry();
  data.searchTerms[clean] = (data.searchTerms[clean] || 0) + 1;
  saveTelemetry(data);
}

// Ghi nhận chế độ xem
export function trackMode(mode: '2d' | '3d' | 'detail'): void {
  const data = loadTelemetry();
  data.modes[mode] = (data.modes[mode] || 0) + 1;
  saveTelemetry(data);
}

// Ghi nhận tương tác giới tính cơ thể
export function trackGenderChoice(gender: 'male' | 'female'): void {
  const data = loadTelemetry();
  data.genders[gender] = (data.genders[gender] || 0) + 1;
  saveTelemetry(data);
}

// Ghi nhận khảo sát nhân khẩu học tự nguyện
export function trackDemographicPulse(role?: string, ageGroup?: string): void {
  const data = loadTelemetry();
  if (role && data.demographics.roles[role] !== undefined) {
    data.demographics.roles[role] = (data.demographics.roles[role] || 0) + 1;
  } else if (role) {
    data.demographics.roles[role] = 1;
  }
  if (ageGroup && data.demographics.ageGroups[ageGroup] !== undefined) {
    data.demographics.ageGroups[ageGroup] = (data.demographics.ageGroups[ageGroup] || 0) + 1;
  } else if (ageGroup) {
    data.demographics.ageGroups[ageGroup] = 1;
  }
  saveTelemetry(data);
}

// Xóa trắng dữ liệu (dành cho Admin)
export function resetTelemetry(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
