/* Õpetaja Abiline – "Advanced control": every setting that can be tuned, in one data table.
   Empty value = automatic (the AI decides). The table drives the screen, the prompts, the file builders and the presets. */
(function () {
  'use strict';

  var AUTO = ['Automaatne', 'Авто', 'Auto'];
  function sel(id, g, label, opts, extra) {
    return Object.assign({ id: id, g: g, t: 'sel', l: label, o: [[''].concat(AUTO)].concat(opts) }, extra || {});
  }
  function num(id, g, label, min, max, extra) { return Object.assign({ id: id, g: g, t: 'num', l: label, min: min, max: max }, extra || {}); }
  function chk(id, g, label, def, extra) { return Object.assign({ id: id, g: g, t: 'chk', l: label, def: def }, extra || {}); }

  var GROUPS = [
    { id: 'general', ico: '⚙️', l: ['Üldine', 'Общее', 'General'] },
    { id: 'tasks', ico: '✏️', l: ['Ülesanded', 'Задания', 'Tasks'] },
    { id: 'slides', ico: '🖼️', l: ['Slaidid', 'Слайды', 'Slides'] },
    { id: 'look', ico: '🎨', l: ['Välimus', 'Внешний вид', 'Look'] },
    { id: 'grade', ico: '📊', l: ['Hindamisskaala', 'Шкала оценок', 'Grading scale'] }
  ];

  /* fmts: where the field is shown; plain: also for lesson plan / cards / letter / rubric; only: extra condition on the work type */
  var FIELDS = [
    /* ---- general ---- */
    num('minutes', 'general', ['Töö kestus (min)', 'Длительность работы (мин)', 'Work duration (min)'], 5, 240, { fmts: ['pptx', 'docx', 'xlsx'], plain: 1 }),
    sel('tone', 'general', ['Toon', 'Тон', 'Tone'], [
      ['playful', 'Mänguline', 'Игривый', 'Playful'], ['neutral', 'Neutraalne', 'Нейтральный', 'Neutral'],
      ['formal', 'Ametlik', 'Официальный', 'Formal'], ['warm', 'Soe ja julgustav', 'Тёплый и ободряющий', 'Warm and encouraging']], { fmts: ['pptx', 'docx', 'xlsx'], plain: 1 }),
    sel('approach', 'general', ['Lähenemine', 'Подход', 'Approach'], [
      ['practical', 'Praktiline', 'Практический', 'Practical'], ['theory', 'Teoreetiline', 'Теоретический', 'Theoretical'],
      ['reallife', 'Elulised olukorrad', 'Жизненные ситуации', 'Real-life situations'], ['creative', 'Loov', 'Творческий', 'Creative'],
      ['exam', 'Eksamitüüpi', 'Как на экзамене', 'Exam-style']], { fmts: ['pptx', 'docx', 'xlsx'] }),
    sel('cefr', 'general', ['Keeletase (keeleainetele)', 'Уровень языка (для языковых предметов)', 'Language level (language subjects)'], [
      ['A1', 'A1', 'A1', 'A1'], ['A2', 'A2', 'A2', 'A2'], ['B1', 'B1', 'B1', 'B1'], ['B2', 'B2', 'B2', 'B2'], ['C1', 'C1', 'C1', 'C1']], { fmts: ['pptx', 'docx', 'xlsx'] }),
    sel('creativity', 'general', ['Loovus (Gemini)', 'Креативность (Gemini)', 'Creativity (Gemini)'], [
      ['precise', 'Täpne', 'Точный', 'Precise'], ['balanced', 'Tasakaalus', 'Сбалансированный', 'Balanced'], ['creative', 'Loominguline', 'Креативный', 'Creative']], { fmts: ['pptx', 'docx', 'xlsx'], plain: 1 }),
    { id: 'must', g: 'general', t: 'txt', l: ['Kindlasti lisa (teemad, sõnad)', 'Обязательно включить (темы, слова)', 'Must include (topics, words)'], fmts: ['pptx', 'docx', 'xlsx'], plain: 1 },
    { id: 'avoid', g: 'general', t: 'txt', l: ['Väldi (teemad, sõnad)', 'Избегать (темы, слова)', 'Avoid (topics, words)'], fmts: ['pptx', 'docx', 'xlsx'], plain: 1 },

    /* ---- tasks (Word worksheet, Excel) ---- */
    num('mixChoice', 'tasks', ['Valikvastustega ülesandeid', 'Заданий с выбором ответа', 'Multiple-choice tasks'], 0, 30, { fmts: ['docx', 'xlsx'], mix: 1 }),
    num('mixTf', 'tasks', ['Õige/vale ülesandeid', 'Заданий «верно/неверно»', 'True/false tasks'], 0, 30, { fmts: ['docx', 'xlsx'], mix: 1 }),
    num('mixFill', 'tasks', ['Lünkülesandeid', 'Заданий с пропусками', 'Fill-in-the-gap tasks'], 0, 30, { fmts: ['docx', 'xlsx'], mix: 1 }),
    num('mixOpen', 'tasks', ['Avatud vastusega ülesandeid', 'Заданий с развёрнутым ответом', 'Open-answer tasks'], 0, 30, { fmts: ['docx', 'xlsx'], mix: 1 }),
    num('maxChars', 'tasks', ['Ülesande teksti max pikkus (tähemärki)', 'Макс. длина текста задания (символов)', 'Max length of a task text (characters)'], 30, 1000, { fmts: ['docx', 'xlsx'] }),
    num('options', 'tasks', ['Vastusevariantide arv', 'Количество вариантов ответа', 'Number of answer options'], 2, 6, { fmts: ['docx', 'xlsx'] }),
    num('points', 'tasks', ['Punkte ühe ülesande eest', 'Баллов за одно задание', 'Points per task'], 1, 10, { fmts: ['docx', 'xlsx'] }),
    num('openPoints', 'tasks', ['Punkte avatud ülesande eest', 'Баллов за открытое задание', 'Points per open task'], 1, 20, { fmts: ['docx', 'xlsx'] }),
    num('totalPoints', 'tasks', ['Punkte kokku', 'Всего баллов', 'Total points'], 5, 200, { fmts: ['docx', 'xlsx'] }),
    num('lines', 'tasks', ['Vastusridu avatud ülesandes', 'Строк для ответа в открытом задании', 'Answer lines per open task'], 1, 10, { fmts: ['docx'] }),
    num('sections', 'tasks', ['Osade arv', 'Количество разделов', 'Number of sections'], 1, 6, { fmts: ['docx'] }),
    num('reading', 'tasks', ['Lugemistekst igas osas (sõnu)', 'Текст для чтения в каждом разделе (слов)', 'Reading text per section (words)'], 0, 400, { fmts: ['docx'] }),
    chk('hints', 'tasks', ['Lisa igale ülesandele vihje', 'Добавить подсказку к каждому заданию', 'Add a hint to every task'], false, { fmts: ['docx'] }),

    /* ---- slides ---- */
    num('bMin', 'slides', ['Punkte slaidil: vähemalt', 'Пунктов на слайде: не меньше', 'Bullets per slide: at least'], 1, 6, { fmts: ['pptx'] }),
    num('bMax', 'slides', ['Punkte slaidil: kuni', 'Пунктов на слайде: не больше', 'Bullets per slide: at most'], 2, 8, { fmts: ['pptx'] }),
    num('bWords', 'slides', ['Sõnu ühes punktis (max)', 'Слов в одном пункте (макс.)', 'Words per bullet (max)'], 4, 30, { fmts: ['pptx'] }),
    sel('notes', 'slides', ['Märkmed õpetajale', 'Заметки для учителя', 'Speaker notes'], [
      ['none', 'Pole', 'Нет', 'None'], ['short', 'Lühikesed', 'Короткие', 'Short'], ['long', 'Pikad', 'Длинные', 'Long']], { fmts: ['pptx'] }),
    sel('pics', 'slides', ['Pildiideed', 'Идеи картинок', 'Picture ideas'], [
      ['never', 'Mitte kunagi', 'Никогда', 'Never'], ['always', 'Igal slaidil', 'На каждом слайде', 'On every slide']], { fmts: ['pptx'] }),
    num('quizN', 'slides', ['Kontrollküsimusi lõpus', 'Контрольных вопросов в конце', 'Check questions at the end'], 0, 15, { fmts: ['pptx'] }),
    chk('goals', 'slides', ['Eesmärkide slaid algusesse', 'Слайд с целями в начале', 'Goals slide at the start'], true, { fmts: ['pptx'] }),
    chk('summary', 'slides', ['Kokkuvõtte slaid lõppu', 'Слайд с итогами в конце', 'Summary slide at the end'], true, { fmts: ['pptx'] }),

    /* ---- look (Word) ---- */
    sel('font', 'look', ['Kirjatüüp', 'Шрифт', 'Font'], [
      ['Calibri', 'Calibri', 'Calibri', 'Calibri'], ['Arial', 'Arial', 'Arial', 'Arial'], ['Times New Roman', 'Times New Roman', 'Times New Roman', 'Times New Roman'],
      ['Georgia', 'Georgia', 'Georgia', 'Georgia'], ['Verdana', 'Verdana', 'Verdana', 'Verdana'], ['Comic Sans MS', 'Comic Sans MS', 'Comic Sans MS', 'Comic Sans MS']], { fmts: ['docx'], plain: 1 }),
    num('fsize', 'look', ['Teksti suurus (pt)', 'Размер текста (pt)', 'Text size (pt)'], 9, 20, { fmts: ['docx'], plain: 1 }),
    sel('spacing', 'look', ['Reavahe', 'Межстрочный интервал', 'Line spacing'], [
      ['1', '1,0', '1,0', '1.0'], ['1.15', '1,15', '1,15', '1.15'], ['1.5', '1,5', '1,5', '1.5'], ['2', '2,0', '2,0', '2.0']], { fmts: ['docx'], plain: 1 }),
    sel('margins', 'look', ['Veerised', 'Поля', 'Margins'], [
      ['narrow', 'Kitsad', 'Узкие', 'Narrow'], ['wide', 'Laiad', 'Широкие', 'Wide']], { fmts: ['docx'], plain: 1 }),
    sel('orient', 'look', ['Lehe suund', 'Ориентация страницы', 'Page orientation'], [
      ['landscape', 'Rõhtne', 'Альбомная', 'Landscape']], { fmts: ['docx'], plain: 1 }),
    chk('nameLine', 'look', ['Nime / klassi / kuupäeva rida', 'Строка «имя / класс / дата»', 'Name / class / date line'], true, { fmts: ['docx'] }),
    chk('showPts', 'look', ['Näita punkte ülesannete juures', 'Показывать баллы у заданий', 'Show points next to tasks'], true, { fmts: ['docx'] }),
    chk('showMeta', 'look', ['Näita aega ja punktide summat', 'Показывать время и сумму баллов', 'Show time and total points'], true, { fmts: ['docx'] }),

    /* ---- grading scale (test only) ---- */
    sel('scaleType', 'grade', ['Hindamisskaala liik', 'Тип шкалы', 'Scale type'], [
      ['est5', 'Eesti hinded 5–1', 'Эстонские оценки 5–1', 'Estonian grades 5–1'], ['percent', 'Protsendid', 'Проценты', 'Percentages'], ['none', 'Skaalat pole', 'Без шкалы', 'No scale']], { fmts: ['docx'], test: 1 }),
    num('t5', 'grade', ['„5“ alates (%)', '«5» от (%)', '“5” from (%)'], 50, 100, { fmts: ['docx'], test: 1, ph: 90 }),
    num('t4', 'grade', ['„4“ alates (%)', '«4» от (%)', '“4” from (%)'], 30, 99, { fmts: ['docx'], test: 1, ph: 75 }),
    num('t3', 'grade', ['„3“ alates (%)', '«3» от (%)', '“3” from (%)'], 10, 98, { fmts: ['docx'], test: 1, ph: 50 }),
    num('t2', 'grade', ['„2“ alates (%)', '«2» от (%)', '“2” from (%)'], 1, 97, { fmts: ['docx'], test: 1, ph: 25 })
  ];
  var LANGIDX = { et: 0, ru: 1, en: 2 };

  function visible(f, fmt, plainDoc, wtype) {
    if (f.fmts.indexOf(fmt) < 0) return false;
    if (plainDoc && !f.plain) return false;
    if (f.test && wtype !== 'test') return false;
    return true;
  }

  function e(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function fieldHtml(f, val, li) {
    var id = 'adv_' + f.id, lab = f.l[li];
    if (f.t === 'chk') {
      var on = val === '' || val === undefined ? f.def : !!val;
      return '<label class="check adv-chk"><input type="checkbox" data-adv="' + f.id + '" id="' + id + '"' + (on ? ' checked' : '') + '><span>' + e(lab) + '</span></label>';
    }
    var inner;
    if (f.t === 'sel') {
      inner = '<select data-adv="' + f.id + '" id="' + id + '">' + f.o.map(function (o) {
        return '<option value="' + e(o[0]) + '"' + (String(val) === o[0] ? ' selected' : '') + '>' + e(o[1 + li]) + '</option>';
      }).join('') + '</select>';
    } else if (f.t === 'num') {
      inner = '<input type="number" inputmode="numeric" data-adv="' + f.id + '" id="' + id + '" min="' + f.min + '" max="' + f.max + '" value="' + e(val) + '" placeholder="' + e(f.ph !== undefined ? f.ph : '—') + '">';
    } else {
      inner = '<input type="text" maxlength="160" data-adv="' + f.id + '" id="' + id + '" value="' + e(val) + '">';
    }
    return '<label class="field adv-f"><span>' + e(lab) + '</span>' + inner + '</label>';
  }

  /* the markup for the group tabs and the active group's fields */
  function render(adv, fmt, wtype, lang, group) {
    var li = LANGIDX[lang] || 0;
    var plainDoc = fmt === 'docx' && !!(window.AI && AI.PLAIN[wtype]);
    var groups = GROUPS.filter(function (g) {
      return FIELDS.some(function (f) { return f.g === g.id && visible(f, fmt, plainDoc, wtype); });
    });
    if (!groups.length) return { html: '', group: group };
    if (!groups.some(function (g) { return g.id === group; })) group = groups[0].id;
    var changedBy = function (gid) { return FIELDS.filter(function (f) { return f.g === gid && visible(f, fmt, plainDoc, wtype) && isChanged(f, adv); }).length; };
    var tabs = '<div class="seg adv-tabs" id="advTabs">' + groups.map(function (g) {
      var n = changedBy(g.id);
      return '<button type="button" data-advtab="' + g.id + '" class="' + (g.id === group ? 'active' : '') + '">' + g.ico + ' ' + e(g.l[li]) + (n ? ' <i class="adv-dot">' + n + '</i>' : '') + '</button>';
    }).join('') + '</div>';
    var fields = FIELDS.filter(function (f) { return f.g === group && visible(f, fmt, plainDoc, wtype); });
    var body = '<div class="adv-grid">' + fields.map(function (f) {
      var cls = f.t === 'chk' ? ' adv-wide' : (f.t === 'txt' ? ' adv-wide' : '');
      return '<div class="adv-cell' + cls + '">' + fieldHtml(f, adv[f.id] === undefined ? '' : adv[f.id], li) + '</div>';
    }).join('') + '</div>';
    if (group === 'tasks' && fmt !== 'pptx') body += '<p class="fine" id="advMixSum"></p>';
    return { html: tabs + body, group: group, changed: groups.reduce(function (a, g) { return a + changedBy(g.id); }, 0) };
  }

  function isChanged(f, adv) {
    var v = adv[f.id];
    if (f.t === 'chk') return v !== undefined && v !== '' && !!v !== f.def;
    return v !== undefined && String(v).trim() !== '';
  }

  function toNum(f, v) {
    var n = parseInt(v, 10);
    if (!isFinite(n)) return undefined;
    return Math.max(f.min, Math.min(f.max, n));
  }

  /* clean values for the prompts and the builders: only fields that are visible for this work, typed and clamped */
  function collect(adv, fmt, wtype) {
    var plainDoc = fmt === 'docx' && !!(window.AI && AI.PLAIN[wtype]);
    var out = {};
    FIELDS.forEach(function (f) {
      if (!visible(f, fmt, plainDoc, wtype)) return;
      var v = adv[f.id];
      if (f.t === 'chk') { out[f.id] = (v === undefined || v === '') ? f.def : !!v; return; }
      if (v === undefined || String(v).trim() === '') return;
      if (f.t === 'num') { var n = toNum(f, v); if (n !== undefined) out[f.id] = n; }
      else if (f.t === 'sel') { if (f.o.some(function (o) { return o[0] === String(v); })) out[f.id] = String(v); }
      else out[f.id] = String(v).trim().slice(0, 160);
    });
    if (out.bMin !== undefined && out.bMax !== undefined && out.bMax < out.bMin) out.bMax = out.bMin;
    return out;
  }

  function mixTotal(adv) {
    var t = 0, any = false;
    ['mixChoice', 'mixTf', 'mixFill', 'mixOpen'].forEach(function (k) {
      var n = parseInt(adv[k], 10); if (isFinite(n) && String(adv[k]).trim() !== '') { any = true; t += Math.max(0, Math.min(30, n)); }
    });
    return any ? t : 0;
  }

  /* presets (named sets of advanced settings) live in this browser */
  var PKEY = 'oa.advPresets';
  function presets() { try { var o = JSON.parse(localStorage.getItem(PKEY) || '{}'); return (o && typeof o === 'object') ? o : {}; } catch (er) { return {}; } }
  function savePresets(o) { try { localStorage.setItem(PKEY, JSON.stringify(o)); } catch (er) { /* private mode */ } }

  /* how many fields were changed in each visible group (for the little dots on the tabs) */
  function groupsInfo(adv, fmt, wtype) {
    var plainDoc = fmt === 'docx' && !!(window.AI && AI.PLAIN[wtype]);
    return GROUPS.map(function (g) {
      var vis = FIELDS.filter(function (f) { return f.g === g.id && visible(f, fmt, plainDoc, wtype); });
      return { id: g.id, shown: vis.length > 0, n: vis.filter(function (f) { return isChanged(f, adv); }).length };
    });
  }

  window.Adv = { groupsInfo: groupsInfo, FIELDS: FIELDS, GROUPS: GROUPS, render: render, collect: collect, mixTotal: mixTotal, presets: presets, savePresets: savePresets, isChanged: isChanged };
})();
