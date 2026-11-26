/* xiaohuo.js — Xiao Huo 小火 ("Si Api Kecil"), maskot asisten TIF UVERS.
   • Web: maskot 2D di pojok kanan bawah dengan gelembung bicara + tombol pertanyaan cepat (ID/EN).
   • VR: naskah yang sama dipakai xrkit.js (model 3D) lewat window.XiaoHuo.naskah.
   Asisten berskrip: semua jawaban ditulis di sini, tanpa internet dan tanpa AI. */
(function () {
  const L = (id, en) => (window.L ? window.L(id, en) : id);
  const halaman = (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';

  // ---------- naskah ----------
  // pose: lambai | senang | vr | sertifikat | cemberut | belakang
  const SIAPA = { p: 'senang', t: ['Aku Xiao Huo 小火, panda merah dari hutan bambu Wolong. Suatu malam petir menyalakan komputer tua di pondok riset, dan sejak itu aku jatuh cinta pada cahaya digital! Sekarang aku membantu manusia dan teknologi saling bicara.',
    "I'm Xiao Huo 小火, a red panda from the bamboo forests of Wolong. One night lightning woke an old computer in a research hut, and I fell in love with digital light! Now I help people and technology talk to each other."] };
  const APA_API = { p: 'senang', t: ['Namaku 小火 artinya "Si Api Kecil". Api itu lambang kreativitas dan semangat inovasi, seperti api di logo TIF.',
    'My name 小火 means "Little Fire". Fire stands for creativity and the spirit of innovation, just like the flame in the TIF logo.'] };
  const BAHASA = { p: 'lambai', t: ['Tekan tombol ID / EN di pojok atas untuk ganti bahasa. Aku juga ikut berganti bahasa!', 'Press the ID / EN button at the top to switch language. I switch too!'] };
  const PAPAN = { p: 'sertifikat', t: ['Skor dari semua headset muncul langsung di Papan Skor. Ayo kejar peringkat 1 hari ini!', "Scores from every headset appear live on the Scoreboard. Go for today's top spot!"] };
  const MASUK_VR = { p: 'vr', t: ['Di Meta Quest, tekan tombol Masuk VR di kartu bawah. Di laptop kamu bisa melihat-lihat dulu dengan mouse.', 'On a Meta Quest, press the Enter VR button on the card below. On a laptop you can look around with the mouse first.'] };

  const APP = {
    invasi: { n: ['Invasi Portal', 'Portal Invasion'], tujuan: ['Portal alien terbuka di ruanganmu! Tembak musuh yang keluar, lalu tutup portalnya. Ini Mixed Reality, jadi ruangan aslimu tetap terlihat.', 'Alien portals are opening in your room! Shoot the enemies coming out, then close the portals. This is Mixed Reality, so you still see your real room.'],
      kontrol: ['Tarik TRIGGER untuk menembak, atau cubit jari kalau pakai tangan. Tembak portal 5x untuk menutupnya.', 'Pull the TRIGGER to shoot, or pinch if you use your hands. Hit a portal 5x to close it.'],
      tips: [['Lihat sekeliling, musuh bisa datang dari belakang!', 'Look around, enemies can come from behind!'], ['Kapal induk muncul di akhir. Bidik inti merahnya!', 'The mothership arrives at the end. Aim for its red core!']] },
    benteng: { n: ['Benteng 4 Penjuru', 'Four-Corner Fort'], tujuan: ['Main berempat! Tiap pemain menjaga satu sisi menara dan melindungi Kristal di tengah.', 'Play as four! Each player guards one side of the tower and protects the Crystal in the middle.'],
      kontrol: ['Tarik TRIGGER untuk menembak. Masukkan kode ruang 4 huruf yang sama di semua headset agar satu tim.', 'Pull the TRIGGER to shoot. Enter the same 4-letter room code on every headset to join one team.'],
      tips: [['Saat kapal induk datang, tembak ke atas BERSAMA-SAMA agar perisainya jebol.', 'When the mothership arrives, shoot UP together to break its shield.'], ['Bicaralah dengan timmu, siapa yang kewalahan perlu dibantu!', "Talk to your team, help whoever's overwhelmed!"]] },
    blaster: { n: ['Galaksi Blaster', 'Galaxy Blaster'], tujuan: ['Tembak drone, pesawat cepat, raksasa berduri, dan UFO di luar angkasa. Kejar skor tertinggi!', 'Shoot drones, fast fighters, spiky giants and UFOs in space. Chase the high score!'],
      kontrol: ['Arahkan controller lalu tarik TRIGGER. Tembak target hijau untuk mulai.', 'Aim the controller and pull the TRIGGER. Shoot the green target to start.'],
      tips: [['Tembakan beruntun tanpa meleset memberi combo sampai x4!', 'Chain hits without missing for a combo up to x4!'], ['UFO bernilai paling besar, tapi paling lincah.', 'UFOs are worth the most, but they are the trickiest.']] },
    bola: { n: ['Pop Bola', 'Bubble Pop'], tujuan: ['Pecahkan sebanyak mungkin bola dalam waktu yang ada. Cocok untuk pemula!', 'Pop as many bubbles as you can before time runs out. Great for beginners!'],
      kontrol: ['Sentuh bola dengan ujung jari atau controller. Sentuh tombol hijau untuk mulai.', 'Touch bubbles with your fingertip or controller. Touch the green button to start.'],
      tips: [['Biru +1, emas +5, tapi hindari bom merah −3!', 'Blue +1, gold +5, but avoid the red bombs −3!'], ['Gerakkan kedua tangan, jangan cuma satu.', 'Use both hands, not just one.']] },
    fpv: { n: ['Robot SAR (FPV)', 'SAR Robot (FPV)'], tujuan: ['Kamu jadi operator robot SAR setelah gempa. Cari korban di reruntuhan lewat kamera termal, lalu tandai.', "You're a SAR robot operator after an earthquake. Find victims in the rubble with the thermal camera and mark them."],
      kontrol: ['Stik KIRI maju/mundur, stik KANAN belok. Hadapkan robot ke korban lalu tarik TRIGGER untuk menandai.', 'LEFT stick forward/back, RIGHT stick turns. Face a victim and pull the TRIGGER to mark it.'],
      tips: [['Korban tampak kuning terang di kamera termal, tapi drum api dan genset juga panas. Jangan tertipu!', 'Victims glow bright yellow on thermal, but fire drums and generators are hot too. Don\'t be fooled!'], ['Pilih level Mudah, Normal, atau Sulit di layar awal.', 'Choose Easy, Normal or Hard on the start screen.']] },
    mecanum: { n: ['Robot Mecanum', 'Mecanum Robot'], tujuan: ['Roda mecanum bisa bergerak ke samping dan diagonal tanpa berbelok. Kumpulkan semua bintang di lapangan!', 'Mecanum wheels can move sideways and diagonally without turning. Collect all the stars on the field!'],
      kontrol: ['Stik KIRI untuk gerak, stik KANAN untuk putar. Atau tunjuk tombol arah di panel kiri.', 'LEFT stick to move, RIGHT stick to rotate. Or point at the direction buttons on the left panel.'],
      tips: [['Perhatikan panah di tiap roda: itu arah gaya rollernya.', 'Watch the arrows on each wheel: that is the force direction of its rollers.'], ['Coba geser ke samping, robot biasa tidak bisa begitu!', 'Try strafing sideways, ordinary robots cannot do that!']] },
    lengan: { n: ['Lengan Robot', 'Robot Arm'], tujuan: ['Kendalikan lengan robot 4 servo dan pindahkan 3 kubus ke kotak yang warnanya sama, secepat mungkin.', 'Control a 4-servo robot arm and move 3 cubes into the boxes of the same colour, as fast as you can.'],
      kontrol: ['Pegang bola biru (trigger atau cubit), lalu gerakkan. Tombol GRIP membuka dan menutup capit.', 'Grab the blue ball (trigger or pinch) and move it. The GRIP button opens and closes the gripper.'],
      tips: [['Turunkan capit pelan-pelan tepat di atas kubus sebelum menutupnya.', 'Lower the gripper slowly right above a cube before closing it.'], ['Waktu tercepat masuk ke Papan Skor!', 'The fastest time goes on the Scoreboard!']] },
    linefollower: { n: ['Line Follower PID', 'Line Follower PID'], tujuan: ['Atur Kp, Ki, dan Kd, lalu lihat robot mengikuti garis. Ini cara kerja kendali PID sungguhan!', 'Tune Kp, Ki and Kd and watch the robot follow the line. This is how real PID control works!'],
      kontrol: ['Tunjuk tombol + / − di panel kiri, lalu tarik trigger. Coba juga preset yang tersedia.', 'Point at the + / − buttons on the left panel and pull the trigger. Try the presets too.'],
      tips: [['Tekan "Jadikan pembanding" untuk membalap robot hantu dengan setelan lamamu.', 'Press "Pin as comparison" to race a ghost robot with your old settings.'], ['Kp terlalu besar membuat robot bergoyang, terlalu kecil membuatnya keluar di tikungan.', 'Too much Kp makes it wobble, too little and it misses the curves.']] },
  };

  function naskahHalaman() {
    if (halaman === 'index') return {
      sapa: { p: 'lambai', t: ['Halo! Aku Xiao Huo 小火, si Api Kecil dari TIF. Mau main game atau coba simulasi robot?', "Hi! I'm Xiao Huo 小火, the Little Fire of TIF. Want to play a game or try a robot simulation?"] },
      tanya: [
        [['Mulai dari mana?', 'Where do I start?'], { p: 'vr', t: ['Pemula? Coba Pop Bola. Suka robot? Coba Robot SAR FPV. Pilih kartu, lalu tekan Masuk VR di headset.', 'New here? Try Bubble Pop. Love robots? Try the SAR Robot FPV. Pick a card, then press Enter VR on the headset.'] }],
        [['Game vs Simulasi?', 'Games vs Simulations?'], { p: 'senang', t: ['Game untuk seru-seruan sambil mencetak skor. Simulasi untuk belajar robot sungguhan: PID line follower, lengan robot, roda mecanum, dan robot SAR.', 'Games are for fun and scores. Simulations teach real robotics: PID line follower, robot arm, mecanum wheels and a SAR robot.'] }],
        [['Papan skor?', 'Scoreboard?'], PAPAN], [['Siapa kamu?', 'Who are you?'], SIAPA], [['Kenapa "Api Kecil"?', 'Why "Little Fire"?'], APA_API], [['Ganti bahasa', 'Change language'], BAHASA]] };
    if (halaman === 'papan') return {
      sapa: { p: 'sertifikat', t: ['Ini Papan Skor hari ini! Skor dari tiap headset muncul otomatis dalam beberapa detik.', "This is today's Scoreboard! Scores from each headset show up automatically within seconds."] },
      tanya: [[['Kenapa skorku belum muncul?', "Why isn't my score here?"], { p: 'cemberut', t: ['Pastikan headset tersambung internet. Kalau sempat offline, skornya disimpan dan dikirim otomatis begitu online lagi.', 'Make sure the headset is online. If it was offline, the score is saved and sent automatically once it reconnects.'] }],
        [['Urutannya bagaimana?', 'How is it ranked?'], { p: 'senang', t: ['Kebanyakan game: skor terbesar di atas. Lengan Robot dan Line Follower: waktu tercepat di atas.', 'Most games: highest score on top. Robot Arm and Line Follower: fastest time on top.'] }],
        [['Siapa kamu?', 'Who are you?'], SIAPA], [['Ganti bahasa', 'Change language'], BAHASA]] };
    const a = APP[halaman]; if (!a) return null;
    return {
      sapa: { p: 'lambai', t: [`Selamat datang di ${a.n[0]}! Aku Xiao Huo, siap menemanimu.`, `Welcome to ${a.n[1]}! I'm Xiao Huo, here to help.`] },
      tanya: [[['Tujuannya?', "What's the goal?"], { p: 'senang', t: a.tujuan }], [['Cara main?', 'How to play?'], { p: 'vr', t: a.kontrol }],
        [['Tips dong', 'Any tips?'], { p: 'senang', t: a.tips[0], lanjut: a.tips.slice(1).map(t => ({ p: 'senang', t })) }],
        [['Masuk VR?', 'Enter VR?'], MASUK_VR], [['Siapa kamu?', 'Who are you?'], SIAPA], [['Papan skor?', 'Scoreboard?'], PAPAN]] };
  }

  // ---------- bunyi "pip" kecil (WebAudio, tanpa file) ----------
  let ac = null;
  function pip(n = 2) {
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') return;
      for (let i = 0; i < n; i++) { const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * .09;
        o.type = 'triangle'; o.frequency.setValueAtTime(880 + i * 260, t); o.frequency.exponentialRampToValueAtTime(1400 + i * 200, t + .07);
        g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.08, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .08);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + .09); } } catch (e) {}
  }
  document.addEventListener('pointerdown', () => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); } catch (e) {} }, { once: true });

  // ekspor untuk VR (xrkit.js)
  window.XiaoHuo = { naskah: APP, siapa: SIAPA, halaman, pip };

  // ---------- widget web ----------
  const N = naskahHalaman(); if (!N) return;
  const css = `
  .xh{position:fixed;right:16px;bottom:var(--xh-b,16px);z-index:40;display:flex;flex-direction:column;align-items:flex-end;gap:4px;font-family:'Space Grotesk',system-ui,sans-serif;pointer-events:none}
  .xh *{box-sizing:border-box}
  .xh.bebas{right:auto;bottom:auto;left:var(--xh-x);top:var(--xh-y)}
  .xh.kiri{align-items:flex-start}.xh.kiri .xh-bub{margin:0 0 0 46px}
  .xh.bawah{flex-direction:column-reverse}
  .xh.seret,.xh.seret *{cursor:grabbing!important;user-select:none}
  .xh.seret .xh-fig img{animation:none;transform:translate(-50%,-4px) rotate(-6deg) scale(1.05)}
  .xh-fig{touch-action:none}
  /* proyektor hologram: piringan + berkas cahaya + maskot melayang */
  .xh-fig{pointer-events:auto;position:relative;width:124px;height:150px;border:0;padding:0;background:none;cursor:pointer;flex:none}
  .xh-fig img{position:absolute;left:50%;bottom:26px;width:118px;transform:translateX(-50%);display:block;z-index:2;
    filter:drop-shadow(0 0 10px rgba(62,230,255,.45));animation:xhApung 3.2s ease-in-out infinite,xhKedip 6s steps(1) infinite}
  .xh-fig .xh-sinar{position:absolute;left:50%;bottom:14px;width:120px;height:120px;transform:translateX(-50%);z-index:1;
    background:linear-gradient(to top,rgba(62,230,255,.32),rgba(123,92,255,.10) 55%,transparent);clip-path:polygon(30% 100%,70% 100%,100% 0,0 0);filter:blur(2px);opacity:.75}
  .xh-fig .xh-pad{position:absolute;left:50%;bottom:6px;width:96px;height:22px;transform:translateX(-50%);border-radius:50%;z-index:0;
    background:radial-gradient(ellipse at center,rgba(150,245,255,.95) 0,rgba(62,230,255,.6) 28%,rgba(123,92,255,.35) 55%,transparent 72%);
    box-shadow:0 0 0 2px rgba(62,230,255,.5),0 0 22px 4px rgba(62,230,255,.35),0 0 36px 10px rgba(255,63,164,.18)}
  .xh-fig .xh-pad::after{content:'';position:absolute;inset:-6px -10px;border-radius:50%;border:1px solid rgba(255,63,164,.55);animation:xhCincin 2.4s ease-out infinite}
  .xh-fig:hover img{filter:drop-shadow(0 0 16px rgba(62,230,255,.7)) brightness(1.1)}
  .xh-fig.lompat img{animation:xhMuncul .5s cubic-bezier(.3,1.5,.5,1),xhApung 3.2s .5s ease-in-out infinite}
  @keyframes xhApung{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,-6px)}}
  @keyframes xhKedip{0%,91%,95%,100%{opacity:1}92%{opacity:.55}94%{opacity:.85}}
  @keyframes xhMuncul{0%{transform:translate(-50%,10px) scaleY(.2);opacity:0;filter:brightness(2.2) drop-shadow(0 0 20px #3ee6ff)}60%{transform:translate(-50%,-4px) scaleY(1.06);opacity:1}100%{transform:translate(-50%,0) scaleY(1)}}
  @keyframes xhCincin{0%{transform:scale(.7);opacity:.9}100%{transform:scale(1.35);opacity:0}}
  .xh-bub{pointer-events:auto;position:relative;width:min(var(--xh-w,330px),calc(100vw - 32px));max-height:calc(100vh - var(--xh-b,16px) - 250px);overflow:auto;margin-right:46px;padding:14px 16px 12px;border-radius:18px;color:#f4f6ff;
    background:linear-gradient(160deg,rgba(30,22,64,.86),rgba(8,10,28,.9));backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
    border:1px solid rgba(62,230,255,.45);box-shadow:0 0 0 1px rgba(255,63,164,.18) inset,0 0 24px -6px rgba(62,230,255,.55),0 18px 40px -18px rgba(0,0,0,.8);
    transform-origin:100% 100%;transition:opacity .2s,transform .25s}
  .xh-bub::before{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(62,230,255,.05) 0 1px,transparent 1px 4px)}
  .xh.tutup .xh-bub{display:none}
  .xh-nama{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;font-weight:700;
    background:linear-gradient(90deg,#3ee6ff,#ff3fa4);-webkit-background-clip:text;background-clip:text;color:transparent}
  .xh-nama .titik{display:inline-block;width:7px;height:7px;border-radius:50%;background:#3ee6ff;box-shadow:0 0 8px #3ee6ff;margin-right:7px;vertical-align:1px}
  .xh-x{background:none;border:0;color:rgba(244,246,255,.6);font-size:18px;line-height:1;cursor:pointer;padding:2px 4px;border-radius:8px;-webkit-text-fill-color:currentColor}
  .xh-x:hover{color:#fff;background:rgba(255,255,255,.08)}
  .xh-teks{font-size:15px;line-height:1.5;min-height:2.6em;position:relative}
  .xh-teks .kur{display:inline-block;width:7px;height:1em;margin-left:2px;vertical-align:-2px;background:#3ee6ff;box-shadow:0 0 6px #3ee6ff;animation:xhKur .8s steps(1) infinite}
  @keyframes xhKur{50%{opacity:0}}
  .xh-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;position:relative}
  .xh-chips button{font:600 12.5px/1 'Space Grotesk',system-ui,sans-serif;color:#e8fbff;background:rgba(62,230,255,.07);border:1px solid rgba(62,230,255,.3);padding:8px 11px;border-radius:999px;cursor:pointer;transition:background .15s,border-color .15s,box-shadow .15s}
  .xh-chips button:hover,.xh-chips button:focus-visible{background:rgba(255,63,164,.16);border-color:rgba(255,63,164,.75);box-shadow:0 0 12px -2px rgba(255,63,164,.6);outline:none}
  .xh.tutup .xh-fig{width:88px;height:108px}.xh.tutup .xh-fig img{width:82px;bottom:20px}.xh.tutup .xh-sinar{width:84px;height:84px}.xh.tutup .xh-pad{width:70px;height:16px}
  .xh-tanda{position:absolute;top:2px;right:4px;z-index:3;width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#ff3fa4,#7b5cff);color:#fff;font:700 14px/24px 'Space Grotesk',sans-serif;text-align:center;box-shadow:0 0 12px rgba(255,63,164,.7);display:none}
  .xh.tutup .xh-tanda{display:block}
  @media (max-width:700px){.xh{right:8px}.xh-bub{margin-right:30px}.xh-fig{width:100px;height:122px}.xh-fig img{width:94px;bottom:20px}.xh-sinar{width:96px;height:96px}.xh-pad{width:78px;height:18px}}
  @media (prefers-reduced-motion:reduce){.xh-fig img,.xh-fig.lompat img,.xh-pad::after,.xh-teks .kur{animation:none!important}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const el = document.createElement('div'); el.className = 'xh tutup'; el.setAttribute('role', 'complementary');
  el.innerHTML = `<div class="xh-bub" aria-live="polite"><div class="xh-nama"><span><i class="titik"></i>Xiao Huo 小火</span><button class="xh-x" type="button">✕</button></div>
    <div class="xh-teks"></div><div class="xh-chips"></div></div>
    <button class="xh-fig" type="button"><span class="xh-pad"></span><span class="xh-sinar"></span><img alt="" src="xiaohuo/belakang.webp"><span class="xh-tanda">?</span></button>`;
  const fig = el.querySelector('.xh-fig'), img = fig.querySelector('img'), teks = el.querySelector('.xh-teks'), chips = el.querySelector('.xh-chips'), xBtn = el.querySelector('.xh-x');
  ['lambai', 'senang', 'vr', 'sertifikat', 'cemberut', 'belakang'].forEach(p => { const i = new Image(); i.src = `xiaohuo/${p}.webp`; }); // pramuat

  let ketik = null, antre = [];
  function pose(p) { img.src = `xiaohuo/${p}.webp`; fig.classList.remove('lompat'); void fig.offsetWidth; fig.classList.add('lompat'); }
  function label() { fig.setAttribute('aria-label', el.classList.contains('tutup') ? L('Buka asisten Xiao Huo', 'Open the Xiao Huo assistant') : L('Tutup asisten', 'Close the assistant')); xBtn.setAttribute('aria-label', L('Tutup', 'Close')); }
  function bicara(item, suara = true, sisaAntre = null) {
    if (!item) return; el.classList.remove('tutup'); label(); pose(item.p || 'senang'); if (suara) pip();
    antre = sisaAntre ?? (item.lanjut || []).slice();
    const s = L(item.t[0], item.t[1]); clearInterval(ketik); chips.innerHTML = '';
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { teks.textContent = s; tombol(); return; }
    teks.innerHTML = '<span></span><i class="kur"></i>'; const sp = teks.firstChild; let i = 0;
    ketik = setInterval(() => { i += 2; sp.textContent = s.slice(0, i); if (i >= s.length) { clearInterval(ketik); teks.querySelector('.kur')?.remove(); tombol(); } }, 18);
  }
  function tombol() {
    chips.innerHTML = '';
    const tambah = (lbl, fn) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = lbl; b.onclick = fn; chips.appendChild(b); };
    if (antre.length) tambah(L('Lagi →', 'More →'), () => bicara(antre[0], true, antre.slice(1)));
    N.tanya.forEach(([lbl, isi]) => tambah(L(lbl[0], lbl[1]), () => bicara(isi)));
  }
  function tutup() { el.classList.add('tutup'); clearInterval(ketik); img.src = 'xiaohuo/belakang.webp'; label(); try { sessionStorage.setItem('xh_tutup', '1'); } catch (e) {} }
  // ---- seret untuk memindahkan (posisi disimpan) ----
  let posBebas = null; try { posBebas = JSON.parse(localStorage.getItem('xh_pos') || 'null'); } catch (e) {}
  function terapkanPos() {
    if (!posBebas) { el.classList.remove('bebas', 'kiri', 'bawah'); return; }
    const fw = fig.offsetWidth || 124, fh = fig.offsetHeight || 150;
    const fx = Math.min(innerWidth - fw - 4, Math.max(4, posBebas.x * innerWidth)), fy = Math.min(innerHeight - fh - 4, Math.max(60, posBebas.y * innerHeight));
    const kiri = fx + fw / 2 < innerWidth / 2, bawah = fy < innerHeight * .45;
    el.classList.add('bebas'); el.classList.toggle('kiri', kiri); el.classList.toggle('bawah', bawah);
    // titik acuan .xh = pojok kiri-atas kotaknya; maskot ada di ujung bawah (atau atas bila gelembung di bawah)
    const bub = el.querySelector('.xh-bub'), bh = el.classList.contains('tutup') ? 0 : bub.offsetHeight + 4;
    const lebar = Math.max(fw, el.classList.contains('tutup') ? 0 : bub.offsetWidth + 46);
    el.style.setProperty('--xh-x', (kiri ? fx : fx + fw - lebar) + 'px');
    el.style.setProperty('--xh-y', (bawah ? fy : fy - bh) + 'px');
  }
  let tekan = null;
  fig.addEventListener('pointerdown', e => { tekan = { x: e.clientX, y: e.clientY, r: fig.getBoundingClientRect(), geser: false }; fig.setPointerCapture(e.pointerId); });
  fig.addEventListener('pointermove', e => {
    if (!tekan) return; const dx = e.clientX - tekan.x, dy = e.clientY - tekan.y;
    if (!tekan.geser && Math.hypot(dx, dy) > 6) { tekan.geser = true; el.classList.add('seret'); }
    if (tekan.geser) { posBebas = { x: (tekan.r.left + dx) / innerWidth, y: (tekan.r.top + dy) / innerHeight }; terapkanPos(); }
  });
  fig.addEventListener('pointerup', () => {
    if (!tekan) return; const geser = tekan.geser; tekan = null; el.classList.remove('seret');
    if (geser) { try { localStorage.setItem('xh_pos', JSON.stringify(posBebas)); } catch (e) {} pip(1); return; }
    el.classList.contains('tutup') ? bicara(N.sapa) : tutup();
  });
  fig.addEventListener('dblclick', () => { posBebas = null; try { localStorage.removeItem('xh_pos'); } catch (e) {} terapkanPos(); });
  fig.title = L('Klik: bicara · Seret: pindahkan · Klik ganda: kembali ke pojok', 'Click: talk · Drag: move · Double-click: back to corner');
  new ResizeObserver(() => terapkanPos()).observe(el); addEventListener('resize', terapkanPos);
  xBtn.onclick = tutup;
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !el.classList.contains('tutup')) tutup(); });
  document.addEventListener('langchange', () => { label(); if (!el.classList.contains('tutup')) bicara(N.sapa, false); });

  // jaga agar tidak menutupi kartu bawah (#ov) di layar sempit
  function posisi() {
    if (posBebas) return terapkanPos();
    const ov = document.getElementById('ov'); let b = 16, w = 330;
    if (ov && ov.getClientRects().length && getComputedStyle(ov).display !== 'none') {
      const r = ov.getBoundingClientRect(), ruang = innerWidth - r.right - 16 - 40;   // ruang kosong di kanan kartu
      if (ruang >= 260) w = Math.min(330, ruang - 8);                                // cukup: gelembung menyesuaikan
      else b = innerHeight - r.top + 10;                                             // sempit: naik ke atas kartu
    }
    el.style.setProperty('--xh-b', Math.max(16, Math.round(b)) + 'px'); el.style.setProperty('--xh-w', Math.round(w) + 'px');
  }
  addEventListener('resize', posisi);
  function pasang() {
    document.body.appendChild(el); label(); posisi(); setInterval(posisi, 1500);
    let sudah = false; try { sudah = sessionStorage.getItem('xh_sapa_' + halaman) === '1'; } catch (e) {}
    if (!sudah) { setTimeout(() => { bicara(N.sapa, false); try { sessionStorage.setItem('xh_sapa_' + halaman, '1'); } catch (e) {} }, 600); }
  }
  // tunggu layar loading UVERS selesai
  const mulai = () => { const tunggu = () => document.getElementById('uvl') ? setTimeout(tunggu, 200) : pasang(); tunggu(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai); else mulai();
})();
