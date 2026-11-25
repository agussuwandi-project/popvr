// Logo UVERS 3D di dalam VR/MR: matahari terbit di atas lengkung bumi, sama seperti layar loading,
// tapi berlapis kedalaman (huruf punya ketebalan, matahari & sinar di belakang) lalu memudar.
// Pemakaian: import('./logo3d.js').then(m => m.pasangLogo3D(renderer, scene, { syarat: () => true }));
// Diputar sekali per halaman (saat pertama masuk VR), dan hanya jika syarat() bernilai true.
// Uji di laptop: tambahkan ?logo3d=1 di URL.
import * as THREE from 'three';

const W = 1.6, H = W * 552 / 1146;          // ukuran logo di dunia (meter)
const DIST = 2.2;                           // jarak dari mata pemain
const DUR = 3.9;                            // total durasi (detik)
const C_LIGHT = 0xffffff, C_TEXT = 0xf4f6ff, C_EDGE = 0x5b3fb8; // bagian bergradien memakai warna dari tekstur

const clamp01 = x => Math.min(1, Math.max(0, x));
const seg = (t, a, d) => clamp01((t - a) / d);
const outCubic = x => 1 - Math.pow(1 - x, 3);
const outBack = x => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

const GRAD = ['horizon', 'sun', 'reflect', 'ray-center', 'ray-short', 'ray-long']; // diberi gradien merek seperti judul menu
function maskTexture(src, grad) {
  // mask PNG hanya berisi alpha; ubah jadi gambar putih ber-alpha supaya bisa diwarnai lewat material.color
  const c = document.createElement('canvas'); c.width = 1146; c.height = 552;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const img = new Image();
  img.onload = () => { const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height); x.globalCompositeOperation = 'source-in';
    if (grad) { const g = x.createLinearGradient(0, 0, c.width, 0); g.addColorStop(0, '#ff7ad1'); g.addColorStop(.5, '#a48cff'); g.addColorStop(1, '#5ee7ff'); x.fillStyle = g; } else x.fillStyle = '#fff';
    x.fillRect(0, 0, c.width, c.height); tex.needsUpdate = true; };
  img.src = src;
  return tex;
}
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,170,230,1)'); g.addColorStop(.25, 'rgba(255,122,209,.55)'); g.addColorStop(.6, 'rgba(164,140,255,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function pasangLogo3D(renderer, scene, opsi = {}) {
  const M = window.UVERS_MASKS;
  if (!M) { console.warn('logo3d: mask logo tidak ada (loader.js belum dimuat)'); return; }
  renderer.localClippingEnabled = true;     // hanya berlaku untuk material yang memakai clippingPlanes (matahari)

  const tex = {}; for (const k in M) tex[k] = maskTexture(M[k], GRAD.includes(k));
  const root = new THREE.Group(); root.name = 'logoUVERS3D';
  const mats = [];
  const plane = new THREE.PlaneGeometry(W, H);
  function layer(texKey, color, z, extra = {}) {
    const { geo, ...matExtra } = extra;
    const m = new THREE.MeshBasicMaterial({ map: tex[texKey], color, transparent: true, alphaTest: .35, depthTest: false, depthWrite: false, side: THREE.DoubleSide, ...matExtra });
    mats.push(m);
    const mesh = new THREE.Mesh(geo || plane, m); mesh.position.z = z; mesh.renderOrder = 1000 + Math.round((z + .3) * 1000); return mesh;
  }
  // tebal: tumpuk lapisan dari belakang (biru) ke depan (terang)
  function thick(texKey, colorFront, z0, depth, n) {
    const g = new THREE.Group();
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1), col = new THREE.Color(C_EDGE).lerp(new THREE.Color(colorFront), i === n - 1 ? 1 : k * .55);
      g.add(layer(texKey, col, z0 - depth + depth * k));
    }
    return g;
  }

  // pelat navy lembut di belakang logo (seperti latar layar loading) supaya logo selalu terbaca
  const plateC = document.createElement('canvas'); plateC.width = 512; plateC.height = 320;
  { const x = plateC.getContext('2d'); const g = x.createRadialGradient(256, 160, 40, 256, 160, 250);
    g.addColorStop(0, 'rgba(14,10,36,.93)'); g.addColorStop(.62, 'rgba(5,6,15,.86)'); g.addColorStop(1, 'rgba(5,6,15,0)');
    x.fillStyle = g; x.fillRect(0, 0, 512, 320); }
  const plateTex = new THREE.CanvasTexture(plateC); plateTex.colorSpace = THREE.SRGBColorSpace;
  const plateMat = new THREE.MeshBasicMaterial({ map: plateTex, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.55, W * 1.55 * 320 / 512), plateMat);
  plate.position.set(0, -H * .02, -.25); plate.renderOrder = 998; root.add(plate);

  // cahaya di belakang matahari
  const glowMat = new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const glow = new THREE.Sprite(glowMat); glow.scale.set(W * .62, W * .62, 1); glow.position.set(0, H * .09, -.16); glow.renderOrder = 999; glowMat.depthTest = false; root.add(glow);

  // lengkung bumi (digambar dari kiri ke kanan: pivot di tepi kiri)
  const hzGeo = plane.clone().translate(W / 2, 0, 0);
  const horizon = new THREE.Group(); horizon.position.x = -W / 2;
  for (let i = 0; i < 5; i++) { const k = i / 4; horizon.add(layer('horizon', new THREE.Color(C_EDGE).lerp(new THREE.Color(C_LIGHT), i === 4 ? 1 : k * .5), -.03 + .03 * k, { geo: hzGeo })); }
  root.add(horizon);

  // matahari naik dari balik cakrawala (dipotong bidang horizontal)
  const sunClip = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const sun = layer('sun', C_LIGHT, -.09, { clippingPlanes: [sunClip] }); root.add(sun);
  const reflect = layer('reflect', C_LIGHT, -.07); root.add(reflect);

  // sinar memancar dari titik pusat matahari
  const pivotY = H * (0.5 - 0.51);
  const rays = ['ray-center', 'ray-short', 'ray-long'].map((k, i) => {
    const pg = new THREE.Group(); pg.position.set(0, pivotY, -.12 - i * .015);
    const m = layer(k, C_LIGHT, 0); m.position.y = -pivotY; pg.add(m); root.add(pg); return pg;
  });

  const letters = thick('letters', C_TEXT, .06, .06, 9); root.add(letters);
  const word = thick('wordmark', C_TEXT, .04, .03, 5); root.add(word);

  // ---- animasi
  let t0 = -1, frames = 0, playing = false, fixedT = null; // fixedT: hanya untuk pengujian
  const tmpP = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), fwd = new THREE.Vector3(), wp = new THREE.Vector3();

  function place(cam) {
    cam.matrixWorld.decompose(tmpP, tmpQ, tmpS);
    fwd.set(0, 0, -1).applyQuaternion(tmpQ); fwd.y = 0;
    if (fwd.lengthSq() < 1e-4) fwd.set(0, 0, -1); fwd.normalize();
    root.position.copy(tmpP).addScaledVector(fwd, DIST); root.position.y = tmpP.y + .08;
    root.rotation.set(0, Math.atan2(-fwd.x, -fwd.z), 0);
    root.updateMatrixWorld(true);
    // bidang potong matahari = garis cakrawala di dunia
    root.localToWorld(wp.set(0, H * (0.5 - 0.515), 0)); sunClip.constant = -wp.y;
  }
  function setOpacity(a) { for (const m of mats) m.opacity = a; }

  function update(t) {
    const hz = outCubic(seg(t, 0, .75));            horizon.scale.x = Math.max(.001, hz);
    const su = outCubic(seg(t, .35, .85));          sun.position.y = -H * .3 * (1 - su); sun.material.opacity = .2 + .8 * su;
    const rf = outCubic(seg(t, .95, .6));           reflect.scale.y = .6 + .4 * rf; reflect.material.opacity = rf; reflect.visible = rf > 0;
    rays.forEach((r, i) => { const k = outBack(seg(t, 1.05 + i * .1, .55)); r.scale.setScalar(Math.max(.001, k)); r.visible = k > 0.01; });
    const lt = outCubic(seg(t, 1.35, .6));          letters.position.y = -H * .05 * (1 - lt); letters.visible = lt > 0; letters.children.forEach(m => m.material.opacity = lt);
    const wd = outCubic(seg(t, 1.6, .6));           word.position.y = -H * .05 * (1 - wd); word.visible = wd > 0; word.children.forEach(m => m.material.opacity = wd);
    plateMat.opacity = outCubic(seg(t, 0, .4));
    glowMat.opacity = .85 * su * (t > 2.2 ? .8 + .2 * Math.sin((t - 2.2) * 5) : 1);
    if (t > 2.2) rays.forEach((r, i) => r.scale.setScalar(1 - .08 * Math.max(0, Math.sin((t - 2.2) * 4 - i * .7))));
    // sedikit berputar supaya ketebalan terlihat
    root.rotation.x = Math.sin(t * 1.3) * .04;
    // keluar
    const out = seg(t, DUR - .6, .6);
    if (out > 0) { const e = outCubic(out); root.scale.setScalar(1 + .12 * e); setOpacity(1 - e); glowMat.opacity *= 1 - e; plateMat.opacity *= 1 - e; }
  }

  const prev = scene.onBeforeRender;
  scene.onBeforeRender = function (r, s, camera, ...rest) {
    prev.call(this, r, s, camera, ...rest);
    if (!playing) return;
    const cam = renderer.xr.isPresenting ? renderer.xr.getCamera() : camera;
    if (t0 < 0) { if (++frames < 4) return; place(cam); scene.add(root); t0 = performance.now(); }
    const t = fixedT ?? (performance.now() - t0) / 1000;
    if (t >= DUR) { scene.remove(root); playing = false; return; }
    update(t);
  };

  function mainkan() {
    fixedT = null; t0 = -1; frames = 0; playing = true; root.scale.setScalar(1); setOpacity(1); scene.remove(root);
    horizon.scale.x = .001; rays.forEach(r => r.scale.setScalar(.001)); letters.visible = word.visible = reflect.visible = false;
  }
  let sudah = false;
  renderer.xr.addEventListener('sessionstart', () => {
    if (sudah || (opsi.syarat && !opsi.syarat())) return;
    sudah = true; mainkan();
  });
  if (new URLSearchParams(location.search).get('logo3d') === '1') { // pratinjau laptop: tunggu layar loading UVERS selesai dulu
    const tunggu = () => document.getElementById('uvl') ? setTimeout(tunggu, 150) : setTimeout(mainkan, 300); tunggu(); }
  function pratinjau(t) { if (!playing) mainkan(); fixedT = t; }
  window.uversLogo3D = { mainkan, pratinjau };
  return { mainkan, pratinjau };
}
