// alien.js — model musuh mid-poly + ledakan efisien untuk game UVERS XR Lab
//  buatMusuh(tipe, {skala, ringan})  → Group (userData.spin = bagian yang berputar). Hitbox ditambahkan pemanggil.
//  buatBos({skala, ringan})          → {grup, hull, dome, core}
//  new Ledakan(scene, {ringan})       → .meledak(pos, warna, n, ukuran, laju)  .update(dt)   (2 draw call untuk semua serpihan)
//  ringan = true untuk Mixed Reality (segmen lebih sedikit).
import * as THREE from 'three';
import { mergeGeometries } from './addons/BufferGeometryUtils.js';

// ---------- material ----------
const cache = new Map(); let ENV = null;
function mat(kunci, buat) { if (!cache.has(kunci)) { const m = buat(); m.userData.pantul = true; if (ENV) m.envMap = ENV; cache.set(kunci, m); } return cache.get(kunci); }
// pasang pantulan lingkungan ke semua material musuh (yang sudah ada dan yang dibuat nanti)
export function pakaiPantulan(env) { ENV = env; for (const m of cache.values()) if (m.isMeshStandardMaterial) { m.envMap = env; m.needsUpdate = true; } }
const logam = (warna, glow = .35, kasar = .3) => mat('l' + warna + glow + kasar, () => new THREE.MeshStandardMaterial({ color: warna, emissive: warna, emissiveIntensity: glow, metalness: .75, roughness: kasar, flatShading: true }));
const halus = (warna, glow = .35, kasar = .25) => mat('h' + warna + glow + kasar, () => new THREE.MeshStandardMaterial({ color: warna, emissive: warna, emissiveIntensity: glow, metalness: .6, roughness: kasar }));
const gelap = () => mat('gelap', () => new THREE.MeshStandardMaterial({ color: 0x1a1d2b, metalness: .85, roughness: .35, flatShading: true }));
const kaca = (warna) => mat('k' + warna, () => new THREE.MeshStandardMaterial({ color: warna, emissive: warna, emissiveIntensity: .25, metalness: .2, roughness: .05, transparent: true, opacity: .7 }));
const nyala = (warna) => { const k = 'n' + warna; if (!cache.has(k)) cache.set(k, new THREE.MeshBasicMaterial({ color: warna, toneMapped: false })); return cache.get(k); };

// ---------- pembantu geometri ----------
function siap(g) { let x = g.index ? g.toNonIndexed() : g; for (const n of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(n)) x.deleteAttribute(n);
  if (!x.attributes.uv) x.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2)); x.clearGroups(); return x; }
// kumpulan geometri per material → satu mesh per material
function rakit(daftar) { // daftar: [[geo, material], ...]
  const per = new Map(); for (const [g, m] of daftar) { if (!per.has(m)) per.set(m, []); per.get(m).push(siap(g)); }
  const grup = new THREE.Group(); for (const [m, gs] of per) grup.add(new THREE.Mesh(gs.length > 1 ? mergeGeometries(gs) : gs[0], m)); return grup;
}
const T = (g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => g.scale(s, s, s).rotateX(rx).rotateY(ry).rotateZ(rz).translate(x, y, z);
const bubut = (titik, seg) => new THREE.LatheGeometry(titik.map(([r, y]) => new THREE.Vector2(r, y)), seg);

// ---------- musuh ----------
export function buatMusuh(tipe, { skala = 1, ringan = false } = {}) {
  const q = ringan ? .6 : 1, S = n => Math.max(6, Math.round(n * q));
  const g = new THREE.Group(), model = new THREE.Group(); model.scale.setScalar(skala); g.add(model);
  if (tipe === 'drone') {            // inti berlapis panel + cincin pendorong berputar + lensa mata
    model.add(rakit([
      [new THREE.IcosahedronGeometry(.24, 1), logam(0xff33cc, .4)],
      [T(new THREE.TorusGeometry(.235, .03, 6, S(32)), 0, 0, 0, Math.PI / 2), gelap()],            // sabuk lapis baja
      [T(new THREE.TorusGeometry(.085, .018, 8, S(24)), 0, 0, .2), gelap()],
      [T(new THREE.SphereGeometry(.07, S(16), S(10)), 0, 0, .21), nyala(0xffffaa)],
      [T(new THREE.SphereGeometry(.03, 8, 6), 0, 0, .27), nyala(0xffffff)],
    ]));
    const cincin = [[new THREE.TorusGeometry(.38, .028, 8, S(40)), halus(0x33e0ff, .5)]];
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2;
      cincin.push([T(new THREE.CylinderGeometry(.045, .06, .11, S(12)), Math.cos(a) * .38, Math.sin(a) * .38, 0, Math.PI / 2), gelap()]);   // pendorong di cincin
      cincin.push([T(new THREE.CircleGeometry(.04, S(12)), Math.cos(a) * .38, Math.sin(a) * .38, -.056, 0, Math.PI), nyala(0x66f0ff)]); }
    const ring = rakit(cincin); model.add(ring); g.userData.spin = ring;
  } else if (tipe === 'fast') {      // pesawat pemburu: badan ramping, kanopi, sayap menyapu, dua mesin menyala
    const sayapGeo = k => { const sh = new THREE.Shape(); sh.moveTo(0, .14); sh.lineTo(k * .36, -.12); sh.lineTo(k * .36, -.2); sh.lineTo(0, -.16); sh.closePath();
      return new THREE.ExtrudeGeometry(sh, { depth: .018, bevelEnabled: true, bevelSize: .006, bevelThickness: .006, bevelSegments: 1 }); };
    const d = [
      [T(bubut([[0, -.3], [.07, -.28], [.11, -.12], [.12, .05], [.08, .2], [0, .32]], S(14)), 0, 0, 0, Math.PI / 2), logam(0x55ff66, .35)],
      [T(new THREE.SphereGeometry(.07, S(16), S(10), 0, Math.PI * 2, 0, Math.PI / 2), 0, .06, .08, 0, 0, 0, 1).scale(1, 1, 1.8), kaca(0x9ff7ff)],
    ];
    for (const k of [-1, 1]) {
      d.push([T(sayapGeo(k), 0, 0, 0, Math.PI / 2).translate(0, -.009, 0), logam(0x22aa44, .3)]);
      d.push([T(new THREE.CylinderGeometry(.04, .05, .2, S(12)), k * .13, -.02, -.2, Math.PI / 2), gelap()]);
      d.push([T(new THREE.CircleGeometry(.036, S(12)), k * .13, -.02, -.301, 0, Math.PI), nyala(0x9dffb0)]);
    }
    model.add(rakit(d));
  } else if (tipe === 'tank') {      // bola berlapis baja dengan duri, sabuk lapis, dan lubang nyala
    const d = [[new THREE.IcosahedronGeometry(.4, 1), logam(0xff8833, .3, .35)],
      [T(new THREE.TorusGeometry(.405, .035, 6, S(32)), 0, 0, 0, Math.PI / 2), gelap()],
      [T(new THREE.TorusGeometry(.405, .035, 6, S(32)), 0, 0, 0, 0, Math.PI / 2), gelap()]];
    const arah = [[1, 1, 1], [-1, 1, 1], [1, -1, 1], [-1, -1, 1], [1, 1, -1], [-1, 1, -1], [1, -1, -1], [-1, -1, -1]].map(v => new THREE.Vector3(...v).normalize());
    const up = new THREE.Vector3(0, 1, 0), m4 = new THREE.Matrix4(), qq = new THREE.Quaternion();
    for (const v of arah) {
      const duri = new THREE.ConeGeometry(.07, .26, S(10)); duri.translate(0, .52, 0); qq.setFromUnitVectors(up, v); duri.applyMatrix4(m4.makeRotationFromQuaternion(qq)); d.push([duri, halus(0xffdd55, .5)]);
      const lub = new THREE.CylinderGeometry(.05, .05, .02, S(10)); lub.translate(0, .4, 0); lub.applyMatrix4(m4.makeRotationFromQuaternion(qq.setFromUnitVectors(up, v.clone().multiplyScalar(-1).applyAxisAngle(up, .8).normalize()))); d.push([lub, nyala(0xffb347)]);
    }
    const b = rakit(d); model.add(b); g.userData.spin = b;
  } else {                           // ufo: piringan bubut berlekuk, kubah kaca, cincin lampu, cahaya bawah
    const d = [[bubut([[0, -.14], [.35, -.12], [.7, -.05], [.86, 0], [.7, .05], [.42, .09], [.3, .1], [0, .1]], S(40)), logam(0xffcc33, .25, .25)],
      [T(new THREE.TorusGeometry(.8, .02, 6, S(48)), 0, 0, 0, Math.PI / 2), gelap()],
      [T(new THREE.CircleGeometry(.3, S(32)), 0, -.141, 0, Math.PI / 2), nyala(0x66ffee)]];
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; d.push([T(new THREE.SphereGeometry(.045, 8, 6), Math.cos(a) * .78, -.02, Math.sin(a) * .78), nyala(i % 2 ? 0xff3355 : 0x33ff77)]); }
    const disc = rakit(d); model.add(disc);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(.34, S(32), S(14), 0, Math.PI * 2, 0, Math.PI / 2), kaca(0x88ffff)); dome.position.y = .09; disc.add(dome);
    g.userData.spin = disc;
  }
  g.userData.spinPart = g.userData.spin;
  return g;
}

// ---------- kapal induk ----------
export function buatBos({ skala = 1, ringan = false, lampu = [0x33e0ff, 0xff3fa4] } = {}) {
  const q = ringan ? .6 : 1, S = n => Math.max(8, Math.round(n * q));
  const grup = new THREE.Group(); grup.scale.setScalar(skala);
  const d = [[bubut([[0, -.22], [.9, -.2], [1.75, -.08], [2.4, 0], [2.3, .08], [1.6, .2], [.8, .25], [0, .25]], S(48)), logam(0x5a2d9c, .25, .25)],
    [T(new THREE.TorusGeometry(2.36, .05, 8, S(64)), 0, 0, 0, Math.PI / 2), gelap()],
    [T(new THREE.TorusGeometry(1.4, .04, 8, S(48)), 0, .21, 0, Math.PI / 2), gelap()]];
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + .26;      // menara meriam
    d.push([T(new THREE.CylinderGeometry(.16, .2, .18, S(12)), Math.cos(a) * 1.6, .28, Math.sin(a) * 1.6), gelap()]);
    d.push([T(new THREE.CylinderGeometry(.035, .035, .4, 8), Math.cos(a) * 1.6 + Math.cos(a) * .15, .34, Math.sin(a) * 1.6 + Math.sin(a) * .15, 0, -a, Math.PI / 2 - .3), gelap()]); }
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; d.push([T(new THREE.BoxGeometry(.22, .05, .05), Math.cos(a) * 2.05, -.1, Math.sin(a) * 2.05, 0, -a), nyala(0x9a6bff)]); } // panel nyala bawah
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; d.push([T(new THREE.SphereGeometry(.08, 8, 6), Math.cos(a) * 2.2, -.05, Math.sin(a) * 2.2), nyala(lampu[i % lampu.length])]); }
  const hull = rakit(d); grup.add(hull);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(.9, S(32), S(14), 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), halus(0xff3fa4, .45)); dome.position.y = -.2; grup.add(dome);
  const domeRing = new THREE.Mesh(new THREE.TorusGeometry(.92, .045, 8, S(48)), gelap()); domeRing.rotation.x = Math.PI / 2; domeRing.position.y = -.2; grup.add(domeRing);
  const core = new THREE.Mesh(new THREE.SphereGeometry(.45, S(24), S(16)), new THREE.MeshBasicMaterial({ color: 0xff2255, toneMapped: false })); core.position.y = -.75; grup.add(core);
  return { grup, hull, dome, core };
}

// ---------- ledakan (pool instanced) ----------
function teksturBulat(dalam, luar) { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, dalam); g.addColorStop(.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, luar); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c); }
function teksturCincin() { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 40, 64, 64, 62); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.7, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c); }
export class Ledakan {
  constructor(scene, { ringan = false, maks = ringan ? 240 : 420 } = {}) {
    this.scene = scene; this.maks = maks; this.n = 0; this.ringan = ringan;
    const geo = new THREE.TetrahedronGeometry(1, 0);
    this.im = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ toneMapped: false }), maks);
    this.im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.im.count = 0; this.im.frustumCulled = false;
    this.im.setColorAt(0, new THREE.Color()); scene.add(this.im);
    this.p = Array.from({ length: maks }, () => ({ pos: new THREE.Vector3(), v: new THREE.Vector3(), q: new THREE.Quaternion(), w: new THREE.Vector3(), t: 0, life: 0, s: 0 }));
    this.texF = teksturBulat('rgba(255,255,255,1)', 'rgba(255,255,255,0)'); this.texR = teksturCincin();
    this.spr = []; for (let i = 0; i < 12; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: i % 2 ? this.texR : this.texF, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      s.visible = false; s.userData = { t: 0, life: 1, s0: 0, s1: 0, cincin: i % 2 === 1 }; scene.add(s); this.spr.push(s); }
    this._m = new THREE.Matrix4(); this._s = new THREE.Vector3(); this._c = new THREE.Color(); this._dq = new THREE.Quaternion(); this._e = new THREE.Euler();
  }
  _sprite(cincin, pos, warna, s0, s1, life) {
    const s = this.spr.find(x => !x.visible && x.userData.cincin === cincin) || this.spr.filter(x => x.userData.cincin === cincin).sort((a, b) => b.userData.t / b.userData.life - a.userData.t / a.userData.life)[0];
    s.visible = true; s.position.copy(pos); s.material.color.set(warna); Object.assign(s.userData, { t: 0, life, s0, s1 }); s.scale.setScalar(s0);
  }
  meledak(pos, warna = 0xffaa33, n = 24, ukuran = .06, laju = 3.5) {
    if (this.ringan) n = Math.round(n * .7);
    const c = this._c;
    for (let i = 0; i < n; i++) {
      if (this.n >= this.maks) this._buang(0);
      const k = this.n++, p = this.p[k], percik = i % 4 === 0;     // seperempat serpihan = percikan putih-kuning cepat
      p.pos.copy(pos); p.v.randomDirection().multiplyScalar((percik ? 1.6 : THREE.MathUtils.randFloat(.35, 1)) * laju);
      p.w.set(Math.random() - .5, Math.random() - .5, Math.random() - .5).multiplyScalar(14); p.q.random();
      p.t = 0; p.life = THREE.MathUtils.randFloat(.5, .95) * (percik ? .6 : 1); p.s = ukuran * (percik ? .45 : THREE.MathUtils.randFloat(.6, 1.4));
      this.im.setColorAt(k, percik ? c.set(0xfff2b0) : c.set(warna).offsetHSL(0, 0, (Math.random() - .5) * .25));
    }
    this.im.instanceColor.needsUpdate = true;
    this._sprite(false, pos, 0xffffff, ukuran * 3, ukuran * 14, .28);
    this._sprite(false, pos, warna, ukuran * 4, ukuran * 18, .45);
    this._sprite(true, pos, warna, ukuran * 2, ukuran * 26, .5);
  }
  _buang(k) { const last = --this.n; if (k !== last) { const a = this.p[k]; this.p[k] = this.p[last]; this.p[last] = a; this.im.getColorAt(last, this._c); this.im.setColorAt(k, this._c); } }
  update(dt) {
    for (let k = this.n - 1; k >= 0; k--) {
      const p = this.p[k]; p.t += dt; if (p.t >= p.life) { this._buang(k); continue; }
      p.v.multiplyScalar(1 - 1.6 * dt); p.v.y -= 1.2 * dt; p.pos.addScaledVector(p.v, dt);
      this._dq.setFromEuler(this._e.set(p.w.x * dt, p.w.y * dt, p.w.z * dt)); p.q.multiply(this._dq);
      const f = 1 - p.t / p.life; this._s.setScalar(p.s * Math.max(.05, f));
      this.im.setMatrixAt(k, this._m.compose(p.pos, p.q, this._s));
    }
    this.im.count = this.n; this.im.instanceMatrix.needsUpdate = true; if (this.im.instanceColor) this.im.instanceColor.needsUpdate = true;
    for (const s of this.spr) if (s.visible) { const u = s.userData; u.t += dt; const k = u.t / u.life;
      if (k >= 1) { s.visible = false; continue; } s.scale.setScalar(u.s0 + (u.s1 - u.s0) * (1 - (1 - k) ** 3)); s.material.opacity = (1 - k) * (u.cincin ? .8 : 1); }
  }
}
