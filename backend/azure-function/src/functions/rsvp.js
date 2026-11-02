'use strict';
const { app } = require('@azure/functions');
const core = require('../lib/rsvp-core');

app.http('rsvp', {
  methods: ['POST', 'OPTIONS'], authLevel: 'anonymous', route: 'rsvp',
  handler: async (request, context) => {
    const origin = core.allowedOrigin(request.headers.get('origin'), process.env.ALLOWED_ORIGINS);
    const cors = origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' } : {};
    const reply = (status, body) => ({ status, headers: cors, jsonBody: body });

    if (!origin) return { status: 403, jsonBody: { ok: false, error: 'Origin not allowed.' } };   // CORS allow-list
    if (request.method === 'OPTIONS') return { status: 204, headers: cors };

    const ip = String(request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim().replace(/:\d+$/, '');
    if (core.rateLimited(ip, Number(process.env.RATE_LIMIT_MAX || 5), Number(process.env.RATE_LIMIT_WINDOW_MS || 600000)))
      return reply(429, { ok: false, error: 'Too many attempts. Please wait a few minutes and try again.' });
    if (Number(request.headers.get('content-length') || 0) > 8192) return reply(413, { ok: false, error: 'Request too large.' });

    let body;
    try { body = await request.json(); } catch { return reply(400, { ok: false, error: 'Invalid JSON.' }); }
    if (core.isBot(body)) return reply(200, { ok: true });   // honeypot / too-fast submit: pretend success, store nothing

    const v = core.validate(body);
    if (v.errors) return reply(422, { ok: false, error: 'Please check the form and try again.', fields: v.errors });
    if (core.wasSeen(v.requestId)) return reply(200, { ok: true, duplicate: true });

    const flowUrl = process.env.POWER_AUTOMATE_URL;
    if (!flowUrl) { context.error('POWER_AUTOMATE_URL is not configured'); return reply(503, { ok: false, error: 'RSVP storage is not configured yet.' }); }

    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(flowUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v.row), signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) { context.error('Power Automate returned ' + res.status); return reply(502, { ok: false, error: 'Your RSVP could not be saved. Please try again.' }); }
      core.markSeen(v.requestId);
      context.log('RSVP stored', v.row.submissionId);   // no personal data in logs
      return reply(200, { ok: true, submissionId: v.row.submissionId });   // success only after Excel flow confirmed
    } catch (e) {
      context.error('Forwarding failed: ' + (e && e.name));
      return reply(502, { ok: false, error: 'Your RSVP could not be saved. Please try again.' });
    }
  }
});
