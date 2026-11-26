// xiaohuo-vr.js — pengendali Xiao Huo (hologram 2D, pose sama dengan web) di dalam sesi VR. Dipasang oleh xrkit.js.
//  • Muncul di depan saat masuk VR, melambai, membacakan sapaan + tujuan + cara main + tips (naskah dari xiaohuo.js).
//  • Lalu menepi ke kiri-bawah pandangan dan mengikuti dengan halus.
//  • Bisa DIPEGANG & DIPINDAH: dekatkan controller lalu tahan GRIP (atau cubit bila pakai tangan), geser, lepas → diam di situ.
//    Controller sengaja hanya lewat grip: trigger dipakai game untuk menembak/menekan, jadi tidak ikut memegang maskot.
//  • Bereaksi saat skor masuk papan dan saat peringatan "Masih bermain?".
import * as THREE from 'three';
import { buatXiaoHuo } from './xiaohuo3d.js';

const FONT = "'Space Grotesk', system-ui, sans-serif";
export function pasang(renderer, scene, parent, opsi = {}) {
  const L = (id, en) => (window.L ? window.L(id, en) : id);
  const SKALA = .42, xh = buatXiaoHuo();
  xh.grup.scale.setScalar(SKALA); xh.grup.visible = false; parent.add(xh.grup);
  window.uversXiaoGrup = xh.grup;                                  // FPV menyembunyikannya dari kamera termal

  // ---------- gelembung bicara (panel kanvas) ----------
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 400; const ctx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const bub = new THREE.Mesh(new THREE.PlaneGeometry(.5, .195), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
  bub.renderOrder = 1600; bub.visible = false; parent.add(bub);
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function gambarGelembung(teks, kecil) {
    ctx.clearRect(0, 0, cv.width, cv.height);
    const g = ctx.createLinearGradient(0, 0, cv.width, cv.height); g.addColorStop(0, 'rgba(30,22,64,.93)'); g.addColorStop(1, 'rgba(8,10,28,.95)');
    ctx.fillStyle = g; rr(10, 10, cv.width - 20, cv.height - 20, 40); ctx.fill();
    ctx.shadowColor = '#3ee6ff'; ctx.shadowBlur = 18; ctx.strokeStyle = 'rgba(62,230,255,.85)'; ctx.lineWidth = 5; rr(10, 10, cv.width - 20, cv.height - 20, 40); ctx.stroke(); ctx.shadowBlur = 0;
    for (let y = 14; y < cv.height - 14; y += 6) { ctx.fillStyle = 'rgba(62,230,255,.035)'; ctx.fillRect(14, y, cv.width - 28, 2); }  // garis pindai
    const gr = ctx.createLinearGradient(56, 0, 360, 0); gr.addColorStop(0, '#3ee6ff'); gr.addColorStop(1, '#ff3fa4');
    ctx.fillStyle = gr; ctx.font = `bold 34px ${FONT}`; ctx.fillText('● XIAO HUO', 56, 74);
    if (kecil) { ctx.fillStyle = 'rgba(244,246,255,.5)'; ctx.font = `26px ${FONT}`; ctx.textAlign = 'right'; ctx.fillText(kecil, cv.width - 56, 74); ctx.textAlign = 'left'; }
    ctx.fillStyle = '#f4f6ff'; ctx.font = `600 40px ${FONT}`;
    const kata = teks.split(' '); let baris = '', y = 140;
    for (const k of kata) { const t = baris ? baris + ' ' + k : k; if (ctx.measureText(t).width > cv.width - 112 && baris) { ctx.fillText(baris, 56, y); baris = k; y += 52; } else baris = t; }
    if (baris) ctx.fillText(baris, 56, y);
    tex.needsUpdate = true;
  }

  // ---------- naskah ----------
  const N = window.XiaoHuo?.naskah?.[opsi.game];
  function antreanSapa() {
    const q = [{ t: ['Halo! Aku Xiao Huo, si Api Kecil dari TIF. Aku temanimu di sini!', "Hi! I'm Xiao Huo, the Little Fire of TIF. I'll keep you company!"], e: 'senang', lambai: true }];
    if (N) { q.push({ t: N.tujuan, e: 'normal' }, { t: N.kontrol, e: 'normal' }); N.tips.forEach(t => q.push({ t, e: 'senang' })); }
    else (opsi.tutorial || []).forEach(t => q.push({ t, e: 'normal' }));
    q.push({ t: ['Aku tunggu di samping ya. Kalau menghalangi, tahan GRIP di dekatku lalu geser!', "I'll wait at your side. If I'm in the way, hold GRIP near me and move me!"], e: 'senang' });
    return q;
  }

  // ---------- keadaan ----------
  let mode = 'sembunyi', modeSblm = 'ikut', antre = [], tBaris = 0, durBaris = 0, tTunggu = -1, peringatanAktif = false;
  const pos = new THREE.Vector3(), target = new THREE.Vector3(), head = new THREE.Vector3(), headQ = new THREE.Quaternion(), f = new THREE.Vector3(), kanan = new THREE.Vector3(), tmp = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0), taruhLokal = new THREE.Vector3();
  const xrCam = () => renderer.xr.getCamera();
  function bacaKepala() { const c = xrCam(); c.getWorldPosition(head); c.getWorldQuaternion(headQ); f.set(0, 0, -1).applyQuaternion(headQ); f.y = 0; if (f.lengthSq() < 1e-6) f.set(0, 0, -1); f.normalize(); kanan.crossVectors(f, UP).normalize(); }
  const posDepan = (v) => v.copy(head).addScaledVector(f, 1.0).addScaledVector(UP, -.8);
  const posIkut = (v) => v.copy(head).addScaledVector(f, .78).addScaledVector(kanan, -.42).addScaledVector(UP, -.72);
  function pip(n) { try { window.XiaoHuo?.pip?.(n); } catch (e) {} }

  function bicara(item) {
    if (!item) return;
    gambarGelembung(L(item.t[0], item.t[1]), antre.length ? `${antre.length}+ · trigger ▸` : '');
    bub.visible = true; xh.ekspresi(item.e || 'normal'); xh.lompat(); xh.lambai(!!item.lambai); pip(2);
    tBaris = 0; const s = L(item.t[0], item.t[1]); durBaris = Math.max(3.6, s.length * .06);
  }
  function lanjut() {
    if (antre.length) { bicara(antre.shift()); return; }
    bub.visible = false; xh.lambai(false); xh.ekspresi('normal');
    if (mode === 'depan') mode = 'ikut';
  }

  // ---------- pegang & pindah ----------
  const tangan = [0, 1].map(i => ({ c: renderer.xr.getController(i), h: renderer.xr.getHand(i) }));
  let pegang = null; const offset = new THREE.Vector3();
  const pusatXh = (v) => xh.grup.getWorldPosition(v).addScaledVector(UP, .22);
  function posisiAlat(t, v) { // ujung telunjuk bila tangan dilacak, selain itu posisi controller
    const tip = t.h?.joints?.['index-finger-tip']; if (tip && tip.visible !== false && t.h.visible) return tip.getWorldPosition(v);
    return t.c.getWorldPosition(v);
  }
  function mulaiPegang(i, via) {
    if (!xh.grup.visible || pegang) return false;
    const p = posisiAlat(tangan[i], new THREE.Vector3()); if (p.distanceTo(pusatXh(tmp)) > .24) return false;
    pegang = { i, via }; offset.copy(xh.grup.getWorldPosition(new THREE.Vector3())).sub(p); bub.visible = false; xh.ekspresi('senang'); xh.lambai(false); pip(1); return true;
  }
  function lepasPegang(i, via) {
    if (!pegang || pegang.i !== i || pegang.via !== via) return; pegang = null; mode = 'taruh'; taruhLokal.copy(xh.grup.position);
    xh.lompat(); antre = []; bicara({ t: ['Di sini ya! Panggil aku dengan memegangku lagi.', 'Right here! Grab me again any time.'], e: 'senang' });
  }
  tangan.forEach((t, i) => {
    // controller: pegang hanya dengan GRIP; tangan (tanpa tombol grip): pegang dengan cubit
    const pakaiTangan = (e) => !!e?.data?.hand;
    t.c.addEventListener('squeezestart', () => mulaiPegang(i, 'grip'));
    t.c.addEventListener('squeezeend', () => lepasPegang(i, 'grip'));
    t.c.addEventListener('selectstart', (e) => { if (pakaiTangan(e) && mulaiPegang(i, 'cubit')) return; if (bub.visible && tBaris > 1) lanjut(); });
    t.c.addEventListener('selectend', () => lepasPegang(i, 'cubit'));
  });

  // ---------- skor masuk papan → rayakan ----------
  const kirimAsli = window.uversSkor;
  if (kirimAsli && !kirimAsli.xh) {
    window.uversSkor = function (game, nilai, teks, kecil) { kirimAsli.apply(this, arguments);
      if (!renderer.xr.isPresenting || !xh.grup.visible) return;
      antre = []; bicara({ t: [`Skormu ${teks || nilai} masuk Papan Skor! Hebat!`, `Your score ${teks || nilai} is on the Scoreboard! Awesome!`], e: 'sertifikat' }); };
    window.uversSkor.xh = true;
  }

  // ---------- API untuk xrkit ----------
  return {
    xh,
    mulai(tunda) { mode = 'sembunyi'; tTunggu = tunda; antre = antreanSapa(); },
    sembunyi() { mode = 'sembunyi'; xh.grup.visible = false; bub.visible = false; pegang = null; tTunggu = -1; },
    peringatan(sisa) {
      if (sisa == null) { if (peringatanAktif) { peringatanAktif = false; mode = modeSblm; xh.ekspresi('normal'); bub.visible = false; } return; }
      if (!peringatanAktif) { peringatanAktif = true; modeSblm = mode === 'depan' ? 'ikut' : mode; mode = 'depan'; antre = []; xh.grup.visible = true; }
      xh.ekspresi('cemberut'); bub.visible = true; tBaris = 0; durBaris = 99;
      gambarGelembung(L(`Masih bermain? Gerakkan kepala atau tekan trigger. Kalau tidak, aku mulai ulang dalam ${sisa} detik.`, `Still playing? Move your head or press the trigger. Otherwise I'll restart in ${sisa} s.`), `${sisa}`);
    },
    update(dt) {
      if (tTunggu >= 0) { tTunggu -= dt; if (tTunggu < 0) { bacaKepala(); mode = 'depan'; posDepan(pos); parent.worldToLocal(xh.grup.position.copy(pos)); xh.grup.visible = true; xh.muncul(); lanjut(); } }
      if (mode === 'sembunyi') return;
      xh.update(dt); bacaKepala();
      // posisi
      if (pegang) { posisiAlat(tangan[pegang.i], tmp).add(offset); parent.worldToLocal(xh.grup.position.copy(tmp)); }
      else if (mode === 'depan' || mode === 'ikut') {
        (mode === 'depan' ? posDepan : posIkut)(target); const now = xh.grup.getWorldPosition(tmp);
        const jauh = now.distanceTo(target); if (jauh > (mode === 'ikut' ? .22 : .05) || xh.grup.userData.jalan) {
          xh.grup.userData.jalan = jauh > .02; now.lerp(target, Math.min(1, dt * (mode === 'ikut' ? 2.2 : 4))); parent.worldToLocal(xh.grup.position.copy(now)); }
      } else if (mode === 'taruh') xh.grup.position.copy(taruhLokal);
      // selalu menghadap pemain (hanya putar sumbu Y)
      const wp = xh.grup.getWorldPosition(new THREE.Vector3()); const yaw = Math.atan2(head.x - wp.x, head.z - wp.z);
      const qw = new THREE.Quaternion().setFromAxisAngle(UP, yaw), pq = parent.getWorldQuaternion(new THREE.Quaternion()).invert(); xh.grup.quaternion.copy(pq.multiply(qw));
      // lambaikan tangan bila controller mendekat
      if (!pegang && !bub.visible) { let dekat = false; for (const t of tangan) if (posisiAlat(t, tmp).distanceTo(pusatXh(new THREE.Vector3())) < .3) dekat = true; xh.lambai(dekat); }
      // gelembung di atas kepala maskot, menghadap pemain
      if (bub.visible) {
        tBaris += dt; if (tBaris > durBaris && !peringatanAktif) lanjut();
        wp.addScaledVector(UP, .52 * SKALA / .42).addScaledVector(tmp.copy(head).sub(wp).setY(0).normalize(), .05);
        bub.position.copy(parent.worldToLocal(wp.clone())); bub.lookAt(head);   // lookAt three.js sudah memperhitungkan rotasi induk
      }
    },
  };
}
