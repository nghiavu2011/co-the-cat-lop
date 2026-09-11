import * as THREE from 'three';
import type { AtlasPart } from './types';

/** Dựng BufferGeometry cho một AtlasPart, đọc trực tiếp (zero-copy) từ buffer
 * chunk đã giải nén — cùng cách bố trí dữ liệu mà ashemag/human-atlas dùng:
 * positions Float32, normals Int16 chuẩn hoá, indices Uint32. */
export function buildPartGeometry(part: AtlasPart, chunkBuffer: ArrayBuffer): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(chunkBuffer, part.positions, part.vertexCount * 3), 3),
  );
  g.setAttribute(
    'normal',
    new THREE.BufferAttribute(new Int16Array(chunkBuffer, part.normals, part.vertexCount * 3), 3, true),
  );
  g.setIndex(new THREE.BufferAttribute(new Uint32Array(chunkBuffer, part.indices, part.indexCount), 1));
  return g;
}
