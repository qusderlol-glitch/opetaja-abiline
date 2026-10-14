/* Õpetaja Abiline – "site key" proxy (Cloudflare Worker).
   The browser sends {system, user, maxTokens}; this Worker adds the secret Gemini key, tries a few Gemini
   models, enforces daily limits and returns {text}. The key lives ONLY in the Worker secret GEMINI_KEY. */

const DEFAULTS = {
  ALLOW_ORIGINS: 'https://qusderlol-glitch.github.io',
  MODEL: 'gemini-3.5-flash',
  DAY_LIMIT_IP: '30',        // works per IP address per day (a whole school may share one IP)
  DAY_LIMIT_TOTAL: '250',    // works per day for the whole site (Gemini's free tier is limited)
  MAX_SYSTEM: '20000',
  MAX_USER: '40000',
  TRY_MS: '35000'
};

const FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'];

function cfg(env, k) { return (env && env[k] !== undefined && env[k] !== '') ? String(env[k]) : DEFAULTS[k]; }

function corsHeaders(origin, env) {
  const allowed = cfg(env, 'ALLOW_ORIGINS').split(',').map(function (s) { return s.trim(); });
  const ok = origin && allowed.indexOf(origin) >= 0;
  return ok ? {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, GET, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    'vary': 'origin'
  } : { 'vary': 'origin' };
}

function json(obj, status, extra) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, extra || {}) });
}

function today() { return new Date().toISOString().slice(0, 10); }

async function getCount(kv, key) { const v = await kv.get(key); return v ? parseInt(v, 10) || 0 : 0; }
async function setCount(kv, key, n) { await kv.put(key, String(Math.max(0, n)), { expirationTtl: 172800 }); }

async function callGemini(env, model, body) {
  const ctl = new AbortController();
  const timer = setTimeout(function () { ctl.abort(); }, parseInt(cfg(env, 'TRY_MS'), 10));
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
      method: 'POST', signal: ctl.signal,
      headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_KEY },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    let data = null; try { data = JSON.parse(text); } catch (e) { /* not json */ }
    return { status: res.status, data: data, raw: text.slice(0, 300) };
  } catch (e) {
    return { status: 0, data: null, raw: 'no answer within time' };
  } finally { clearTimeout(timer); }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin') || '';
    const cors = corsHeaders(origin, env);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (url.pathname === '/health') return json({ ok: true, key: !!env.GEMINI_KEY, kv: !!env.RATE }, 200, cors);
    if (url.pathname !== '/generate' || request.method !== 'POST') return json({ error: { message: 'Not found' } }, 404, cors);

    // only our own page may use it (browsers always send Origin on cross-site POST)
    if (!cors['access-control-allow-origin']) return json({ error: { message: 'Forbidden origin' } }, 403, cors);
    if (!env.GEMINI_KEY) return json({ error: { message: 'Site key is not set up (GEMINI_KEY missing)' } }, 500, cors);

    let body;
    try { body = await request.json(); } catch (e) { return json({ error: { message: 'Bad JSON' } }, 400, cors); }
    const system = typeof body.system === 'string' ? body.system : '';
    const user = typeof body.user === 'string' ? body.user : '';
    if (!user || system.length > parseInt(cfg(env, 'MAX_SYSTEM'), 10) || user.length > parseInt(cfg(env, 'MAX_USER'), 10)) {
      return json({ error: { message: 'Request too large or empty' } }, 413, cors);
    }
    const maxTokens = Math.max(64, Math.min(16000, parseInt(body.maxTokens, 10) || 16000));
    const temperature = (typeof body.temperature === 'number' && isFinite(body.temperature)) ? Math.max(0, Math.min(1.5, body.temperature)) : null;

    // ---- daily limits (KV is optional but strongly recommended) ----
    let kv = env.RATE, ipKey = null, totalKey = null, ipN = 0, totalN = 0;
    if (kv) {
      const ip = request.headers.get('cf-connecting-ip') || 'unknown';
      ipKey = 'ip:' + today() + ':' + ip; totalKey = 'total:' + today();
      [ipN, totalN] = await Promise.all([getCount(kv, ipKey), getCount(kv, totalKey)]);
      if (ipN >= parseInt(cfg(env, 'DAY_LIMIT_IP'), 10)) return json({ error: { message: 'LIMIT_IP: daily limit for this connection is used up' } }, 429, cors);
      if (totalN >= parseInt(cfg(env, 'DAY_LIMIT_TOTAL'), 10)) return json({ error: { message: 'LIMIT_TOTAL: the site limit for today is used up' } }, 429, cors);
      await Promise.all([setCount(kv, ipKey, ipN + 1), setCount(kv, totalKey, totalN + 1)]);
    }

    const geminiBody = {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: Object.assign({ responseMimeType: 'application/json', maxOutputTokens: maxTokens }, temperature !== null ? { temperature: temperature } : {})
    };

    const queue = [cfg(env, 'MODEL')].concat(FALLBACK_MODELS).filter(function (m, i, a) { return a.indexOf(m) === i; });
    let last = null;
    for (const model of queue) {
      const r = await callGemini(env, model, geminiBody);
      if (r.status === 200 && r.data) {
        const parts = r.data.candidates && r.data.candidates[0] && r.data.candidates[0].content && r.data.candidates[0].content.parts;
        const text = (parts || []).map(function (p) { return p.text || ''; }).join('');
        if (text) return json({ text: text, model: model }, 200, cors);
      }
      last = r;
      if (r.status === 400 || r.status === 401 || r.status === 403) break;   // our key is broken: other models will not help
    }

    // nothing worked: give the teacher's count back, it was not her fault
    if (kv) { try { await Promise.all([setCount(kv, ipKey, ipN), setCount(kv, totalKey, totalN)]); } catch (e) { /* ignore */ } }
    if (last && last.status === 429) return json({ error: { message: 'LIMIT_GOOGLE: Gemini free quota is used up for now' } }, 429, cors);
    return json({ error: { message: 'Gemini is busy: ' + (last ? last.status + ' ' + last.raw : 'no answer') } }, 503, cors);
  }
};
