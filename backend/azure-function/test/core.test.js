'use strict';
const test = require('node:test'); const assert = require('node:assert');
const c = require('../src/lib/rsvp-core');
const good = () => ({ requestId: 'abc-12345678', name: 'Ali Khan', phone: '0300 1234567', guests: 3,
  events: { hina: 'Attending', sehra: 'Not Attending', barat: 'Attending', walima: 'Attending' }, message: '=HYPERLINK("x")', website: '', elapsedMs: 9000 });
test('valid RSVP becomes a row with Pakistan time and safe text', () => {
  const v = c.validate(good()); assert.equal(v.errors, null);
  assert.match(v.row.submissionDate, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  assert.equal(v.row.contactNumber, '03001234567'); assert.ok(v.row.additionalMessage.startsWith("'="));
});
test('rejects missing name, bad phone, no attending event', () => {
  assert.ok(c.validate({ ...good(), name: '' }).errors.name);
  assert.ok(c.validate({ ...good(), phone: '12' }).errors.phone);
  assert.ok(c.validate({ ...good(), events: { hina: 'Not Attending', sehra: 'Not Attending', barat: 'Not Attending', walima: 'Not Attending' } }).errors.events);
});
test('honeypot, fast submit, origin allow-list and rate limit', () => {
  assert.ok(c.isBot({ website: 'x' })); assert.ok(c.isBot({ elapsedMs: 500 })); assert.ok(!c.isBot(good()));
  assert.equal(c.allowedOrigin('https://a.github.io/', 'https://a.github.io'), 'https://a.github.io');
  assert.equal(c.allowedOrigin('https://evil.com', 'https://a.github.io'), null);
  let last; for (let i = 0; i < 6; i++) last = c.rateLimited('1.2.3.4', 5, 60000); assert.equal(last, true);
});
test('Karachi time is UTC+5', () => assert.equal(c.karachiNow(new Date('2026-11-20T13:00:00Z')), '2026-11-20 18:00:00'));
