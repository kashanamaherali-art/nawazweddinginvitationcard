'use strict';
/* Pure helpers (no Azure dependency) so they can be unit-tested: node --test test/ */
const crypto = require('crypto');

const EVENTS = [
  { key: 'hina', label: 'Rasm-e-Hina' }, { key: 'sehra', label: 'Sehra Bandi' },
  { key: 'barat', label: 'Departure of Barat' }, { key: 'walima', label: 'Walima' }
];
const hits = new Map();   // best-effort per-instance rate limit (see backend/README.md for stronger options)
const seen = new Map();   // recent successful requestIds, to ignore accidental double submits

const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const excelSafe = (s) => (/^[=+\-@]/.test(s) ? "'" + s : s);   // stops formula injection when a cell is opened in Excel

function allowedOrigin(origin, list) {
  const allowed = String(list || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
  const o = String(origin || '').replace(/\/$/, '');
  return o && allowed.includes(o) ? o : null;
}
function rateLimited(ip, max, windowMs, now = Date.now()) {
  const a = (hits.get(ip) || []).filter((t) => now - t < windowMs); a.push(now); hits.set(ip, a);
  if (hits.size > 5000) hits.clear();
  return a.length > max;
}
function karachiNow(d = new Date()) {
  const p = {};
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
    .formatToParts(d).forEach((x) => { p[x.type] = x.value; });
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;   // Pakistan Standard Time
}
function isBot(b) { return !!(b && (b.website || (typeof b.elapsedMs === 'number' && b.elapsedMs < 2500))); }

function validate(b) {
  const errors = {};
  if (!b || typeof b !== 'object') return { errors: { body: 'Invalid request.' } };
  const name = clean(b.name, 80);
  const phone = String(b.phone == null ? '' : b.phone).replace(/[\s\-()]/g, '');
  const guests = Number(b.guests);
  const message = clean(b.message, 500);
  const requestId = String(b.requestId || '');
  if (name.length < 2) errors.name = 'Full name is required.';
  if (!/^\+?\d{10,15}$/.test(phone)) errors.phone = 'A valid contact number is required.';
  if (!Number.isInteger(guests) || guests < 1 || guests > 20) errors.guests = 'Guests must be between 1 and 20.';
  if (!/^[A-Za-z0-9-]{8,64}$/.test(requestId)) errors.requestId = 'Missing request id.';
  const ev = (b.events && typeof b.events === 'object') ? b.events : {};
  const answers = {};
  EVENTS.forEach((e) => {
    const v = ev[e.key];
    if (v !== 'Attending' && v !== 'Not Attending') errors['event_' + e.key] = 'Invalid answer for ' + e.label + '.';
    answers[e.key] = v;
  });
  if (!Object.keys(errors).length && !EVENTS.some((e) => answers[e.key] === 'Attending')) errors.events = 'Select at least one occasion.';
  if (Object.keys(errors).length) return { errors };
  return {
    errors: null, requestId,
    row: {   // field names match power-automate/request-schema.json and the WeddingRSVP columns
      submissionId: crypto.randomUUID(), submissionDate: karachiNow(),
      guestName: excelSafe(name), contactNumber: phone, totalGuests: guests,
      rasmEHina: answers.hina, sehraBandi: answers.sehra, departureOfBarat: answers.barat, walima: answers.walima,
      additionalMessage: excelSafe(message)
    }
  };
}
const wasSeen = (id) => { const t = seen.get(id); return !!t && Date.now() - t < 3600000; };
const markSeen = (id) => { if (seen.size > 5000) seen.clear(); seen.set(id, Date.now()); };

module.exports = { EVENTS, clean, excelSafe, allowedOrigin, rateLimited, karachiNow, isBot, validate, wasSeen, markSeen };
