import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { disposeObject } from './dispose';

export const FIT_SIZE = 3.8;
const CACHE_LIMIT = 3;

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
    this.loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  }

  get hasAnimation() { return Boolean(this.current?.mixer); }

  prefetch(url: string) {
    if (this.cache.has(url) || this.inflight.has(url)) return;
    void fetch(url, { priority: 'low' } as RequestInit).catch(() => {});
  }

  async load(url: string, onProgress?: (p: number) => void): Promise<LoadedOrgan> {
    const cached = this.cache.get(url);
    if (cached) {
      this.cache.delete(url);
      this.cache.set(url, cached);
      this.resetMaterials(cached);
      onProgress?.(1);
      this.current = cached;
      return cached;
    }
    const pending = this.inflight.get(url) ?? this.parse(url, onProgress);
    this.inflight.set(url, pending);
    try {
      const organ = await pending;
      this.cache.set(url, organ);
      this.evict();
      this.current = organ;
      return organ;
    } finally {
      this.inflight.delete(url);
    }
  }

  private async parse(url: string, onProgress?: (p: number) => void): Promise<LoadedOrgan> {
    const gltf = await this.loader.loadAsync(url, (event) => {
      if (event.total > 0) onProgress?.(event.loaded / event.total);
    });
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = FIT_SIZE / Math.max(size.x, size.y, size.z, 0.001);
    model.scale.setScalar(scale);
    model.position.copy(center.multiplyScalar(-scale));

    const pivot = new THREE.Group();
    pivot.name = 'organ-pivot';
    pivot.add(model);
    pivot.rotation.set(0.05, -0.28, 0);

    const meshes: THREE.Mesh[] = [];
    model.traverse((child) => {
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
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        mat.transparent = false;
        mat.opacity = 1;
        mat.depthWrite = true;
        mat.clippingPlanes = null;
        mat.clipShadows = false;
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
