/* Bahasa ID / EN untuk semua halaman UVERS XR Lab.
   - Pilihan disimpan di localStorage ('uvers_lang'), bisa juga dipaksa lewat ?lang=en / ?lang=id.
   - L('teks Indonesia', 'English text') → teks sesuai bahasa aktif (dipakai di JS tiap halaman).
   - Elemen HTML dengan data-en="..." otomatis ditukar isinya; data-en-ph="..." untuk placeholder input.
   - <meta name="title-en" content="..."> mengganti judul tab saat EN.
   - Tombol ID | EN dipasang di header. Di halaman game, ganti bahasa = muat ulang halaman,
     karena teks di dalam VR digambar saat halaman dimuat. */
(function () {
  var KEY = 'uvers_lang', lang = null;
  try { lang = localStorage.getItem(KEY); } catch (e) {}
  var q = new URLSearchParams(location.search).get('lang');
  if (q === 'en' || q === 'id') { lang = q; try { localStorage.setItem(KEY, q); } catch (e) {} }
  if (lang !== 'en') lang = 'id';
  window.LANG = lang;
  window.L = function (id, en) { return lang === 'en' && en != null ? en : id; };
  document.documentElement.lang = lang;
  if (lang === 'en') {
    var mt = document.querySelector('meta[name="title-en"]'); if (mt) document.title = mt.content;
    var md = document.querySelector('meta[name="description-en"]'), d = document.querySelector('meta[name="description"]');
    if (md && d) d.content = md.content;
  }

  function apply() {
    var els = document.querySelectorAll('[data-en]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      // data-en-if: hanya terjemahkan teks awal; kalau skrip halaman sudah menggantinya (mis. status perangkat), biarkan
      if (el.hasAttribute('data-en-if') && el.textContent !== el.getAttribute('data-en-if')) continue;
      if (el.dataset.id == null) el.dataset.id = el.innerHTML;
      el.innerHTML = lang === 'en' ? el.dataset.en : el.dataset.id;
    }
    var ph = document.querySelectorAll('[data-en-ph]');
    for (var j = 0; j < ph.length; j++) {
      var p = ph[j]; if (p.dataset.idPh == null) p.dataset.idPh = p.placeholder;
      p.placeholder = lang === 'en' ? p.dataset.enPh : p.dataset.idPh;
    }
  }
  var css = '.lang-sw{display:inline-flex;align-items:center;gap:2px;padding:3px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);font:600 13px/1 "Space Grotesk",system-ui,sans-serif;letter-spacing:.04em;flex:none}'
    + '.lang-sw button{all:unset;cursor:pointer;padding:7px 11px;border-radius:999px;color:rgba(244,246,255,.65);transition:background .2s,color .2s}'
    + '.lang-sw button:hover{color:#fff}.lang-sw button[aria-pressed="true"]{color:#fff;background:linear-gradient(90deg,var(--a1,#ff3fa4),var(--a2,#7b5cff));box-shadow:0 4px 14px -4px var(--a1,#ff3fa4)}'
    + '.lang-sw button:focus-visible{outline:2px solid #fff;outline-offset:2px}'
    + '.xr-right{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}';
  function tombol() {
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    var w = document.createElement('div'); w.className = 'lang-sw'; w.setAttribute('role', 'group'); w.setAttribute('aria-label', lang === 'en' ? 'Language' : 'Bahasa');
    ['id', 'en'].forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = k.toUpperCase();
      b.setAttribute('aria-pressed', String(k === lang)); b.title = k === 'id' ? 'Bahasa Indonesia' : 'English';
      b.onclick = function () {
        if (k === lang) return;
        try { localStorage.setItem(KEY, k); } catch (e) {}
        var u = new URL(location.href); u.searchParams.delete('lang');
        if (document.body.dataset.langLive === '1') { // halaman tanpa teks 3D (menu): tukar tanpa memuat ulang
          lang = window.LANG = k; document.documentElement.lang = k; apply();
          w.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x.textContent.toLowerCase() === k)); });
          history.replaceState(null, '', u); document.dispatchEvent(new CustomEvent('langchange', { detail: k }));
        } else location.replace(u.toString());
      };
      w.appendChild(b);
    });
    // letakkan di header: halaman game → sebelum pil status; menu → di dalam header
    var pill = document.getElementById('xrStatus') || document.getElementById('net') || document.querySelector('header .pill');
    if (pill && pill.parentNode) {
      var box = document.createElement('div'); box.className = 'xr-right';
      pill.parentNode.insertBefore(box, pill); box.appendChild(w); box.appendChild(pill);
    } else { w.style.cssText = 'position:fixed;top:14px;right:14px;z-index:60'; document.body.appendChild(w); }
  }
  function siap() { apply(); tombol(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', siap); else siap();
})();
