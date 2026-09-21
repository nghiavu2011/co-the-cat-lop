import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { AtlasJSON, AtlasPart, SystemId } from '../data/types';
import { loadAllChunks, type LoadProgress } from '../data/loader';
import { buildPartGeometry } from '../data/geometry';
import { defaultSystemFor, SYSTEM_BY_ID } from '../data/systems';
import { buildBinding } from '../data/bind';
import { NOTE_BY_ID } from '../content/notes';
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

function getVietnameseFemaleName(nodeName: string): string {
  const nameMap: Record<string, string> = {
    // Sinh dục
    VH_F_fundus_of_uterus: 'Đáy tử cung',
    VH_F_body_of_uterus: 'Thân tử cung',
    VH_F_cervix: 'Cổ tử cung',
    VH_F_left_ovary: 'Buồng trứng trái',
    VH_F_right_ovary: 'Buồng trứng phải',
    VH_F_ampulla_of_uterine_tube_L: 'Bóng vòi trứng trái',
    VH_F_ampulla_of_uterine_tube_R: 'Bóng vòi trứng phải',
    VH_F_isthmus_of_fallopian_tube_L: 'Eo vòi trứng trái',
    VH_F_isthmus_of_fallopian_tube_R: 'Eo vòi trứng phải',
    VH_F_fibria_of_uterine_tube_L: 'Loa vòi trứng trái (Fimbriae)',
    VH_F_fibria_of_uterine_tube_R: 'Loa vòi trứng phải (Fimbriae)',
    VH_F_broad_ligament: 'Dây chằng rộng',
    VH_F_round_ligament: 'Dây chằng tròn',
    VH_F_ovarian_ligament: 'Dây chằng riêng buồng trứng',
    VH_F_uterosacral_ligament: 'Dây chằng tử cung - cùng',
    VH_F_suspensory_ligament_of_ovary: 'Dây chằng treo buồng trứng',
    VH_F_vagina: 'Âm đạo',
    VH_F_anterior_wall_of_uterus: 'Thành trước tử cung',
    VH_F_posterior_wall_of_uterus: 'Thành sau tử cung',
    VH_F_internal_cervical_os: 'Lỗ trong cổ tử cung',
    VH_F_external_cervical_os: 'Lỗ ngoài cổ tử cung',
    // Khung chậu
    VH_F_pelvis: 'Khung chậu nữ',
    VH_F_sacrum: 'Xương cùng nữ',
    VH_F_coccyx: 'Xương cụt',
    VH_F_pubis: 'Xương mu',
    VH_F_ilium: 'Xương cánh chậu nữ',
    VH_F_ischium: 'Xương ngồi',
    // Tuyến vú (Integumentary)
    VH_F_mammary_lobes_L: 'Thùy tuyến vú trái',
    VH_F_mammary_lobes_R: 'Thùy tuyến vú phải',
    VH_F_main_lactiferous_ducts_L: 'Ống dẫn sữa trái',
    VH_F_main_lactiferous_ducts_R: 'Ống dẫn sữa phải',
    VH_F_suspensory_ligaments_L: 'Dây chằng treo vú trái (Cooper)',
    VH_F_suspensory_ligaments_R: 'Dây chằng treo vú phải (Cooper)',
    VH_F_areola_L: 'Quầng vú trái',
    VH_F_areola_R: 'Quầng vú phải',
    VH_F_nipple_L: 'Núm vú trái',
    VH_F_nipple_R: 'Núm vú phải',
    VH_F_fat_L: 'Mô mỡ vú trái',
    VH_F_fat_R: 'Mô mỡ vú phải',
    // Mạch máu nữ
    VH_F_left_uterine_artery: 'Động mạch tử cung trái',
    VH_F_right_uterine_artery: 'Động mạch tử cung phải',
    VH_F_left_uterine_vein: 'Tĩnh mạch tử cung trái',
    VH_F_right_uterine_vein: 'Tĩnh mạch tử cung phải',
    VH_F_internal_iliac_vein_L: 'Tĩnh mạch chậu trong trái',
    VH_F_internal_iliac_vein_R: 'Tĩnh mạch chậu trong phải',
    VH_F_left_common_iliac_vein: 'Tĩnh mạch chậu chung trái',
    VH_F_right_common_iliac_vein: 'Tĩnh mạch chậu chung phải',
    VH_F_descending_aorta_a: 'Động mạch chủ ngực',
    VH_F_descending_aorta_b: 'Động mạch chủ bụng',
    VH_F_inferior_vena_cava_a: 'Tĩnh mạch chủ dưới (ngực)',
    VH_F_inferior_vena_cava_b: 'Tĩnh mạch chủ dưới (bụng)',
  };

  if (nameMap[nodeName]) return nameMap[nodeName];
  return nodeName
    .replace(/^VH_F_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

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
  showLabels?: boolean;
  axis: number;
  sliceT: number;
  selection: Selection | null;
  gender?: 'male' | 'female';
  onGenderChange?: (gender: 'male' | 'female') => void;
  onPick: (sel: Selection) => void;
  onCounts?: (visible: number, total: number) => void;
}

interface SystemPBRProfile {
  color: number;
  roughness: number;
  metalness: number;
  emissive?: number;
}

const SYSTEM_PBR_PROFILES: Record<SystemId, SystemPBRProfile> = {
  da: { color: 0xd9a07a, roughness: 0.62, metalness: 0.01 },
  co: { color: 0xaa3832, roughness: 0.65, metalness: 0.02 },
  xuong: { color: 0xf3ebd7, roughness: 0.60, metalness: 0.04 }, // Màu ngà voi y khoa sáng rõ, rãnh khớp nổi 3D
  tuanhoan: { color: 0xd32f2f, roughness: 0.38, metalness: 0.06 }, // Động mạch đỏ tươi
  hohap: { color: 0x8ba6be, roughness: 0.52, metalness: 0.02 }, // Phổi xám lam phớt hồng
  tieuhoa: { color: 0xd87040, roughness: 0.44, metalness: 0.03 }, // Nội tạng ấm áp
  tietnieu: { color: 0x9c5b80, roughness: 0.42, metalness: 0.03 },
  noitiet: { color: 0xffb300, roughness: 0.45, metalness: 0.05 },
  sinhduc: { color: 0xec407a, roughness: 0.48, metalness: 0.04 },
  lympho: { color: 0x43a047, roughness: 0.55, metalness: 0.02 },
  thankinh: { color: 0xffd600, roughness: 0.30, metalness: 0.05, emissive: 0x443300 }, // Vàng hoàng yến rực rỡ, phát sáng nhẹ
};

/**
 * Thuật toán biến dạng lưới mô phỏng thể trạng (Body Parameters & BMI Simulation):
 * Điều chỉnh độ cao (chiều cao), độ dày khối cơ/mỡ theo BMI, tỷ lệ hông/eo nam-nữ theo phân phối Gauss, và độ teo cơ theo tuổi.
 */
function deformMeshes(
  meshes: THREE.Mesh[],
  { height, weight, age, sex }: { height: number; weight: number; age: number; sex: 'male' | 'female' },
): void {
  const h = height / 175;
  const bmi = weight / ((height / 100) ** 2);
  // Hệ số nở khối theo BMI (chuẩn 22.86 là 1.0)
  const bulk = THREE.MathUtils.clamp(1 + (bmi - 70 / (1.75 ** 2)) * 0.014, 0.80, 1.45);
  const female = sex === 'female';
  const older = Math.max(0, age - 50) / 40;

  for (const m of meshes) {
    if (!m.geometry || !m.geometry.attributes.position) continue;
    const a = m.geometry.attributes.position.array as Float32Array;
    const o = m.userData.original as Float32Array | undefined;
    if (!o) continue;
    const rigid = m.userData.sys === 'xuong';
    const isMuscle = m.userData.sys === 'co';
    const isPivoted = m.userData.isPivot;
    const baseCenter = (m.userData.baseCenter as THREE.Vector3) || new THREE.Vector3();

    for (let i = 0; i < a.length; i += 3) {
      const x = o[i];
      const y = o[i + 1];
      const z = o[i + 2];
      const worldY = isPivoted ? y + baseCenter.y : y;

      // Phân phối hình chuông Gauss tại eo/ngực (1.29m) và hông (0.89m)
      const torso = Math.exp(-(((worldY - 1.29) / 0.18) ** 2));
      const hip = Math.exp(-(((worldY - 0.89) / 0.15) ** 2));
      // Tỷ lệ nữ: eo thon hơn (-8.5%), hông nở hơn (+12%)
      const sexWidth = female ? 1 - 0.085 * torso + 0.12 * hip : 1;

      const w = sexWidth * (1 + (bulk - 1) * (rigid ? 0.2 : 1)) * (isMuscle ? 1 - older * 0.045 : 1);

      if (isPivoted) {
        a[i] = x * w * h;
        a[i + 1] = y * h;
        a[i + 2] = z * (1 + (bulk - 1) * 1.1) * h;
      } else {
        a[i] = x * w * h;
        a[i + 1] = y * h;
        a[i + 2] = (z * (1 + (bulk - 1) * 1.1) + older * Math.max(0, worldY - 0.93) * 0.045) * h;
      }
    }
    m.geometry.attributes.position.needsUpdate = true;
    m.geometry.computeBoundingSphere();
    m.geometry.computeBoundingBox();
  }
}

export default function View3D({
  atlas,
  activeSystem,
  onlySystem,
  showGhost,
  showLabels = true,
  axis,
  sliceT,
  selection,
  gender = 'male',
  onGenderChange,
  onPick,
  onCounts,
}: View3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState<LoadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const [explode, setExplode] = useState(0);
  const [isIsolated, setIsIsolated] = useState(false);
  const pinRef = useRef<HTMLDivElement>(null);
  const selRef = useRef<Selection | null>(selection);
  selRef.current = selection;
  const showLabelsRef = useRef(showLabels);
  showLabelsRef.current = showLabels;

  // Thể trạng & Chỉ số BMI (Body Parameters)
  const [showBodyParams, setShowBodyParams] = useState(false);
  const [bodyParams, setBodyParams] = useState({
    height: 175,
    weight: 70,
    age: 30,
  });

  const bmi = useMemo(() => {
    const hM = bodyParams.height / 100;
    return +(bodyParams.weight / (hM * hM)).toFixed(1);
  }, [bodyParams.height, bodyParams.weight]);

  const bmiCategory = useMemo(() => {
    if (bmi < 18.5) return { label: 'Gầy (Dưới chuẩn)', color: '#42a5f5' };
    if (bmi < 24.9) return { label: 'Chuẩn y khoa', color: '#66bb6a' };
    if (bmi < 29.9) return { label: 'Thừa cân', color: '#ffa726' };
    return { label: 'Béo phì', color: '#ef5350' };
  }, [bmi]);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const planeRef = useRef<THREE.Plane | null>(null);
  const skinRef = useRef<THREE.Mesh | null>(null);
  const entriesRef = useRef<MeshEntry[]>([]);
  const selectedMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
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
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(34, 1, 0.02, 60);
    cameraRef.current = camera;
    const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), sliceValue(axis, sliceT));
    planeRef.current = plane;

    // Hệ thống chiếu sáng Studio Giải Phẫu chuẩn PBR:
    // 1. Ánh sáng bầu trời - mặt đất (HemisphereLight) tạo chiều sâu tự nhiên cho các hốc xương và cơ
    scene.add(new THREE.HemisphereLight(0xe8eff5, 0x3d4957, 1.8));

    // 2. Key Light (Đèn chính): ánh sáng ấm nhẹ, tạo bóng khối sắc nét
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.6);
    keyLight.position.set(-2.2, 4.5, 3.2);
    scene.add(keyLight);

    // 3. Fill Light (Đèn bù sáng): ánh sáng lạnh nhẹ bù các góc khuất
    const fillLight = new THREE.DirectionalLight(0xd5e5f5, 1.2);
    fillLight.position.set(3.0, 2.0, 2.5);
    scene.add(fillLight);

    // 4. Rim / Back Light (Đèn viền sau lưng): tách biệt từng sợi thần kinh và khung xương khỏi nền tối
    const rimLight = new THREE.DirectionalLight(0xbde0fe, 2.0);
    rimLight.position.set(2.0, 3.5, -3.5);
    scene.add(rimLight);

    const selectedMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xffd54f),
      emissive: new THREE.Color(0x8c6200),
      roughness: 0.32,
      metalness: 0.2,
      side: THREE.DoubleSide,
      clippingPlanes: [plane],
    });
    selectedMatRef.current = selectedMaterial;

    const normalMat: Record<SystemId, THREE.MeshStandardMaterial> = {} as never;
    for (const s of Object.keys(SYSTEM_BY_ID) as SystemId[]) {
      const profile = SYSTEM_PBR_PROFILES[s] ?? { color: 0x8a8a8a, roughness: 0.5, metalness: 0.02 };
      normalMat[s] = new THREE.MeshStandardMaterial({
        color: new THREE.Color(profile.color),
        side: THREE.DoubleSide,
        roughness: profile.roughness,
        metalness: profile.metalness,
        emissive: profile.emissive ? new THREE.Color(profile.emissive) : new THREE.Color(0x000000),
        clippingPlanes: [plane],
      });
    }

    // Tĩnh mạch (veins) dùng vật liệu xanh y khoa đặc trưng
    const veinMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x1976d2),
      roughness: 0.38,
      metalness: 0.08,
      side: THREE.DoubleSide,
      clippingPlanes: [plane],
    });

    const vesselMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0xd32f2f) },
        uTime: { value: 0 },
        uLightDir: { value: new THREE.Vector3(-2.2, 4.5, 3.2).normalize() },
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
          const isSkin = part.name === 'Skin' || part.id === 'VH_F_skin' || part.name === 'skin of body';
          const geo = buildPartGeometry(part, buffers[part.chunk]);
          const system = defaultSystemFor(part);
          const noteId = binding.partToNote.get(part.id) ?? (part.system === 'reproductive' ? 'tucung' : null);
          if (part.id.startsWith('VH_F_')) {
            part.name = getVietnameseFemaleName(part.id);
          }
          if (isSkin) {
            const skinMat = new THREE.MeshStandardMaterial({
              color: new THREE.Color(0xd9a07a),
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.07,
              depthWrite: false,
              roughness: 0.55,
              metalness: 0.02,
              clippingPlanes: [plane],
            });
            const mesh = new THREE.Mesh(geo, skinMat);
            mesh.renderOrder = 2;
            mesh.visible = showGhost;
            mesh.userData.basePos = mesh.position.clone();
            mesh.userData.sys = 'da';
            mesh.userData.original = (geo.attributes.position.array as Float32Array).slice();
            scene.add(mesh);
            skinRef.current = mesh;
            continue;
          }
          const isVein = part.system === 'venous';
          const isVessel = (system === 'tuanhoan' || part.system === 'arterial') && !(noteId && NON_VESSEL_CIRCULATORY_IDS.has(noteId));
          const ownMaterial: THREE.Material = isVein ? veinMaterial : isVessel ? vesselMaterial : normalMat[system];
          const mesh = new THREE.Mesh(geo, ownMaterial);
          mesh.userData.partId = part.id;
          const isHeart = noteId !== null && HEART_NOTE_IDS.has(noteId);
          const isLung = noteId !== null && LUNG_NOTE_IDS.has(noteId);
          if (isHeart || isLung) pivotAtCenter(mesh);

          // Lưu toạ độ đỉnh ban đầu để biến dạng thể trạng (BMI/Height/Weight) & tính tâm hình học
          mesh.userData.original = (geo.attributes.position.array as Float32Array).slice();
          mesh.userData.sys = system;

          geo.computeBoundingBox();
          const bcenter = new THREE.Vector3();
          if (geo.boundingBox) {
            geo.boundingBox.getCenter(bcenter);
          }
          mesh.userData.baseCenter = isHeart || isLung ? mesh.position.clone() : bcenter.clone();
          mesh.userData.basePos = mesh.position.clone();
          mesh.userData.isPivot = isHeart || isLung;

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

      // Cập nhật vị trí Ghim nhãn 3D nổi (Floating 3D Pin)
      if (pinRef.current) {
        const pinEl = pinRef.current;
        const currentSel = selRef.current;
        if (currentSel && showLabelsRef.current && highlightedRef.current.length > 0 && canvasRef.current) {
          const box = new THREE.Box3();
          for (const m of highlightedRef.current) {
            box.expandByObject(m);
          }
          const pinCenter = new THREE.Vector3();
          box.getCenter(pinCenter);
          pinCenter.y = box.max.y; // Ghim ngay mép trên đỉnh của bộ phận

          const projected = pinCenter.clone().project(camera);
          if (projected.z < 1 && Math.abs(projected.x) <= 0.94 && Math.abs(projected.y) <= 0.94) {
            const rect = canvasRef.current.getBoundingClientRect();
            const px = (projected.x * 0.5 + 0.5) * rect.width;
            const py = (-projected.y * 0.5 + 0.5) * rect.height;
            pinEl.style.display = 'inline-flex';
            pinEl.style.left = `${px}px`;
            pinEl.style.top = `${py}px`;
          } else {
            pinEl.style.display = 'none';
          }
        } else {
          pinEl.style.display = 'none';
        }
      }
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

  // ---------- hiển thị / ẩn theo hệ đang chọn & chế độ cô lập (isolate) ----------
  useEffect(() => {
    const entries = entriesRef.current;
    if (!entries.length) return;
    let visible = 0;
    const targetIds = selection
      ? new Set(
          selection.kind === 'part'
            ? [selection.id]
            : entries.filter((e) => e.noteId === selection.id).map((e) => e.part.id),
        )
      : null;

    for (const en of entries) {
      let show = !onlySystem || !activeSystem || en.system === activeSystem;
      if (isIsolated && targetIds) {
        show = targetIds.has(en.part.id);
      }
      en.mesh.visible = show;
      if (show) visible += 1;
    }
    if (skinRef.current) {
      skinRef.current.visible = !isIsolated && showGhost;
    }
    onCounts?.(visible, entries.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSystem, onlySystem, ready, isIsolated, selection, showGhost]);

  // ---------- Bóc tách / Tách lớp theo không gian (Exploded View Đa Hướng) ----------
  useEffect(() => {
    if (!ready) return;
    const t = explode / 100;

    for (const en of entriesRef.current) {
      const baseCenter = (en.mesh.userData.baseCenter as THREE.Vector3) || new THREE.Vector3();
      const basePos = (en.mesh.userData.basePos as THREE.Vector3) || new THREE.Vector3();
      const signX = Math.sign(baseCenter.x) || (en.mesh.id % 2 === 0 ? 1 : -1);

      let dx = 0;
      let dy = 0;
      let dz = 0;

      // Phân tầng không gian đa hướng theo hệ giải phẫu (Anatomical Layer Separation)
      switch (en.system) {
        case 'xuong':
          // Bộ xương làm trục tham chiếu ở trung tâm, chỉ nở nhẹ để các khớp háng/vai tách ra
          dx = baseCenter.x * 0.25 * t;
          dz = 0;
          break;

        case 'thankinh':
          // Hệ thần kinh: dạt nhẹ ra sau (tủy sống) và lên trên (não bộ)
          dx = baseCenter.x * 0.35 * t;
          dz = -0.22 * t;
          dy = 0.05 * t;
          break;

        case 'tuanhoan':
          // Hệ tuần hoàn:
          // Động mạch (thường ở sâu) dạt sang trái và phía trước
          // Tĩnh mạch dạt sang phải và phía trước
          if (en.part.system === 'venous') {
            dx = (0.28 + Math.abs(baseCenter.x) * 0.4) * t;
            dz = 0.32 * t;
          } else {
            dx = (-0.28 - Math.abs(baseCenter.x) * 0.4) * t;
            dz = 0.32 * t;
          }
          if (en.noteId === 'tim') {
            dx = -0.1 * t;
            dz = 0.46 * t; // Tim tách hẳn ra phía trước ngực
          }
          break;

        case 'hohap':
          // Phổi: Tách mạnh sang 2 bên sườn và hơi tiến lên phía trước
          dx = signX * 0.42 * t;
          dz = 0.22 * t;
          break;

        case 'tieuhoa':
          // Hệ tiêu hóa (dạ dày, gan, ruột): Tách mạnh về phía trước bụng
          dx = (baseCenter.x * 0.5) * t;
          dz = 0.52 * t;
          dy = -0.05 * t;
          break;

        case 'tietnieu':
          // Thận và tiết niệu: Tách về phía sau lưng và sang 2 bên
          dx = signX * 0.32 * t;
          dz = -0.32 * t;
          break;

        case 'sinhduc':
          // Sinh dục: Tách về phía trước vùng chậu
          dx = (baseCenter.x * 0.4) * t;
          dz = 0.42 * t;
          dy = -0.08 * t;
          break;

        case 'co':
          // Cơ bắp: Tách rộng sang hai bên và hơi lùi về sau
          dx = signX * 0.68 * t;
          dz = -0.28 * t;
          break;

        case 'da':
          // Da: Tách xa nhất ra hai bên cánh
          dx = signX * 0.98 * t;
          dz = 0.55 * t;
          break;

        default:
          dx = signX * 0.38 * t;
          dz = 0.35 * t;
          break;
      }

      en.mesh.position.set(basePos.x + dx, basePos.y + dy, basePos.z + dz);
    }

    if (skinRef.current) {
      const skinBasePos = (skinRef.current.userData.basePos as THREE.Vector3) || new THREE.Vector3();
      skinRef.current.position.set(skinBasePos.x, skinBasePos.y, skinBasePos.z + 0.68 * t);
    }
  }, [explode, ready]);

  // ---------- Mô phỏng thể trạng cơ thể (Chiều cao, Cân nặng, BMI, Tuổi, Giới tính) ----------
  useEffect(() => {
    if (!ready || !entriesRef.current.length) return;
    const allMeshes = entriesRef.current.map((e) => e.mesh);
    if (skinRef.current) allMeshes.push(skinRef.current);
    deformMeshes(allMeshes, {
      height: bodyParams.height,
      weight: bodyParams.weight,
      age: bodyParams.age,
      sex: gender,
    });
  }, [bodyParams, gender, ready]);

  const focusOnSelection = () => {
    if (!selection || !ready) return;
    const targetIds = new Set(
      selection.kind === 'part'
        ? [selection.id]
        : entriesRef.current.filter((e) => e.noteId === selection.id).map((e) => e.part.id),
    );
    const box = new THREE.Box3();
    let found = false;
    for (const en of entriesRef.current) {
      if (targetIds.has(en.part.id)) {
        box.expandByObject(en.mesh);
        found = true;
      }
    }
    if (found && !box.isEmpty()) {
      const center = new THREE.Vector3();
      box.getCenter(center);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const desiredRadius = Math.max(0.25, Math.min(2.0, maxDim * 2.6));

      camState.current.destTargetX = center.x;
      camState.current.destTargetY = center.y;
      camState.current.destTargetZ = center.z;
      camState.current.destRadius = desiredRadius;
      lastInteractRef.current = performance.now();
    }
  };

  const selectedLabelText = useMemo(() => {
    if (!selection) return '';
    if (selection.kind === 'note') {
      return NOTE_BY_ID[selection.id]?.n || selection.id;
    }
    const en = entriesRef.current.find((e) => e.part.id === selection.id);
    return en?.part.name || selection.id;
  }, [selection, ready]);

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

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  useEffect(() => {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 60);
  }, [isFullscreen]);

  return (
    <div className={isFullscreen ? 'view3dFullscreen' : undefined}>
      <canvas id="c3d" ref={canvasRef} style={{ touchAction: 'none' }} />

      {ready && (
        <>
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

            {/* Bóc tách / Tách lớp theo không gian (Exploded View) */}
            <div className="explodeControl" title="Bóc tách / Tách rời các lớp cơ thể theo không gian (0 - 100%)">
              <span>⤢ Tách lớp:</span>
              <input
                type="range"
                min={0}
                max={100}
                value={explode}
                onChange={(e) => setExplode(Number(e.target.value))}
              />
              <b>{explode}%</b>
            </div>

            {/* Chế độ cô lập bộ phận đang chọn (Isolate / Solo) */}
            {selection && (
              <button
                type="button"
                onClick={() => {
                  const next = !isIsolated;
                  setIsIsolated(next);
                  if (next) focusOnSelection();
                }}
                className={isIsolated ? 'activeBtn isolateBtn' : 'isolateBtn'}
                title={isIsolated ? 'Hiện lại tất cả cơ quan xung quanh' : 'Chỉ hiển thị riêng cơ quan đang chọn'}
              >
                {isIsolated ? '✕ Thoát cô lập' : '👁 Cô lập'}
              </button>
            )}

            {/* Mô phỏng thể trạng & BMI (Body Parameters) */}
            <button
              type="button"
              onClick={() => setShowBodyParams(!showBodyParams)}
              className={showBodyParams ? 'activeBtn bodyParamsBtn' : 'bodyParamsBtn'}
              title="Mô phỏng thể trạng: Chiều cao, Cân nặng, BMI, Tuổi"
            >
              ⚖ Thể trạng (BMI)
            </button>

            <button
              type="button"
              onClick={() => onGenderChange?.(gender === 'male' ? 'female' : 'male')}
              title="Chuyển đổi giải phẫu cơ thể Nam / Nữ"
              style={{
                borderColor: gender === 'female' ? '#e91e63' : undefined,
                color: gender === 'female' ? '#f06292' : undefined,
                fontWeight: 600,
              }}
            >
              {gender === 'female' ? '♀ Nữ' : '♂ Nam'}
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Thu nhỏ lại (Esc)' : 'Xem toàn màn hình'}
              className="fsToggleBtn"
            >
              {isFullscreen ? '✕ Thu nhỏ' : '⛶ Toàn màn hình'}
            </button>
          </div>

          {/* Bảng điều khiển mô phỏng Thể trạng & BMI */}
          {showBodyParams && (
            <div className="bodyParamsPanel">
              <div className="bodyParamsHeader">
                <span>⚖ THỂ TRẠNG & BMI</span>
                <button type="button" onClick={() => setShowBodyParams(false)} className="closeBtn" title="Đóng bảng">
                  ✕
                </button>
              </div>

              <div className="bmiDisplayCard">
                <div className="bmiNumberRow">
                  <span className="bmiLabel">Chỉ số BMI</span>
                  <strong className="bmiValue">{bmi}</strong>
                </div>
                <div
                  className="bmiCategoryBadge"
                  style={{
                    background: `${bmiCategory.color}22`,
                    color: bmiCategory.color,
                    borderColor: bmiCategory.color,
                  }}
                >
                  {bmiCategory.label}
                </div>
              </div>

              <div className="bodyParamItem">
                <div className="paramLabelRow">
                  <label>Chiều cao</label>
                  <b>{bodyParams.height} cm</b>
                </div>
                <input
                  type="range"
                  min={135}
                  max={210}
                  value={bodyParams.height}
                  onChange={(e) => setBodyParams((p) => ({ ...p, height: Number(e.target.value) }))}
                />
              </div>

              <div className="bodyParamItem">
                <div className="paramLabelRow">
                  <label>Cân nặng</label>
                  <b>{bodyParams.weight} kg</b>
                </div>
                <input
                  type="range"
                  min={35}
                  max={140}
                  value={bodyParams.weight}
                  onChange={(e) => setBodyParams((p) => ({ ...p, weight: Number(e.target.value) }))}
                />
              </div>

              <div className="bodyParamItem">
                <div className="paramLabelRow">
                  <label>Độ tuổi</label>
                  <b>{bodyParams.age} tuổi</b>
                </div>
                <input
                  type="range"
                  min={18}
                  max={85}
                  value={bodyParams.age}
                  onChange={(e) => setBodyParams((p) => ({ ...p, age: Number(e.target.value) }))}
                />
              </div>

              <button
                type="button"
                className="resetParamsBtn"
                onClick={() => setBodyParams({ height: 175, weight: 70, age: 30 })}
              >
                ↺ Đặt lại thể trạng chuẩn
              </button>
            </div>
          )}

          {/* Ghim nhãn 3D nổi trên bộ phận được chọn (Floating 3D Pin) */}
          <div ref={pinRef} className="floatingPin3d" style={{ display: 'none' }}>
            <span className="floatingPinDot" />
            <span>{selectedLabelText}</span>
          </div>
        </>
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
    </div>
  );
}
