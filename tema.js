/* Pil status di kanan atas: menunjukkan apakah perangkat ini bisa VR / Mixed Reality. */
/* Juga: tombol "–" untuk mengecilkan kartu supaya scene di belakangnya bisa diklik. */
(function () {
  var ov = document.getElementById('ov');
  if (ov) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'xr-min';
    var sync = function () { var m = ov.classList.contains('mini'); b.textContent = m ? '+' : '–'; b.setAttribute('aria-label', m ? 'Tampilkan panel' : 'Kecilkan panel'); b.title = b.getAttribute('aria-label'); };
    b.onclick = function () { ov.classList.toggle('mini'); sync(); };
    sync(); ov.appendChild(b);
  }
  var p = document.getElementById('xrStatus');
  if (!p) return;
  function set(cls, txt) { p.className = 'xr-pill ' + cls; p.textContent = txt; }
  if (!navigator.xr) { set('', 'Mode tes laptop'); return; }
  Promise.all([
    navigator.xr.isSessionSupported('immersive-ar').catch(function () { return false; }),
    navigator.xr.isSessionSupported('immersive-vr').catch(function () { return false; })
  ]).then(function (r) {
    if (r[0]) set('ok', 'Headset siap · VR & Mixed Reality');
    else if (r[1]) set('ok', 'Headset siap · VR');
    else set('', 'Mode tes laptop');
  });
})();
