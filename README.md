# UVERS XR Lab — Koleksi Game WebXR

Kumpulan game dan pengalaman VR/Mixed Reality berbasis WebXR untuk **Meta Quest 3**, dibuat untuk pameran kampus Universitas Universal (UVERS), Batam. Semua berjalan langsung di browser headset, tanpa instal aplikasi.

**Buka:** https://agussuwandi-project.github.io/popvr/

## Daftar aplikasi

| Halaman | Nama | Mode | Keterangan |
|---|---|---|---|
| `invasi.html` | Invasi Portal | VR & Mixed Reality | Portal alien terbuka di ruangan nyata; tutup portal dan kalahkan kapal induk |
| `benteng.html` | Benteng 4 Penjuru | VR, multiplayer 2–4 | Empat penjaga, satu menara; tembak kapal induk bersama-sama |
| `mecanum.html` | Robot Mecanum | VR | Kendalikan robot holonomik; lihat gaya tiap roda dan rumus kinematikanya |
| `lengan.html` | Lengan Robot | VR | Lengan 4 servo + capit dengan inverse kinematics; pindahkan 3 kubus ke kotak sewarna |
| `fpv.html` | Robot SAR (FPV) | VR (duduk) | Kemudikan robot penyelamat dari kameranya; cari 5 korban gempa dengan kamera termal, hindari sumber panas palsu |
| `linefollower.html` | Line Follower PID | VR | Atur Kp, Ki, Kd dan kecepatan; bandingkan dengan logika ON-OFF 2 sensor, atau jalankan "robot hantu" pembanding |
| `blaster.html` | Galaksi Blaster | VR | Tembak alien dari platform luar angkasa, kejar combo hingga x4 |
| `bola.html` | Pop Bola | VR & Mixed Reality | Pecahkan bola dengan tangan atau controller; cocok untuk pemula |
| `papan.html` | Papan Skor | Laptop / layar besar | Skor hari ini dari semua headset, diperbarui tiap 4 detik |

## Cara pakai di Quest

1. Buka **Meta Quest Browser**, masuk ke alamat di atas.
2. Pilih game dari menu.
3. Tekan **Masuk VR** (atau **Mulai Mixed Reality** di Invasi Portal dan Pop Bola).
4. Benteng 4 Penjuru: semua pemain memasukkan **kode ruang** 4 huruf yang sama. Butuh internet (Firebase).

Sebelum pameran, buka setiap game sekali di tiap headset supaya file versi terbaru tersimpan di cache.

## Fitur pameran (xrkit.js)

Semua app VR memuat `xrkit.js`, yang menambahkan:

- **Tutorial singkat** saat pertama masuk VR; tutup dengan trigger atau hilang sendiri.
- **Reset otomatis**: diam 75 detik → peringatan "Masih bermain?", 10 detik kemudian keluar VR dan muat ulang. Headset dilepas >25 detik juga memicu reset. Benteng sengaja tanpa reset diam.
- **Meter FPS**: `?fps=1` (tersimpan di headset; `?fps=0` mematikan).
- **Kualitas adaptif**: bila FPS lama di bawah target, bayangan dimatikan; bila masih berat, sesi berikutnya memakai resolusi 0,8.
- **Hand tracking**: titik sendi tangan terlihat (kecuali Pop Bola).
- **Skor ke papan**: tiap game mengirim skor ke Firebase; bila offline, skor diantre dan dikirim saat online. Robot Mecanum tidak punya skor.

## Asisten Xiao Huo 小火

Maskot TIF (panda merah "Si Api Kecil") tampil sebagai **hologram neon**, asisten berskrip tanpa AI dan tanpa internet.

- **Web** (`xiaohuo.js` + `xiaohuo/*.webp`): melayang di atas piringan proyektor di pojok kanan bawah, dengan gelembung bicara dan tombol pertanyaan cepat (ID/EN). Klik untuk bicara, seret untuk memindahkan (posisi disimpan), klik ganda untuk kembali ke pojok.
- **VR** (`xiaohuo3d.js` + `xiaohuo-vr.js`, dipasang oleh `xrkit.js`): hologram 2D (pose yang sama persis dengan versi web) di atas piringan proyektor, yang muncul di depan saat masuk VR, membacakan sapaan, tujuan, cara main, dan tips, lalu menepi ke kiri bawah. Bisa **dipegang dan dipindah**: dekatkan controller lalu tahan **grip** (trigger sengaja tidak dipakai agar tidak bentrok dengan menembak), atau cubit bila memakai tangan. Juga merayakan skor dan menyampaikan peringatan "Masih bermain?".
- Naskah per halaman ada di `xiaohuo.js` (objek `APP`).

## Papan skor

1. Di tiap headset, buka sekali `?hs=Headset1` (Headset2, 3, 4) agar skor tercatat dengan nama headset.
2. Buka `papan.html` di laptop. `?demo=1` menampilkan data contoh, `?tgl=2026-11-30` tanggal tertentu.
3. Bila papan menampilkan "akses ditolak", tambahkan aturan ini di Firebase Realtime Database → Rules:

```json
"papan": { "$tgl": { ".read": true, "$game": { "$id": {
  ".write": "!data.exists()",
  ".validate": "newData.hasChildren(['s', 'h', 'w']) && newData.child('s').isNumber()" } } } }
```

Robot SAR punya level: `fpv.html?level=mudah|normal|sulit` (juga bisa dipilih di layar awal).

Layar loading logo UVERS tampil minimal 4 detik (atur `minMs` di `loader.js`).

## Bahasa ID / EN

Tombol **ID | EN** ada di pojok kanan atas setiap halaman. Pilihan disimpan di browser (di Quest cukup pilih sekali). Bisa juga dipaksa lewat URL: `?lang=en` atau `?lang=id`. Teks ada di `i18n.js` (fungsi `L('teks ID', 'EN text')` dan atribut `data-en`).

## Mode tes di laptop

Tanpa headset, halaman tetap bisa dibuka di Chrome/Edge. Mode tes laptop aktif otomatis (status di pojok kanan atas: "Mode tes laptop"); klik untuk berinteraksi. Robot Mecanum: WASD + Q/E. Lengan Robot: seret bola biru, roda mouse = naik/turun, Spasi = capit. Robot SAR: W/S/A/D menyetir, Spasi menandai, seret mouse untuk menoleh.

- `?logo3d=1` — memutar animasi logo 3D tanpa masuk VR.
- `benteng.html?room=ABCD&name=Budi&auto=1` — langsung masuk ruang Benteng (berguna untuk tes beberapa tab).
- `benteng.html?lokal=1` — Benteng tanpa Firebase, pemain hanya tersambung antar-tab di browser yang sama.

## Struktur file

```
index.html            Menu utama
invasi.html, benteng.html, blaster.html, bola.html          Game
mecanum.html, lengan.html, linefollower.html, fpv.html      Simulasi robotika
menu.html             Pengalihan ke ./ (alamat lama)
loader.js             Layar loading animasi logo UVERS
logo3d.js             Animasi logo 3D saat masuk VR
tema.css, tema.js     Tema bersama (latar aurora, kartu kaca, tombol)
i18n.js               Bahasa ID/EN dan tombol pengganti bahasa
xrkit.js              Fitur pameran bersama (tutorial, reset, FPS, skor)
alien.js              Model musuh & kapal induk mid-poly + ledakan instanced (dipakai Blaster, Benteng, Invasi, Pop Bola)
xiaohuo.js            Asisten Xiao Huo (web) + naskah
xiaohuo3d.js          Hologram Xiao Huo untuk VR (panel pose + proyektor)
xiaohuo-vr.js         Perilaku Xiao Huo di VR (ikut, pegang & pindah, bicara)
xiaohuo/              6 pose hologram (WebP)
detail.js             Visual mid/high-poly bersama: tekstur prosedural, material logam/karet/PCB, pantulan, penggabung draw call
addons/               Tambahan Three.js r160 (RoomEnvironment, BufferGeometryUtils, RoundedBoxGeometry), lisensi MIT
papan.html            Papan skor untuk laptop
fonts/                Space Grotesk lokal (lisensi OFL)
three.module.min.js   Three.js r160 (disimpan lokal, tidak bergantung CDN)
favicon.svg           Ikon tab
```

## Catatan teknis

- Three.js r160 lewat import map, disimpan di repo agar tidak bergantung pada unpkg.
- Fisika Line Follower dan IK Lengan Robot sudah diuji dengan skrip otomatis (waktu putaran tiap preset, akurasi ujung capit, misi 3 kubus).
- Multiplayer Benteng memakai Firebase Realtime Database (host-authoritative).
- Model robot di empat simulasi dibuat prosedural (tanpa file 3D): roda mecanum dengan roller tong, servo berlabel, bracket aluminium, PCB bertekstur, rantai karet. Bagian statis digabung per material sehingga draw call rendah (FPV: 225 → ~60). Pantulan lingkungan hanya dipasang pada material robot agar biaya per piksel tetap kecil.
- Game: musuh dan kapal induk mid-poly (drone bercincin pendorong, pesawat pemburu, raksasa berduri, UFO berkubah kaca), bagian per material digabung. Ledakan memakai satu InstancedMesh + sprite (4 ledakan bersamaan: 130 → 49 draw call di Blaster). Invasi & Pop Bola (Mixed Reality) memakai versi segmen lebih sedikit.
- Font Space Grotesk disimpan lokal; internet hanya dibutuhkan untuk Firebase (Benteng dan papan skor). Game single-player tetap jalan offline setelah tersimpan di cache.

## Kredit

Dibuat oleh Agus Suwandi — UVERS XR Lab, Universitas Universal Batam.
Three.js © three.js authors, lisensi MIT. Space Grotesk © The Space Grotesk Project Authors, lisensi SIL OFL 1.1.
