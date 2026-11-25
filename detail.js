// detail.js — perlengkapan visual "mid/high poly" untuk simulasi robotika UVERS XR Lab
//  • lingkungan(): pantulan lingkungan (env map) supaya logam & plastik terlihat nyata
//  • tekstur prosedural (canvas, tanpa file gambar): beton, bata, PCB, tapak ban, logam sikat, stiker
//  • gabung(): menyatukan banyak mesh statis per material → jauh lebih sedikit draw call
//  • bentuk siap pakai: kotak tumpul, baut, silinder berongga
import * as THREE from 'three';
import { RoomEnvironment } from './addons/RoomEnvironment.js';
import { mergeGeometries } from './addons/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from './addons/RoundedBoxGeometry.js';
export { RoundedBoxGeometry };

// ---------- Pantulan lingkungan ----------
// Pantulan hanya dipasang pada material "pahlawan" (robot: logam, plastik, karet — userData.pantul),
// bukan pada lantai/dinding/latar, agar biaya per piksel tetap rendah di Quest.
export function lingkungan(renderer, scene) {
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(new RoomEnvironment(renderer), .04).texture; pm.dispose();
  scene.traverse(o => { const ms = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of ms) if (m && m.isMeshStandardMaterial && m.userData.pantul) { m.envMap = env; m.needsUpdate = true; } });
  return env;
}

// ---------- Tekstur prosedural ----------
const cache = new Map();
function kanvas(w, h, gambar) { const c = document.createElement('canvas'); c.width = w; c.height = h; gambar(c.getContext('2d'), w, h); return c; }
function jadiTekstur(c, warna = true, ulang = [1, 1]) {
  const t = new THREE.CanvasTexture(c); if (warna) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...ulang); t.anisotropy = 4; return t;
}
let seed = 7; const acak = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function bintik(ctx, w, h, n, min, max, alpha) {
  for (let i = 0; i < n; i++) { const v = min + acak() * (max - min) | 0, s = 1 + acak() * 2.5;
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha})`; ctx.fillRect(acak() * w, acak() * h, s, s); }
}
// beton: warna dasar + bintik + retak halus. Kembalikan {map, bump}
export function teksturBeton(hex = '#9a9184') {
  const k = 'beton' + hex; if (cache.has(k)) return cache.get(k);
  const bump = kanvas(256, 256, (x, w, h) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); bintik(x, w, h, 5000, 40, 220, .35);
    x.strokeStyle = 'rgba(20,20,20,.55)'; x.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) { x.beginPath(); let px = acak() * w, py = acak() * h; x.moveTo(px, py);
      for (let j = 0; j < 7; j++) { px += (acak() - .5) * 50; py += (acak() - .5) * 50; x.lineTo(px, py); } x.stroke(); } });
  const map = kanvas(256, 256, (x, w, h) => { x.fillStyle = hex; x.fillRect(0, 0, w, h); x.globalAlpha = .28; x.drawImage(bump, 0, 0); x.globalAlpha = 1;
    for (let i = 0; i < 14; i++) { const g = x.createRadialGradient(acak() * w, acak() * h, 2, acak() * w, acak() * h, 60 + acak() * 60);
      g.addColorStop(0, 'rgba(40,30,20,.18)'); g.addColorStop(1, 'rgba(40,30,20,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } });
  const r = { map: jadiTekstur(map), bump: jadiTekstur(bump, false) }; cache.set(k, r); return r;
}
export function teksturBata() {
  if (cache.has('bata')) return cache.get('bata');
  const bump = kanvas(256, 256, (x, w, h) => { x.fillStyle = '#303030'; x.fillRect(0, 0, w, h);
    const bh = 32, bw = 64; for (let r = 0; r < h / bh; r++) for (let c = -1; c < w / bw + 1; c++) {
      const ox = (r % 2) * bw / 2; x.fillStyle = `rgb(${150 + acak() * 50 | 0},${150 + acak() * 50 | 0},${150 + acak() * 50 | 0})`; x.fillRect(c * bw + ox + 3, r * bh + 3, bw - 6, bh - 6); }
    bintik(x, w, h, 2500, 60, 200, .3); });
  const map = kanvas(256, 256, (x, w, h) => { x.fillStyle = '#b8ad9c'; x.fillRect(0, 0, w, h);
    const bh = 32, bw = 64; for (let r = 0; r < h / bh; r++) for (let c = -1; c < w / bw + 1; c++) {
      const ox = (r % 2) * bw / 2, v = acak(); x.fillStyle = `rgb(${140 + v * 40 | 0},${70 + v * 25 | 0},${50 + v * 18 | 0})`; x.fillRect(c * bw + ox + 3, r * bh + 3, bw - 6, bh - 6); }
    x.globalAlpha = .22; bintik(x, w, h, 3000, 30, 220, 1); x.globalAlpha = 1; });
  const r = { map: jadiTekstur(map), bump: jadiTekstur(bump, false) }; cache.set('bata', r); return r;
}
export function teksturTanah() {
  if (cache.has('tanah')) return cache.get('tanah');
  const bump = kanvas(512, 512, (x, w, h) => { x.fillStyle = '#7a7a7a'; x.fillRect(0, 0, w, h); bintik(x, w, h, 26000, 20, 240, .4); });
  const map = kanvas(512, 512, (x, w, h) => { x.fillStyle = '#6e6052'; x.fillRect(0, 0, w, h); x.globalAlpha = .35; x.drawImage(bump, 0, 0); x.globalAlpha = 1;
    for (let i = 0; i < 40; i++) { const cx = acak() * w, cy = acak() * h, g = x.createRadialGradient(cx, cy, 2, cx, cy, 30 + acak() * 70);
      const t = acak() < .5 ? '60,50,40' : '140,128,112'; g.addColorStop(0, `rgba(${t},.25)`); g.addColorStop(1, `rgba(${t},0)`); x.fillStyle = g; x.fillRect(0, 0, w, h); } });
  const r = { map: jadiTekstur(map), bump: jadiTekstur(bump, false) }; cache.set('tanah', r); return r;
}
// PCB hijau: jalur tembaga, pad, IC, tulisan sablon
export function teksturPCB(warna = '#0f6b4a', label = 'UVERS') {
  const k = 'pcb' + warna + label; if (cache.has(k)) return cache.get(k);
  const c = kanvas(512, 512, (x, w, h) => {
    x.fillStyle = warna; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(190,230,170,.35)'; x.lineWidth = 4; x.lineCap = 'round';
    for (let i = 0; i < 40; i++) { let px = acak() * w, py = acak() * h; x.beginPath(); x.moveTo(px, py);
      for (let j = 0; j < 3; j++) { if (acak() < .5) px += (acak() - .5) * 220; else py += (acak() - .5) * 220; x.lineTo(px, py); } x.stroke(); }
    for (let i = 0; i < 90; i++) { x.fillStyle = '#d8b25a'; const px = acak() * w, py = acak() * h; x.beginPath(); x.arc(px, py, 5, 0, 7); x.fill(); x.fillStyle = '#222'; x.beginPath(); x.arc(px, py, 2, 0, 7); x.fill(); }
    for (let i = 0; i < 5; i++) { const px = 40 + acak() * (w - 140), py = 40 + acak() * (h - 120); x.fillStyle = '#16181d'; x.fillRect(px, py, 70 + acak() * 40, 50 + acak() * 30);
      x.fillStyle = '#c9c9c9'; for (let j = 0; j < 8; j++) { x.fillRect(px - 6, py + 4 + j * 7, 6, 3); x.fillRect(px + 70, py + 4 + j * 7, 6, 3); } }
    x.fillStyle = 'rgba(255,255,255,.85)'; x.font = 'bold 34px sans-serif'; x.fillText(label, 24, h - 26);
    x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 3; x.strokeRect(10, 10, w - 20, h - 20);
  });
  const t = jadiTekstur(c); cache.set(k, t); return t;
}
// tapak ban (untuk bumpMap & roughness), arah alur sepanjang U
export function teksturTapak(alur = 24) {
  const k = 'tapak' + alur; if (cache.has(k)) return cache.get(k);
  const c = kanvas(512, 64, (x, w, h) => { x.fillStyle = '#bbb'; x.fillRect(0, 0, w, h); x.fillStyle = '#222';
    for (let i = 0; i < alur; i++) { const px = i * w / alur; x.beginPath(); x.moveTo(px, 0); x.lineTo(px + w / alur * .35, h / 2); x.lineTo(px, h); x.lineTo(px + w / alur * .18, h); x.lineTo(px + w / alur * .53, h / 2); x.lineTo(px + w / alur * .18, 0); x.fill(); } });
  const t = jadiTekstur(c, false); cache.set(k, t); return t;
}
// logam sikat (roughnessMap halus bergaris)
export function teksturSikat() {
  if (cache.has('sikat')) return cache.get('sikat');
  const c = kanvas(256, 256, (x, w, h) => { x.fillStyle = '#6a6a6a'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const v = 70 + acak() * 90 | 0; x.strokeStyle = `rgba(${v},${v},${v},.35)`; x.lineWidth = .6 + acak(); const py = acak() * h; x.beginPath(); x.moveTo(0, py); x.lineTo(w, py + (acak() - .5) * 3); x.stroke(); } });
  const t = jadiTekstur(c, false); cache.set('sikat', t); return t;
}
// stiker/label (misal label servo)
export function teksturStiker(baris, latar = '#1d1f27', aksen = '#ffb020') {
  const k = 'stk' + baris.join('|') + latar + aksen; if (cache.has(k)) return cache.get(k);
  const c = kanvas(256, 128, (x, w, h) => { x.fillStyle = latar; x.fillRect(0, 0, w, h); x.fillStyle = aksen; x.fillRect(0, 0, w, 10); x.fillRect(0, h - 10, w, 10);
    x.fillStyle = '#f2f2f2'; x.font = 'bold 40px sans-serif'; x.textAlign = 'center'; x.fillText(baris[0] || '', w / 2, 62);
    x.font = '22px sans-serif'; x.fillStyle = 'rgba(255,255,255,.7)'; x.fillText(baris[1] || '', w / 2, 98); });
  const t = jadiTekstur(c); cache.set(k, t); return t;
}

// ---------- Material siap pakai ----------
function tandai(m, kuat = 1) { m.userData.pantul = true; m.envMapIntensity = kuat; return m; }
export const Mat = {
  aluminium: (warna = 0xc9ced6, kasar = .38) => tandai(new THREE.MeshStandardMaterial({ color: warna, metalness: .9, roughness: kasar, roughnessMap: teksturSikat() })),
  anodized: (warna) => tandai(new THREE.MeshStandardMaterial({ color: warna, metalness: .75, roughness: .32, roughnessMap: teksturSikat() })),
  baja: (warna = 0x8a8f98) => tandai(new THREE.MeshStandardMaterial({ color: warna, metalness: 1, roughness: .28 })),
  krom: () => tandai(new THREE.MeshStandardMaterial({ color: 0xe8e8ea, metalness: 1, roughness: .12 })),
  plastik: (warna, kasar = .42) => tandai(new THREE.MeshStandardMaterial({ color: warna, metalness: 0, roughness: kasar }), .8),
  karet: (warna = 0x1b1b1d, tapak = null) => { const m = new THREE.MeshStandardMaterial({ color: warna, metalness: 0, roughness: .92 });
    if (tapak) { m.bumpMap = tapak; m.bumpScale = 2.2; } return tandai(m, .45); },
  pcb: (warna, label) => tandai(new THREE.MeshStandardMaterial({ map: teksturPCB(warna, label), metalness: .15, roughness: .55 }), .7),
  stiker: (baris, latar, aksen) => tandai(new THREE.MeshStandardMaterial({ map: teksturStiker(baris, latar, aksen), metalness: .1, roughness: .5 }), .6),
};

// ---------- Bentuk ----------
export const kotakTumpul = (w, h, d, r = Math.min(w, h, d) * .18, seg = 3) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, Math.min(w, h, d) / 2 - 1e-4));
// baut kepala hex (sumbu Y), untuk digabung
export const baut = (r = .003, h = .002) => new THREE.CylinderGeometry(r, r, h, 6);
// silinder berongga (ring/flens) sumbu Y
export function cincin(rLuar, rDalam, tinggi, seg = 32) {
  const s = new THREE.Shape(); s.absarc(0, 0, rLuar, 0, Math.PI * 2);
  const lubang = new THREE.Path(); lubang.absarc(0, 0, rDalam, 0, Math.PI * 2, true); s.holes.push(lubang);
  const g = new THREE.ExtrudeGeometry(s, { depth: tinggi, bevelEnabled: true, bevelSize: Math.min(.0008, tinggi * .2), bevelThickness: Math.min(.0008, tinggi * .2), bevelSegments: 2, curveSegments: seg });
  g.rotateX(-Math.PI / 2); g.translate(0, -tinggi / 2, 0); return g;
}
// UV kotak menurut ukuran nyata (agar tekstur tidak melar pada kotak panjang). skala = meter per ulangan tekstur
export function uvNyata(geo, skala = 1) {
  const p = geo.parameters, uv = geo.attributes.uv; if (!p || p.width === undefined || !uv) return geo;
  const dims = [[p.depth, p.height], [p.depth, p.height], [p.width, p.depth], [p.width, p.depth], [p.width, p.height], [p.width, p.height]];
  const sudah = new Set(), idx = geo.index;
  for (const g of geo.groups) { const [du, dv] = dims[Math.min(5, g.materialIndex)];
    for (let i = g.start; i < g.start + g.count; i++) { const v = idx ? idx.getX(i) : i; if (sudah.has(v)) continue; sudah.add(v);
      uv.setXY(v, uv.getX(v) * du / skala, uv.getY(v) * dv / skala); } }
  uv.needsUpdate = true;
  return geo;
}
// patahan acak (vertex digeser menurut posisinya sendiri, sehingga tepi tetap tertutup) — untuk puing beton
export function patahkan(geo, kuat = .15) {
  const p = geo.attributes.position, v = new THREE.Vector3();
  const h = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s) - .5; };
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = kuat * (Math.abs(v.x) + Math.abs(v.y) + Math.abs(v.z)) / 3;
    p.setXYZ(i, v.x + h(v.x, v.y, v.z) * k * 2, v.y + h(v.y, v.z, v.x) * k * 2, v.z + h(v.z, v.x, v.y) * k * 2); }
  geo.computeVertexNormals(); return geo;
}

// ---------- Penggabung draw call ----------
function siapkan(g) {
  let x = g.index ? g.toNonIndexed() : g.clone();
  for (const n of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(n)) x.deleteAttribute(n);
  if (!x.attributes.uv) x.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2));
  if (!x.attributes.normal) x.computeVertexNormals();
  x.clearGroups(); return x;
}
// Gabungkan daftar mesh (statis relatif terhadap `induk`) per kunci (default: material).
// Mesh asli dilepas dari induknya; mesh gabungan ditambahkan ke `induk`. Kembalikan daftar mesh gabungan.
export function gabungMesh(meshes, induk, kunci = m => m.material.uuid) {
  induk.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(induk.matrixWorld).invert();
  const grup = new Map();
  for (const m of meshes) { if (!m.isMesh || m.isInstancedMesh || Array.isArray(m.material)) continue; const k = kunci(m); if (!grup.has(k)) grup.set(k, []); grup.get(k).push(m); }
  const hasil = [];
  for (const [, list] of grup) {
    if (list.length < 2) continue;
    const geos = list.map(m => siapkan(m.geometry).applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld)));
    const merged = mergeGeometries(geos, false); geos.forEach(g => g.dispose()); if (!merged) continue;
    merged.computeBoundingSphere(); merged.computeBoundingBox();
    const out = new THREE.Mesh(merged, list[0].material);
    out.castShadow = list.some(m => m.castShadow); out.receiveShadow = list.some(m => m.receiveShadow);
    out.userData = { ...list[0].userData, gabungan: list.length };
    for (const m of list) m.removeFromParent();
    induk.add(out); hasil.push(out);
  }
  return hasil;
}
// Gabungkan semua mesh di bawah `akar` (yang tidak bertanda userData.tetap) per material.
export function gabung(akar) {
  const list = []; akar.traverse(o => { if (o.isMesh && !o.userData.tetap) list.push(o); });
  return gabungMesh(list, akar);
}
