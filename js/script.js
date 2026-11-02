/* Wedding invitation: card opening, continuous scroll, countdowns and music. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body, cover = $('#cover'), stage = $('#stage'), audio = $('#bgm'), music = $('#music'),
      progress = $('#progress'), secs = $$('.sec'), opened = false, ticking = false;

  /* Bismillah / In Shaa Allah reference pictures: keep the picture if present, otherwise show readable text */
  $$('img.ref').forEach(function (img) {
    function fallback() {
      var txt = img.getAttribute('data-fb') || '', ar = /[\u0600-\u06FF]/.test(txt), s = document.createElement('p');
      s.className = (ar ? 'fb' : 't gold') + (img.classList.contains('rv') ? ' rv' : '');
      if (ar) s.lang = 'ar'; else s.style.fontSize = '2em';
      s.textContent = txt; img.replaceWith(s);
    }
    if (img.complete && img.naturalWidth === 0) fallback(); else img.addEventListener('error', fallback);
  });

  /* ---------- Music (starts only after the visitor taps Open) ---------- */
  var playBtn = $('#m-play'), muteBtn = $('#m-mute');
  audio.volume = 0.35;
  function ui() {
    var on = !audio.paused;
    music.classList.toggle('playing', on); music.classList.toggle('muted', audio.muted);
    playBtn.setAttribute('aria-pressed', on); playBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music');
    muteBtn.setAttribute('aria-pressed', audio.muted); muteBtn.setAttribute('aria-label', audio.muted ? 'Unmute music' : 'Mute music');
  }
  ['play', 'pause', 'volumechange'].forEach(function (e) { audio.addEventListener(e, ui); });
  audio.addEventListener('error', function () { music.hidden = true; console.warn('assets/audio/wedding-music.mp3 is missing or unreadable.'); });
  function startMusic() {
    music.hidden = false; ui();
    var p = audio.play(); if (p && p.catch) p.catch(function () { ui(); });   /* if blocked, the visitor can press play */
  }
  playBtn.addEventListener('click', function () { if (audio.paused) { var p = audio.play(); if (p && p.catch) p.catch(ui); } else audio.pause(); });
  muteBtn.addEventListener('click', function () { audio.muted = !audio.muted; ui(); });

  /* ---------- Card opening ---------- */
  function openInvite() {
    if (opened) return; opened = true; startMusic();
    function finish() {
      body.classList.add('open'); window.scrollTo(0, 0); initScroll();
      cover.classList.add('fade'); setTimeout(function () { cover.remove(); }, 1200);
    }
    if (reduce) { finish(); return; }
    var r = stage.getBoundingClientRect();
    var z = Math.max(innerWidth / (r.width * 0.8842), innerHeight / (r.height * 0.8144));
    stage.style.setProperty('--z', Math.max(1, z).toFixed(3));
    cover.classList.add('opening');
    setTimeout(function () { cover.classList.add('swing'); }, 450);   /* seal lifts, then the two covers swing open */
    setTimeout(function () { cover.classList.add('zoom'); }, 1800);   /* camera moves into the card */
    setTimeout(finish, 3300);
  }
  cover.addEventListener('click', openInvite);
  cover.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openInvite(); } });

  /* ---------- Continuous scroll: reveals, parallax, progress ---------- */
  function update() {
    ticking = false;
    var h = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
    if (reduce) return;
    secs.forEach(function (s) {
      var r = s.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      var c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      s.style.setProperty('--py', (-c * r.height * 0.05).toFixed(1) + 'px');
    });
  }
  function initScroll() {
    secs.forEach(function (s) { $$('.rv', s).forEach(function (el, i) { el.style.setProperty('--i', i); }); });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('show', e.isIntersecting); }); }, { threshold: 0.22 });
      secs.forEach(function (s) { io.observe(s); });
    } else secs.forEach(function (s) { s.classList.add('show'); });
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update); update();
  }
  $('#to-top').addEventListener('click', function () { $('#s-welcome').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---------- Countdowns: each function counts down to its own start (Pakistan time, +05:00) ---------- */
  var T = {
    hina: Date.parse('2026-11-20T18:00:00+05:00'),
    barat: Date.parse('2026-11-21T08:00:00+05:00'),   /* Sehra Bandi */
    walima: Date.parse('2026-11-22T14:00:00+05:00')
  };
  function p2(x) { return String(x).padStart(2, '0'); }
  function tick() {
    var now = Date.now();
    $$('[data-cd]').forEach(function (el) {
      var ms = T[el.getAttribute('data-cd')] - now;
      if (ms <= 0) { el.textContent = 'It is time to celebrate!'; return; }
      var t = Math.floor(ms / 1000);
      el.innerHTML = '<div><b>' + Math.floor(t / 86400) + '</b><span>days</span></div><div><b>' + p2(Math.floor(t % 86400 / 3600)) +
        '</b><span>hours</span></div><div><b>' + p2(Math.floor(t % 3600 / 60)) + '</b><span>min</span></div><div><b>' + p2(t % 60) + '</b><span>sec</span></div>';
    });
  }
  tick(); setInterval(tick, 1000);
})();
