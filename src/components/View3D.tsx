import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { AtlasJSON, AtlasPart, SystemId } from '../data/types';
import { loadAllChunks, type LoadProgress } from '../data/loader';
import { buildPartGeometry } from '../data/geometry';
import { defaultSystemFor, SYSTEM_BY_ID } from '../data/systems';
import { buildBinding } from '../data/bind';
import type { Selection } from '../selection';

export interface AxisDef {
  label: string;
  normal: [number, number, number];
  lo: number;
  hi: number;
  /** điểm dừng không đều theo trục dọc (đầu/cổ/ngực/bụng/chậu/chân) */
  stops?: number[];
}

export const AXES: AxisDef[] = [
  { label: 'Ngang (axial)', normal: [0, 1, 0], lo: -0.03, hi: 1.74, stops: [1.735, 1.3, 1.08, 0.9, -0.03] },
  { label: 'Dọc giữa (sagittal)', normal: [1, 0, 0], lo: -0.36, hi: 0.36 },
  { label: 'Trước – sau (coronal)', normal: [0, 0, 1], lo: -0.17, hi: 0.17 },
];

export function sliceValue(axis: number, sliceT: number): number {
  const a = AXES[axis];
  if (axis !== 0 || !a.stops) return a.lo + (sliceT / 100) * (a.hi - a.lo);
  const t = (sliceT / 100) * 4;
  const i = Math.min(3, Math.floor(t));
  const f = t - i;
  return a.stops[i] + (a.stops[i + 1] - a.stops[i]) * f;
}

interface MeshEntry {
  mesh: THREE.Mesh;
  part: AtlasPart;
  system: SystemId;
  noteId: string | null;
  /** Vật liệu "bình thường" thật sự của mesh này (có thể khác vật liệu dùng
   * chung theo hệ, ví dụ mạch máu dùng vật liệu riêng có hiệu ứng dòng chảy).
   * Dùng để khôi phục đúng vẻ ngoài khi bỏ chọn, thay vì luôn quay về
   * normalMat[system]. */
  ownMaterial: THREE.Material;
}

/** Các mục chú thích được coi là "tim" — cho hiệu ứng đập nhịp. */
const HEART_NOTE_IDS = new Set(['tim']);
/** Các mục chú thích được coi là "phổi" — cho hiệu ứng phồng-xẹp khi thở. */
const LUNG_NOTE_IDS = new Set(['phoiphai', 'phoitrai']);
/** Các mục thuộc hệ tuần hoàn nhưng KHÔNG phải mạch máu (không áp hiệu ứng dòng chảy). */
const NON_VESSEL_CIRCULATORY_IDS = new Set(['tim', 'vantim']);

/** Dịch chuyển hình học về gốc rồi đặt lại vị trí ở tâm khối, để scale mesh
 * co-giãn quanh CHÍNH TÂM của nó thay vì quanh gốc toạ độ thế giới — cần cho
 * hiệu ứng tim đập / thở vì dữ liệu BodyParts3D đã đóng gói toạ độ tuyệt đối
 * ngay trong hình học (mesh.position mặc định là gốc). */
function pivotAtCenter(mesh: THREE.Mesh): void {
  const geo = mesh.geometry;
  geo.computeBoundingBox();
  const center = new THREE.Vector3();
  geo.boundingBox!.getCenter(center);
  geo.translate(-center.x, -center.y, -center.z);
  mesh.position.copy(center);
}

const VESSEL_VERTEX_SHADER = `
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  #include <clipping_planes_pars_vertex>
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 mvPosition = viewMatrix * worldPos;
    gl_Position = projectionMatrix * mvPosition;
    #include <clipping_planes_vertex>
  }
`;
const VESSEL_FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform float uTime;
  uniform vec3 uLightDir;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  #include <clipping_planes_pars_fragment>
  void main() {
    #include <clipping_planes_fragment>
    vec3 N = normalize(vNormalW);
    vec3 L = normalize(uLightDir);
    vec3 V = normalize(cameraPosition - vWorldPos);
    
    // Tán xạ mô sinh học dạng Half-Lambert làm mềm bóng đổ thành mạch
    float diff = pow(max(0.0, dot(N, L)) * 0.5 + 0.5, 1.3);
    
    // Viền sáng Fresnel mô phỏng lớp màng bao bóng ẩm
    float fresnel = pow(1.0 - max(0.0, dot(N, V)), 2.8);
    
    // Dải xung động tuần hoàn chạy dọc chiều dài mạch máu
    float band = pow(0.5 + 0.5 * sin(vWorldPos.y * 16.0 - uTime * 2.8), 5.0);
    
    vec3 baseCol = uColor * (diff * 0.88 + 0.22) + vec3(1.0, 0.5, 0.4) * fresnel * 0.32;
    vec3 pulseCol = vec3(1.0, 0.94, 0.82) * band * 0.48;
    gl_FragColor = vec4(baseCol + pulseCol, 1.0);
  }
`;

export interface View3DProps {
  atlas: AtlasJSON;
  activeSystem: SystemId | null;
  onlySystem: boolean;
  showGhost: boolean;
  axis: number;
  sliceT: number;
  selection: Selection | null;
  onPick: (sel: Selection) => void;
  onCounts?: (visible: number, total: number) => void;
}

function readCssColor(varName: string): THREE.Color {
  const v = getComputedStyle(document.body).getPropertyValue(varName).trim();
  return new THREE.Color(v || '#8a8a8a');
}

interface SystemMaterialProfile {
  shininess: number;
  specular?: number;
  emissive?: number;
}

const SYSTEM_MATERIAL_PROFILES: Record<SystemId, SystemMaterialProfile> = {
  da: { shininess: 6, specular: 0x222222 },
  co: { shininess: 24, specular: 0x442222 },
  xuong: { shininess: 8, specular: 0x2a2820 },
  tuanhoan: { shininess: 42, specular: 0x662222 },
  hohap: { shininess: 14, specular: 0x334455 },
  tieuhoa: { shininess: 36, specular: 0x553820 },
  tietnieu: { shininess: 32, specular: 0x443040 },
  noitiet: { shininess: 20, specular: 0x443818 },
  sinhduc: { shininess: 28, specular: 0x442838 },
  lympho: { shininess: 16, specular: 0x283820 },
  thankinh: { shininess: 28, specular: 0x554418, emissive: 0x201804 },
};

export default function View3D({
  atlas,
  activeSystem,
  onlySystem,
  showGhost,
  axis,
  sliceT,
  selection,
  onPick,
  onCounts,
}: View3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState<LoadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const planeRef = useRef<THREE.Plane | null>(null);
  const skinRef = useRef<THREE.Mesh | null>(null);
  const entriesRef = useRef<MeshEntry[]>([]);
  const selectedMatRef = useRef<THREE.MeshPhongMaterial | null>(null);
  const vesselMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const highlightedRef = useRef<THREE.Mesh[]>([]);
  const heartMeshesRef = useRef<THREE.Mesh[]>([]);
  const lungMeshesRef = useRef<THREE.Mesh[]>([]);
  const camState = useRef({
    theta: 0.34,
    phi: 1.46,
    radius: 3.0,
    targetX: 0,
    targetY: 0.92,
    targetZ: 0,
    destTheta: 0.34,
    destPhi: 1.46,
    destRadius: 3.0,
    destTargetX: 0,
    destTargetY: 0.92,
    destTargetZ: 0,
  });
  const lastInteractRef = useRef(0);
  const draggingRef = useRef(false);
  const reducedMotionRef = useRef(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

  // ---------- dựng cảnh một lần khi atlas sẵn sàng ----------
  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(34, 1, 0.02, 60);
    cameraRef.current = camera;
    const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), sliceValue(axis, sliceT));
    planeRef.current = plane;

    // Hệ thống ánh sáng 3 điểm chuẩn Studio Y khoa:
    // 1. Ánh sáng môi trường dịu nhẹ, giữ độ tương phản cho các hốc giải phẫu
    scene.add(new THREE.AmbientLight(0xfff6ec, 0.38));

    // 2. Key Light (Đèn chính): ánh sáng ấm nhẹ, tạo bóng khối rõ rệt
    const keyLight = new THREE.DirectionalLight(0xfff8f0, 0.82);
    keyLight.position.set(2.5, 4.0, 3.5);
    scene.add(keyLight);

    // 3. Fill Light (Đèn bù sáng): ánh sáng lạnh nhẹ, bù sáng các vùng khuất
    const fillLight = new THREE.DirectionalLight(0xdce6f5, 0.36);
    fillLight.position.set(-3.0, 1.2, -2.0);
    scene.add(fillLight);

    // 4. Rim / Back Light (Đèn viền ngược): tách biệt khối cơ thể khỏi nền
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.42);
    rimLight.position.set(0.0, 3.0, -4.2);
    scene.add(rimLight);

    const selectedMaterial = new THREE.MeshPhongMaterial({
      color: readCssColor('--brass'),
      emissive: new THREE.Color(0x5a4218),
      specular: new THREE.Color(0xffe290),
      shininess: 56,
      side: THREE.DoubleSide,
      clippingPlanes: [plane],
    });
    selectedMatRef.current = selectedMaterial;

    const normalMat: Record<SystemId, THREE.MeshPhongMaterial> = {} as never;
    for (const s of Object.keys(SYSTEM_BY_ID) as SystemId[]) {
      const profile = SYSTEM_MATERIAL_PROFILES[s] ?? { shininess: 18 };
      normalMat[s] = new THREE.MeshPhongMaterial({
        color: readCssColor(SYSTEM_BY_ID[s].color),
        side: THREE.DoubleSide,
        shininess: profile.shininess,
        specular: profile.specular !== undefined ? new THREE.Color(profile.specular) : new THREE.Color(0x333333),
        emissive: profile.emissive !== undefined ? new THREE.Color(profile.emissive) : new THREE.Color(0x000000),
        clippingPlanes: [plane],
      });
    }
    const vesselMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: readCssColor(SYSTEM_BY_ID.tuanhoan.color) },
        uTime: { value: 0 },
        uLightDir: { value: new THREE.Vector3(2.5, 4.0, 3.5).normalize() },
      },
      vertexShader: VESSEL_VERTEX_SHADER,
      fragmentShader: VESSEL_FRAGMENT_SHADER,
      clippingPlanes: [plane],
      side: THREE.DoubleSide,
    });
    vesselMatRef.current = vesselMaterial;

    (async () => {
      try {
        const buffers = await loadAllChunks(atlas, (p) => !cancelled && setProgress(p));
        if (cancelled) return;
        const binding = buildBinding(atlas);
        const entries: MeshEntry[] = [];
        for (const part of atlas.parts) {
          const isSkin = part.name === 'Skin';
          const geo = buildPartGeometry(part, buffers[part.chunk]);
          const system = defaultSystemFor(part);
          const noteId = binding.partToNote.get(part.id) ?? null;
          if (isSkin) {
            const skinMat = new THREE.MeshPhongMaterial({
              color: readCssColor(SYSTEM_BY_ID.da.color),
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.06,
              depthWrite: false,
              shininess: 4,
              clippingPlanes: [plane],
            });
            const mesh = new THREE.Mesh(geo, skinMat);
            mesh.renderOrder = 2;
            mesh.visible = showGhost;
            scene.add(mesh);
            skinRef.current = mesh;
            continue;
          }
          const isVessel = system === 'tuanhoan' && !(noteId && NON_VESSEL_CIRCULATORY_IDS.has(noteId));
          const ownMaterial: THREE.Material = isVessel ? vesselMaterial : normalMat[system];
          const mesh = new THREE.Mesh(geo, ownMaterial);
          mesh.userData.partId = part.id;
          const isHeart = noteId !== null && HEART_NOTE_IDS.has(noteId);
          const isLung = noteId !== null && LUNG_NOTE_IDS.has(noteId);
          if (isHeart || isLung) pivotAtCenter(mesh);
          scene.add(mesh);
          entries.push({ mesh, part, system, noteId, ownMaterial });
          if (isHeart) heartMeshesRef.current.push(mesh);
          if (isLung) lungMeshesRef.current.push(mesh);
        }
        entriesRef.current = entries;
        if (!cancelled) {
          setReady(true);
          onCounts?.(entries.filter((e) => e.mesh.visible).length, entries.length);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();

    // ---------- tương tác chuột đa chiều: xoay (left-drag), kéo pan (right-drag hoặc Shift+left), phóng to, double-click zoom in ----------
    let isDragging = false;
    let dragMode: 'orbit' | 'pan' = 'orbit';
    let moved = 0;
    let px = 0;
    let py = 0;

    // ponytail: touch gesture state — minimal vars for pinch/pan detection
    let lastTouchDist = 0;
    let lastTouchCX = 0;
    let lastTouchCY = 0;
    let touchCount = 0;
    let lastTapTime = 0;

    const onDown = (e: PointerEvent) => {
      isDragging = true;
      draggingRef.current = true;
      lastInteractRef.current = performance.now();
      moved = 0;
      px = e.clientX;
      py = e.clientY;
      // Chuột phải (button === 2) hoặc giữ phím Shift: Chế độ kéo Pan (di chuyển góc nhìn)
      dragMode = e.button === 2 || e.shiftKey ? 'pan' : 'orbit';
      canvas.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!isDragging) return;
      lastInteractRef.current = performance.now();
      const dx = e.clientX - px;
      const dy = e.clientY - py;
      moved += Math.abs(dx) + Math.abs(dy);
      px = e.clientX;
      py = e.clientY;

      if (dragMode === 'pan') {
        // TÍNH TOÁN VECTOR PAN VUÔNG GÓC VỚI HƯỚNG NHÌN CAMERA
        const forward = new THREE.Vector3()
          .subVectors(
            new THREE.Vector3(camState.current.targetX, camState.current.targetY, camState.current.targetZ),
            camera.position
          )
          .normalize();
        const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
        const up = new THREE.Vector3().crossVectors(right, forward).normalize();

        const factor = (camState.current.radius / 1000) * 1.5;
        const panX = -right.x * dx * factor + up.x * dy * factor;
        const panY = -right.y * dx * factor + up.y * dy * factor;
        const panZ = -right.z * dx * factor + up.z * dy * factor;

        camState.current.destTargetX += panX;
        camState.current.destTargetY += panY;
        camState.current.destTargetZ += panZ;
        camState.current.targetX += panX;
        camState.current.targetY += panY;
        camState.current.targetZ += panZ;
      } else {
        // CHẾ ĐỘ XOAY QUANH ĐIỂM TIÊU CỰ (ORBIT)
        camState.current.destTheta -= dx * 0.008;
        camState.current.destPhi = Math.max(0.2, Math.min(2.95, camState.current.destPhi - dy * 0.006));
        camState.current.theta = camState.current.destTheta;
        camState.current.phi = camState.current.destPhi;
      }
    };

    const onUp = (e: PointerEvent) => {
      isDragging = false;
      draggingRef.current = false;
      lastInteractRef.current = performance.now();
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      lastInteractRef.current = performance.now();
      const zoomDelta = e.deltaY * 0.0022;
      camState.current.destRadius = Math.max(0.18, Math.min(5.5, camState.current.destRadius + zoomDelta));
    };

    const raycaster = new THREE.Raycaster();

    // Bấm chọn đơn
    const onClick = (e: MouseEvent) => {
      if (moved > 6) return;
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      const pl = planeRef.current!;
      const candidates = entriesRef.current.filter((en) => en.mesh.visible).map((en) => en.mesh);
      const hits = raycaster
        .intersectObjects(candidates, false)
        .filter((h) => pl.distanceToPoint(h.point) > 0);
      if (hits.length === 0) return;
      const hitMesh = hits[0].object as THREE.Mesh;
      const partId = hitMesh.userData.partId as string;
      const entry = entriesRef.current.find((en) => en.part.id === partId);
      if (!entry) return;
      onPick(entry.noteId ? { kind: 'note', id: entry.noteId } : { kind: 'part', id: partId });
    };

    // DOUBLE-CLICK ĐỂ ZOOM IN VÀ TIÊU ĐIỂM (FOCUS) TRỰC TIẾP VÀO BỘ PHẬN ĐƯỢC CHỌN
    const onDblClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      const pl = planeRef.current!;
      const candidates = entriesRef.current.filter((en) => en.mesh.visible).map((en) => en.mesh);
      const hits = raycaster
        .intersectObjects(candidates, false)
        .filter((h) => pl.distanceToPoint(h.point) > 0);

      if (hits.length > 0) {
        const hit = hits[0];
        const hitMesh = hit.object as THREE.Mesh;
        const partId = hitMesh.userData.partId as string;
        const entry = entriesRef.current.find((en) => en.part.id === partId);
        if (entry) {
          onPick(entry.noteId ? { kind: 'note', id: entry.noteId } : { kind: 'part', id: partId });
        }

        // Lấy tâm hình học thật của bộ phận vừa bấm
        hitMesh.geometry.computeBoundingBox();
        const bbox = hitMesh.geometry.boundingBox;
        const targetPt = hit.point.clone();
        if (bbox) {
          const center = new THREE.Vector3();
          bbox.getCenter(center);
          hitMesh.localToWorld(center);
          targetPt.copy(center);
        }

        // Tính khoảng cách zoom phù hợp theo kích thước bộ phận
        let desiredRadius = 0.55;
        if (bbox) {
          const sz = new THREE.Vector3();
          bbox.getSize(sz);
          const maxDim = Math.max(sz.x, sz.y, sz.z);
          desiredRadius = Math.max(0.28, Math.min(1.6, maxDim * 2.8));
        }

        // Mượt mà chuyển tiêu cự vào tâm bộ phận
        camState.current.destTargetX = targetPt.x;
        camState.current.destTargetY = targetPt.y;
        camState.current.destTargetZ = targetPt.z;
        camState.current.destRadius = desiredRadius;
        lastInteractRef.current = performance.now();
      }
    };

    // ---------- cử chỉ cảm ứng cho thiết bị di động ----------
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      touchCount = e.touches.length;
      lastInteractRef.current = performance.now();
      if (touchCount === 1) {
        // 1 ngón = xoay orbit
        px = e.touches[0].clientX;
        py = e.touches[0].clientY;
        isDragging = true;
        draggingRef.current = true;
        dragMode = 'orbit';
        moved = 0;
        // Double-tap detection
        const now = performance.now();
        if (now - lastTapTime < 320) {
          // Giả lập double-click tại vị trí ngón tay
          const fakeEvt = { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } as MouseEvent;
          onDblClick(fakeEvt);
          lastTapTime = 0;
        } else {
          lastTapTime = now;
        }
      } else if (touchCount === 2) {
        // 2 ngón = pinch zoom + pan
        isDragging = true;
        draggingRef.current = true;
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        lastTouchDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        lastTouchCX = (t0.clientX + t1.clientX) / 2;
        lastTouchCY = (t0.clientY + t1.clientY) / 2;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      lastInteractRef.current = performance.now();
      if (e.touches.length === 1 && touchCount === 1) {
        // 1 ngón: xoay orbit
        const dx = e.touches[0].clientX - px;
        const dy = e.touches[0].clientY - py;
        moved += Math.abs(dx) + Math.abs(dy);
        px = e.touches[0].clientX;
        py = e.touches[0].clientY;
        camState.current.destTheta -= dx * 0.008;
        camState.current.destPhi = Math.max(0.2, Math.min(2.95, camState.current.destPhi - dy * 0.006));
        camState.current.theta = camState.current.destTheta;
        camState.current.phi = camState.current.destPhi;
      } else if (e.touches.length === 2) {
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        // Pinch zoom
        const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        if (lastTouchDist > 0) {
          const scale = lastTouchDist / dist;
          camState.current.destRadius = Math.max(0.18, Math.min(5.5, camState.current.destRadius * scale));
        }
        lastTouchDist = dist;
        // Pan bằng trung tâm 2 ngón
        const cx = (t0.clientX + t1.clientX) / 2;
        const cy = (t0.clientY + t1.clientY) / 2;
        const dx = cx - lastTouchCX;
        const dy = cy - lastTouchCY;
        lastTouchCX = cx;
        lastTouchCY = cy;
        const forward = new THREE.Vector3()
          .subVectors(
            new THREE.Vector3(camState.current.targetX, camState.current.targetY, camState.current.targetZ),
            camera.position
          )
          .normalize();
        const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
        const up = new THREE.Vector3().crossVectors(right, forward).normalize();
        const factor = (camState.current.radius / 1000) * 1.5;
        const panX = -right.x * dx * factor + up.x * dy * factor;
        const panY = -right.y * dx * factor + up.y * dy * factor;
        const panZ = -right.z * dx * factor + up.z * dy * factor;
        camState.current.destTargetX += panX;
        camState.current.destTargetY += panY;
        camState.current.destTargetZ += panZ;
        camState.current.targetX += panX;
        camState.current.targetY += panY;
        camState.current.targetZ += panZ;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 0) {
        isDragging = false;
        draggingRef.current = false;
        lastInteractRef.current = performance.now();
        // Tap chọn (không kéo nhiều)
        if (touchCount === 1 && moved < 10) {
          const fakeEvt = { clientX: px, clientY: py } as MouseEvent;
          onClick(fakeEvt);
        }
      }
      touchCount = e.touches.length;
      if (touchCount === 2) {
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        lastTouchDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        lastTouchCX = (t0.clientX + t1.clientX) / 2;
        lastTouchCY = (t0.clientY + t1.clientY) / 2;
      }
    };

    const onCtxMenu = (e: Event) => e.preventDefault();

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('dblclick', onDblClick);
    canvas.addEventListener('contextmenu', onCtxMenu);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    const resize = () => {
      const w = canvas.clientWidth || 600;
      const h = canvas.clientHeight || 520;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', resize);
    resize();

    const IDLE_DELAY_MS = 4000;
    const IDLE_ROTATE_SPEED = 0.045; // rad/giây

    let rafId = 0;
    let lastTs = 0;
    const loop = (ts: number) => {
      rafId = requestAnimationFrame(loop);
      const dt = lastTs ? Math.min(0.1, (ts - lastTs) / 1000) : 0;
      lastTs = ts;
      const t = ts / 1000;
      const reduceMotion = reducedMotionRef.current;

      // Nội suy mượt mà (Lerp) góc nhìn, độ phóng và tâm nhìn
      const lerpSpeed = dt * 8.5;
      camState.current.radius += (camState.current.destRadius - camState.current.radius) * lerpSpeed;
      camState.current.targetX += (camState.current.destTargetX - camState.current.targetX) * lerpSpeed;
      camState.current.targetY += (camState.current.destTargetY - camState.current.targetY) * lerpSpeed;
      camState.current.targetZ += (camState.current.destTargetZ - camState.current.targetZ) * lerpSpeed;

      // Tự xoay nhẹ khi rảnh tay
      if (!reduceMotion && !draggingRef.current && ts - lastInteractRef.current > IDLE_DELAY_MS) {
        camState.current.theta += IDLE_ROTATE_SPEED * dt;
        camState.current.destTheta = camState.current.theta;
      }

      if (!reduceMotion) {
        // Nhịp tim
        const heartPulse = 1 + 0.07 * Math.pow(Math.max(0, Math.sin(2 * Math.PI * 1.2 * t)), 6);
        for (const m of heartMeshesRef.current) m.scale.setScalar(heartPulse);

        // Hô hấp
        const breathPulse = 1 + 0.035 * Math.sin(2 * Math.PI * 0.25 * t);
        for (const m of lungMeshesRef.current) m.scale.setScalar(breathPulse);

        // Mạch máu
        if (vesselMatRef.current) vesselMatRef.current.uniforms.uTime.value = t;

        // Điểm sáng thở nhẹ
        const glow = 0.35 + 0.25 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.9 * t));
        selectedMaterial.emissive.setRGB(glow * 0.62, glow * 0.42, glow * 0.16);
      }

      const { theta, phi, radius, targetX, targetY, targetZ } = camState.current;
      camera.position.set(
        targetX + radius * Math.sin(phi) * Math.sin(theta),
        targetY + radius * Math.cos(phi),
        targetZ + radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(targetX, targetY, targetZ);
      renderer.render(scene, camera);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('dblclick', onDblClick);
      canvas.removeEventListener('contextmenu', onCtxMenu);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
      entriesRef.current.forEach((en) => en.mesh.geometry.dispose());
      Object.values(normalMat).forEach((m) => m.dispose());
      selectedMaterial.dispose();
      vesselMaterial.dispose();
      heartMeshesRef.current = [];
      lungMeshesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atlas]);

  // ---------- lớp da (bóng cơ thể trong suốt) ----------
  useEffect(() => {
    if (skinRef.current) skinRef.current.visible = showGhost;
  }, [showGhost]);

  // ---------- hiển thị / ẩn theo hệ đang chọn ----------
  useEffect(() => {
    const entries = entriesRef.current;
    if (!entries.length) return;
    let visible = 0;
    for (const en of entries) {
      const show = !onlySystem || !activeSystem || en.system === activeSystem;
      en.mesh.visible = show;
      if (show) visible += 1;
    }
    onCounts?.(visible, entries.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSystem, onlySystem, ready]);

  // ---------- mặt phẳng cắt ----------
  useEffect(() => {
    const plane = planeRef.current;
    if (!plane) return;
    const n = AXES[axis].normal;
    plane.normal.set(-n[0], -n[1], -n[2]);
    plane.constant = sliceValue(axis, sliceT);
  }, [axis, sliceT]);

  // ---------- tô sáng mục đang chọn ----------
  useEffect(() => {
    const selMat = selectedMatRef.current;
    if (!selMat) return;

    // trả các mesh được tô sáng lượt trước về đúng vật liệu bình thường của nó
    for (const mesh of highlightedRef.current) {
      const en = entriesRef.current.find((e) => e.mesh === mesh);
      if (en) mesh.material = en.ownMaterial;
    }
    highlightedRef.current = [];

    if (!selection) return;
    const targetIds = new Set(
      selection.kind === 'part'
        ? [selection.id]
        : entriesRef.current.filter((e) => e.noteId === selection.id).map((e) => e.part.id),
    );
    const found: THREE.Mesh[] = [];
    for (const en of entriesRef.current) {
      if (targetIds.has(en.part.id)) {
        en.mesh.material = selMat;
        found.push(en.mesh);
      }
    }
    highlightedRef.current = found;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, ready]);

  const setCameraPreset = (view: 'front' | 'back' | 'left' | 'right' | 'top' | 'reset') => {
    lastInteractRef.current = performance.now();
    switch (view) {
      case 'front':
        camState.current.destTheta = 0;
        camState.current.destPhi = Math.PI / 2;
        break;
      case 'back':
        camState.current.destTheta = Math.PI;
        camState.current.destPhi = Math.PI / 2;
        break;
      case 'left':
        camState.current.destTheta = -Math.PI / 2;
        camState.current.destPhi = Math.PI / 2;
        break;
      case 'right':
        camState.current.destTheta = Math.PI / 2;
        camState.current.destPhi = Math.PI / 2;
        break;
      case 'top':
        camState.current.destTheta = 0;
        camState.current.destPhi = 0.25;
        break;
      case 'reset':
        camState.current.destTheta = 0.34;
        camState.current.destPhi = 1.46;
        camState.current.destRadius = 3.0;
        camState.current.destTargetX = 0;
        camState.current.destTargetY = 0.92;
        camState.current.destTargetZ = 0;
        break;
    }
  };

  return (
    <>
      <canvas id="c3d" ref={canvasRef} style={{ touchAction: 'none' }} />

      {ready && (
        <div className="view3dTools">
          <span className="view3dToolsTitle">Góc nhìn:</span>
          <button type="button" onClick={() => setCameraPreset('front')} title="Góc nhìn chính diện">
            Trước
          </button>
          <button type="button" onClick={() => setCameraPreset('back')} title="Góc nhìn từ sau lưng">
            Sau
          </button>
          <button type="button" onClick={() => setCameraPreset('left')} title="Góc nhìn nghiêng trái">
            Trái
          </button>
          <button type="button" onClick={() => setCameraPreset('right')} title="Góc nhìn nghiêng phải">
            Phải
          </button>
          <button type="button" onClick={() => setCameraPreset('top')} title="Góc nhìn từ đỉnh đầu">
            Đỉnh
          </button>
          <button type="button" onClick={() => setCameraPreset('reset')} className="resetBtn" title="Đặt lại camera & điểm nhìn">
            ↺ Đặt lại
          </button>
        </div>
      )}

      {!ready && (
        <div className="loading3d">
          <div className="load3d">
            {error ? (
              <div className="err">{error}</div>
            ) : (
              <>
                <div className="msg">
                  ĐANG TẢI {progress ? Math.round((progress.loadedBytes / progress.totalBytes) * 100) : 0}% ·{' '}
                  {atlas.parts.length.toLocaleString('vi-VN')} CẤU TRÚC THẬT
                </div>
                <div className="bar">
                  <i style={{ width: `${progress ? (progress.loadedBytes / progress.totalBytes) * 100 : 2}%` }} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
