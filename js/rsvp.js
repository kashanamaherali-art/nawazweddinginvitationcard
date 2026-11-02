/* RSVP: four event buttons, one form, validated and sent to the secure backend API (see backend/README.md). */
(function () {
  'use strict';
  var EV = [
    { k: 'hina', n: 'Rasm-e-Hina', b: 'Rasm-e-Hina', w: '20 November 2026, 6:00 PM' },
    { k: 'sehra', n: 'Sehra Bandi', b: 'Sehra Bandi', w: '21 November 2026, 8:00 AM' },
    { k: 'barat', n: 'Departure of Barat', b: 'Barat', w: '21 November 2026, 10:00 AM' },
    { k: 'walima', n: 'Walima', b: 'Walima', w: '22 November 2026, 2:00 PM' }
  ];
  var $ = function (s) { return document.querySelector(s); };
  var dlg = $('#rsvp-dlg'), form = $('#rsvp-form'), ok = $('#rsvp-ok'), err = $('#rsvp-err'), send = $('#rsvp-send'),
      box = $('#rsvp-events'), btns = $('#rsvp-buttons'), busy = false, startedAt = 0, requestId = '';

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
  function newId() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }

  EV.forEach(function (ev) {
    var b = el('button', 'btn t'); b.type = 'button';
    b.appendChild(el('span', '', 'I’m Coming to ' + ev.b)); b.appendChild(el('small', '', ev.w));
    b.addEventListener('click', function () { openForm(ev.k); }); btns.appendChild(b);

    var row = el('div', 'evr'), seg = el('div', 'seg');
    row.appendChild(el('b', '', ev.n)); row.appendChild(el('small', '', ev.w));
    [['Attending', false], ['Not Attending', true]].forEach(function (o) {
      var l = el('label'), i = el('input'); i.type = 'radio'; i.name = 'ev_' + ev.k; i.value = o[0]; i.checked = o[1];
      l.appendChild(i); l.appendChild(el('span', '', o[0])); seg.appendChild(l);
    });
    row.appendChild(seg); box.appendChild(row);
  });

  function setEv(k, v) { var i = form.querySelector('input[name="ev_' + k + '"][value="' + v + '"]'); if (i) i.checked = true; }
  function showErr(m) { err.textContent = m; err.hidden = false; err.scrollIntoView({ block: 'nearest' }); }

  function openForm(pre) {
    if (!busy) { form.reset(); EV.forEach(function (e) { setEv(e.k, 'Not Attending'); }); err.hidden = true; ok.hidden = true; form.hidden = false; requestId = newId(); startedAt = Date.now(); }
    if (pre) setEv(pre, 'Attending');
    if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
    form.elements.name.focus();
  }
  $('#rsvp-open').addEventListener('click', function () { openForm(); });
  $('#rsvp-all').addEventListener('click', function () { EV.forEach(function (e) { setEv(e.k, 'Attending'); }); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.hasAttribute('data-close')) { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); } });

  function collect() {
    var f = form.elements, ev = {};
    EV.forEach(function (e) { ev[e.k] = (form.querySelector('input[name="ev_' + e.k + '"]:checked') || {}).value || 'Not Attending'; });
    return { requestId: requestId, name: f.name.value.trim(), phone: f.phone.value.trim(), guests: parseInt(f.guests.value, 10),
             events: ev, message: f.message.value.trim(), website: f.website.value, elapsedMs: Date.now() - startedAt };
  }
  function problem(v) {
    if (v.name.length < 2) return 'Please enter your full name.';
    var d = v.phone.replace(/[\s\-()]/g, ''); if (!/^\+?\d{10,15}$/.test(d)) return 'Please enter a valid contact number (10 to 15 digits).';
    if (!(v.guests >= 1 && v.guests <= 20)) return 'Number of guests must be between 1 and 20.';
    if (!EV.some(function (e) { return v.events[e.k] === 'Attending'; })) return 'Please choose at least one occasion you will attend.';
    return '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault(); if (busy) return;                       /* blocks repeated clicks */
    var v = collect(), p = problem(v); if (p) { showErr(p); return; }
    var url = (window.WEDDING_CONFIG || {}).rsvpEndpoint;
    if (!url) { showErr('The RSVP service is not connected yet, so nothing was saved. Please call the family on the numbers shown on the invitation.'); return; }
    err.hidden = true; busy = true; send.disabled = true; send.textContent = 'Sending…';
    var ctrl = new AbortController(), to = setTimeout(function () { ctrl.abort(); }, 20000);
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v), signal: ctrl.signal })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { good: r.ok && d.ok === true, d: d }; }); })
      .then(function (res) {
        if (!res.good) throw new Error((res.d && res.d.error) || 'save failed');
        form.hidden = true; ok.hidden = false; requestId = newId();       /* success is shown only after the backend confirms storage */
      })
      .catch(function (x) { showErr(x && x.message && x.message !== 'save failed' && x.name !== 'AbortError' && x.name !== 'TypeError' ? x.message : 'We could not save your RSVP. Please check your connection and try again.'); })
      .then(function () { clearTimeout(to); busy = false; send.disabled = false; send.textContent = 'Send RSVP'; });
  });
})();
