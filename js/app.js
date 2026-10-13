/* Õpetaja Abiline – main application */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var t = function (k, v) { return I18N.t(k, v); };
  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var PROVIDERS = ['claude', 'openai', 'gemini'];
  var WTYPES = ['lesson', 'indep', 'home', 'test', 'quiz'];
  var COUNT = { pptx: { def: 10, min: 4, max: 20 }, docx: { def: 12, min: 3, max: 30 }, xlsx: { def: 10, min: 3, max: 30 } };

  /* ------------------------------------------------------------------ storage */
  var DEFAULTS = {
    name: '', ui: 'et', outLang: 'et', outTouched: false, fmt: 'pptx', prov: 'gemini', wtype: 'lesson', diff: 'medium', theme: 'rose',
    school: '', grade: '6', subject: 'math', answers: true, remember: true, welcomed: false, tutorialSeen: false,
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
    var list = KEYS[p].map(cleanKey).filter(Boolean);
    var i = list.indexOf(lastGood[p]);
    if (i > 0) { list.splice(0, 0, list.splice(i, 1)[0]); }
    return list;
  }

  var S = loadSettings();
  var KEYS = loadKeys();
  var RESULT = null, LAST_OPTS = null, ABORT = null;
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
  function providerOf(fmt) { return fmt === 'pptx' ? 'claude' : S.prov; }
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

    $('#typeChips').innerHTML = WTYPES.map(function (w) {
      return '<button class="chip' + (S.wtype === w ? ' active' : '') + '" data-wtype="' + w + '">' + esc(t('wt.' + w)) + '</button>';
    }).join('');
    $('#typeDesc').textContent = t('wt.' + S.wtype + '.d');

    $('#themeSwatches').innerHTML = Object.keys(I18N.THEMES).map(function (k) {
      var th = I18N.THEMES[k];
      return '<button class="swatch' + (S.theme === k ? ' active' : '') + '" data-theme="' + k + '" aria-label="' + k + '" style="--sw1:#' + th.p + ';--sw2:#' + th.a + ';--sw3:#' + th.l + '"><i></i><i></i><i></i></button>';
    }).join('');

    renderTopicChips();
    updateFormatUI();
    $$('#diffSeg button').forEach(function (b) { b.classList.toggle('active', b.dataset.diff === S.diff); });
    $$('#providerSeg button').forEach(function (b) { b.classList.toggle('active', b.dataset.prov === S.prov); });
    $$('#uiLang button, #welcomeLang button').forEach(function (b) { b.classList.toggle('active', b.dataset.lang === S.ui); });
  }

  function renderTopicChips() {
    var list = (I18N.TOPICS[S.ui] || {})[$('#fSubject').value] || [];
    $('#topicChips').innerHTML = list.map(function (x) { return '<button class="chip" data-topic="' + esc(x) + '">' + esc(x) + '</button>'; }).join('');
  }

  function updateFormatUI() {
    $$('.fmt').forEach(function (b) { b.classList.toggle('active', b.dataset.fmt === S.fmt); });
    $('#providerRow').classList.toggle('hidden', S.fmt === 'pptx');
    $('#countLabel').textContent = t(S.fmt === 'pptx' ? 'f.count.slides' : 'f.count.tasks');
    var c = COUNT[S.fmt], inp = $('#fCount');
    inp.min = c.min; inp.max = c.max;
    updateKeyHint();
  }

  function updateKeyHint() {
    var p = providerOf(S.fmt), el = $('#keyHint');
    if (activeKeys(p).length) { hide(el); return; }
    el.innerHTML = esc(t('hint.nokey', { ai: aiName(p) })) + ' <button class="linkbtn" data-act="openSettings">⚙️ ' + esc(t('set.open')) + '</button>';
    show(el);
  }

  function applyLanguage() {
    I18N.setLang(S.ui);
    I18N.applyStatic();
    renderGreeting(); renderForm(); renderMusicUI();
    if (!$('#settings').classList.contains('hidden')) buildSettings();
    if (!$('#tutorial').classList.contains('hidden')) renderTutorial();
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

    var html = PROVIDERS.map(function (p) {
      var rows = [0, 1].map(function (i) {
        return '<div class="key-row"><label class="key-lbl">' + esc(t(i ? 'set.key2' : 'set.key1')) + '</label>' +
          '<div class="key-input"><input type="password" class="key-in" data-prov="' + p + '" data-idx="' + i + '" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(KEYS[p][i]) + '" placeholder="' + (p === 'claude' ? 'sk-ant-…' : (p === 'openai' ? 'sk-…' : 'AIza…')) + '">' +
          '<button type="button" class="mini" data-act="eye">' + esc(t('btn.show')) + '</button>' +
          '<button type="button" class="mini" data-act="testkey" data-prov="' + p + '" data-idx="' + i + '">' + esc(t('btn.test')) + '</button></div>' +
          '<div class="key-status" data-status="' + p + i + '"></div></div>';
      }).join('');
      return '<div class="key-group"><div class="kg-head"><b>' + esc(aiName(p)) + '</b> <span class="soft">' + esc(t('set.usedfor.' + p)) + '</span>' +
        '<a class="mini as-link" href="' + I18N.KEY_LINKS[p] + '" target="_blank" rel="noopener noreferrer">' + esc(t('set.getkey')) + '</a></div>' + rows + '</div>';
    }).join('');
    $('#keyGroups').innerHTML = html;
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
      setStatus(p, i, errorMessage(e), 'bad');
    }
  }

  function saveFromSettings() {
    S.name = $('#setName').value.trim().slice(0, 40);
    var newLang = $('#setLang').value;
    S.remember = $('#setRemember').checked;
    S.music.load = $('#setMusicLoad').checked; S.music.keep = $('#setMusicKeep').checked;
    S.models.claude = $('#modelClaude').value.trim() || AI.DEFAULT_MODELS.claude;
    S.models.openai = $('#modelOpenai').value.trim() || AI.DEFAULT_MODELS.openai;
    S.models.gemini = $('#modelGemini').value.trim() || AI.DEFAULT_MODELS.gemini;
    $$('.key-in').forEach(function (inp) { KEYS[inp.dataset.prov][+inp.dataset.idx] = cleanKey(inp.value); });
    saveKeys();
    if (newLang !== S.ui) setUiLang(newLang); else { saveSettings(); applyLanguage(); }
    closeModal('settings');
    toast(t('set.saved'));
  }

  /* ------------------------------------------------------------------ tutorial */
  var tutIdx = 0;
  function renderTutorial() {
    var steps = I18N.TUT[S.ui] || I18N.TUT.et;
    tutIdx = Math.max(0, Math.min(steps.length - 1, tutIdx));
    var st = steps[tutIdx];
    $('#tutTitle').textContent = st.ico + '  ' + st.title;
    var link = st.link ? '<p class="tut-link"><a class="btn primary" href="' + I18N.KEY_LINKS[st.link] + '" target="_blank" rel="noopener noreferrer">' + esc(t('set.getkey')) + '</a></p>' : '';
    $('#tutBody').innerHTML = '<div class="tut-step">' + st.html + link + '</div>';
    $('#tutDots').innerHTML = steps.map(function (_, i) { return '<button class="dot' + (i === tutIdx ? ' active' : '') + '" data-step="' + i + '" aria-label="' + (i + 1) + '"></button>'; }).join('');
    $('#tutPrev').style.visibility = tutIdx === 0 ? 'hidden' : 'visible';
    $('#tutNext').textContent = tutIdx === steps.length - 1 ? t('tut.done') : t('tut.next');
    $('#tutBody').scrollTop = 0;
  }
  function openTutorial(start) { tutIdx = start || 0; renderTutorial(); openModal('tutorial'); }
  function closeTutorial() { closeModal('tutorial'); if (!S.tutorialSeen) { S.tutorialSeen = true; saveSettings(); } }

  /* ------------------------------------------------------------------ music UI */
  function renderMusicUI() {
    var on = Music.playing;
    $('#btnMusic').classList.toggle('on', on);
    $('#btnMusic').setAttribute('aria-pressed', on ? 'true' : 'false');
    $('#lmPlay').textContent = on ? '⏸' : '▶';
    var id = Music.trackId;
    $('#loadTrack').textContent = on ? t('music.now', { name: t('music.names.' + id) }) : t('music.off');
    $('#lmVol').value = Math.round(Music.volume * 100);
    if (!$('#settings').classList.contains('hidden')) buildTrackSelect();
  }

  function persistMusic() {
    S.music.track = Music.trackId === 'own' ? 0 : Music.trackIndex;
    S.music.volume = Music.volume;
    saveSettings();
  }

  /* ------------------------------------------------------------------ loading screen */
  function startLoading(titleKey) {
    $('#loadTitle').textContent = t(titleKey || 'load.title');
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
    clearInterval(elapsedTimer); clearInterval(msgTimer);
    if (done) $('#loadBar').style.width = '100%';
    var finish = function () { hide($('#loading')); if (!$$('.modal:not(.hidden), .overlay:not(.hidden)').length) document.body.classList.remove('noscroll'); };
    if (done) setTimeout(finish, 350); else finish();
    if (autoMusic && !musicTouched && !S.music.keep) Music.pause(1.4);
    autoMusic = false;
  }

  /* ------------------------------------------------------------------ errors */
  function errorMessage(e) {
    if (e && e.kind && ['badkey', 'quota', 'model', 'busy', 'network', 'parse'].indexOf(e.kind) >= 0) return t('err.' + e.kind);
    return t('err.generic');
  }

  function showError(e) {
    var old = $('#errorModal'); if (old) old.remove();
    var kind = e && e.kind;
    var hint = (kind === 'quota' || kind === 'badkey') ? t('err.hint.' + kind) : '';
    var div = document.createElement('div');
    div.id = 'errorModal'; div.className = 'modal'; div.setAttribute('role', 'alertdialog'); div.setAttribute('aria-modal', 'true');
    div.innerHTML = '<div class="card modal-card small tilt-r"><div class="modal-head"><h2 class="hl">' + esc(t('err.title')) + '</h2></div>' +
      '<div class="modal-body"><p class="lead">' + esc(errorMessage(e)) + '</p>' + (hint ? '<p class="soft">' + esc(hint) + '</p>' : '') +
      (e && e.tried ? '<p class="fine">' + esc(t('err.tried', { n: e.tried })) + '</p>' : '') +
      (e && e.detail ? '<details class="fine"><summary>…</summary><code>' + esc(e.detail) + '</code></details>' : '') + '</div>' +
      '<div class="modal-foot"><button class="btn ghost" data-act="errClose">OK</button>' +
      (kind === 'badkey' || kind === 'quota' || kind === 'model' ? '<button class="btn primary" data-act="errSettings">⚙️ ' + esc(t('set.open')) + '</button>' : '') + '</div></div>';
    document.body.appendChild(div);
    document.body.classList.add('noscroll');
    div.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-act]'); if (!a) return;
      div.remove(); if (!$$('.modal:not(.hidden), .overlay:not(.hidden)').length) document.body.classList.remove('noscroll');
      if (a.dataset.act === 'errSettings') { buildSettings(); openModal('settings'); }
    });
  }

  /* ------------------------------------------------------------------ form -> options */
  function readForm() {
    var c = COUNT[S.fmt];
    var count = parseInt($('#fCount').value, 10);
    if (!isFinite(count)) count = c.def;
    count = Math.max(c.min, Math.min(c.max, count));
    var subjectId = $('#fSubject').value, outLang = $('#fOutLang').value;
    return {
      fmt: S.fmt, wtype: S.wtype, grade: parseInt($('#fGrade').value, 10) || 6, subjectId: subjectId,
      subjectName: I18N.t('subj.' + subjectId, null, outLang),
      topic: $('#fTopic').value.trim(), extra: $('#fExtra').value.trim(), diff: S.diff, count: count,
      outLang: outLang, theme: S.theme, school: $('#fSchool').value.trim(), answers: $('#fAnswers').checked
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
    if (!keys.length) { toast(t('err.nokey', { ai: aiName(provider) })); buildSettings(); openModal('settings'); return; }
    LAST_OPTS = opts;
    ABORT = new AbortController();
    startLoading('load.title');
    try {
      var r = await AI.generate(opts, provider, keys, S.models[provider] || AI.DEFAULT_MODELS[provider], ABORT.signal, null, function (k) { lastGood[provider] = k; });
      RESULT = r;
      stopLoading(true);
      showResult();
    } catch (e) {
      stopLoading(false);
      if (e && e.name === 'AbortError') { toast(t('toast.cancelled')); return; }
      showError(e);
    } finally { ABORT = null; }
  }

  function onDemo() {
    rememberForm();
    var opts = readForm(); LAST_OPTS = opts;
    RESULT = Demo.make(opts); RESULT.demo = true;
    showResult();
  }

  async function regenSlide(i) {
    if (RESULT.demo) { toast(t('res.demoNote')); return; }
    var keys = activeKeys('claude');
    if (!keys.length) { toast(t('err.nokey', { ai: 'Claude' })); buildSettings(); openModal('settings'); return; }
    ABORT = new AbortController();
    startLoading('load.title.slide');
    try {
      var s = await AI.regenSlide(RESULT, i, LAST_OPTS || readForm(), keys, S.models.claude, ABORT.signal, null, function (k) { lastGood.claude = k; });
      RESULT.slides[i] = s;
      stopLoading(true);
      renderPreview(true); toast(t('toast.slideDone'));
    } catch (e) {
      stopLoading(false);
      if (e && e.name === 'AbortError') toast(t('toast.cancelled')); else showError(e);
    } finally { ABORT = null; }
  }

  /* ------------------------------------------------------------------ result screen */
  function showHome() { hide($('#result')); show($('#home')); window.scrollTo(0, 0); }

  function renderResultHead() {
    var r = RESULT;
    $('#resTitle').textContent = r.title;
    $('#resMeta').textContent = t('res.meta', { type: t('wt.' + r.wtype), grade: t('grade.n', { n: r.grade }), subject: t('subj.' + (LAST_OPTS ? LAST_OPTS.subjectId : 'other')) }) + (r.demo ? '  ·  ' + t('res.demoNote') : '');
    $('#dlLabel').textContent = t('dl.' + r.kind);
    $('#btnPresent').classList.toggle('hidden', r.kind !== 'pptx');
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
    hide($('#home')); show($('#result'));
    window.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------------ downloads */
  function saveBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 6000);
  }

  async function onDownload() {
    try {
      var r = Preview.clean(RESULT);
      var out = await Build.make(r);
      saveBlob(new Blob([out.data], { type: out.mime }), Build.fileBase(r) + '.' + out.ext);
      toast(t('toast.downloaded'));
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

      var fmt = el.closest('.fmt');
      if (fmt) {
        S.fmt = fmt.dataset.fmt;
        $('#fCount').value = COUNT[S.fmt].def; saveSettings(); updateFormatUI(); return;
      }
      var prov = el.closest('#providerSeg button');
      if (prov) { S.prov = prov.dataset.prov; saveSettings(); $$('#providerSeg button').forEach(function (b) { b.classList.toggle('active', b === prov); }); updateKeyHint(); return; }
      var wt = el.closest('[data-wtype]');
      if (wt) { S.wtype = wt.dataset.wtype; saveSettings(); $$('#typeChips .chip').forEach(function (b) { b.classList.toggle('active', b === wt); }); $('#typeDesc').textContent = t('wt.' + S.wtype + '.d'); return; }
      var df = el.closest('#diffSeg button');
      if (df) { S.diff = df.dataset.diff; saveSettings(); $$('#diffSeg button').forEach(function (b) { b.classList.toggle('active', b === df); }); return; }
      var sw = el.closest('[data-theme]');
      if (sw) { S.theme = sw.dataset.theme; saveSettings(); $$('#themeSwatches .swatch').forEach(function (b) { b.classList.toggle('active', b === sw); }); return; }
      var tp = el.closest('[data-topic]');
      if (tp) { $('#fTopic').value = tp.dataset.topic; $('#fTopic').focus(); return; }
      var stp = el.closest('[data-step]');
      if (stp) { tutIdx = +stp.dataset.step; renderTutorial(); return; }
      if (el.closest('[data-close]')) { var m = el.closest('.modal'); if (m.id === 'tutorial') closeTutorial(); else closeModal(m.id); return; }

      var act = el.closest('[data-act]');
      if (act) {
        var a = act.dataset.act;
        if (a === 'openSettings') { buildSettings(); openModal('settings'); }
        else if (a === 'eye') {
          var inp = act.parentNode.querySelector('.key-in'); var vis = inp.type === 'text';
          inp.type = vis ? 'password' : 'text'; act.textContent = t(vis ? 'btn.show' : 'btn.hide');
        }
        else if (a === 'testkey') testKey(act.dataset.prov, +act.dataset.idx);
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

    /* header */
    $('#btnSettings').addEventListener('click', function () { buildSettings(); openModal('settings'); });
    $('#btnTutorial').addEventListener('click', function () { openTutorial(0); });
    $('#btnSettingsTutorial').addEventListener('click', function () { closeModal('settings'); openTutorial(0); });
    $('#btnSettingsSave').addEventListener('click', saveFromSettings);
    $('#btnMusic').addEventListener('click', function () { Music.toggle(); });

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

    /* tutorial nav */
    $('#tutPrev').addEventListener('click', function () { tutIdx--; renderTutorial(); });
    $('#tutNext').addEventListener('click', function () {
      var steps = I18N.TUT[S.ui] || I18N.TUT.et;
      if (tutIdx >= steps.length - 1) closeTutorial(); else { tutIdx++; renderTutorial(); }
    });
    $('#tutSkip').addEventListener('click', closeTutorial);

    /* welcome */
    $('#welcomeStart').addEventListener('click', function () { finishWelcome(true); });
    $('#welcomeSkip').addEventListener('click', function () { finishWelcome(false); });
    $('#welcomeName').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') finishWelcome(true); });

    /* main buttons */
    $('#btnMake').addEventListener('click', function () { rememberForm(); onMake(); });
    $('#fTopic').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { rememberForm(); onMake(); } });
    $('#btnDemo').addEventListener('click', onDemo);
    $('#loadCancel').addEventListener('click', function () { if (ABORT) ABORT.abort(); });
    $('#btnBack').addEventListener('click', showHome);
    $('#btnDownload').addEventListener('click', onDownload);
    $('#btnHtml').addEventListener('click', onHtml);
    $('#btnPrint').addEventListener('click', onPrint);
    $('#btnPresent').addEventListener('click', openPresenter);
    $('#btnAgain').addEventListener('click', function () {
      if (RESULT && RESULT.demo) { RESULT = Demo.make(LAST_OPTS); RESULT.demo = true; showResult(); return; }
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
      if (ev.key === 'Escape') {
        if (!$('#tutorial').classList.contains('hidden')) closeTutorial();
        else if (!$('#settings').classList.contains('hidden')) closeModal('settings');
      }
    });
    document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement && !$('#presenter').classList.contains('hidden')) closePresenter(); });
  }

  function finishWelcome(withTutorial) {
    S.name = $('#welcomeName').value.trim().slice(0, 40);
    S.welcomed = true; saveSettings();
    hide($('#welcome')); document.body.classList.remove('noscroll');
    renderGreeting();
    if (withTutorial && !S.tutorialSeen) openTutorial(0);
    else if (!withTutorial) { S.tutorialSeen = true; saveSettings(); }
  }

  /* ------------------------------------------------------------------ start */
  function init() {
    var pcss = document.createElement('style'); pcss.id = 'previewCss'; pcss.textContent = Preview.css; document.head.appendChild(pcss);
    I18N.setLang(S.ui);
    Music.setVolume(S.music.volume);
    Music.setTrack(S.music.track || 0);
    $('#fOutLang').value = S.outLang; $('#fSchool').value = S.school; $('#fAnswers').checked = !!S.answers;
    $('#fCount').value = COUNT[S.fmt].def;
    I18N.applyStatic();
    renderGreeting(); renderForm(); renderMusicUI();
    $('#fGrade').value = S.grade; $('#fSubject').value = S.subject; renderTopicChips();
    bind();
    if (!S.welcomed) { $('#welcomeName').value = S.name; show($('#welcome')); document.body.classList.add('noscroll'); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
