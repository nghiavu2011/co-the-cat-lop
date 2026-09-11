// Âm thanh cơ thể được TỔNG HỢP trực tiếp bằng Web Audio API (oscillator +
// noise đã lọc), không dùng file âm thanh bên ngoài — giữ app hoàn toàn tự
// chứa (không phụ thuộc mạng, không cần tải asset), nhất quán với cách đóng
// gói phông chữ cục bộ. Âm lượng cố ý rất nhẹ và có thể tắt hoàn toàn.

let ctx: AudioContext | null = null;
let stopCurrent: (() => void) | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** Dừng âm thanh cơ thể đang phát (nếu có), giảm dần nhẹ nhàng thay vì cắt đột ngột. */
export function stopBodySound(): void {
  stopCurrent?.();
  stopCurrent = null;
}

/** Tiếng tim đập nhẹ (nhịp lub-dub ~72 lần/phút), lặp cho tới khi stopBodySound(). */
export function playHeartbeat(): void {
  stopBodySound();
  let c: AudioContext;
  try {
    c = getCtx();
  } catch {
    return;
  }
  let stopped = false;
  const master = c.createGain();
  master.gain.value = 0.0001;
  master.connect(c.destination);
  master.gain.linearRampToValueAtTime(1, c.currentTime + 0.5);

  const bpm = 72;
  const period = 60 / bpm;
  const thumpOffsets = [0, 0.14]; // "lub" rồi "dub"
  let nextBeat = c.currentTime + 0.05;
  let timer = 0;

  function scheduleBeat(startTime: number) {
    for (let i = 0; i < thumpOffsets.length; i++) {
      const t0 = startTime + thumpOffsets[i];
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(58, t0);
      osc.frequency.exponentialRampToValueAtTime(36, t0 + 0.1);
      const g = c.createGain();
      const peak = i === 0 ? 0.85 : 0.5;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
      osc.connect(g);
      g.connect(master);
      osc.start(t0);
      osc.stop(t0 + 0.22);
    }
  }
  function tick() {
    if (stopped) return;
    const now = c.currentTime;
    while (nextBeat < now + 0.6) {
      scheduleBeat(nextBeat);
      nextBeat += period;
    }
    timer = window.setTimeout(tick, 150);
  }
  tick();

  stopCurrent = () => {
    stopped = true;
    window.clearTimeout(timer);
    const t0 = c.currentTime;
    master.gain.cancelScheduledValues(t0);
    master.gain.setValueAtTime(master.gain.value, t0);
    master.gain.linearRampToValueAtTime(0.0001, t0 + 0.25);
    window.setTimeout(() => {
      try {
        master.disconnect();
      } catch {
        /* đã ngắt kết nối */
      }
    }, 400);
  };
}

/** Tiếng thở nhẹ (hít vào – thở ra, chu kỳ ~4 giây), lặp cho tới khi stopBodySound(). */
export function playBreath(): void {
  stopBodySound();
  let c: AudioContext;
  try {
    c = getCtx();
  } catch {
    return;
  }
  let stopped = false;

  const master = c.createGain();
  master.gain.value = 0.0001;
  master.connect(c.destination);

  const bufferSize = 2 * c.sampleRate;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 550;
  filter.Q.value = 0.5;
  noise.connect(filter);
  filter.connect(master);
  noise.start();

  const period = 4; // giây mỗi chu kỳ hít-thở
  let timer = 0;
  function envelope() {
    if (stopped) return;
    const t0 = c.currentTime + 0.02;
    master.gain.cancelScheduledValues(t0);
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.linearRampToValueAtTime(0.16, t0 + period * 0.42); // hít vào
    master.gain.linearRampToValueAtTime(0.0001, t0 + period); // thở ra
    timer = window.setTimeout(envelope, period * 1000);
  }
  envelope();

  stopCurrent = () => {
    stopped = true;
    window.clearTimeout(timer);
    try {
      noise.stop();
    } catch {
      /* đã dừng */
    }
    window.setTimeout(() => {
      try {
        filter.disconnect();
        master.disconnect();
      } catch {
        /* đã ngắt kết nối */
      }
    }, 200);
  };
}
