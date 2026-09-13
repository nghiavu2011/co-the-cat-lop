import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { HotspotDef } from './organData';
import { OrganAssetManager, type LoadedOrgan } from './loaders';
import { HotspotLayer } from './hotspots';

type ViewerCallbacks = {
  onLoading: (loading: boolean, progress: number) => void;
  onSelect: (hotspot: HotspotDef | null) => void;
};

const DOT_PIXELS = 34;
const CAMERA_FOV = 34;
const HOME_CAMERA = { x: 0, y: 1.05, z: 8.2 };
const HOME_TARGET = { x: 0, y: 0.02, z: 0 };

export class OrganDetailViewer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
  private controls: OrbitControls;
  private assets: OrganAssetManager;
  private hotspots = new HotspotLayer();
  private callbacks: ViewerCallbacks;
  private container: HTMLElement;
  private organ: LoadedOrgan | null = null;

  private frame = 0;
  private clock = new THREE.Clock();
  private resizeObserver: ResizeObserver;
  private intersectionObserver: IntersectionObserver;
  private clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
  private depthMaterial = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, depthTest: true });
  private crossSection = false;

  private width = 1;
  private height = 1;
  private isVisible = true;
  private isPageVisible = true;
  private dirty = true;
  private busyUntil = 0;
  private loadRequest = 0;
  private basePixelRatio: number;
  private autoRotateWanted = true;
  private interactionUntil = 0;
  private selectedId: string | null = null;
  private hoveredId: string | null = null;
  private hoverProbe: { x: number; y: number } | null = null;
  private pointerId: number | null = null;
  private pointerStart = { x: 0, y: 0 };
  private dragged = false;
  private disposed = false;

  constructor(container: HTMLElement, callbacks: ViewerCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    const lowPower = window.matchMedia('(max-width: 780px)').matches || (navigator.hardwareConcurrency ?? 8) < 6;
    this.basePixelRatio = Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2);

    this.renderer = new THREE.WebGLRenderer({ antialias: !lowPower, alpha: true, powerPreference: 'high-performance', stencil: false, depth: true });
    this.renderer.setPixelRatio(this.basePixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.shadowMap.enabled = false;
    this.renderer.localClippingEnabled = true;
    this.renderer.domElement.setAttribute('aria-label', 'Mô hình 3D nội tạng tương tác');
    this.renderer.domElement.tabIndex = 0;
    container.appendChild(this.renderer.domElement);

    this.camera.position.set(HOME_CAMERA.x, HOME_CAMERA.y, HOME_CAMERA.z);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = true;
    this.controls.panSpeed = 1.0;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 15;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.65;
    this.controls.target.set(HOME_TARGET.x, HOME_TARGET.y, HOME_TARGET.z);

    this.assets = new OrganAssetManager(this.renderer);
    this.buildEnvironment();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => { this.isVisible = entry.isIntersecting; if (this.isVisible) this.dirty = true; },
      { rootMargin: '120px' },
    );
    this.intersectionObserver.observe(container);

    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.controls.addEventListener('start', this.onControlStart);
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointerleave', this.onPointerLeave);
    canvas.addEventListener('keydown', this.onKeyDown);
    canvas.addEventListener('contextmenu', this.onContextMenu);

    this.resize();
    this.animate();
  }

  // ---- scene ----

  private buildEnvironment() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.42));
    this.scene.add(new THREE.HemisphereLight(0xfff8ee, 0x33252d, 0.72));
    const key = new THREE.DirectionalLight(0xfff3e7, 3.5); key.position.set(4.8, 6.5, 6.8); this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xe6ecff, 1.12); fill.position.set(-4.5, 1.2, 5.2); this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffb7a5, 1.6); rim.position.set(-4, 3.5, -5.5); this.scene.add(rim);
    const warm = new THREE.PointLight(0xff8d70, 0.72, 11, 2); warm.position.set(-3, -1.4, 3.5); this.scene.add(warm);
    const glow = new THREE.PointLight(0xee7c6a, 0.5, 8, 2); glow.name = 'organ-glow'; glow.position.set(2.8, 0.4, 2.8); this.scene.add(glow);

    this.scene.environment = this.buildEnvironmentMap();

    const positions = new Float32Array(48 * 3);
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = (Math.random() - 0.5) * 9;
      positions[i + 1] = (Math.random() - 0.5) * 6;
      positions[i + 2] = (Math.random() - 0.5) * 5 - 2;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xe7a18e, size: 0.013, transparent: true, opacity: 0.16 })));
  }

  private buildEnvironmentMap() {
    const w = 16, h = 32;
    const data = new Uint8Array(w * h * 4);
    const top = new THREE.Color(0xfff3e4), bottom = new THREE.Color(0x6b4f45), mixed = new THREE.Color();
    for (let y = 0; y < h; y++) {
      mixed.copy(bottom).lerp(top, Math.pow(1 - y / (h - 1), 0.7));
      for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; data[i] = mixed.r * 255; data[i + 1] = mixed.g * 255; data[i + 2] = mixed.b * 255; data[i + 3] = 255; }
    }
    const source = new THREE.DataTexture(data, w, h);
    source.mapping = THREE.EquirectangularReflectionMapping;
    source.colorSpace = THREE.SRGBColorSpace;
    source.needsUpdate = true;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const env = pmrem.fromEquirectangular(source).texture;
    pmrem.dispose(); source.dispose();
    return env;
  }

  // ---- organs ----

  async setOrgan(modelUrl: string, hotspots: HotspotDef[], accent: string) {
    const request = ++this.loadRequest;
    this.select(null);
    this.callbacks.onLoading(true, 0);

    const outgoing = this.organ;
    if (outgoing) {
      this.hotspots.clear();
      this.assets.release(outgoing);
      this.organ = null;
      this.dirty = true;
    }

    let organ: LoadedOrgan;
    try {
      organ = await this.assets.load(modelUrl, (progress) => {
        if (request === this.loadRequest) this.callbacks.onLoading(true, progress);
      });
    } catch (err) {
      console.error('Failed to load organ in OrganViewer:', modelUrl, err);
      if (request === this.loadRequest) this.callbacks.onLoading(false, 0);
      return;
    }
    if (request !== this.loadRequest || this.disposed) return;

    this.organ = organ;
    organ.pivot.scale.setScalar(1);
    organ.pivot.position.set(0, 0, 0);
    this.scene.add(organ.pivot);
    organ.pivot.updateWorldMatrix(true, true);

    this.hotspots.attach(organ.pivot, hotspots, organ.meshes);
    this.hotspots.setPixelSize(DOT_PIXELS, this.height, CAMERA_FOV);

    const glow = this.scene.getObjectByName('organ-glow') as THREE.PointLight | undefined;
    glow?.color.set(accent);

    this.callbacks.onLoading(false, 1);
    this.busy(1);
    this.dirty = true;

    // Reset camera
    this.camera.position.set(HOME_CAMERA.x, HOME_CAMERA.y, HOME_CAMERA.z);
    this.controls.target.set(HOME_TARGET.x, HOME_TARGET.y, HOME_TARGET.z);
  }

  // ---- loop ----

  private animate = () => {
    this.frame = requestAnimationFrame(this.animate);
    if (!this.isVisible || !this.isPageVisible) return;
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const now = performance.now();

    this.applyAutoRotate(now);
    if (this.controls.update(delta)) this.dirty = true;
    if (this.assets.hasAnimation) { this.assets.update(delta); this.dirty = true; }
    if (this.hoverProbe) this.resolveHover();
    if (!this.dirty && now >= this.busyUntil) return;

    if (!this.hotspots.update(this.camera, delta, this.selectedId, this.hoveredId)) this.dirty = true;
    else this.dirty = false;
    if (now < this.busyUntil) this.dirty = true;

    this.renderer.render(this.scene, this.camera);
  };

  private busy(seconds: number) { this.busyUntil = Math.max(this.busyUntil, performance.now() + seconds * 1000); this.dirty = true; }
  private applyAutoRotate(now: number) { this.controls.autoRotate = this.autoRotateWanted && !this.selectedId && now >= this.interactionUntil; }

  private onVisibilityChange = () => { this.isPageVisible = !document.hidden; if (this.isPageVisible) { this.clock.start(); this.dirty = true; } };

  private resize() {
    this.width = Math.max(this.container.clientWidth, 1);
    this.height = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height, false);
    this.hotspots.setPixelSize(DOT_PIXELS, this.height, CAMERA_FOV);
    this.dirty = true;
  }

  // ---- input ----

  private onControlStart = () => { this.interactionUntil = performance.now() + 3000; this.dirty = true; };
  private onPointerDown = (e: PointerEvent) => { this.pointerId = e.pointerId; this.pointerStart = { x: e.clientX, y: e.clientY }; this.dragged = false; };
  private onPointerMove = (e: PointerEvent) => {
    if (this.pointerId !== null) { if (Math.hypot(e.clientX - this.pointerStart.x, e.clientY - this.pointerStart.y) > 5) this.dragged = true; return; }
    this.hoverProbe = { x: e.offsetX, y: e.offsetY }; this.dirty = true;
  };
  private onPointerUp = (e: PointerEvent) => {
    const wasDragging = this.dragged; this.pointerId = null; this.dragged = false;
    if (wasDragging) return;
    const marker = this.hotspots.pick(e.offsetX, e.offsetY, this.camera, this.width, this.height);
    this.select(marker && marker.hotspot.id !== this.selectedId ? marker.hotspot.id : null);
  };
  private onPointerLeave = () => { this.pointerId = null; this.hoverProbe = null; if (this.hoveredId) { this.hoveredId = null; this.dirty = true; } };

  private resolveHover() {
    const probe = this.hoverProbe; this.hoverProbe = null; if (!probe) return;
    const marker = this.hotspots.pick(probe.x, probe.y, this.camera, this.width, this.height);
    const id = marker?.hotspot.id ?? null;
    if (id === this.hoveredId) return;
    this.hoveredId = id;
    this.renderer.domElement.style.cursor = id ? 'pointer' : '';
    this.dirty = true;
  }

  private select(id: string | null) {
    if (this.selectedId === id) return;
    this.selectedId = id;
    this.busy(0.4);
    const marker = this.hotspots.list.find(m => m.hotspot.id === id);
    this.callbacks.onSelect(marker?.hotspot ?? null);
  }

  clearSelection() { this.select(null); }
  selectHotspot(id: string | null) { this.select(id); }
  setAutoRotate(enabled: boolean) { this.autoRotateWanted = enabled; if (enabled) this.interactionUntil = 0; this.dirty = true; }

  reset() {
    this.select(null);
    this.camera.position.set(HOME_CAMERA.x, HOME_CAMERA.y, HOME_CAMERA.z);
    this.controls.target.set(HOME_TARGET.x, HOME_TARGET.y, HOME_TARGET.z);
    if (this.organ) this.organ.pivot.rotation.set(0.05, -0.28, 0);
    this.dirty = true;
  }

  toggleCrossSection() {
    this.crossSection = !this.crossSection;
    if (!this.organ) return this.crossSection;
    const planes = this.crossSection ? [this.clipPlane] : null;
    this.organ.meshes.forEach(mesh => {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach(m => { m.clippingPlanes = planes; m.needsUpdate = true; });
    });
    this.clipPlane.constant = this.crossSection ? 0 : -1.8;
    this.dirty = true;
    return this.crossSection;
  }

  toggleWireframe() {
    if (!this.organ) return false;
    let enabled = false;
    this.organ.meshes.forEach(mesh => {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach(m => { if (m instanceof THREE.MeshStandardMaterial) { m.wireframe = !m.wireframe; enabled = m.wireframe; } });
    });
    this.dirty = true;
    return enabled;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && this.organ) this.organ.pivot.rotation.y -= 0.08;
    if (e.key === 'ArrowRight' && this.organ) this.organ.pivot.rotation.y += 0.08;
    if (e.key === '+') this.camera.position.z = Math.max(4.8, this.camera.position.z - 0.35);
    if (e.key === '-') this.camera.position.z = Math.min(12, this.camera.position.z + 0.35);
    if (e.key === 'Escape') this.select(null);
    this.dirty = true;
  };

  dispose() {
    this.disposed = true;
    this.loadRequest += 1;
    cancelAnimationFrame(this.frame);
    this.controls.removeEventListener('start', this.onControlStart);
    this.controls.dispose();
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('pointerup', this.onPointerUp);
    canvas.removeEventListener('pointerleave', this.onPointerLeave);
    canvas.removeEventListener('keydown', this.onKeyDown);
    canvas.removeEventListener('contextmenu', this.onContextMenu);
    this.hotspots.dispose();
    this.depthMaterial.dispose();
    this.assets.dispose();
    this.scene.environment?.dispose();
    this.renderer.dispose();
    canvas.remove();
  }

  private onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };
}
