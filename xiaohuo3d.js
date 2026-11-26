// xiaohuo3d.js — Xiao Huo 小火 di VR sebagai HOLOGRAM 2D (pose yang sama persis dengan versi web).
//   const xh = buatXiaoHuo();  parent.add(xh.grup);
//   xh.ekspresi('normal' | 'senang' | 'cemberut' | 'sertifikat');  xh.lambai(true);  xh.lompat();  xh.update(dt);  xh.muncul();
// Panel proyeksi menghadap +Z (pengendali memutar grup agar selalu menghadap pemain), berdiri di atas piringan proyektor.
// Tinggi ±1.1 unit (skala grup untuk ukuran sebenarnya).
import * as THREE from 'three';

const POSE = ['lambai', 'senang', 'vr', 'sertifikat', 'cemberut', 'belakang'];
const PETA = { normal: 'vr', senang: 'senang', cemberut: 'cemberut', sertifikat: 'sertifikat' };   // ekspresi → pose
const waktuU = { value: 0 }, munculU = { value: 1 }, glitchU = { value: 0 };
const TINGGI = 1.0;                                    // tinggi panel (unit)

// ---------- piringan proyektor + berkas cahaya + partikel ----------
function proyektor() {
  const g = new THREE.Group(), add = THREE.AdditiveBlending;
  const m = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: add, depthWrite: false, side: THREE.DoubleSide });
  const cincin = new THREE.Mesh(new THREE.RingGeometry(.2, .26, 48), m(0x3ee6ff, .9)); cincin.rotation.x = -Math.PI / 2; g.add(cincin);
  const cakram = new THREE.Mesh(new THREE.CircleGeometry(.2, 48), m(0x5a3df0, .45)); cakram.rotation.x = -Math.PI / 2; cakram.position.y = .002; g.add(cakram);
  const gel = new THREE.Mesh(new THREE.RingGeometry(.28, .3, 48), m(0xff3fa4, .7)); gel.rotation.x = -Math.PI / 2; g.add(gel);
  const sinar = new THREE.Mesh(new THREE.CylinderGeometry(.4, .22, 1.05, 40, 1, true).translate(0, .525, 0), new THREE.ShaderMaterial({
    uniforms: { uWaktu: waktuU, uMuncul: munculU }, transparent: true, depthWrite: false, blending: add, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `uniform float uWaktu; uniform float uMuncul; varying vec2 vU; void main(){ float a = pow(1. - vU.y, 2.) * .14 * (.8 + .2 * sin(vU.x * 60. + uWaktu * 3.));
      gl_FragColor = vec4(mix(vec3(.24,.9,1.), vec3(.48,.36,1.), vU.y), a * uMuncul); }` }));
  g.add(sinar);
  const n = 36, pos = new Float32Array(n * 3), fase = new Float32Array(n);
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, r = .05 + Math.random() * .2; pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 2] = Math.sin(a) * r; fase[i] = Math.random(); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('fase', new THREE.BufferAttribute(fase, 1));
  const titik = new THREE.Points(pg, new THREE.ShaderMaterial({ uniforms: { uWaktu: waktuU, uMuncul: munculU }, transparent: true, depthWrite: false, blending: add,
    vertexShader: `attribute float fase; uniform float uWaktu; varying float vA; void main(){ float t = fract(fase + uWaktu * .18); vec3 p = position; p.y = t * 1.05; p.xz *= 1. + t * .6; vA = sin(t * 3.14159);
      vec4 mv = modelViewMatrix * vec4(p,1.); gl_PointSize = 26. / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uMuncul; varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(.6,.97,1., smoothstep(.5,.0,d) * vA * .8 * uMuncul); }` }));
  titik.frustumCulled = false; g.add(titik);
  return { g, gel };
}

// ---------- panel hologram: gambar pose + garis pindai bergerak + kedip + glitch + efek muncul dari bawah ----------
function holoMat(tex) {
  return new THREE.ShaderMaterial({
    uniforms: { uTex: { value: tex }, uWaktu: waktuU, uMuncul: munculU, uGlitch: glitchU },
    vertexShader: `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `uniform sampler2D uTex; uniform float uWaktu; uniform float uMuncul; uniform float uGlitch; varying vec2 vU;
      float h(float n){ return fract(sin(n) * 43758.5453); }
      void main(){
        vec2 uv = vU;
        float baris = floor(uv.y * 40.);                                                  // glitch: irisan horizontal bergeser
        uv.x += (h(baris + floor(uWaktu * 24.)) - .5) * .06 * uGlitch * step(.6, h(baris * 1.7 + floor(uWaktu * 12.)));
        vec4 c = texture2D(uTex, uv);
        if (uGlitch > .01) { c.r = texture2D(uTex, uv + vec2(.012 * uGlitch, 0.)).r; c.b = texture2D(uTex, uv - vec2(.012 * uGlitch, 0.)).b; }
        float pita = .9 + .1 * smoothstep(.92, 1., fract(uv.y * 1.3 - uWaktu * .4));             // pita terang yang naik
        float kedip = .94 + .06 * sin(uWaktu * 41.) * step(.96, fract(uWaktu * .21));
        float tampak = smoothstep(uMuncul * 1.15 - .15, uMuncul * 1.15, 1. - uv.y);               // muncul dari bawah ke atas
        float garisMuncul = smoothstep(.04, .0, abs((1. - uv.y) - uMuncul * 1.15 + .1)) * (1. - uMuncul);
        c.rgb = c.rgb * pita * kedip + vec3(.4,.95,1.) * garisMuncul * 1.5;
        gl_FragColor = vec4(c.rgb, c.a * (1. - tampak) + garisMuncul * .8);
        if (gl_FragColor.a < .01) discard; }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
}

const muat = new THREE.TextureLoader(), cacheTex = {};
function teksturPose(n) {
  if (!cacheTex[n]) { cacheTex[n] = muat.load(`xiaohuo/${n}.webp`, t => { t.userData.siap = true; }); cacheTex[n].colorSpace = THREE.SRGBColorSpace; }
  return cacheTex[n];
}

export function buatXiaoHuo() {
  const grup = new THREE.Group();
  const pr = proyektor(); grup.add(pr.g);
  const badan = new THREE.Group(); badan.position.y = .08; grup.add(badan);          // melayang di atas piringan
  POSE.forEach(teksturPose);                                                          // pramuat semua pose
  const mat = holoMat(teksturPose('lambai'));
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(0, .5, 0), mat); panel.renderOrder = 5; badan.add(panel);
  let pose = 'lambai';
  function pasangPose(n) {
    if (n === pose && mat.uniforms.uTex.value === cacheTex[n]) return;
    pose = n; const t = teksturPose(n); mat.uniforms.uTex.value = t; tGlitch = .28;   // glitch singkat saat berganti pose
    const img = t.image; const asp = img && img.width ? img.width / img.height : .8; panel.scale.set(TINGGI * asp, TINGGI, 1);
  }
  panel.scale.set(TINGGI * .95, TINGGI, 1);

  let eks = 'normal', lambaiOn = false, waktu = 0, tLompat = -1, tMuncul = 1, tGlitch = 0, tGlitchAcak = 3 + Math.random() * 4;
  const pilihPose = () => pasangPose(lambaiOn ? 'lambai' : (PETA[eks] || 'vr'));
  function update(dt) {
    waktu += dt; waktuU.value = waktu;
    if (tMuncul < 1) { tMuncul = Math.min(1, tMuncul + dt / .7); munculU.value = tMuncul; }
    // tekstur bisa belum termuat saat pose dipasang: perbarui rasio lebar-tinggi begitu siap
    const img = mat.uniforms.uTex.value.image; if (img && img.width) panel.scale.x = TINGGI * img.width / img.height;
    // glitch: singkat saat ganti pose + sesekali acak
    tGlitchAcak -= dt; if (tGlitchAcak <= 0) { tGlitch = Math.max(tGlitch, .15); tGlitchAcak = 4 + Math.random() * 6; }
    tGlitch = Math.max(0, tGlitch - dt); glitchU.value = Math.min(1, tGlitch * 5);
    // melayang + sedikit bergoyang
    badan.position.y = .08 + Math.sin(waktu * 2.1) * .025; badan.rotation.z = Math.sin(waktu * 1.3) * .03;
    // lompat kecil (memantul) saat bicara
    let sx = 1, sy = 1;
    if (tLompat >= 0) { tLompat += dt; const k = tLompat / .45; if (k >= 1) tLompat = -1; else { badan.position.y += Math.sin(k * Math.PI) * .1; const q = Math.sin(k * Math.PI * 2) * .05; sx = 1 + q; sy = 1 - q; } }
    badan.scale.set(sx, sy, 1);
    pr.gel.scale.setScalar(1 + (waktu * .8 % 1) * .5); pr.gel.material.opacity = .7 * (1 - waktu * .8 % 1);
  }
  return { grup, badan, update,
    ekspresi: (n) => { eks = n; pilihPose(); },
    lambai: (on) => { if (lambaiOn !== on) { lambaiOn = on; pilihPose(); } },
    lompat: () => { tLompat = 0; },
    muncul: () => { tMuncul = 0; munculU.value = 0; },
    get pose() { return pose; } };
}
