import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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
  if (sliceT <= 0) return 999.0;
  const a = AXES[axis];
  if (axis === 0 && a.stops) {
    const t = (sliceT / 100) * 4;
    const i = Math.min(3, Math.floor(t));
    const f = t - i;
    return a.stops[i] + (a.stops[i + 1] - a.stops[i]) * f;
  }
  return a.hi - (sliceT / 100) * (a.hi - a.lo);
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
const HEART_NOTE_IDS = new Set(['tim', 'vantim']);
/** Các mục chú thích được coi là "phổi" — cho hiệu ứng phồng-xẹp khi thở. */
const LUNG_NOTE_IDS = new Set(['phoiphai', 'phoitrai']);
/** Các mục thuộc hệ tuần hoàn nhưng KHÔNG phải mạch máu (không áp hiệu ứng dòng chảy). */
const NON_VESSEL_CIRCULATORY_IDS = new Set(['tim', 'vantim']);

function isHeartPart(part: { id: string; name: string; system?: string }, noteId: string | null): boolean {
  if (noteId !== null && HEART_NOTE_IDS.has(noteId)) return true;
  const id = part.id;
  if (
    id === 'FJ2428' || id === 'FJ2438' || id === 'FJ2439' ||
    id === 'FJ2418' || id === 'FJ2419' || id === 'FJ2429' || id === 'FJ2430' || id === 'FJ2437' ||
    id.startsWith('VH_F_left_ventricle') || id.startsWith('VH_F_right_ventricle') ||
    id.startsWith('VH_F_left_cardiac_atrium') || id.startsWith('VH_F_right_cardiac_atrium') ||
    id.startsWith('VH_F_interventricular_septum') || id.startsWith('VH_F_papillary_muscle') ||
    id.startsWith('VH_F_aortic_valve') || id.startsWith('VH_F_pulmonary_valve') ||
    id.startsWith('VH_F_mitral_valve') || id.startsWith('VH_F_tricuspid_valve')
  ) {
    return true;
  }
  const name = (part.name || '').toLowerCase();
  if (
    /^(wall of (ventricle|left atrium|right atrium)|interventricular septum|.*cardiac atrium|heart (left|right) ventricle|.*papillary muscle.*|.*valve.*)$/i.test(name) &&
    !/lateral ventricle|third ventricle|fourth ventricle|interventricular foramen/i.test(name)
  ) {
    return true;
  }
  return false;
}

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
    // Tim mạch & mạch máu lớn
    VH_F_left_ventricle: 'Tâm thất trái',
    VH_F_right_ventricle: 'Tâm thất phải',
    VH_F_left_cardiac_atrium: 'Tâm nhĩ trái',
    VH_F_right_cardiac_atrium: 'Tâm nhĩ phải',
    VH_F_interventricular_septum: 'Vách liên thất',
    VH_F_papillary_muscle_of_heart_ant: 'Cơ nhú trước tâm thất trái',
    VH_F_papillary_muscle_of_heart_antlat: 'Cơ nhú trước-bên tâm thất trái',
    VH_F_papillary_muscle_of_heart_med: 'Cơ nhú vách tâm thất phải',
    VH_F_papillary_muscle_of_heart_pos: 'Cơ nhú sau tâm thất phải',
    VH_F_papillary_muscle_of_heart_posmed: 'Cơ nhú sau-trong tâm thất trái',
    VH_F_aortic_valve: 'Van động mạch chủ',
    VH_F_pulmonary_valve: 'Van động mạch phổi',
    VH_F_mitral_valve: 'Van hai lá',
    VH_F_tricuspid_valve: 'Van ba lá',
    VH_F_aortic_arch: 'Quai động mạch chủ',
    VH_F_ascending_aorta: 'Động mạch chủ lên',
    VH_F_pulmonary_trunk: 'Thân động mạch phổi',
    VH_F_pulmonary_artery_L: 'Động mạch phổi trái',
    VH_F_pulmonary_artery_R: 'Động mạch phổi phải',
    VH_F_left_coronary_artery: 'Động mạch vành trái',
    VH_F_right_coronary_artery: 'Động mạch vành phải',
  };

  if (nameMap[nodeName]) return nameMap[nodeName];
  return nodeName
    .replace(/^VH_F_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
  peelDepth?: number;
  hiddenPartIds?: Set<string>;
  ghostPartIds?: Set<string>;
  isolatedTargetId?: string | null;
  explode?: number;
  focusKey?: number;
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

export default function View3D({
  atlas,
  activeSystem,
  onlySystem,
  showGhost,
  showLabels = true,
  axis,
  sliceT,
  selection,
  gender: _gender = 'male',
  onGenderChange: _onGenderChange,
  onPick,
  onCounts,
  peelDepth = 100,
  hiddenPartIds,
  ghostPartIds,
  isolatedTargetId,
  explode: explodeProp,
  focusKey,
}: View3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState<LoadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const explode = explodeProp ?? 0;
  const isIsolated = Boolean(isolatedTargetId);
  const selRef = useRef<Selection | null>(selection);
  selRef.current = selection;
  const showLabelsRef = useRef(showLabels);
  showLabelsRef.current = showLabels;

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
  const heartCenterRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.35, 0));
  const lungMeshesRef = useRef<THREE.Mesh[]>([]);
  const lungPivotRef = useRef<THREE.Group | null>(null);
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
  const setCameraPreset = useCallback((view: 'front' | 'back' | 'left' | 'right' | 'top' | 'reset') => {
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
  }, []);

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

    // Cơ tim (myocardium) dùng vật liệu cơ màu đỏ sẫm y học riêng biệt, tách bạch hoàn toàn với mạch máu
    const heartMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xb91c1c),
      roughness: 0.46,
      metalness: 0.03,
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
              opacity: 0.10,
              depthWrite: false,
              roughness: 0.55,
              metalness: 0.02,
              clippingPlanes: [plane],
            });
            const skinMesh = new THREE.Mesh(geo, skinMat);
            skinMesh.renderOrder = 3;
            skinMesh.visible = showGhost;
            skinMesh.userData.basePos = skinMesh.position.clone();
            skinMesh.userData.sys = 'da';
            skinMesh.userData.original = (geo.attributes.position.array as Float32Array).slice();
            scene.add(skinMesh);
            skinRef.current = skinMesh;
            continue;
          }
          const isHeart = isHeartPart(part, noteId);
          const isVein = part.system === 'venous';
          const isVessel = !isHeart && (system === 'tuanhoan' || part.system === 'arterial') && !(noteId && NON_VESSEL_CIRCULATORY_IDS.has(noteId));
          const ownMaterial: THREE.Material = isHeart ? heartMaterial : isVein ? veinMaterial : isVessel ? vesselMaterial : normalMat[system];
          const mesh = new THREE.Mesh(geo, ownMaterial);
          mesh.userData.partId = part.id;
          const isLung = noteId !== null && LUNG_NOTE_IDS.has(noteId);

          // Lưu toạ độ đỉnh ban đầu để biến dạng thể trạng (BMI/Height/Weight) & tính tâm hình học
          mesh.userData.original = (geo.attributes.position.array as Float32Array).slice();
          mesh.userData.sys = system;

          geo.computeBoundingBox();
          const bcenter = new THREE.Vector3();
          if (geo.boundingBox) {
            geo.boundingBox.getCenter(bcenter);
          }
          mesh.userData.baseCenter = bcenter.clone();
          mesh.userData.basePos = new THREE.Vector3(0, 0, 0);

          scene.add(mesh);
          entries.push({ mesh, part, system, noteId, ownMaterial });
          if (isHeart) heartMeshesRef.current.push(mesh);
          if (isLung) lungMeshesRef.current.push(mesh);
        }

        // Tính tâm hình học đồng tâm cho toàn bộ khối tim (tâm thất, tâm nhĩ, vách tim, van tim)
        if (heartMeshesRef.current.length > 0) {
          const heartUnionBox = new THREE.Box3();
          for (const m of heartMeshesRef.current) {
            m.geometry.computeBoundingBox();
            if (m.geometry.boundingBox) {
              heartUnionBox.union(m.geometry.boundingBox);
            }
          }
          heartUnionBox.getCenter(heartCenterRef.current);
          for (const m of heartMeshesRef.current) {
            m.userData.baseCenter = heartCenterRef.current.clone();
          }
        }

        // Nạp khối giải phẫu hai lá phổi (Lung Lobes) bổ sung vào lồng ngực
        try {
          const lungLoader = new GLTFLoader();
          const lungGltf = await lungLoader.loadAsync(`${import.meta.env.BASE_URL}organs/models/lungs.glb`);
          if (!cancelled) {
            const lungModel = lungGltf.scene;
            const box = new THREE.Box3().setFromObject(lungModel);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            // Tọa độ ngực: Y = 1.317 (đồng bộ tâm cây phế quản), X = 0.003, Z = -0.001
            // Chiều cao targetH = 0.275m bao trọn vẹn toàn bộ hệ thống phế quản (cao 0.228m)
            const targetH = 0.275;
            const scale = targetH / Math.max(size.y, 0.001);

            // Sử dụng lungPivot cố định tại tâm ngực để thở (scale) không làm dịch chuyển tâm giải phẫu
            const lungPivot = new THREE.Group();
            lungPivot.position.set(0.003, 1.317, -0.001);

            lungModel.scale.setScalar(scale);
            // Dịch chuyển lungModel để tâm hình học của phổi trùng khớp đúng tâm (0,0,0) của lungPivot
            lungModel.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
            lungPivot.add(lungModel);

            lungModel.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.material.clippingPlanes = [plane];
                child.material.side = THREE.DoubleSide;
                child.userData.sys = 'hohap';
                child.userData.partId = 'fullbody_lung_parenchyma';
                child.userData.baseCenter = new THREE.Vector3(0.003, 1.317, -0.001);
                if (child.geometry?.attributes?.position) {
                  child.userData.original = (child.geometry.attributes.position.array as Float32Array).slice();
                }
                entries.push({
                  mesh: child,
                  part: {
                    id: 'fullbody_lung_parenchyma',
                    conceptId: 'FMA7309',
                    name: 'Nhu mô hai lá phổi (Lungs)',
                    system: 'respiratory',
                    chunk: 0,
                    positions: 0,
                    normals: 0,
                    indices: 0,
                    vertexCount: child.geometry.attributes.position.count,
                    indexCount: child.geometry.index?.count ?? 0,
                    bounds: [
                      [-0.13, 1.18, -0.09],
                      [0.13, 1.46, 0.09],
                    ],
                  },
                  system: 'hohap',
                  noteId: 'phoiphai',
                  ownMaterial: child.material,
                });
              }
            });
            scene.add(lungPivot);
            lungPivotRef.current = lungPivot;
          }
        } catch (err) {
          console.warn('Could not load lungs.glb:', err);
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

    const onZygoteCamera = (e: Event) => {
      const customEvent = e as CustomEvent;
      const act = customEvent.detail;
      lastInteractRef.current = performance.now();
      if (act === 'zoom-in') {
        camState.current.radius = Math.max(0.6, camState.current.radius * 0.85);
        camState.current.destRadius = camState.current.radius;
      } else if (act === 'zoom-out') {
        camState.current.radius = Math.min(6.0, camState.current.radius * 1.18);
        camState.current.destRadius = camState.current.radius;
      } else if (act === 'orbit-up') {
        camState.current.destPhi = Math.max(0.15, camState.current.destPhi - 0.25);
      } else if (act === 'orbit-down') {
        camState.current.destPhi = Math.min(Math.PI - 0.15, camState.current.destPhi + 0.25);
      } else if (act === 'orbit-left') {
        camState.current.destTheta -= 0.35;
      } else if (act === 'orbit-right') {
        camState.current.destTheta += 0.35;
      } else if (act === 'reset') {
        setCameraPreset('reset');
      } else if (['front', 'back', 'left', 'right', 'top'].includes(act)) {
        setCameraPreset(act as any);
      }
    };
    window.addEventListener('zygote-camera-action', onZygoteCamera);

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
        // Nhịp tim - co bóp đồng tâm quanh heartCenter mà không dịch chuyển vị trí gốc
        const heartPulse = 1 + 0.07 * Math.pow(Math.max(0, Math.sin(2 * Math.PI * 1.2 * t)), 6);
        const hc = heartCenterRef.current;
        const hScaleInv = 1 - heartPulse;
        for (const m of heartMeshesRef.current) {
          m.scale.setScalar(heartPulse);
          const exp = m.userData.explodeDelta as THREE.Vector3 | undefined;
          const ex = exp ? exp.x : 0;
          const ey = exp ? exp.y : 0;
          const ez = exp ? exp.z : 0;
          m.position.set(ex + hc.x * hScaleInv, ey + hc.y * hScaleInv, ez + hc.z * hScaleInv);
        }

        // Hô hấp - phồng xẹp quanh tâm của từng phổi
        const breathPulse = 1 + 0.035 * Math.sin(2 * Math.PI * 0.25 * t);
        const bScaleInv = 1 - breathPulse;
        if (lungPivotRef.current) {
          lungPivotRef.current.scale.setScalar(breathPulse);
        }
        for (const m of lungMeshesRef.current) {
          m.scale.setScalar(breathPulse);
          const lc = (m.userData.baseCenter as THREE.Vector3) || new THREE.Vector3();
          const exp = m.userData.explodeDelta as THREE.Vector3 | undefined;
          const ex = exp ? exp.x : 0;
          const ey = exp ? exp.y : 0;
          const ez = exp ? exp.z : 0;
          m.position.set(ex + lc.x * bScaleInv, ey + lc.y * bScaleInv, ez + lc.z * bScaleInv);
        }

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
      window.removeEventListener('zygote-camera-action', onZygoteCamera);
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
      lungPivotRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atlas]);

  // ---------- lớp da bán trong suốt ----------
  useEffect(() => {
    if (skinRef.current) skinRef.current.visible = !isIsolated && showGhost;
  }, [showGhost, isIsolated]);

  // ---------- hiển thị / ẩn theo hệ đang chọn, bóc tách Zygote & thao tác ngữ cảnh ----------
  useEffect(() => {
    const entries = entriesRef.current;
    if (!entries.length) return;
    let visible = 0;

    const effectiveIsolated = isIsolated || Boolean(isolatedTargetId);
    let targetIds: Set<string> | null = null;
    if (isolatedTargetId) {
      targetIds = new Set(
        entries
          .filter((e) => e.part.id === isolatedTargetId || e.noteId === isolatedTargetId)
          .map((e) => e.part.id),
      );
      if (targetIds.size === 0) targetIds.add(isolatedTargetId);
    } else if (selection) {
      const isLungSel = selection.kind === 'note' && LUNG_NOTE_IDS.has(selection.id);
      targetIds = new Set(
        selection.kind === 'part'
          ? [selection.id]
          : entries
              .filter(
                (e) =>
                  e.noteId === selection.id ||
                  (isLungSel && e.part.id === 'fullbody_lung_parenchyma'),
              )
              .map((e) => e.part.id),
      );
    }

    for (const en of entries) {
      let show = !onlySystem || !activeSystem || en.system === activeSystem;

      // 1. Lọc theo độ sâu bóc tách Zygote (peelDepth 0..100)
      if (peelDepth < 85 && en.system === 'da') {
        show = false;
      }
      if (peelDepth < 65 && en.system === 'co') {
        show = false;
      }
      if (peelDepth < 45 && en.system === 'xuong') {
        show = false;
      }
      if (
        peelDepth < 25 &&
        (en.system === 'hohap' ||
          en.system === 'tieuhoa' ||
          en.system === 'tietnieu' ||
          en.system === 'noitiet' ||
          en.system === 'sinhduc' ||
          en.system === 'lympho')
      ) {
        show = false;
      }

      // 2. Lọc theo danh sách Ẩn (Hide)
      if (
        hiddenPartIds &&
        (hiddenPartIds.has(en.part.id) || (en.noteId && hiddenPartIds.has(en.noteId)))
      ) {
        show = false;
      }

      // 3. Lọc theo chế độ Cô lập (Isolate)
      if (effectiveIsolated && targetIds) {
        show = targetIds.has(en.part.id);
      }

      // 4. Áp dụng hiệu ứng Mờ bóng ma (Ghost)
      const isGhosted =
        ghostPartIds &&
        (ghostPartIds.has(en.part.id) || (en.noteId && ghostPartIds.has(en.noteId)));
      const mat = en.mesh.material as THREE.Material;
      if (mat && 'opacity' in mat) {
        if (isGhosted) {
          mat.transparent = true;
          mat.opacity = 0.22;
          mat.depthWrite = false;
        } else {
          // khôi phục độ mờ chuẩn
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.depthWrite = true;
        }
      }

      en.mesh.visible = show;
      if (show) visible += 1;
    }

    // Lớp da ngoài cùng
    const showOuterSkin = peelDepth >= 85 && !effectiveIsolated && showGhost;

    if (skinRef.current) {
      skinRef.current.visible = showOuterSkin;
      if (skinRef.current.material && 'opacity' in skinRef.current.material) {
        (skinRef.current.material as THREE.Material).opacity = Math.min(
          0.38,
          0.12 + ((peelDepth - 85) / 15) * 0.26,
        );
      }
    }

    onCounts?.(visible, entries.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeSystem,
    onlySystem,
    ready,
    isIsolated,
    isolatedTargetId,
    selection,
    showGhost,
    peelDepth,
    hiddenPartIds,
    ghostPartIds,
  ]);

  // ---------- Bóc tách / Tách lớp theo không gian (Exploded View Đa Hướng) ----------
  useEffect(() => {
    if (!ready) return;
    const t = explode / 100;

    for (const en of entriesRef.current) {
      const baseCenter = (en.mesh.userData.baseCenter as THREE.Vector3) || new THREE.Vector3();
      const signX = Math.sign(baseCenter.x) || (en.mesh.id % 2 === 0 ? 1 : -1);

      let dx = 0;
      let dy = 0;
      let dz = 0;

      // Phân tầng không gian đa hướng rõ rệt theo hệ giải phẫu (Distinct Museum Exploded Layering)
      switch (en.system) {
        case 'xuong':
          // Bộ xương làm trục tham chiếu ở trung tâm:
          // Xương cột sống giữ nguyên trục trung tâm, tay chân & xương chậu tách sang 2 bên
          dx = baseCenter.x * 0.45 * t;
          dz = 0;
          break;

        case 'thankinh':
          // Hệ thần kinh: Não bay bổng lên trên (+Y), tủy sống lùi hẳn ra phía sau (-Z)
          if (baseCenter.y > 1.35) {
            dy = 0.55 * t;
            dz = -0.35 * t;
          } else {
            dz = -0.85 * t;
            dx = baseCenter.x * 0.4 * t;
          }
          break;

        case 'tuanhoan':
          // Hệ tuần hoàn: Tim & mạch máu bay thẳng về phía trước (+Z) và tách động mạch (trái) / tĩnh mạch (phải)
          if (en.part.system === 'venous' || en.part.name.toLowerCase().includes('vein')) {
            dx = (0.55 + Math.abs(baseCenter.x) * 0.4) * t;
            dz = 0.65 * t;
          } else {
            dx = (-0.55 - Math.abs(baseCenter.x) * 0.4) * t;
            dz = 0.65 * t;
          }
          break;

        case 'hohap':
          // Phổi & phế quản: Tách rộng ra hai bên mạn sườn và hơi lùi về trước
          dx = signX * (0.85 + Math.abs(baseCenter.x) * 0.3) * t;
          dz = 0.40 * t;
          break;

        case 'tieuhoa':
          // Nội tạng tiêu hóa (Dạ dày, gan, ruột): Bay thẳng ra phía trước tạo thành một tầng nội tạng độc lập
          dx = baseCenter.x * 0.35 * t;
          dz = (0.95 + Math.max(0, baseCenter.z) * 0.5) * t;
          dy = -0.12 * t;
          break;

        case 'tietnieu':
          // Thận và bàng quang: Thận dạt ra phía sau hai bên hông (-Z)
          dx = signX * (0.65 + Math.abs(baseCenter.x) * 0.3) * t;
          dz = -0.75 * t;
          break;

        case 'sinhduc':
          // Sinh dục: Tách hẳn ra phía trước vùng đáy chậu
          dx = baseCenter.x * 0.35 * t;
          dz = 0.75 * t;
          dy = -0.16 * t;
          break;

        case 'co':
          // Hệ cơ bắp: Tách rộng hẳn sang 2 bên cánh
          dx = signX * (1.10 + Math.abs(baseCenter.x) * 0.4) * t;
          dz = -0.35 * t;
          break;

        case 'da':
          // Lớp da ngoài cùng: Tách xa nhất ra 2 bên và bao quanh
          dx = signX * (1.60 + Math.abs(baseCenter.x) * 0.5) * t;
          dz = 0.85 * t;
          break;

        default:
          dx = signX * 0.75 * t;
          dz = 0.50 * t;
          break;
      }

      en.mesh.userData.explodeDelta = new THREE.Vector3(dx, dy, dz);
      if (!heartMeshesRef.current.includes(en.mesh) && !lungMeshesRef.current.includes(en.mesh)) {
        en.mesh.position.set(dx, dy, dz);
      } else if (reducedMotionRef.current) {
        en.mesh.position.set(dx, dy, dz);
      }
    }

    if (skinRef.current) {
      const skinBasePos = (skinRef.current.userData.basePos as THREE.Vector3) || new THREE.Vector3();
      skinRef.current.position.set(skinBasePos.x, skinBasePos.y, skinBasePos.z + 0.68 * t);
    }
    if (lungPivotRef.current) {
      lungPivotRef.current.position.set(0.003, 1.317, -0.001 + 0.50 * t);
    }
  }, [explode, ready]);

  const focusOnSelection = () => {
    if (!selection || !ready) return;
    const isLungSel = selection.kind === 'note' && LUNG_NOTE_IDS.has(selection.id);
    const targetIds = new Set(
      selection.kind === 'part'
        ? [selection.id]
        : entriesRef.current
            .filter(
              (e) =>
                e.noteId === selection.id ||
                (isLungSel && e.part.id === 'fullbody_lung_parenchyma'),
            )
            .map((e) => e.part.id),
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

  useEffect(() => {
    if (isolatedTargetId && ready) {
      focusOnSelection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isolatedTargetId, ready]);

  useEffect(() => {
    if (focusKey && focusKey > 0 && ready) {
      if (selection) {
        focusOnSelection();
      } else {
        setCameraPreset('reset');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, ready]);

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
