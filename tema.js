/* Pil status di kanan atas: menunjukkan apakah perangkat ini bisa VR / Mixed Reality. */
/* Juga: tombol "–" untuk mengecilkan kartu supaya scene di belakangnya bisa diklik. */
(function () {
  var L = window.L || function (a) { return a; };
  var ov = document.getElementById('ov');
  if (ov) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'xr-min';
    var sync = function () { var m = ov.classList.contains('mini'); b.textContent = m ? '+' : '–'; b.setAttribute('aria-label', m ? L('Tampilkan panel', 'Show panel') : L('Kecilkan panel', 'Collapse panel')); b.title = b.getAttribute('aria-label'); };
    b.onclick = function () { ov.classList.toggle('mini'); sync(); };
    sync(); ov.appendChild(b);
  }
  var p = document.getElementById('xrStatus');
  if (!p) return;
  function set(cls, txt) { p.className = 'xr-pill ' + cls; p.textContent = txt; }
  if (!navigator.xr) { set('', L('Mode tes laptop', 'Laptop test mode')); return; }
  Promise.all([
    navigator.xr.isSessionSupported('immersive-ar').catch(function () { return false; }),
    navigator.xr.isSessionSupported('immersive-vr').catch(function () { return false; })
  ]).then(function (r) {
    if (r[0]) set('ok', L('Headset siap · VR & Mixed Reality', 'Headset ready · VR & Mixed Reality'));
    else if (r[1]) set('ok', L('Headset siap · VR', 'Headset ready · VR'));
    else set('', L('Mode tes laptop', 'Laptop test mode'));
  });
})();
