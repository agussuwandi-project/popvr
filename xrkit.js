/* xrkit.js — perlengkapan pameran bersama untuk semua aplikasi UVERS XR Lab.
   Dipasang dari tiap halaman:
     import('./xrkit.js').then(m => m.pasang(renderer, scene, camera, { game: 'bola', tutorial: [...] }));
   Isi:
   1. FPS meter (?fps=1, atau localStorage uvers_fps=1) — tampil di VR dan di layar laptop.
   2. Kualitas adaptif — bila FPS turun terus, bayangan dimatikan; bila masih berat, sesi VR berikutnya
      memakai resolusi 80% (diingat per halaman).
   3. Reset otomatis — headset dilepas lama / diam terlalu lama → keluar VR dan halaman dimuat ulang,
      jadi pengunjung berikutnya mulai dari awal.
   4. Tutorial singkat di dalam VR saat masuk.
   5. Tangan terlihat (hand tracking) untuk halaman yang belum menggambarnya.
   6. window.uversSkor(game, nilai, teks, kecilLebihBaik) — kirim skor ke papan skor bersama (papan.html). */
import * as THREE from 'three';

const L = window.L || ((a) => a);
export const DB_URL = 'https://uvers-xr-default-rtdb.asia-southeast1.firebasedatabase.app';
const FONT = "'Space Grotesk', system-ui, sans-serif";
const q = new URLSearchParams(location.search);
const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

// ---------- identitas headset (untuk papan skor) ----------
if (q.get('hs')) lsSet('uvers_hs', q.get('hs').slice(0, 12));
export function namaHeadset() {
  let h = lsGet('uvers_hs');
  if (!h) { h = 'Q-' + Math.random().toString(36).slice(2, 4).toUpperCase(); lsSet('uvers_hs', h); }
  return h;
}
const tanggal = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

// ---------- papan skor: kirim lewat REST, antrekan bila offline ----------
const QKEY = 'uvers_skor_antre';
async function kirim(entry) {
  const r = await fetch(`${DB_URL}/papan/${entry.d}/${entry.g}.json`, { method: 'POST', body: JSON.stringify(entry.v) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
}
async function kurasAntrean() {
  let a = []; try { a = JSON.parse(lsGet(QKEY) || '[]'); } catch (e) {}
  if (!a.length) return;
  const sisa = [];
  for (const e of a) { try { await kirim(e); } catch (err) { sisa.push(e); } }
  lsSet(QKEY, JSON.stringify(sisa.slice(-50)));
}
window.uversSkor = function (game, nilai, teks, kecilLebihBaik = false) {
  if (!Number.isFinite(nilai)) return;
  const e = { d: tanggal(), g: game, v: { s: nilai, t: String(teks || nilai).slice(0, 60), h: namaHeadset(), w: Date.now(), k: kecilLebihBaik ? 1 : 0 } };
  kirim(e).catch(() => { let a = []; try { a = JSON.parse(lsGet(QKEY) || '[]'); } catch (err) {} a.push(e); lsSet(QKEY, JSON.stringify(a.slice(-50))); });
};
setTimeout(kurasAntrean, 4000); setInterval(kurasAntrean, 60000);

// ---------- panel kanvas kecil ----------
function panel(w, h, cw, ch) {
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const ctx = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
  mesh.renderOrder = 1500; return { mesh, ctx, tex, c };
}
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function wrap(ctx, text, x, y, maxW, lh) {
  const words = text.split(' '); let line = '';
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y); line = w; y += lh; } else line = t; }
  if (line) ctx.fillText(line, x, y); return y;
}

export function pasang(renderer, scene, camera, opsi = {}) {
  const game = opsi.game || location.pathname.split('/').pop().replace('.html', '') || 'menu';
  const parent = opsi.parent || scene;              // FPV: rig robot
  const IDLE = opsi.idle ?? 75;                      // detik diam sebelum reset (0 = mati)
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--a1').trim() || '#ff3fa4';
  const head = new THREE.Vector3(), headQ = new THREE.Quaternion(), tmp = new THREE.Vector3();
  const xrCam = () => renderer.xr.getCamera();

  // ===== 2. kualitas: pakai resolusi 80% bila sesi sebelumnya berat =====
  const QK = 'uvers_q_' + game;
  if (lsGet(QK) === 'low') { try { renderer.xr.setFramebufferScaleFactor(0.8); } catch (e) {} }
  let level = lsGet(QK) === 'low' ? 1 : 0;
  function turunkan() {
    if (level === 0) { // matikan bayangan
      scene.traverse(o => { if (o.isLight && o.castShadow) o.castShadow = false; });
      renderer.shadowMap.autoUpdate = false; level = 1;
    } else if (level === 1) { lsSet(QK, 'low'); level = 2; } // berlaku di sesi berikutnya
  }

  // ===== 1. FPS meter =====
  const tampilFps = q.get('fps') === '1' || lsGet('uvers_fps') === '1';
  if (q.get('fps') === '1') lsSet('uvers_fps', '1'); if (q.get('fps') === '0') lsSet('uvers_fps', '0');
  let fpsP = null, dom = null;
  if (tampilFps) {
    fpsP = panel(0.16, 0.06, 320, 120); scene.add(fpsP.mesh);
    dom = document.createElement('div'); dom.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:80;font:600 12px/1.3 ui-monospace,monospace;color:#7dffa0;background:rgba(0,0,0,.6);padding:6px 9px;border-radius:8px;pointer-events:none';
    document.body.appendChild(dom);
  }
  let lastT = 0, frames = 0, winT = performance.now(), fps = 0, worst = 0, lowWins = 0, gapReset = false;
  const stat = { fps: 0, worstMs: 0, level: () => level };
  window.uversPerf = stat;

  // ===== 3. reset otomatis =====
  let lastActive = performance.now(), lastPose = null, warn = null, warnT = 0;
  function aktif() { lastActive = performance.now(); if (warn) { warn.mesh.visible = false; warnT = 0; } }
  for (let i = 0; i < 2; i++) { const c = renderer.xr.getController(i); c.addEventListener('selectstart', aktif); c.addEventListener('squeezestart', aktif); }
  let sedangReset = false;
  function resetPenuh() {
    if (sedangReset) return; sedangReset = true;
    if (opsi.onReset) return opsi.onReset(); // untuk pengujian
    try { renderer.xr.getSession()?.end(); } catch (e) {}
    setTimeout(() => location.reload(), 400);
  }
  if (IDLE > 0) { warn = panel(0.5, 0.2, 1000, 400); warn.mesh.visible = false; parent.add(warn.mesh); }

  // ===== 4. tutorial =====
  let tut = null, tutT = 0, sesiKe = 0;
  if (opsi.tutorial?.length) {
    tut = panel(0.62, 0.36, 1240, 720); tut.mesh.visible = false; parent.add(tut.mesh);
    const { ctx, c } = tut; ctx.clearRect(0, 0, c.width, c.height);
    const g = ctx.createLinearGradient(0, 0, c.width, c.height); g.addColorStop(0, 'rgba(38,34,78,.92)'); g.addColorStop(1, 'rgba(8,12,30,.92)');
    ctx.fillStyle = g; rr(ctx, 8, 8, c.width - 16, c.height - 16, 44); ctx.fill();
    ctx.strokeStyle = accent; ctx.lineWidth = 6; rr(ctx, 8, 8, c.width - 16, c.height - 16, 44); ctx.stroke();
    ctx.fillStyle = accent; ctx.font = `bold 40px ${FONT}`; ctx.fillText(L('CARA MAIN', 'HOW TO PLAY'), 64, 92);
    let y = 170;
    opsi.tutorial.slice(0, 4).forEach(([id, en], i) => {
      ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(92, y - 14, 30, 0, 7); ctx.fill();
      ctx.fillStyle = '#0b0d18'; ctx.font = `bold 34px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), 92, y - 2); ctx.textAlign = 'left';
      ctx.fillStyle = '#f4f6ff'; ctx.font = `600 38px ${FONT}`; y = wrap(ctx, L(id, en), 146, y, c.width - 210, 48) + 82;
    });
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = `30px ${FONT}`; ctx.fillText(L('Tarik trigger untuk menutup', 'Pull the trigger to close'), 64, c.height - 56);
    tut.tex.needsUpdate = true;
    for (let i = 0; i < 2; i++) renderer.xr.getController(i).addEventListener('selectstart', () => { if (tut.mesh.visible && tutT > 1.2 && tutT < 11) tutT = 11; });
  }
  function letakkanDepan(mesh, jarak, turun) { // di depan kepala (hanya arah horizontal), dalam koordinat parent
    const cam = xrCam(); cam.getWorldPosition(head); cam.getWorldQuaternion(headQ);
    const f = tmp.set(0, 0, -1).applyQuaternion(headQ); f.y = 0; if (f.lengthSq() < 1e-6) f.set(0, 0, -1); f.normalize();
    const p = head.clone().addScaledVector(f, jarak); p.y -= turun;
    parent.worldToLocal(p); mesh.position.copy(p);
    const lookW = head.clone(); lookW.y -= turun; const look = parent.worldToLocal(lookW);
    mesh.lookAt(parent === scene ? lookW : parent.localToWorld(look.clone()));
  }
  let sesiMulai = 0, tunggu = 0;
  renderer.xr.addEventListener('sessionstart', () => { sesiKe++; sedangReset = false; sesiMulai = performance.now(); tunggu = 6; lastActive = performance.now(); lastPose = null; gapReset = false;
    if (tut) { tutT = -(sesiKe === 1 ? 4.3 : 0.8); } }); // tunggu animasi logo 3D di sesi pertama
  renderer.xr.addEventListener('sessionend', () => { if (tut) tut.mesh.visible = false; if (warn) warn.mesh.visible = false; });

  // ===== 5. tangan =====
  const hands = [];
  if (opsi.tangan !== false) {
    const jm = new THREE.MeshStandardMaterial({ color: 0xf0e6ff, roughness: .5, emissive: new THREE.Color(accent).multiplyScalar(.25) });
    const tip = new THREE.MeshStandardMaterial({ color: new THREE.Color(accent), emissive: new THREE.Color(accent).multiplyScalar(.5) });
    const geo = new THREE.SphereGeometry(1, 10, 8);
    for (let i = 0; i < 2; i++) {
      const h = renderer.xr.getHand(i); parent.add(h);
      hands.push({ h, balls: {}, geo, tip, jm }); // bola sendi ditempel ke grup sendi yang dibuat three.js saat berjalan
    }
  }

  // ===== loop (menumpang scene.onBeforeRender, menjaga yang sudah ada) =====
  const prev = scene.onBeforeRender;
  scene.onBeforeRender = function (...args) {
    if (prev) prev.apply(this, args);
    const now = performance.now(), dt = (now - lastT) / 1000;
    if (now - lastT < 3) return; // render kedua di frame yang sama (mis. kamera termal FPV)
    lastT = now;
    const xr = renderer.xr.isPresenting;
    // FPS
    frames++; if (dt < 1) worst = Math.max(worst, dt * 1000);
    if (now - winT >= 1000) {
      fps = frames * 1000 / (now - winT); frames = 0; winT = now; stat.fps = fps; stat.worstMs = worst;
      const target = xr ? (renderer.xr.getSession()?.frameRate || 72) : 60;
      if (xr && now - sesiMulai > 8000) { lowWins = fps < target * 0.85 ? lowWins + 1 : 0; if (lowWins >= 4) { turunkan(); lowWins = 0; } }
      if (fpsP) { const { ctx, c } = fpsP; ctx.clearRect(0, 0, c.width, c.height); ctx.fillStyle = 'rgba(0,0,0,.65)'; rr(ctx, 4, 4, c.width - 8, c.height - 8, 20); ctx.fill();
        ctx.fillStyle = fps >= target * .9 ? '#7dffa0' : fps >= target * .7 ? '#ffd23f' : '#ff6b8a'; ctx.font = `bold 52px ui-monospace,monospace`; ctx.fillText(`${fps.toFixed(0)} fps`, 20, 62);
        ctx.fillStyle = '#c9cfe6'; ctx.font = `24px ui-monospace,monospace`; ctx.fillText(`maks ${worst.toFixed(0)} ms · Q${level} · ${target}Hz`, 20, 100); fpsP.tex.needsUpdate = true; }
      if (dom) dom.textContent = `${fps.toFixed(0)} fps · maks ${worst.toFixed(0)} ms · Q${level}${xr ? ' · XR' : ''}`;
      worst = 0;
    }
    if (fpsP) { const cam = xrCam(); cam.getWorldPosition(head); cam.getWorldQuaternion(headQ); fpsP.mesh.position.copy(head).add(tmp.set(-.14, -.1, -.5).applyQuaternion(headQ)); fpsP.mesh.quaternion.copy(headQ); fpsP.mesh.visible = xr; }
    if (!xr) return;
    for (const hd of hands) { const J = hd.h.joints; if (!J) continue; for (const n in J) if (!hd.balls[n]) { const m = new THREE.Mesh(hd.geo, n.endsWith('tip') ? hd.tip : hd.jm); m.scale.setScalar(n.endsWith('tip') ? .009 : .007); J[n].add(m); hd.balls[n] = m; } }
    if (tunggu > 0) { tunggu--; return; } // pose kepala belum stabil di beberapa frame pertama
    // headset sempat dilepas (frame berhenti lama) → pengunjung baru: reset
    if (IDLE > 0 && dt > 25 && !gapReset) { gapReset = true; resetPenuh(); return; }
    // aktivitas: gerak kepala
    const cam = xrCam(); cam.getWorldPosition(head); cam.getWorldQuaternion(headQ);
    if (!lastPose) lastPose = { p: head.clone(), q: headQ.clone() };
    else if (head.distanceTo(lastPose.p) > 0.03 || headQ.angleTo(lastPose.q) > 0.08) { lastPose.p.copy(head); lastPose.q.copy(headQ); aktif(); }
    if (warn && IDLE > 0) {
      const diam = (now - lastActive) / 1000;
      if (diam > IDLE) {
        if (!warn.mesh.visible) { warn.mesh.visible = true; letakkanDepan(warn.mesh, 0.9, 0.05); }
        const sisa = Math.ceil(IDLE + 10 - diam);
        if (sisa !== warnT) { warnT = sisa; const { ctx, c } = warn; ctx.clearRect(0, 0, c.width, c.height); ctx.fillStyle = 'rgba(12,10,28,.92)'; rr(ctx, 6, 6, c.width - 12, c.height - 12, 40); ctx.fill();
          ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 6; rr(ctx, 6, 6, c.width - 12, c.height - 12, 40); ctx.stroke(); ctx.textAlign = 'center';
          ctx.fillStyle = '#ffd23f'; ctx.font = `bold 64px ${FONT}`; ctx.fillText(L('Masih bermain?', 'Still playing?'), c.width / 2, 130);
          ctx.fillStyle = '#f4f6ff'; ctx.font = `40px ${FONT}`; ctx.fillText(L(`Gerakkan kepala atau tekan trigger · ${sisa}`, `Move your head or press the trigger · ${sisa}`), c.width / 2, 230);
          ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = `32px ${FONT}`; ctx.fillText(L('Kalau tidak, aplikasi kembali ke awal', 'Otherwise the app restarts'), c.width / 2, 310); warn.tex.needsUpdate = true; }
        if (diam > IDLE + 10) { resetPenuh(); return; }
      }
    }
    // tutorial
    if (tut) {
      if (tutT < 0) { tutT += dt; if (tutT >= 0) { letakkanDepan(tut.mesh, 1.2, 0.22); tut.mesh.visible = true; tut.mesh.material.opacity = 0; } }
      else if (tut.mesh.visible) { tutT += dt; const o = tutT < .4 ? tutT / .4 : tutT > 11 ? Math.max(0, 1 - (tutT - 11) / .5) : 1; tut.mesh.material.opacity = o; if (o <= 0 && tutT > 1) tut.mesh.visible = false; }
    }
  };
  return { stat, turunkan, namaHeadset };
}
