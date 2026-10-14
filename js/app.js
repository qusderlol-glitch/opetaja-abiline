/* Õpetaja Abiline – main application */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var t = function (k, v) { return I18N.t(k, v); };
  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var PROVIDERS = ['claude', 'openai', 'gemini'];
  var WTYPES = ['lesson', 'indep', 'home', 'test', 'quiz'];
  var WTYPES_DOC = WTYPES.concat(['plan', 'cards', 'letter', 'rubric']);
  var COUNT_W = { plan: { def: 6, min: 3, max: 10, label: 'f.count.stages' }, cards: { def: 12, min: 4, max: 30, label: 'f.count.cards' }, rubric: { def: 5, min: 3, max: 8, label: 'f.count.criteria' }, letter: { def: 1, min: 1, max: 1, label: 'f.count.tasks' } };
  function wtypesFor(fmt) { return fmt === 'docx' ? WTYPES_DOC : WTYPES; }
  function isPlain() { return S.fmt === 'docx' && !!AI.PLAIN[S.wtype]; }
  function countCfg() {
    if (isPlain()) return COUNT_W[S.wtype];
    var c = COUNT[S.fmt]; return { def: c.def, min: c.min, max: c.max, label: S.fmt === 'pptx' ? 'f.count.slides' : 'f.count.tasks' };
  }
  function fixWtype() { if (wtypesFor(S.fmt).indexOf(S.wtype) < 0) S.wtype = 'lesson'; }
  var COUNT = { pptx: { def: 10, min: 4, max: 20 }, docx: { def: 12, min: 3, max: 30 }, xlsx: { def: 10, min: 3, max: 30 } };

  /* ------------------------------------------------------------------ storage */
  var DEFAULTS = {
    name: '', ui: 'et', outLang: 'et', outTouched: false, fmt: 'pptx', prov: 'gemini', wtype: 'lesson', level: 5, adv: {}, advGroup: 'general', theme: 'rose',
    keyMode: '', school: '', grade: '6', subject: 'math', answers: true, remember: true, welcomed: false, tutorialSeen: false,
    models: JSON.parse(JSON.stringify(AI.DEFAULT_MODELS)),
    music: { track: 0, volume: 0.5, load: true, keep: false }
  };

  function lsGet(store, key) { try { return store.getItem(key); } catch (e) { return null; } }
  function lsSet(store, key, val) { try { store.setItem(key, val); } catch (e) { /* private mode */ } }
  function lsDel(store, key) { try { store.removeItem(key); } catch (e) { /* ignore */ } }

  function loadSettings() {
    var s = JSON.parse(JSON.stringify(DEFAULTS));
    try {
      var raw = JSON.parse(lsGet(localStorage, 'oa.settings') || '{}');
      Object.keys(raw).forEach(function (k) {
        if (k === 'models' || k === 'music') Object.assign(s[k], raw[k]); else s[k] = raw[k];
      });
    } catch (e) { /* ignore */ }
    if (s.diff && !(parseInt(s.level, 10) >= 1)) s.level = { easy: 3, medium: 5, hard: 8 }[s.diff] || 5;   // old three-step choice
    delete s.diff;
    s.level = Math.max(1, Math.min(10, parseInt(s.level, 10) || 5));
    if (!s.adv || typeof s.adv !== 'object' || Array.isArray(s.adv)) s.adv = {};
    return s;
  }
  function saveSettings() { lsSet(localStorage, 'oa.settings', JSON.stringify(S)); }

  function loadKeys() {
    var k = { claude: ['', ''], openai: ['', ''], gemini: ['', ''] };
    var raw = lsGet(localStorage, 'oa.keys') || lsGet(sessionStorage, 'oa.keys');
    try {
      var o = JSON.parse(raw || '{}');
      PROVIDERS.forEach(function (p) { if (Array.isArray(o[p])) k[p] = [String(o[p][0] || ''), String(o[p][1] || '')]; });
    } catch (e) { /* ignore */ }
    return k;
  }
  function saveKeys() {
    var raw = JSON.stringify(KEYS);
    if (S.remember) { lsSet(localStorage, 'oa.keys', raw); lsDel(sessionStorage, 'oa.keys'); }
    else { lsSet(sessionStorage, 'oa.keys', raw); lsDel(localStorage, 'oa.keys'); }
  }
  function cleanKey(v) { return String(v || '').replace(/[\s"'`]+/g, ''); }
  var lastGood = {};   // the key that worked last time goes first, so a broken key is not retried every time
  function activeKeys(p) {
    if (usingShared() && p === 'gemini') return [AI.SHARED];
    var list = KEYS[p].map(cleanKey).filter(Boolean);
    var i = list.indexOf(lastGood[p]);
    if (i > 0) { list.splice(0, 0, list.splice(i, 1)[0]); }
    return list;
  }

  var S = loadSettings();
  var KEYS = loadKeys();
  if (!S.keyMode) {   // first visit: no key yet and the site key exists -> start with the site key (nothing to set up)
    var hasOwn = PROVIDERS.some(function (p) { return KEYS[p].some(Boolean); });
    S.keyMode = (!hasOwn && window.OA_CONFIG && OA_CONFIG.sharedUrl) ? 'shared' : 'own';
  }
  var RESULT = null, LAST_OPTS = null, ABORT = null;
  var RESULTS = { A: null, B: null }, curVar = 'A';
  var elapsedTimer = null, msgTimer = null, autoMusic = false, musicTouched = false;

  /* ------------------------------------------------------------------ helpers */
  function show(el) { el.classList.remove('hidden'); }
  function hide(el) { el.classList.add('hidden'); }
  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast'); el.textContent = msg; show(el);
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { hide(el); }, 3400);
  }
  function openModal(id) { show($('#' + id)); document.body.classList.add('noscroll'); }
  function closeModal(id) {
    hide($('#' + id));
    if (!$$('.modal:not(.hidden), .overlay:not(.hidden)').length) document.body.classList.remove('noscroll');
  }
  function sharedOn() { return !!(window.OA_CONFIG && OA_CONFIG.sharedUrl); }
  function usingShared() { return S.keyMode === 'shared' && sharedOn(); }
  function providerOf() { return usingShared() ? 'gemini' : S.prov; }   // one AI for every format

  /* ------------------------------------------------------------------ pages (the menu) */
  var SECS = ['home', 'make', 'result', 'history', 'settings', 'help'], curSec = 'home';
  function go(sec) {
    if (SECS.indexOf(sec) < 0) sec = 'home';
    if (sec === 'result' && !RESULT) sec = 'make';
    curSec = sec;
    SECS.forEach(function (x) { $('#sec-' + x).classList.toggle('hidden', x !== sec); });
    $$('.tab').forEach(function (b) { b.classList.toggle('active', b.dataset.go === sec); });
    $('#navResult').classList.toggle('off', !RESULT);
    document.body.dataset.sec = sec;
    if (sec === 'settings') buildSettings();
    if (sec === 'help') { renderHelp(); renderInstall(); }
    if (sec === 'home') renderKeyStatus();
    if (sec === 'history') renderHistory();
    if (location.hash !== '#' + sec) { try { location.hash = sec; } catch (e) { /* ignore */ } }
    window.scrollTo(0, 0);
  }
  function aiName(p) { return AI.META[p].name; }

  /* ------------------------------------------------------------------ rendering of the home screen */
  function renderGreeting() {
    var nm = I18N.capitalizeName(S.name);
    $('#greeting').textContent = (nm ? t('greet', { name: nm }) : t('greet.noname')) + ' 🌹';
  }

  function fillSelect(sel, items, value) {
    sel.innerHTML = items.map(function (it) { return '<option value="' + esc(it.v) + '">' + esc(it.l) + '</option>'; }).join('');
    sel.value = value;
    if (sel.value !== String(value) && items.length) sel.value = items[0].v;
  }

  function renderForm() {
    var gradeVal = $('#fGrade').value || S.grade, subjVal = $('#fSubject').value || S.subject;
    var grades = []; for (var g = 1; g <= 12; g++) grades.push({ v: String(g), l: t('grade.n', { n: g }) });
    fillSelect($('#fGrade'), grades, gradeVal);
    fillSelect($('#fSubject'), I18N.SUBJECT_IDS.map(function (id) { return { v: id, l: t('subj.' + id) }; }), subjVal);

    fixWtype();
    $('#typeChips').innerHTML = wtypesFor(S.fmt).map(function (w) {
      return '<button class="chip' + (S.wtype === w ? ' active' : '') + '" data-wtype="' + w + '">' + esc(t('wt.' + w)) + '</button>';
    }).join('');
    $('#typeDesc').textContent = t('wt.' + S.wtype + '.d');

    $('#themeSwatches').innerHTML = Object.keys(I18N.THEMES).map(function (k) {
      var th = I18N.THEMES[k];
      return '<button class="swatch' + (S.theme === k ? ' active' : '') + '" data-theme="' + k + '" aria-label="' + k + '" style="--sw1:#' + th.p + ';--sw2:#' + th.a + ';--sw3:#' + th.l + '"><i></i><i></i><i></i></button>';
    }).join('');

    renderTopicChips();
    updateFormatUI();
    renderLevel();
    $$('#providerSeg button').forEach(function (b) { b.classList.toggle('active', b.dataset.prov === S.prov); });
    $$('#uiLang button, #homeLang button').forEach(function (b) { b.classList.toggle('active', b.dataset.lang === S.ui); });
  }

  function renderTopicChips() {
    var list = (I18N.TOPICS[S.ui] || {})[$('#fSubject').value] || [];
    $('#topicChips').innerHTML = list.map(function (x) { return '<button class="chip" data-topic="' + esc(x) + '">' + esc(x) + '</button>'; }).join('');
  }

  function updateFormatUI() {
    $$('.fmt').forEach(function (b) { b.classList.toggle('active', b.dataset.fmt === S.fmt); });
    renderProvNote();
    fixWtype();
    var c = countCfg(), inp = $('#fCount'), plain = isPlain();
    $('#countLabel').textContent = t(c.label);
    inp.min = c.min; inp.max = c.max;
    $('#countLabel').parentNode.classList.toggle('hidden', S.wtype === 'letter' && plain);
    $('#fAnswers').parentNode.classList.toggle('hidden', plain);
    $('#rowGlossary').classList.toggle('hidden', plain);
    $('#rowVariantB').classList.toggle('hidden', S.fmt === 'pptx' || plain );
    $('#typeChips').innerHTML = wtypesFor(S.fmt).map(function (w) {
      return '<button class="chip' + (S.wtype === w ? ' active' : '') + '" data-wtype="' + w + '">' + esc(t('wt.' + w)) + '</button>';
    }).join('');
    $('#typeDesc').textContent = t('wt.' + S.wtype + '.d');
    updateKeyHint();
    renderAdv();
  }

  /* ------------------------------------------------------------------ difficulty 1-10 (slider + number + quick buttons) */
  var LEVEL_PRESET = { easy: 3, medium: 5, hard: 8 };
  function clampLevel(n) { n = parseInt(n, 10); return isFinite(n) ? Math.max(1, Math.min(10, n)) : null; }
  function setLevel(n, fromNumberBox) {
    n = clampLevel(n); if (n === null) return;
    S.level = n; saveSettings();
    $('#fLevel').value = n;
    if (!fromNumberBox) $('#fLevelNum').value = n;
    showLevelText();
    updateSummary();
  }
  function showLevelText() {
    var k = Math.ceil(S.level / 2);
    $('#levelText').innerHTML = '<b>' + esc(t('lvl.b' + k)) + '.</b> ' + esc(t('lvl.d' + k));
    $('#levelText').className = 'level-text lv' + k;
    $('#fLevel').style.setProperty('--lv', ((S.level - 1) / 9 * 100).toFixed(0) + '%');
    $$('#diffSeg button').forEach(function (b) { b.classList.toggle('active', LEVEL_PRESET[b.dataset.diff] === S.level); });
  }
  function renderLevel() { $('#fLevel').value = S.level; $('#fLevelNum').value = S.level; showLevelText(); }
  function diffOf(n) { return n <= 3 ? 'easy' : (n >= 8 ? 'hard' : 'medium'); }

  /* ------------------------------------------------------------------ advanced control */
  function cloneJson(o) { return JSON.parse(JSON.stringify(o || {})); }
  function renderAdv() {
    var r = Adv.render(S.adv, S.fmt, S.wtype, S.ui, S.advGroup);
    S.advGroup = r.group || S.advGroup;
    $('#advBody').innerHTML = r.html || '';
    refreshAdvPresets();
    refreshAdvMeta();
  }
  function refreshAdvMeta() {
    var info = Adv.groupsInfo(S.adv, S.fmt, S.wtype), total = 0;
    info.forEach(function (g) {
      total += g.n;
      var b = document.querySelector('[data-advtab="' + g.id + '"]'); if (!b) return;
      var dot = b.querySelector('.adv-dot');
      if (g.n) { if (!dot) { dot = document.createElement('i'); dot.className = 'adv-dot'; b.appendChild(dot); } dot.textContent = g.n; }
      else if (dot) dot.remove();
    });
    var c = $('#advCount');
    c.textContent = total ? t('adv.count', { n: total }) : ''; c.classList.toggle('hidden', !total);
    var mt = Adv.mixTotal(S.adv), ms = $('#advMixSum');
    if (ms) ms.textContent = mt ? t('adv.mix.sum', { n: mt }) : '';
    S.advChanged = total;
    updateSummary();
  }
  function refreshAdvPresets() {
    var names = Object.keys(Adv.presets());
    $('#advPresetSel').innerHTML = names.map(function (n) { return '<option value="' + esc(n) + '">' + esc(n) + '</option>'; }).join('');
    ['#advPresetSel', '#advPresetLoad', '#advPresetDel'].forEach(function (id) { $(id).classList.toggle('hidden', !names.length); });
  }
  function onAdvInput(el) {
    var id = el.dataset.adv;
    S.adv[id] = el.type === 'checkbox' ? el.checked : el.value;
    saveSettings(); refreshAdvMeta();
  }

  function updateSummary() {
    var el = $('#sumLine'); if (!el) return;
    var plain = isPlain(), parts = [t('wt.' + S.wtype)];
    parts.push(t('grade.n', { n: parseInt($('#fGrade').value, 10) || S.grade }));
    var sj = $('#fSubject').value; if (sj) parts.push(t('subj.' + sj));
    if (!(S.wtype === 'letter' && plain)) parts.push(t('sum.level', { n: S.level }));
    var mt = Adv.mixTotal(S.adv);
    var cnt = mt || parseInt($('#fCount').value, 10);
    if (cnt && !(S.wtype === 'letter' && plain)) parts.push(cnt + ' ' + t(countCfg().label === 'f.count.slides' ? 'sum.slides' : 'sum.tasks'));
    if (S.advChanged) parts.push(t('sum.adv', { n: S.advChanged }));
    el.innerHTML = '<span class="sum-h">' + esc(t('sum.title')) + '</span> ' + parts.map(esc).join(' · ');
  }

  /* ------------------------------------------------------------------ transfer code (keys and settings to another device) */
  function b64enc(str) { return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64dec(b) { b = b.replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '='; return decodeURIComponent(escape(atob(b))); }
  function makeTransferCode() {
    var settings = cloneJson(S); delete settings.advChanged;
    return 'OA1.' + b64enc(JSON.stringify({ v: 1, s: settings, k: KEYS, p: Adv.presets() }));
  }
  function importTransferCode(code) {
    code = String(code || '').replace(/\s+/g, '');
    if (code.indexOf('OA1.') !== 0) throw new Error('bad');
    var o = JSON.parse(b64dec(code.slice(4)));
    if (!o || o.v !== 1 || typeof o.s !== 'object') throw new Error('bad');
    var ns = cloneJson(DEFAULTS);
    Object.keys(o.s).forEach(function (k) {
      if (k === 'models' || k === 'music') Object.assign(ns[k], o.s[k]); else ns[k] = o.s[k];
    });
    ns.level = clampLevel(ns.level) || 5;
    if (!ns.adv || typeof ns.adv !== 'object') ns.adv = {};
    ns.welcomed = true; ns.tutorialSeen = true;
    Object.keys(S).forEach(function (k) { delete S[k]; });
    Object.assign(S, ns);
    var nk = { claude: ['', ''], openai: ['', ''], gemini: ['', ''] };
    PROVIDERS.forEach(function (p) { if (o.k && Array.isArray(o.k[p])) nk[p] = [cleanKey(o.k[p][0]), cleanKey(o.k[p][1])]; });
    KEYS = nk;
    if (o.p && typeof o.p === 'object') Adv.savePresets(o.p);
    saveSettings(); saveKeys();
  }


  function renderProvNote() {
    var el = $('#provNote'); if (!el) return;
    el.className = 'prov-note ' + S.prov;
    el.textContent = t('prov.note.' + S.prov);
  }

  function setProvider(p) {
    if (PROVIDERS.indexOf(p) < 0) return;
    S.prov = p; saveSettings();
    $$('#providerSeg button').forEach(function (b) { b.classList.toggle('active', b.dataset.prov === p); });
    renderProvNote(); updateKeyHint();
  }

  function renderKeyStatus() {
    var el = $('#keyStatus'); if (!el) return;
    var ok = activeKeys(providerOf()).length > 0;
    el.className = 'key-badge' + (ok ? ' ok' : '');
    el.textContent = usingShared() ? t('home.key.shared') : (ok ? t('home.key.ok', { ai: aiName(S.prov) }) : t('home.key.none'));
  }

  function updateKeyHint() {
    renderKeyStatus();
    var p = providerOf(S.fmt), el = $('#keyHint');
    if (activeKeys(p).length) { hide(el); return; }
    el.innerHTML = esc(t('hint.nokey', { ai: aiName(p) })) + ' <button class="linkbtn" data-act="openSettings">⚙️ ' + esc(t('set.open')) + '</button>';
    show(el);
  }

  function applyLanguage() {
    I18N.setLang(S.ui);
    I18N.applyStatic();
    renderGreeting(); renderForm(); renderMusicUI(); renderKeyStatus();
    if (curSec === 'settings') buildSettings();
    if (curSec === 'help') { renderHelp(); renderInstall(); }
    if (RESULT) renderResultHead();
  }

  function setUiLang(l) {
    S.ui = l;
    if (!S.outTouched) { S.outLang = l; $('#fOutLang').value = l; }
    saveSettings(); applyLanguage();
  }

  /* ------------------------------------------------------------------ settings modal */
  function buildSettings() {
    $('#setName').value = S.name;
    $('#setLang').value = S.ui;
    $('#setRemember').checked = !!S.remember;
    $('#setMusicLoad').checked = !!S.music.load;
    $('#setMusicKeep').checked = !!S.music.keep;
    $('#setVol').value = Math.round(Music.volume * 100);
    $('#modelClaude').value = S.models.claude; $('#modelOpenai').value = S.models.openai; $('#modelGemini').value = S.models.gemini;
    buildTrackSelect();
    $('#ownName').textContent = Music.hasOwn ? t('music.fileChosen', { name: Music.ownName }) : '';

    buildKeyGroups();
  }

  /* one AI at a time: pick it, then paste its two keys */
  function buildKeyGroups() {
    var modes = '<div class="mode-row"><span class="lbl">' + esc(t('mode.title')) + '</span><div class="mode-cards" id="keyModeSeg">' +
      ['shared', 'own'].map(function (m) {
        var off = m === 'shared' && !sharedOn(), act = m === 'shared' ? usingShared() : !usingShared();
        return '<button type="button" class="mode-card' + (act ? ' active' : '') + (off ? ' off' : '') + '" data-keymode="' + m + '"><b>' + esc(t('mode.' + m)) + '</b><span>' + esc(off ? t('mode.shared.off') : t('mode.' + m + '.d')) + '</span></button>';
      }).join('') + '</div></div>';
    if (usingShared()) { $('#keyGroups').innerHTML = modes + '<div class="prov-note gemini">' + esc(t('mode.shared.note')) + '</div>'; return; }
    var p = S.prov;
    var seg = '<div class="provider-row"><span class="lbl">' + esc(t('set.choose')) + '</span><div class="seg" id="setProvSeg">' +
      ['gemini', 'openai', 'claude'].map(function (q) { return '<button type="button" data-prov="' + q + '" class="' + (q === p ? 'active' : '') + '">' + esc(aiName(q)) + '</button>'; }).join('') + '</div></div>';
    var rows = [0, 1].map(function (i) {
      return '<div class="key-row"><label class="key-lbl">' + esc(t(i ? 'set.key2' : 'set.key1')) + '</label>' +
        '<div class="key-input"><input type="password" class="key-in" data-prov="' + p + '" data-idx="' + i + '" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(KEYS[p][i]) + '" placeholder="' + (p === 'claude' ? 'sk-ant-…' : (p === 'openai' ? 'sk-…' : 'AQ.… / AIza…')) + '">' +
        '<button type="button" class="mini" data-act="eye">' + esc(t('btn.show')) + '</button>' +
        '<button type="button" class="mini" data-act="testkey" data-prov="' + p + '" data-idx="' + i + '">' + esc(t('btn.test')) + '</button></div>' +
        '<div class="key-status" data-status="' + p + i + '"></div></div>';
    }).join('') + (p === 'gemini' ? '<div class="key-row"><button type="button" class="mini" data-act="findmodel">' + esc(t('set.findmodel')) + '</button><div class="key-status" id="modelStatus"></div></div>' : '');
    $('#keyGroups').innerHTML = modes + seg + '<div class="prov-note ' + p + '">' + esc(t('prov.note.' + p)) + '</div>' +
      '<div class="key-group"><div class="kg-head"><b>' + esc(aiName(p)) + '</b>' +
      '<a class="mini as-link" href="' + I18N.KEY_LINKS[p] + '" target="_blank" rel="noopener noreferrer">' + esc(t('set.getkey')) + '</a></div>' + rows + '</div>';
  }

  function buildTrackSelect() {
    var opts = Music.ids.map(function (id, i) { return '<option value="' + i + '">' + esc(t('music.names.' + id)) + '</option>'; });
    if (Music.hasOwn) opts.push('<option value="' + Music.ids.length + '">' + esc(t('music.names.own')) + '</option>');
    $('#setTrack').innerHTML = opts.join('');
    $('#setTrack').value = String(Music.trackId === 'own' ? Music.ids.length : Music.trackIndex);
  }

  function setStatus(p, i, text, cls) {
    var el = $('[data-status="' + p + i + '"]');
    if (!el) return; el.textContent = text; el.className = 'key-status ' + (cls || '');
  }

  async function testKey(p, i) {
    var inp = $('.key-in[data-prov="' + p + '"][data-idx="' + i + '"]');
    var key = cleanKey(inp.value);
    if (!key) { setStatus(p, i, t('key.empty'), 'bad'); return; }
    if (!AI.META[p].test.test(key)) setStatus(p, i, t('key.looksWrong', { ai: aiName(p) }), 'warn');
    else setStatus(p, i, t('key.testing'), '');
    var model = ($('#model' + p.charAt(0).toUpperCase() + p.slice(1)).value || '').trim() || AI.DEFAULT_MODELS[p];
    try {
      await AI.testKey(p, key, model);
      lastGood[p] = key;
      setStatus(p, i, t('key.ok'), 'ok');
    } catch (e) {
      // show the real reason from the provider (short), so a wrong key / model / quota can be told apart
      var why = e && e.detail ? ' (' + String(e.detail).replace(/\s+/g, ' ').slice(0, 140) + ')' : '';
      setStatus(p, i, errorMessage(e) + why, 'bad');
    }
  }

  function collectSettings() {
    S.name = $('#setName').value.trim().slice(0, 40); $('#homeName').value = S.name;
    var newLang = $('#setLang').value;
    S.remember = $('#setRemember').checked;
    S.music.load = $('#setMusicLoad').checked; S.music.keep = $('#setMusicKeep').checked;
    S.models.claude = $('#modelClaude').value.trim() || AI.DEFAULT_MODELS.claude;
    S.models.openai = $('#modelOpenai').value.trim() || AI.DEFAULT_MODELS.openai;
    S.models.gemini = $('#modelGemini').value.trim() || AI.DEFAULT_MODELS.gemini;
    $$('.key-in').forEach(function (inp) { KEYS[inp.dataset.prov][+inp.dataset.idx] = cleanKey(inp.value); });
    saveKeys();
    if (newLang !== S.ui) setUiLang(newLang); else { saveSettings(); renderGreeting(); updateKeyHint(); }
  }
  function saveFromSettings() { collectSettings(); toast(t('set.saved')); }

  /* ask Google which model this key can really use right now, and pick it */
  async function findModel() {
    var st = $('#modelStatus'); if (!st) return;
    var key = $$('.key-in').map(function (i) { return cleanKey(i.value); }).filter(Boolean)[0];
    if (!key) { st.textContent = t('key.empty'); st.className = 'key-status bad'; return; }
    st.className = 'key-status';
    try {
      var m = await AI.findGeminiModel(key, function (pr) { st.textContent = t('set.findmodel.try', { m: pr.model }); });
      S.models.gemini = m; $('#modelGemini').value = m; saveSettings();
      st.textContent = t('set.findmodel.ok', { m: m }); st.className = 'key-status ok';
    } catch (e) {
      var why = e && e.detail ? ' (' + String(e.detail).replace(/\s+/g, ' ').slice(0, 140) + ')' : '';
      st.textContent = errorMessage(e) + why; st.className = 'key-status bad';
    }
  }

  /* ------------------------------------------------------------------ help page and the arrow tour */
  function renderHelp() {
    var steps = I18N.TUT[S.ui] || I18N.TUT.et;
    $('#helpSteps').innerHTML = steps.map(function (st, i) {
      var link = st.link ? '<p class="tut-link"><a class="btn primary" href="' + I18N.KEY_LINKS[st.link] + '" target="_blank" rel="noopener noreferrer">' + esc(t('set.getkey')) + '</a></p>' : '';
      return '<div class="card help-step ' + (i % 2 ? 'tilt-r' : 'tilt-l') + '"><span class="num">' + (i + 1) + '</span><h3>' + esc(st.title) + '</h3>' + st.html + link + '</div>';
    }).join('');
  }
  var deferredInstall = null;
  var APK_URL = 'https://github.com/qusderlol-glitch/opetaja-abiline/releases/latest/download/opetaja-abiline.apk';
  function isStandalone() { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }
  function renderInstall() {
    var el = $('#installCard'); if (!el) return;
    if (window.OAAndroid || isStandalone()) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    var li = function (k) { return '<li>' + esc(t(k)) + '</li>'; };
    el.innerHTML = '<h2 class="card-title">' + esc(t('inst.title')) + '</h2><p class="soft">' + esc(t('inst.sub')) + '</p>' +
      '<div class="inst-cols"><div class="inst-col"><h3>🍎 ' + esc(t('inst.ios.t')) + '</h3><ol>' + li('inst.ios.1') + li('inst.ios.2') + li('inst.ios.3') + li('inst.ios.4') + '</ol></div>' +
      '<div class="inst-col"><h3>🤖 ' + esc(t('inst.and.t')) + '</h3><ol>' + li('inst.and.1') + li('inst.and.2') + '</ol>' +
      '<p><a class="btn" href="' + APK_URL + '" target="_blank" rel="noopener noreferrer">' + esc(t('inst.apk')) + '</a></p><p class="soft small">' + esc(t('inst.apk.note')) + '</p></div></div>' +
      '<div class="inst-actions">' + (deferredInstall ? '<button class="btn primary" data-act="install">' + esc(t('inst.btn')) + '</button>' : '') +
      '<button class="btn" data-act="sharesite">' + esc(t('inst.share')) + '</button></div>';
  }
  async function shareSite() {
    var data = { title: t('app.title'), url: location.origin + location.pathname };
    try { if (navigator.share) { await navigator.share(data); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(data.url); toast(t('inst.copied')); } catch (e) { window.prompt('', data.url); }
  }
  function startTour() {
    if (!S.tutorialSeen) { S.tutorialSeen = true; saveSettings(); }
    $('#startHere').classList.add('hidden');
    var steps = (I18N.TOUR[S.ui] || I18N.TOUR.et).filter(function (st) {
      return !usingShared() || !(st.sel && /^#(setProvSeg|keyGroups )/.test(st.sel));
    });
    Tour.start(steps, { go: go });
  }

  /* ------------------------------------------------------------------ music UI */
  function renderMusicUI() {
    var on = Music.playing;
    $('#btnMusic').classList.toggle('on', on);
    $('#btnMusic').setAttribute('aria-pressed', on ? 'true' : 'false');
    $('#lmPlay').textContent = on ? '⏸' : '▶';
    var id = Music.trackId;
    $('#loadTrack').textContent = on ? t('music.now', { name: t('music.names.' + id) }) : t('music.off');
    $('#lmVol').value = Math.round(Music.volume * 100);
    if (curSec === 'settings') buildTrackSelect();
  }

  function persistMusic() {
    S.music.track = Music.trackId === 'own' ? 0 : Music.trackIndex;
    S.music.volume = Music.volume;
    saveSettings();
  }

  /* ------------------------------------------------------------------ loading screen */
  function startLoading(titleKey) {
    $('#loadTitle').textContent = t(titleKey || 'load.title');
    $('#loadSub').textContent = '';
    AI.setStatus(function (st) { $('#loadSub').textContent = t('load.try', { m: st.model, n: st.n, max: st.max }); });
    $('#loadBar').style.width = '2%';
    var msgs = I18N.LOADING[S.ui] || I18N.LOADING.et, mi = Math.floor(Math.random() * msgs.length);
    $('#loadMsg').textContent = msgs[mi];
    clearInterval(msgTimer);
    msgTimer = setInterval(function () { mi = (mi + 1) % msgs.length; $('#loadMsg').textContent = msgs[mi]; }, 4800);
    var t0 = Date.now();
    clearInterval(elapsedTimer);
    elapsedTimer = setInterval(function () {
      var p = 93 * (1 - Math.exp(-(Date.now() - t0) / 24000));
      $('#loadBar').style.width = Math.max(2, p).toFixed(1) + '%';
    }, 250);
    musicTouched = false; autoMusic = false;
    if (S.music.load && Music.supported && !Music.playing) { Music.play(); autoMusic = true; }
    renderMusicUI();
    show($('#loading')); document.body.classList.add('noscroll');
  }

  function stopLoading(done) {
    AI.setStatus(null);
    clearInterval(elapsedTimer); clearInterval(msgTimer);
    if (done) $('#loadBar').style.width = '100%';
    var finish = function () { hide($('#loading')); if (!$$('.modal:not(.hidden), .overlay:not(.hidden)').length) document.body.classList.remove('noscroll'); };
    if (done) setTimeout(finish, 350); else finish();
    if (autoMusic && !musicTouched && !S.music.keep) Music.pause(1.4);
    autoMusic = false;
  }

  /* ------------------------------------------------------------------ errors */
  function errorMessage(e) {
    if (e && e.kind && ['badkey', 'quota', 'model', 'busy', 'network', 'parse', 'limit'].indexOf(e.kind) >= 0) return t('err.' + e.kind);
    return t('err.generic');
  }

  function showError(e) {
    var old = $('#errorModal'); if (old) old.remove();
    var kind = e && e.kind;
    var hint = (kind === 'quota' || kind === 'badkey' || kind === 'busy' || kind === 'limit') ? t('err.hint.' + kind) : '';
    var div = document.createElement('div');
    div.id = 'errorModal'; div.className = 'modal'; div.setAttribute('role', 'alertdialog'); div.setAttribute('aria-modal', 'true');
    div.innerHTML = '<div class="card modal-card small tilt-r"><div class="modal-head"><h2 class="hl">' + esc(t('err.title')) + '</h2></div>' +
      '<div class="modal-body"><p class="lead">' + esc(errorMessage(e)) + '</p>' + (hint ? '<p class="soft">' + esc(hint) + '</p>' : '') +
      (e && e.tried ? '<p class="fine">' + esc(t('err.tried', { n: e.tried })) + '</p>' : '') +
      (e && e.detail ? '<details class="fine"><summary>…</summary><code>' + esc(e.detail) + '</code></details>' : '') + '</div>' +
      '<div class="modal-foot"><button class="btn ghost" data-act="errClose">OK</button>' +
      (kind === 'badkey' || kind === 'quota' || kind === 'model' || kind === 'limit' ? '<button class="btn primary" data-act="errSettings">⚙️ ' + esc(t('set.open')) + '</button>' : '') + '</div></div>';
    document.body.appendChild(div);
    document.body.classList.add('noscroll');
    div.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-act]'); if (!a) return;
      div.remove(); if (!$$('.modal:not(.hidden), .overlay:not(.hidden)').length) document.body.classList.remove('noscroll');
      if (a.dataset.act === 'errSettings') go('settings');
    });
  }

  /* ------------------------------------------------------------------ form -> options */
  function readForm() {
    var c = countCfg();
    var count = parseInt($('#fCount').value, 10);
    if (!isFinite(count)) count = c.def;
    count = Math.max(c.min, Math.min(c.max, count));
    var subjectId = $('#fSubject').value, outLang = $('#fOutLang').value;
    return {
      fmt: S.fmt, wtype: S.wtype, grade: parseInt($('#fGrade').value, 10) || 6, subjectId: subjectId,
      subjectName: I18N.t('subj.' + subjectId, null, outLang),
      topic: $('#fTopic').value.trim(), extra: $('#fExtra').value.trim(), diff: diffOf(S.level), level: S.level, adv: Adv.collect(S.adv, S.fmt, S.wtype), count: count,
      outLang: outLang, theme: S.theme, school: $('#fSchool').value.trim(), answers: $('#fAnswers').checked,
      simple: $('#fSimple').checked, glossary: $('#fGlossary').checked, variantB: $('#fVariantB').checked && !$('#rowVariantB').classList.contains('hidden'),
      source: $('#fSource').value.trim().slice(0, 8000), signer: S.name
    };
  }

  function rememberForm() {
    S.grade = $('#fGrade').value; S.subject = $('#fSubject').value; S.outLang = $('#fOutLang').value;
    S.school = $('#fSchool').value.trim(); S.answers = $('#fAnswers').checked; saveSettings();
  }

  /* ------------------------------------------------------------------ generate */
  async function onMake(opts) {
    opts = opts || readForm();
    if (!opts.topic) { toast(t('err.topic')); $('#fTopic').focus(); showHome(); return; }
    var provider = providerOf(opts.fmt), keys = activeKeys(provider);
    if (!keys.length) { toast(t('err.nokey', { ai: aiName(provider) })); go('settings'); return; }
    LAST_OPTS = opts;
    ABORT = new AbortController();
    startLoading('load.title');
    try {
      var model = S.models[provider] || AI.DEFAULT_MODELS[provider], okFn = function (k) { lastGood[provider] = k; };
      AI.setCreativity((opts.adv || {}).creativity);
      var r = await AI.generate(opts, provider, keys, model, ABORT.signal, null, okFn);
      var rb = null;
      if (opts.variantB) {
        $('#loadTitle').textContent = t('load.b');
        try { rb = await AI.generateB(opts, r, provider, keys, model, ABORT.signal, null, okFn); }
        catch (eb) { if (eb && eb.name === 'AbortError') throw eb; rb = null; toast(errorMessage(eb)); }
      }
      if (rb) { var baseTitle = r.title; r.title = baseTitle + ' (A)'; rb.title = baseTitle + ' (B)'; }
      setResults(r, rb);
      historyAdd(opts); lsDel(localStorage, 'oa.draft');
      stopLoading(true);
      showResult(); confetti();
    } catch (e) {
      stopLoading(false);
      if (e && e.name === 'AbortError') { toast(t('toast.cancelled')); return; }
      showError(e);
    } finally { ABORT = null; }
  }

  function onDemo() {
    rememberForm();
    var opts = readForm(); LAST_OPTS = opts;
    var da = Demo.make(opts); da.demo = true; var db = null;
    if (opts.variantB) { db = Demo.make(Object.assign({}, opts, { variant: 'B' })); db.demo = true; var bt = da.title; da.title = bt + ' (A)'; db.title = bt + ' (B)'; }
    setResults(da, db);
    showResult();
  }

  async function regenSlide(i) {
    if (RESULT.demo) { toast(t('res.demoNote')); return; }
    var prov = providerOf(), keys = activeKeys(prov);
    if (!keys.length) { toast(t('err.nokey', { ai: aiName(prov) })); go('settings'); return; }
    ABORT = new AbortController();
    startLoading('load.title.slide');
    try {
      AI.setCreativity(((LAST_OPTS || {}).adv || {}).creativity);
      var s = await AI.regenSlide(RESULT, i, LAST_OPTS || readForm(), keys, S.models[prov] || AI.DEFAULT_MODELS[prov], ABORT.signal, null, function (k) { lastGood[prov] = k; }, prov);
      RESULT.slides[i] = s;
      stopLoading(true);
      renderPreview(true); toast(t('toast.slideDone'));
    } catch (e) {
      stopLoading(false);
      if (e && e.name === 'AbortError') toast(t('toast.cancelled')); else showError(e);
    } finally { ABORT = null; }
  }

  /* ------------------------------------------------------------------ history ("my works") */
  var HIST_KEY = 'oa.history', HIST_ID = 0, HIST_MAX = 12;
  function histLoad() { try { var a = JSON.parse(lsGet(localStorage, HIST_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function histSave(list) {
    list = list.slice(0, HIST_MAX);
    while (true) {
      try { localStorage.setItem(HIST_KEY, JSON.stringify(list)); return; } catch (e) { if (!list.length) return; list.pop(); }   // storage full: drop the oldest
    }
  }
  function historyAdd(opts) {
    if (!RESULTS.A || RESULTS.A.demo) return;
    var o = Object.assign({}, opts); delete o.source; delete o.signer;
    HIST_ID = Date.now();
    histSave([{ id: HIST_ID, opts: o, a: RESULTS.A, b: RESULTS.B }].concat(histLoad()));
  }
  function historyUpdate() {
    if (!HIST_ID || !RESULTS.A || RESULTS.A.demo) return;
    var list = histLoad(), i = list.findIndex(function (x) { return x.id === HIST_ID; });
    if (i >= 0) { list[i].a = RESULTS.A; list[i].b = RESULTS.B; histSave(list); }
  }
  function renderHistory() {
    var list = histLoad(), el = $('#histList');
    $('#histEmpty').classList.toggle('hidden', list.length > 0);
    $('#btnHistClear').classList.toggle('hidden', !list.length);
    el.innerHTML = list.map(function (h, i) {
      var r = h.a, d = new Date(h.id);
      var when = d.toLocaleDateString(S.ui === 'et' ? 'et-EE' : (S.ui === 'ru' ? 'ru-RU' : 'en-GB')) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      return '<div class="card hist-item ' + (i % 2 ? 'tilt-r' : 'tilt-l') + '"><svg class="ico" aria-hidden="true"><use href="#i-' + (r.kind === 'pptx' ? 'slides' : (r.kind === 'docx' ? 'word' : 'excel')) + '"/></svg>' +
        '<div class="hi-main"><div class="hi-title">' + esc(r.title) + (h.b ? ' <small>(A+B)</small>' : '') + '</div>' +
        '<div class="soft">' + esc(t('wt.' + r.wtype)) + ' · ' + esc(t('grade.n', { n: r.grade })) + ' · ' + esc(r.subject || '') + ' · ' + esc(when) + '</div></div>' +
        '<div class="hi-btns"><button class="btn primary small" data-hopen="' + h.id + '">' + esc(t('hist.open')) + '</button><button class="btn small danger" data-hdel="' + h.id + '">🗑</button></div></div>';
    }).join('');
  }
  function historyOpen(id) {
    var h = histLoad().find(function (x) { return x.id === id; }); if (!h) return;
    LAST_OPTS = h.opts; HIST_ID = h.id; setResults(h.a, h.b); showResult();
  }

  /* ------------------------------------------------------------------ refine a finished work */
  var REF = {
    simpler: 'Make it easier: simpler wording, smaller steps and easier tasks. Keep the same number of tasks or slides.',
    harder: 'Make it harder: more challenging content and reasoning tasks, still fair for the grade. Keep the same number of tasks or slides.',
    shorter: 'Make it shorter: remove the less important parts and tighten the wording, so there is about a third less content.',
    more: 'Add 3 more items of the same style (for a presentation 3 more content slides, otherwise 3 more tasks with answers).'
  };
  async function onRefine(instruction, lang) {
    if (!RESULT) return;
    if (RESULT.demo) { toast(t('ref.demo')); return; }
    var prov = providerOf(), keys = activeKeys(prov);
    if (!keys.length) { toast(t('err.nokey', { ai: aiName(prov) })); go('settings'); return; }
    var opts = Object.assign({}, LAST_OPTS || readForm(), { outLang: lang || RESULT.lang });
    var wasB = curVar;
    ABORT = new AbortController();
    startLoading('load.refine');
    try {
      AI.setCreativity((opts.adv || {}).creativity);
      var nr = await AI.refine(Preview.clean(RESULT), instruction, opts, prov, keys, S.models[prov] || AI.DEFAULT_MODELS[prov], ABORT.signal, null, function (k) { lastGood[prov] = k; });
      nr.title = nr.title || RESULT.title;
      if (RESULTS.A && RESULTS.B) nr.title = nr.title.replace(/\s*\([AB]\)$/, '') + ' (' + wasB + ')';
      RESULTS[wasB] = nr; RESULT = nr; if (lang) LAST_OPTS = opts;
      historyUpdate();
      stopLoading(true);
      renderResultHead(); renderPreview(false); toast(t('ref.done'));
    } catch (e) {
      stopLoading(false);
      if (e && e.name === 'AbortError') toast(t('toast.cancelled')); else showError(e);
    } finally { ABORT = null; }
  }

  function confetti() {
    try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) { /* ignore */ }
    var box = document.createElement('div'); box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
    var bits = ['🌹', '💖', '✨', '⭐', '🌸'];
    for (var i = 0; i < 26; i++) {
      var b = document.createElement('i'); b.textContent = bits[i % bits.length];
      b.style.left = (Math.random() * 100).toFixed(1) + '%'; b.style.animationDelay = (Math.random() * 0.6).toFixed(2) + 's';
      b.style.fontSize = (16 + Math.random() * 18).toFixed(0) + 'px'; b.style.animationDuration = (1.6 + Math.random() * 1.2).toFixed(2) + 's';
      box.appendChild(b);
    }
    document.body.appendChild(box); setTimeout(function () { box.remove(); }, 3400);
  }

  /* ------------------------------------------------------------------ result screen */
  function showHome() { go('make'); }

  function setResults(a, b) { RESULTS = { A: a, B: b || null }; curVar = 'A'; RESULT = a; }
  function switchVariant(v) { if (!RESULTS[v]) return; curVar = v; RESULT = RESULTS[v]; renderResultHead(); renderPreview(false); window.scrollTo(0, 0); }

  function renderResultHead() {
    var r = RESULT;
    $('#resTitle').textContent = r.title;
    $('#resMeta').textContent = t('res.meta', { type: t('wt.' + r.wtype), grade: t('grade.n', { n: r.grade }), subject: t('subj.' + (LAST_OPTS ? LAST_OPTS.subjectId : 'other')) }) + (r.demo ? '  ·  ' + t('res.demoNote') : '');
    $('#dlLabel').textContent = t('dl.' + r.kind);
    $('#btnPresent').classList.toggle('hidden', r.kind !== 'pptx');
    var two = !!(RESULTS.A && RESULTS.B);
    $('#variantBar').classList.toggle('hidden', !two);
    $('#btnDownloadBoth').classList.toggle('hidden', !two);
    $$('#variantBar button').forEach(function (b) { b.classList.toggle('active', b.dataset.var === curVar); });
  }

  function renderPreview(keepScroll) {
    var y = window.scrollY;
    $('#preview').innerHTML = Preview.html(RESULT, true);
    if (keepScroll) window.scrollTo(0, y);
  }

  function showResult() {
    renderResultHead();
    $('#preview').className = 'preview kind-' + RESULT.kind;
    renderPreview(false);
    go('result');
  }

  /* ------------------------------------------------------------------ downloads */
  var IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var pendingFile = null;   // array of Files waiting for a fresh tap (iPhone)

  function anchorSave(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 6000);
  }

  function blobToBase64(blob) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () { res(String(fr.result).split(',')[1] || ''); };
      fr.onerror = function () { rej(fr.error); };
      fr.readAsDataURL(blob);
    });
  }

  function canShareFile(file) {
    try { return !!(navigator.canShare && navigator.share && navigator.canShare({ files: [file] })); } catch (e) { return false; }
  }

  function closeSaveSheet() { pendingFile = null; hide($('#saveSheet')); }

  function offerSaveSheet(files) {
    pendingFile = files; $('#ssName').textContent = t('save.ready') + ': ' + files.map(function (f) { return f.name; }).join(', '); show($('#saveSheet'));
  }

  async function shareNow(files) {
    try { await navigator.share({ files: files, title: files[0].name }); closeSaveSheet(); toast(t('toast.saved')); }
    catch (e) { if (e && e.name !== 'AbortError') { files.forEach(function (f) { anchorSave(f, f.name); }); closeSaveSheet(); } }
  }

  /* Android app: the page is inside a WebView where blob downloads do not work, so the app saves it */
  /* iPhone / iPad: the Share sheet gives "Save to Files"; the first try may be refused (needs a fresh tap) */
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  async function saveFiles(list) {   // list: [{blob, name}]
    if (window.OAAndroid && window.OAAndroid.save) {
      try { for (var i = 0; i < list.length; i++) { window.OAAndroid.save(list[i].name, list[i].blob.type || 'application/octet-stream', await blobToBase64(list[i].blob)); if (i < list.length - 1) await wait(300); } return; } catch (e) { console.error(e); }
    }
    if (IS_IOS) {
      var files = list.map(function (x) { return new File([x.blob], x.name, { type: x.blob.type || 'application/octet-stream' }); });
      try {
        if (navigator.canShare && navigator.share && navigator.canShare({ files: files })) {
          try { await navigator.share({ files: files, title: files[0].name }); toast(t('toast.saved')); return; }
          catch (e) { if (e && e.name === 'AbortError') return; offerSaveSheet(files); return; }
        }
      } catch (e2) { /* fall through to a normal download */ }
    }
    for (var k = 0; k < list.length; k++) { anchorSave(list[k].blob, list[k].name); if (k < list.length - 1) await wait(700); }
  }
  function saveBlob(blob, name) { return saveFiles([{ blob: blob, name: name }]); }

  async function onDownloadBoth() {
    try {
      var list = [];
      for (var i = 0; i < 2; i++) {
        var r = Preview.clean(RESULTS[i ? 'B' : 'A']), out = await Build.make(r);
        list.push({ blob: new Blob([out.data], { type: out.mime }), name: Build.fileBase(r) + '.' + out.ext });
      }
      await saveFiles(list);
      if (!(IS_IOS || window.OAAndroid)) toast(t('toast.downloaded'));
    } catch (e) { console.error(e); toast(t('err.file')); }
  }

  async function onDownload() {
    try {
      var r = Preview.clean(RESULT);
      var out = await Build.make(r);
      await saveBlob(new Blob([out.data], { type: out.mime }), Build.fileBase(r) + '.' + out.ext);
      if (!(IS_IOS || window.OAAndroid)) toast(t('toast.downloaded'));
    } catch (e) { console.error(e); toast(t('err.file')); }
  }

  function onHtml() {
    var r = Preview.clean(RESULT);
    saveBlob(new Blob([Preview.exportHtml(r, S.ui)], { type: 'text/html;charset=utf-8' }), Build.fileBase(r) + '.html');
    toast(t('toast.downloaded'));
  }

  function onPrint() {
    var st = null;
    if (RESULT.kind === 'pptx') { st = document.createElement('style'); st.textContent = '@page{size:A4 landscape;margin:8mm}'; document.head.appendChild(st); }
    var after = function () { if (st) st.remove(); window.removeEventListener('afterprint', after); };
    window.addEventListener('afterprint', after);
    window.print();
  }

  /* ------------------------------------------------------------------ slide show */
  var presItems = [], presIdx = 0;
  function openPresenter() {
    presItems = Preview.slideShow(Preview.clean(RESULT)); presIdx = 0;
    show($('#presenter')); document.body.classList.add('noscroll'); drawPres();
    var el = $('#presenter'); if (el.requestFullscreen) el.requestFullscreen().catch(function () { /* fine */ });
  }
  function drawPres() {
    $('#presStage').innerHTML = presItems[presIdx];
    $('#presCount').textContent = (presIdx + 1) + ' / ' + presItems.length;
  }
  function closePresenter() {
    hide($('#presenter'));
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () { /* fine */ });
    if (!$$('.modal:not(.hidden), .overlay:not(.hidden)').length) document.body.classList.remove('noscroll');
  }
  function presMove(d) { presIdx = Math.max(0, Math.min(presItems.length - 1, presIdx + d)); drawPres(); }

  /* ------------------------------------------------------------------ events */
  function bind() {
    document.addEventListener('click', function (ev) {
      var el = ev.target;

      var lang = el.closest('[data-lang]');
      if (lang) { setUiLang(lang.dataset.lang); return; }
      var gob = el.closest('[data-go]');
      if (gob) { go(gob.dataset.go); return; }

      var fmt = el.closest('.fmt');
      if (fmt) {
        S.fmt = fmt.dataset.fmt;
        fixWtype(); $('#fCount').value = countCfg().def; saveSettings(); updateFormatUI(); return;
      }
      var prov = el.closest('#providerSeg button');
      if (prov) { setProvider(prov.dataset.prov); return; }
      var sprov = el.closest('#setProvSeg button');
      if (sprov) {
        $$('.key-in').forEach(function (inp) { KEYS[inp.dataset.prov][+inp.dataset.idx] = cleanKey(inp.value); });  // keep what was typed
        setProvider(sprov.dataset.prov); buildKeyGroups(); return;
      }
      var wt = el.closest('[data-wtype]');
      if (wt) { S.wtype = wt.dataset.wtype; saveSettings(); $('#fCount').value = countCfg().def; updateFormatUI(); return; }
      var df = el.closest('#diffSeg button');
      if (df) { setLevel(LEVEL_PRESET[df.dataset.diff]); return; }
      var at = el.closest('[data-advtab]');
      if (at) { S.advGroup = at.dataset.advtab; saveSettings(); renderAdv(); return; }
      var vb = el.closest('[data-var]');
      if (vb) { switchVariant(vb.dataset.var); return; }
      var rf = el.closest('[data-ref]');
      if (rf) { onRefine(REF[rf.dataset.ref]); return; }
      var rt = el.closest('[data-reftr]');
      if (rt) { onRefine('Translate everything into ' + ({ et: 'Estonian', ru: 'Russian', en: 'English' })[rt.dataset.reftr] + ' (all texts, headings, answers and options). Keep the structure unchanged.', rt.dataset.reftr); return; }
      var ho = el.closest('[data-hopen]');
      if (ho) { historyOpen(+ho.dataset.hopen); return; }
      var hd = el.closest('[data-hdel]');
      if (hd) { histSave(histLoad().filter(function (x) { return x.id !== +hd.dataset.hdel; })); renderHistory(); return; }
      var km = el.closest('[data-keymode]');
      if (km) {
        if (km.dataset.keymode === 'shared' && !sharedOn()) { toast(t('mode.shared.off')); return; }
        S.keyMode = km.dataset.keymode; saveSettings(); buildKeyGroups(); renderKeyStatus(); updateKeyHint(); return;
      }
      var sw = el.closest('[data-theme]');
      if (sw) { S.theme = sw.dataset.theme; saveSettings(); $$('#themeSwatches .swatch').forEach(function (b) { b.classList.toggle('active', b === sw); }); return; }
      var tp = el.closest('[data-topic]');
      if (tp) { $('#fTopic').value = tp.dataset.topic; $('#fTopic').focus(); return; }

      var act = el.closest('[data-act]');
      if (act) {
        var a = act.dataset.act;
        if (a === 'openSettings') go('settings');
        else if (a === 'eye') {
          var inp = act.parentNode.querySelector('.key-in'); var vis = inp.type === 'text';
          inp.type = vis ? 'password' : 'text'; act.textContent = t(vis ? 'btn.show' : 'btn.hide');
        }
        else if (a === 'testkey') testKey(act.dataset.prov, +act.dataset.idx);
        else if (a === 'findmodel') findModel();
        else if (a === 'install') { if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; renderInstall(); } }
        else if (a === 'sharesite') shareSite();
        else if (a === 'addb') {
          var i = +act.dataset.i; RESULT.slides[i].bullets.push('…'); renderPreview(true);
          var spans = $$('.ed[data-path^="slides.' + i + '.bullets."]'); var last = spans[spans.length - 1];
          if (last) { last.focus(); document.execCommand('selectAll', false, null); }
        }
        else if (a === 'regen') regenSlide(+act.dataset.i);
        else if (a === 'del') {
          if (RESULT.slides.length <= 1) return;
          if (window.confirm(t('res.delete') + '?')) { RESULT.slides.splice(+act.dataset.i, 1); renderPreview(true); }
        }
      }
    });

    /* header, home and help */
    $('#btnSettingsSave').addEventListener('click', saveFromSettings);
    $('#sec-settings').addEventListener('change', collectSettings);
    $('#btnMusic').addEventListener('click', function () { Music.toggle(); });
    $('#btnTour').addEventListener('click', startTour);
    $('#btnHelpTour').addEventListener('click', startTour);
    $('#btnHomeDemo').addEventListener('click', onDemo);
    $('#homeName').addEventListener('input', function () { S.name = $('#homeName').value.trim().slice(0, 40); saveSettings(); renderGreeting(); });

    /* forget keys */
    $('#btnForget').addEventListener('click', function () {
      KEYS = { claude: ['', ''], openai: ['', ''], gemini: ['', ''] };
      lsDel(localStorage, 'oa.keys'); lsDel(sessionStorage, 'oa.keys');
      buildSettings(); updateKeyHint(); toast(t('set.forgot'));
    });
    $('#btnModelsReset').addEventListener('click', function () {
      $('#modelClaude').value = AI.DEFAULT_MODELS.claude; $('#modelOpenai').value = AI.DEFAULT_MODELS.openai; $('#modelGemini').value = AI.DEFAULT_MODELS.gemini;
    });

    /* music settings apply immediately */
    $('#setTrack').addEventListener('change', function () { Music.setTrack(+$('#setTrack').value); persistMusic(); });
    $('#setVol').addEventListener('input', function () { Music.setVolume(+$('#setVol').value / 100); persistMusic(); });
    $('#setOwn').addEventListener('change', function () {
      var f = $('#setOwn').files && $('#setOwn').files[0];
      if (f) { Music.setOwnFile(f); $('#ownName').textContent = t('music.fileChosen', { name: f.name }); buildTrackSelect(); }
    });
    $('#lmPlay').addEventListener('click', function () { musicTouched = true; Music.toggle(); });
    $('#lmSkip').addEventListener('click', function () { musicTouched = true; if (!Music.playing) Music.play(); Music.next(); persistMusic(); });
    $('#lmVol').addEventListener('input', function () { Music.setVolume(+$('#lmVol').value / 100); persistMusic(); });
    Music.onChange(renderMusicUI);

    /* main buttons */
    $('#btnMake').addEventListener('click', function () { rememberForm(); onMake(); });
    $('#fTopic').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { rememberForm(); onMake(); } });
    $('#btnDemo').addEventListener('click', onDemo);
    $('#loadCancel').addEventListener('click', function () { if (ABORT) ABORT.abort(); });
    $('#refGo').addEventListener('click', function () {
      var v = $('#refText').value.trim().slice(0, 250); if (!v) { $('#refText').focus(); return; }
      onRefine('Apply this change requested by the teacher (keep the JSON shape): ' + v); $('#refText').value = '';
    });
    $('#refText').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); $('#refGo').click(); } });
    $('#btnHistClear').addEventListener('click', function () { if (window.confirm(t('hist.clear') + '?')) { histSave([]); renderHistory(); } });
    $('#btnDice').addEventListener('click', function () {
      var list = (I18N.TOPICS[S.ui] || {})[$('#fSubject').value] || []; if (!list.length) return;
      var cur = $('#fTopic').value, pick = list[Math.floor(Math.random() * list.length)];
      if (list.length > 1) while (pick === cur) pick = list[Math.floor(Math.random() * list.length)];
      $('#fTopic').value = pick;
    });
    var srcCount = function () { var n = $('#fSource').value.length; $('#srcCount').textContent = n ? n + ' / 8000' : ''; };
    $('#fSource').addEventListener('input', srcCount);
    $('#btnSrcFile').addEventListener('click', function () { $('#srcFile').click(); });
    $('#srcFile').addEventListener('change', function () {
      var f = this.files && this.files[0]; if (!f) return;
      if (f.size > 400000) { toast(t('err.file')); return; }
      var fr = new FileReader();
      fr.onload = function () { $('#fSource').value = String(fr.result).slice(0, 8000); srcCount(); $('#srcBox').open = true; };
      fr.readAsText(f); this.value = '';
    });
    $('#btnSrcClear').addEventListener('click', function () { $('#fSource').value = ''; srcCount(); });
    $('#btnDownload').addEventListener('click', onDownload);
    $('#btnDownloadBoth').addEventListener('click', onDownloadBoth);
    $('#btnHtml').addEventListener('click', onHtml);
    $('#btnPrint').addEventListener('click', onPrint);
    $('#btnPresent').addEventListener('click', openPresenter);
    $('#btnAgain').addEventListener('click', function () {
      if (RESULT && RESULT.demo) { onDemo(); return; }
      onMake(LAST_OPTS);
    });
    $('#presClose').addEventListener('click', closePresenter);
    $('#presPrev').addEventListener('click', function () { presMove(-1); });
    $('#presNext').addEventListener('click', function () { presMove(1); });

    /* form persistence */
    ['#fGrade', '#fSubject', '#fOutLang', '#fSchool', '#fAnswers'].forEach(function (id) {
      $(id).addEventListener('change', function () {
        if (id === '#fOutLang') S.outTouched = true;
        if (id === '#fSubject') renderTopicChips();
        rememberForm();
      });
    });

    /* difficulty: slider + number */
    $('#fLevel').addEventListener('input', function () { setLevel(this.value); });
    $('#fLevelNum').addEventListener('input', function () { var n = clampLevel(this.value); if (n !== null && String(n) === String(this.value).trim()) setLevel(n, true); });
    $('#fLevelNum').addEventListener('change', function () { var n = clampLevel(this.value); setLevel(n === null ? S.level : n); });

    /* advanced control */
    var advBody = $('#advBody');
    advBody.addEventListener('input', function (ev) { var el = ev.target.closest('[data-adv]'); if (el && el.type !== 'checkbox' && el.tagName !== 'SELECT') onAdvInput(el); });
    advBody.addEventListener('change', function (ev) { var el = ev.target.closest('[data-adv]'); if (el) onAdvInput(el); });
    $('#advReset').addEventListener('click', function () { S.adv = {}; saveSettings(); renderAdv(); toast(t('adv.reset.done')); });
    $('#advPresetSave').addEventListener('click', function () {
      var name = $('#advPresetName').value.trim().slice(0, 30);
      if (!name) { $('#advPresetName').focus(); return; }
      var all = Adv.presets(); all[name] = cloneJson(S.adv); Adv.savePresets(all);
      $('#advPresetName').value = ''; refreshAdvPresets(); $('#advPresetSel').value = name; toast(t('adv.preset.saved'));
    });
    $('#advPresetLoad').addEventListener('click', function () {
      var all = Adv.presets(), n = $('#advPresetSel').value; if (!all[n]) return;
      S.adv = cloneJson(all[n]); saveSettings(); renderAdv();
    });
    $('#advPresetDel').addEventListener('click', function () {
      var all = Adv.presets(), n = $('#advPresetSel').value; if (!all[n]) return;
      delete all[n]; Adv.savePresets(all); refreshAdvPresets();
    });
    ['#fCount'].forEach(function (id) { $(id).addEventListener('input', updateSummary); });
    ['#fGrade', '#fSubject'].forEach(function (id) { $(id).addEventListener('change', updateSummary); });

    /* the teacher's text is kept if the page is reloaded; Ctrl+Enter makes the work */
    var draftT = null;
    var saveDraft = function () {
      clearTimeout(draftT);
      draftT = setTimeout(function () { lsSet(localStorage, 'oa.draft', JSON.stringify({ topic: $('#fTopic').value, extra: $('#fExtra').value })); }, 400);
    };
    ['#fTopic', '#fExtra'].forEach(function (id) { $(id).addEventListener('input', saveDraft); });
    ['#fTopic', '#fExtra', '#fSource'].forEach(function (id) {
      $(id).addEventListener('keydown', function (ev) { if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') { ev.preventDefault(); rememberForm(); onMake(); } });
    });

    /* transfer code */
    $('#btnTrCopy').addEventListener('click', function () {
      var code = makeTransferCode(), box = $('#trOut'); box.value = code;
      var done = function () { toast(t('tr.copied')); };
      var fail = function () { show(box); box.focus(); box.select(); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, fail); else fail();
    });
    $('#btnTrShow').addEventListener('click', function () {
      var box = $('#trOut'); box.value = makeTransferCode(); box.classList.toggle('hidden');
    });
    $('#btnTrImport').addEventListener('click', function () {
      var msg = $('#trMsg');
      try {
        importTransferCode($('#trIn').value);
        $('#trIn').value = ''; msg.textContent = t('tr.ok'); msg.className = 'fine ok';
        $('#fOutLang').value = S.outLang; $('#fSchool').value = S.school; $('#fAnswers').checked = !!S.answers; $('#homeName').value = S.name;
        applyLanguage(); buildSettings(); updateKeyHint();
      } catch (er) { msg.textContent = t('tr.bad'); msg.className = 'fine bad'; }
    });

    /* editing inside the preview */
    var pv = $('#preview');
    pv.addEventListener('input', function (ev) {
      var el = ev.target.closest('.ed'); if (!el || !RESULT) return;
      Preview.setPath(RESULT, el.dataset.path, el.textContent);
      if (el.dataset.path === 'title') $('#resTitle').textContent = RESULT.title;
    });
    pv.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && ev.target.closest('.ed')) { ev.preventDefault(); ev.target.blur(); } });
    pv.addEventListener('paste', function (ev) {
      if (!ev.target.closest('.ed')) return;
      ev.preventDefault();
      var txt = (ev.clipboardData || window.clipboardData).getData('text/plain').replace(/\s*\n\s*/g, ' ');
      document.execCommand('insertText', false, txt);
    });

    /* keyboard */
    document.addEventListener('keydown', function (ev) {
      if (!$('#presenter').classList.contains('hidden')) {
        if (ev.key === 'ArrowRight' || ev.key === 'PageDown' || ev.key === ' ') { ev.preventDefault(); presMove(1); }
        else if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') { ev.preventDefault(); presMove(-1); }
        else if (ev.key === 'Escape') closePresenter();
        return;
      }
    });
    document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement && !$('#presenter').classList.contains('hidden')) closePresenter(); });
  }

  /* ------------------------------------------------------------------ start */
  function init() {
    var pcss = document.createElement('style'); pcss.id = 'previewCss'; pcss.textContent = Preview.css; document.head.appendChild(pcss);
    I18N.setLang(S.ui);
    Music.setVolume(S.music.volume);
    Music.setTrack(S.music.track || 0);
    $('#fOutLang').value = S.outLang; $('#fSchool').value = S.school; $('#fAnswers').checked = !!S.answers;
    fixWtype(); $('#fCount').value = countCfg().def;
    try { var dr = JSON.parse(lsGet(localStorage, 'oa.draft') || '{}'); if (dr.topic) $('#fTopic').value = String(dr.topic).slice(0, 200); if (dr.extra) $('#fExtra').value = String(dr.extra).slice(0, 1000); } catch (e) { /* ignore */ }
    I18N.applyStatic();
    renderGreeting(); renderForm(); renderMusicUI();
    $('#fGrade').value = S.grade; $('#fSubject').value = S.subject; renderTopicChips();
    bind();
    $('#homeName').value = S.name;
    if (S.tutorialSeen) $('#startHere').classList.add('hidden');
    Tour.init();
    $('#ssBtn').addEventListener('click', function () { if (pendingFile) shareNow(pendingFile); });
    $('#ssClose').addEventListener('click', closeSaveSheet);
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; if (curSec === 'help') renderInstall(); });
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && !window.OAAndroid) navigator.serviceWorker.register('sw.js').catch(function () { /* offline mode is optional */ });
    window.addEventListener('hashchange', function () { var h = location.hash.replace('#', ''); if (h !== curSec && SECS.indexOf(h) >= 0) go(h); });
    var h0 = location.hash.replace('#', '');
    go(SECS.indexOf(h0) >= 0 && h0 !== 'result' ? h0 : 'home');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
