import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { disposeObject } from './dispose';

export const FIT_SIZE = 3.8;
const CACHE_LIMIT = 3;

export function getAnatomicalColorForMesh(name: string): THREE.Color | null {
  const n = (name || '').toLowerCase();
  if (n.includes('ovary')) return new THREE.Color('#e8a87c'); // Buồng trứng (vàng hạnh nhân / peach)
  if (n.includes('fibria') || n.includes('fimbria')) return new THREE.Color('#d9446a'); // Loa vòi trứng (đỏ cánh sen)
  if (n.includes('uterine_tube') || n.includes('ampulla') || n.includes('isthmus') || n.includes('infundibulum')) {
    return new THREE.Color('#c95973'); // Vòi tử cung (hồng san hô)
  }
  if (n.includes('ligament') || n.includes('meso')) return new THREE.Color('#ded3be'); // Dây chằng & mạc treo (trắng ngà phúc mạc)
  if (n.includes('pouch')) return new THREE.Color('#ebd9c8'); // Túi cùng
  if (n.includes('cervix') || n.includes('os') || n.includes('vagina')) return new THREE.Color('#a84462'); // Cổ tử cung & âm đạo
  if (n.includes('anterior_wall') || n.includes('posterior_wall') || n.includes('fundus') || n.includes('body_of_uterus') || n.includes('lower_uterine') || n.includes('uterus')) {
    return new THREE.Color('#b84666'); // Thân & đáy tử cung (cơ trơn đỏ hồng)
  }
  // Pelvis bone layers
  if (n.includes('spongy_bone')) return new THREE.Color('#c9986b'); // Xương xốp
  if (n.includes('compact_bone') || n.includes('sacrum') || n.includes('coccyx')) return new THREE.Color('#d9cbb5'); // Xương đặc
  return null;
}

export type LoadedOrgan = {
  url: string;
  pivot: THREE.Group;
  meshes: THREE.Mesh[];
  mixer: THREE.AnimationMixer | null;
};

export class OrganAssetManager {
  private loader: GLTFLoader;
  private cache = new Map<string, LoadedOrgan>();
  private inflight = new Map<string, Promise<LoadedOrgan>>();
  private current: LoadedOrgan | null = null;
  private maxAnisotropy: number;

  constructor(renderer: THREE.WebGLRenderer) {
    this.maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const draco = new DRACOLoader();
    draco.setDecoderPath('/draco/');
    this.loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).setDRACOLoader(draco);
  }

  get hasAnimation() { return Boolean(this.current?.mixer); }

  prefetch(url: string) {
    if (this.cache.has(url) || this.inflight.has(url)) return;
    void fetch(url, { priority: 'low' } as RequestInit).catch(() => {});
  }

  async load(url: string, onProgress?: (p: number) => void, companionUrl?: string): Promise<LoadedOrgan> {
    const cacheKey = companionUrl ? `${url}#${companionUrl}` : url;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.cache.delete(cacheKey);
      this.cache.set(cacheKey, cached);
      this.resetMaterials(cached);
      onProgress?.(1);
      this.current = cached;
      return cached;
    }
    const pending = this.inflight.get(cacheKey) ?? this.parse(url, onProgress, companionUrl);
    this.inflight.set(cacheKey, pending);
    try {
      const organ = await pending;
      this.cache.set(cacheKey, organ);
      this.evict();
      this.current = organ;
      return organ;
    } catch (e) {
      console.error('Error loading organ model:', url, e);
      throw e;
    } finally {
      this.inflight.delete(cacheKey);
    }
  }

  private async parse(url: string, onProgress?: (p: number) => void, companionUrl?: string): Promise<LoadedOrgan> {
    await MeshoptDecoder.ready;
    const gltf = await this.loader.loadAsync(url, (event) => {
      if (event.total > 0) onProgress?.(event.loaded / event.total);
    });
    const model = gltf.scene;

    const container = new THREE.Group();
    container.name = 'organ-container';
    container.add(model);

    if (companionUrl) {
      try {
        const compGltf = await this.loader.loadAsync(companionUrl);
        const compModel = compGltf.scene;
        compModel.traverse((c) => {
          if (c instanceof THREE.Mesh) {
            const mats = Array.isArray(c.material) ? c.material : [c.material];
            mats.forEach((mat) => {
              mat.transparent = true;
              mat.opacity = 0.82;
              mat.depthWrite = true;
              mat.side = THREE.DoubleSide;
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.roughness = 0.58;
                mat.metalness = 0.04;
              }
            });
          }
        });
        container.add(compModel);
      } catch (err) {
        console.warn('Could not load companion model:', companionUrl, err);
      }
    }

    const box = new THREE.Box3().setFromObject(container);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = FIT_SIZE / Math.max(size.x, size.y, size.z, 0.001);
    container.scale.setScalar(scale);
    container.position.copy(center.multiplyScalar(-scale));

    const pivot = new THREE.Group();
    pivot.name = 'organ-pivot';
    pivot.add(container);
    pivot.rotation.set(0.05, -0.28, 0);

    const meshes: THREE.Mesh[] = [];
    container.traverse((child) => {
      const childName = (child.name || '').toLowerCase();
      if (
        childName.includes('text') ||
        childName.includes('label') ||
        childName.includes('annotation') ||
        childName.includes('pin') ||
        childName.includes('watermark')
      ) {
        child.visible = false;
        return;
      }
      if (!(child instanceof THREE.Mesh)) return;
      meshes.push(child);
      child.frustumCulled = false;
      child.castShadow = false;
      child.receiveShadow = false;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        mat.transparent = false;
        mat.opacity = 1;
        mat.depthWrite = true;
        mat.depthTest = true;
        mat.side = THREE.FrontSide;
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.roughness = THREE.MathUtils.clamp(mat.roughness ?? 0.5, 0.42, 0.62);
          mat.metalness = 0;
          mat.envMapIntensity = 0.32;
          mat.emissive.set(0x000000);
          mat.emissiveIntensity = 0;
          if ('clearcoat' in mat) {
            const p = mat as THREE.MeshPhysicalMaterial;
            p.clearcoat = Math.min(Math.max(p.clearcoat, 0.08), 0.12);
            p.clearcoatRoughness = 0.62;
            p.transmission = 0;
            p.thickness = 0;
          }
          if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
          if (mat.normalMap) mat.normalScale.multiplyScalar(0.62);
          for (const map of [mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap, mat.aoMap, mat.emissiveMap]) {
            if (!map) continue;
            map.anisotropy = this.maxAnisotropy;
            map.generateMipmaps = true;
            map.minFilter = THREE.LinearMipmapLinearFilter;
            map.magFilter = THREE.LinearFilter;
            map.needsUpdate = true;
          }
        }
        const anatColor = getAnatomicalColorForMesh(child.name);
        if (anatColor && 'color' in mat && (mat as THREE.MeshStandardMaterial).color) {
          (mat as THREE.MeshStandardMaterial).color.copy(anatColor);
        }
        if (child.name.toLowerCase().includes('ligament') || child.name.toLowerCase().includes('meso')) {
          mat.transparent = true;
          mat.opacity = 0.88;
        }
        mat.needsUpdate = true;
      });
    });

    let mixer: THREE.AnimationMixer | null = null;
    if (gltf.animations.length) {
      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => mixer?.clipAction(clip).play());
    }
    return { url, pivot, meshes, mixer };
  }

  private resetMaterials(organ: LoadedOrgan) {
    organ.pivot.rotation.set(0.05, -0.28, 0);
    organ.pivot.position.set(0, 0, 0);
    organ.meshes.forEach((mesh) => {
      mesh.visible = true;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        mat.transparent = false;
        mat.opacity = 1;
        mat.depthWrite = true;
        mat.clippingPlanes = null;
        mat.clipShadows = false;
        mat.side = THREE.FrontSide;
        if (mat instanceof THREE.MeshStandardMaterial) mat.wireframe = false;
        mat.needsUpdate = true;
      });
    });
  }

  private evict() {
    while (this.cache.size > CACHE_LIMIT) {
      const oldest = this.cache.keys().next().value as string | undefined;
      if (!oldest) return;
      const organ = this.cache.get(oldest);
      this.cache.delete(oldest);
      if (organ && organ !== this.current) this.destroy(organ);
    }
  }

  private destroy(organ: LoadedOrgan) {
    organ.mixer?.stopAllAction();
    organ.mixer?.uncacheRoot(organ.pivot);
    organ.pivot.removeFromParent();
    disposeObject(organ.pivot);
  }

  update(delta: number) { this.current?.mixer?.update(delta); }

  release(organ: LoadedOrgan | null = this.current) {
    if (!organ) return;
    organ.mixer?.stopAllAction();
    organ.pivot.removeFromParent();
    if (organ === this.current) this.current = null;
  }

  dispose() {
    this.release();
    this.cache.forEach((organ) => this.destroy(organ));
    this.cache.clear();
  }
}
