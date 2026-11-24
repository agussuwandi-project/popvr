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
| `linefollower.html` | Line Follower PID | VR | Atur Kp, Ki, Kd dan kecepatan; bandingkan dengan logika ON-OFF 2 sensor |
| `blaster.html` | Galaksi Blaster | VR | Tembak alien dari platform luar angkasa, kejar combo hingga x4 |
| `bola.html` | Pop Bola | VR & Mixed Reality | Pecahkan bola dengan tangan atau controller; cocok untuk pemula |

## Cara pakai di Quest

1. Buka **Meta Quest Browser**, masuk ke alamat di atas.
2. Pilih game dari menu.
3. Tekan **Masuk VR** (atau **Mulai Mixed Reality** di Invasi Portal dan Pop Bola).
4. Benteng 4 Penjuru: semua pemain memasukkan **kode ruang** 4 huruf yang sama. Butuh internet (Firebase).

Sebelum pameran, buka setiap game sekali di tiap headset supaya file versi terbaru tersimpan di cache.

## Mode tes di laptop

Tanpa headset, halaman tetap bisa dibuka di Chrome/Edge. Mode tes laptop aktif otomatis (status di pojok kanan atas: "Mode tes laptop"); klik untuk berinteraksi. Robot Mecanum: WASD + Q/E. Lengan Robot: seret bola biru, roda mouse = naik/turun, Spasi = capit.

- `?logo3d=1` — memutar animasi logo 3D tanpa masuk VR.
- `benteng.html?room=ABCD&name=Budi&auto=1` — langsung masuk ruang Benteng (berguna untuk tes beberapa tab).
- `benteng.html?lokal=1` — Benteng tanpa Firebase, pemain hanya tersambung antar-tab di browser yang sama.

## Struktur file

```
index.html            Menu utama
invasi.html, benteng.html, blaster.html, bola.html          Game
mecanum.html, lengan.html, linefollower.html                Simulasi robotika
menu.html             Pengalihan ke ./ (alamat lama)
loader.js             Layar loading animasi logo UVERS
logo3d.js             Animasi logo 3D saat masuk VR
tema.css, tema.js     Tema bersama (latar aurora, kartu kaca, tombol)
three.module.min.js   Three.js r160 (disimpan lokal, tidak bergantung CDN)
favicon.svg           Ikon tab
```

## Catatan teknis

- Three.js r160 lewat import map, disimpan di repo agar tidak bergantung pada unpkg.
- Fisika Line Follower dan IK Lengan Robot sudah diuji dengan skrip otomatis (waktu putaran tiap preset, akurasi ujung capit, misi 3 kubus).
- Multiplayer Benteng memakai Firebase Realtime Database (host-authoritative).
- Masih butuh internet untuk Google Fonts dan Firebase; game single-player tetap jalan bila font gagal dimuat.

## Kredit

Dibuat oleh Agus Suwandi — UVERS XR Lab, Universitas Universal Batam.
Three.js © three.js authors, lisensi MIT.
