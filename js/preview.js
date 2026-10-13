/* Õpetaja Abiline – on-page preview (no Microsoft 365 needed), editing, web-page export, slide show. */
(function () {
  'use strict';

  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  function e(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function th(r) { return I18N.THEMES[r.theme] || I18N.THEMES.rose; }
  function lab(r) { return I18N.OUT[r.lang] || I18N.OUT.et; }
  function vars(r) { var t = th(r); return '--p:#' + t.p + ';--d:#' + t.d + ';--l:#' + t.l + ';--a:#' + t.a + ';'; }

  /* editable text helper */
  function ed(ctx, path, text, cls) {
    if (!ctx.edit) return '<span' + (cls ? ' class="' + cls + '"' : '') + '>' + e(text) + '</span>';
    return '<span class="ed' + (cls ? ' ' + cls : '') + '" contenteditable="true" spellcheck="true" data-path="' + e(path) + '">' + e(text) + '</span>';
  }

  /* ---------------- PowerPoint-like preview ---------------- */
  function slideHtml(r, ls, n, ctx) {
    var L = lab(r), tt = I18N.t;
    var foot = '<div class="s-foot"><span>' + e(r.school) + '</span><span>' + (n + 1) + '</span></div>';
    if (ls.type === 'title') {
      var meta = [L.work[r.wtype], r.grade ? L.gradeN(r.grade) : '', r.subject].filter(Boolean).join('  ·  ');
      return '<div class="slide s-title"><div class="s-panel"><h2>' + ed(ctx, 'title', r.title) + '</h2><p class="s-sub">' + ed(ctx, 'subtitle', r.subtitle) + '</p><div class="s-chip">' + e(meta) + '</div></div>' +
        (r.school ? '<div class="s-school">' + e(r.school) + '</div>' : '') + '</div>';
    }
    if (ls.type === 'content') {
      var s = r.slides[ls.i];
      var total = s.bullets.reduce(function (a, b) { return a + b.length; }, 0);
      var size = (s.bullets.length <= 3 && total < 170) ? 'b26' : (s.bullets.length <= 5 && total < 320 ? 'b22' : 'b18');
      var lis = s.bullets.map(function (b, j) { return '<li>' + ed(ctx, 'slides.' + ls.i + '.bullets.' + j, b) + '</li>'; }).join('');
      var add = ctx.edit ? '<button class="mini" data-act="addb" data-i="' + ls.i + '">' + e(tt('res.addBullet')) + '</button>' : '';
      var pic = s.picture ? '<div class="s-pic"><b>' + e(L.picture) + '</b><i>' + ed(ctx, 'slides.' + ls.i + '.picture', s.picture) + '</i></div>' : '';
      return '<div class="slide s-content ' + size + '"><div class="s-bar"><h3>' + ed(ctx, 'slides.' + ls.i + '.title', s.title) + '</h3></div>' +
        '<div class="s-main"><div class="s-list"><ul>' + lis + '</ul>' + add + '</div>' + pic + '</div>' + foot + '</div>';
    }
    if (ls.type === 'quiz') {
      var items = ls.items.map(function (qi) {
        var q = r.quiz[qi];
        return '<div class="q"><div class="q-t"><b>' + (qi + 1) + '.</b> ' + ed(ctx, 'quiz.' + qi + '.q', q.q) + '</div>' +
          q.options.map(function (o, k) { return '<div class="q-o">' + LETTERS[k] + ') ' + ed(ctx, 'quiz.' + qi + '.options.' + k, o) + '</div>'; }).join('') + '</div>';
      }).join('');
      return '<div class="slide s-quiz"><div class="s-bar alt"><h3>' + e(L.checkYourself + (ls.pages > 1 ? '  (' + (ls.page + 1) + '/' + ls.pages + ')' : '')) + '</h3></div><div class="s-main q-wrap">' + items + '</div>' + foot + '</div>';
    }
    if (ls.type === 'answers') {
      var rows = r.quiz.map(function (q, qi) {
        var k = LETTERS.indexOf(q.answer);
        return '<div class="q-o"><b>' + (qi + 1) + '.</b> ' + e(q.answer || '?') + (k >= 0 && q.options[k] ? ')  ' + e(q.options[k]) : '') + '</div>';
      }).join('');
      return '<div class="slide s-answers"><div class="s-main"><h3 class="a-t">' + e(L.answers + '  (' + L.teacherNote.toLowerCase() + ')') + '</h3>' + rows + '</div>' + foot + '</div>';
    }
    return '<div class="slide s-end"><div class="s-thanks">' + e(L.thanks) + '</div>' + (r.school ? '<div class="s-school">' + e(r.school) + '</div>' : '') + '</div>';
  }

  function deckHtml(r, ctx) {
    var L = lab(r), tt = I18N.t;
    var layout = Build.Deck.layout(r);
    var out = ['<div class="deck" style="' + vars(r) + '">'];
    layout.forEach(function (ls, n) {
      out.push('<section class="slide-wrap" data-n="' + n + '">' + slideHtml(r, ls, n, ctx));
      if (ls.type === 'content') {
        var s = r.slides[ls.i];
        out.push('<div class="s-under"><div class="notes"><b>' + e(tt('res.notes')) + ':</b> ' + ed(ctx, 'slides.' + ls.i + '.notes', s.notes || '—') + '</div>');
        if (ctx.edit) {
          out.push('<div class="s-tools"><button class="mini" data-act="regen" data-i="' + ls.i + '">↻ ' + e(tt('res.regen')) + '</button>' +
            '<button class="mini danger" data-act="del" data-i="' + ls.i + '">🗑 ' + e(tt('res.delete')) + '</button></div>');
        }
        out.push('</div>');
      }
      out.push('</section>');
    });
    out.push('</div>');
    return out.join('');
  }

  /* ---------------- Word-like preview ---------------- */
  function docHtml(r, ctx) {
    var L = lab(r), tt = I18N.t, total = Build.totalPoints(r);
    var us = function (n) { return new Array(n + 1).join('_'); };
    var h = ['<article class="paper" style="' + vars(r) + '">'];
    h.push('<h2 class="p-title">' + ed(ctx, 'title', r.title) + '</h2>');
    if (r.subtitle) h.push('<p class="p-sub">' + ed(ctx, 'subtitle', r.subtitle) + '</p>');
    h.push('<p class="p-name">' + e(L.name + ': ' + us(24) + '   ' + L.cls + ': ' + us(7) + '   ' + L.date + ': ' + us(11)) + '</p>');
    var meta = [];
    if (r.minutes) meta.push(e(L.time + ': ' + r.minutes + ' ' + L.minutes));
    if (total) meta.push(e(L.total + ': ' + total + ' ' + L.points));
    if (meta.length) h.push('<p class="p-meta">' + meta.join('  ·  ') + '</p>');
    if (r.instructions) h.push('<div class="p-instr"><b>' + e(L.instructions) + ':</b> ' + ed(ctx, 'instructions', r.instructions) + '</div>');
    var n = 0;
    r.sections.forEach(function (sec, si) {
      if (sec.heading) h.push('<h3 class="p-head">' + ed(ctx, 'sections.' + si + '.heading', sec.heading) + '</h3>');
      if (sec.text) h.push('<p class="p-text">' + ed(ctx, 'sections.' + si + '.text', sec.text) + '</p>');
      sec.tasks.forEach(function (t, ti) {
        n++;
        var base = 'sections.' + si + '.tasks.' + ti;
        var x = '<div class="task"><div class="t-head"><b>' + n + '.</b> ' + ed(ctx, base + '.text', t.text) + (t.points ? ' <small class="pts">(' + t.points + ' ' + e(L.points) + ')</small>' : '') + '</div>';
        if (t.type === 'choice') x += '<div class="opts">' + t.options.map(function (o, k) { return '<div>' + LETTERS[k] + ') ' + ed(ctx, base + '.options.' + k, o) + '</div>'; }).join('') + '</div>';
        else if (t.type === 'truefalse') x += '<div class="opts">☐ ' + e(L.trueFalse[0]) + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;☐ ' + e(L.trueFalse[1]) + '</div>';
        else if (t.type === 'open') { x += '<div class="lines">'; for (var i = 0; i < (t.lines || 3); i++) x += '<div class="line"></div>'; x += '</div>'; }
        h.push(x + '</div>');
      });
    });
    if (r.scale && r.scale.length) {
      h.push('<h4 class="p-scale">' + e(L.grading) + '</h4><table class="scale"><tr><th>' + e(L.range) + '</th><th>' + e(L.grade) + '</th></tr>' +
        r.scale.map(function (x) { return '<tr><td>' + e(x.range) + '</td><td>' + e(x.grade) + '</td></tr>'; }).join('') + '</table>');
    }
    if (r.includeAnswers) {
      h.push('<div class="p-key"><h3 class="p-head">' + e(L.answerKey) + '</h3>');
      var k2 = 0;
      r.sections.forEach(function (sec) { sec.tasks.forEach(function (t) { k2++; h.push('<div class="k"><b>' + k2 + '.</b> ' + e(Build.answerText(t, L) || '–') + '</div>'); }); });
      if (r.teacherNotes) h.push('<div class="p-instr"><b>' + e(L.teacherNote) + ':</b> ' + ed(ctx, 'teacherNotes', r.teacherNotes) + '</div>');
      h.push('</div>');
    }
    h.push('</article>');
    return h.join('');
  }

  /* ---------------- Excel-like preview ---------------- */
  function sheetHtml(r, ctx) {
    var L = lab(r), tt = I18N.t;
    var h = ['<div class="xl-wrap" style="' + vars(r) + '">'];
    h.push('<h2 class="xl-title">' + ed(ctx, 'title', r.title) + '</h2>');
    if (r.tasks.length) {
      h.push('<div class="xl-tab">' + e(L.sheetTest) + '</div>');
      h.push('<div class="xl-scroll"><table class="xl"><thead><tr><th>#</th><th>' + e(L.task) + '</th><th>' + e(L.options) + '</th><th>' + e(L.pointsFull) + '</th><th>' + e(L.studentAnswer) + '</th><th>' + e(L.score) + '</th></tr></thead><tbody>');
      r.tasks.forEach(function (t, i) {
        var auto = r.includeAnswers && t.type !== 'open' && t.answer;
        h.push('<tr><td class="c">' + (i + 1) + '</td><td>' + ed(ctx, 'tasks.' + i + '.text', t.text) + '</td><td>' +
          t.options.map(function (o, k) { return '<div>' + LETTERS[k] + ') ' + ed(ctx, 'tasks.' + i + '.options.' + k, o) + '</div>'; }).join('') +
          '</td><td class="c">' + (t.points || 0) + '</td><td class="yellow"></td><td class="c ' + (auto ? 'auto' : 'yellow') + '">' + (auto ? '✨ ' + e(L.autoCheck) : e(L.manual)) + '</td></tr>');
      });
      h.push('</tbody></table></div>');
      h.push('<p class="xl-total">' + e(L.maxPoints + ': ' + Build.totalPoints(r)) + '</p>');
      if (r.includeAnswers) {
        h.push('<div class="xl-tab key">' + e(L.sheetAnswers) + '</div>');
        h.push('<div class="xl-scroll"><table class="xl"><thead><tr><th>#</th><th>' + e(L.answers) + '</th><th>' + e(L.pointsFull) + '</th></tr></thead><tbody>' +
          r.tasks.map(function (t, i) { return '<tr><td class="c">' + (i + 1) + '</td><td>' + e(Build.answerText(t, L) || '–') + '</td><td class="c">' + (t.points || 0) + '</td></tr>'; }).join('') +
          '</tbody></table></div><p class="xl-total warn">' + e(L.removeSheet) + '</p>');
      }
    }
    (r.tables || []).forEach(function (tb, ti) {
      h.push('<div class="xl-tab">' + e(tb.name) + '</div><div class="xl-scroll"><table class="xl"><thead><tr>' +
        tb.headers.map(function (x) { return '<th>' + e(x) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        tb.rows.map(function (row, ri) {
          return '<tr>' + tb.headers.map(function (_, c) { return '<td>' + ed(ctx, 'tables.' + ti + '.rows.' + ri + '.' + c, row[c] || '') + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>' + (tb.note ? '<p class="xl-total">' + e(tb.note) + '</p>' : ''));
    });
    h.push('</div>');
    return h.join('');
  }

  function html(r, edit) {
    var ctx = { edit: !!edit };
    if (r.kind === 'pptx') return deckHtml(r, ctx);
    if (r.kind === 'docx') return docHtml(r, ctx);
    return sheetHtml(r, ctx);
  }

  /* ---------------- editing helpers ---------------- */
  function setPath(obj, path, value) {
    var parts = path.split('.'), cur = obj;
    for (var i = 0; i < parts.length - 1; i++) { cur = cur[parts[i]]; if (cur === undefined) return false; }
    cur[parts[parts.length - 1]] = value;
    return true;
  }

  /* drop empty bullets / options etc. just before building files */
  function clean(r) {
    var c = JSON.parse(JSON.stringify(r));
    function task(t) { t.options = (t.options || []).filter(function (o) { return String(o).trim(); }); return t; }
    if (c.kind === 'pptx') {
      c.slides.forEach(function (s) { s.bullets = s.bullets.filter(function (b) { return String(b).trim(); }); if (s.notes === '—') s.notes = ''; });
      c.quiz = (c.quiz || []).map(function (q) { q.options = q.options.filter(function (o) { return String(o).trim(); }); return q; }).filter(function (q) { return q.q && q.options.length >= 2; });
    } else if (c.kind === 'docx') {
      c.sections.forEach(function (s) { s.tasks = s.tasks.map(task); });
    } else {
      c.tasks = c.tasks.map(task);
    }
    return c;
  }

  /* ---------------- CSS used by the page preview AND the saved web page ---------------- */
  var CSS = [
    '.deck,.paper,.xl-wrap{--ink:#3b2e33;color:var(--ink);font-family:"Nunito","Segoe UI",Calibri,Arial,sans-serif}',
    '.ed{outline:none;border-radius:4px;transition:background .15s;cursor:text}',
    '.ed:hover{background:rgba(255,235,150,.45)}.ed:focus{background:rgba(255,235,150,.7);box-shadow:0 0 0 2px rgba(232,120,143,.45)}',
    '.mini{font:inherit;font-size:13px;font-weight:700;cursor:pointer;padding:5px 11px;border:2px solid #5a3b4b;background:#fff;color:#5a3b4b;border-radius:14px 10px 16px 10px/10px 16px 10px 14px}',
    '.mini:hover{background:var(--l,#ffe9ef)}.mini.danger{border-color:#c0506a;color:#c0506a}',
    /* deck */
    '.slide-wrap{max-width:960px;margin:0 auto 30px}',
    '.slide{position:relative;container-type:inline-size;aspect-ratio:16/9;background:#fff;border:3px solid var(--p);border-radius:16px 20px 14px 22px/20px 14px 22px 16px;overflow:hidden;box-shadow:5px 6px 0 rgba(90,59,75,.18)}',
    '.slide::before{content:"";position:absolute;right:-6%;top:-14%;width:26%;aspect-ratio:1;border-radius:50%;background:var(--a);opacity:.5}',
    '.slide::after{content:"";position:absolute;left:-5%;bottom:-16%;width:18%;aspect-ratio:1;border-radius:50%;background:var(--a);opacity:.45}',
    '.slide>*{position:relative;z-index:1}',
    '.s-bar{margin:3.2cqw 3.8cqw 0;padding:1.5cqw 3cqw;background:var(--l);border:.3cqw solid var(--p);border-radius:2.4cqw}',
    '.s-bar.alt{background:var(--a)}',
    '.s-bar h3{margin:0;font-size:3.1cqw;color:var(--d);line-height:1.2}',
    '.s-main{display:flex;gap:3cqw;padding:2.6cqw 6cqw 0;align-items:flex-start}',
    '.s-list{flex:1;min-width:0}.s-list ul{margin:0;padding-left:3.2cqw;color:var(--ink)}',
    '.s-list li{margin-bottom:1.3cqw;line-height:1.25}.s-list li::marker{color:var(--d)}',
    '.b26 .s-list li{font-size:2.7cqw}.b22 .s-list li{font-size:2.3cqw}.b18 .s-list li{font-size:1.9cqw}',
    '.s-pic{width:30%;flex:none;min-height:30cqw;border:.28cqw dashed var(--p);border-radius:2.2cqw;background:var(--l);color:var(--d);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2cqw;font-size:1.6cqw;gap:.8cqw}',
    '.s-foot{position:absolute!important;left:3cqw;right:3.5cqw;bottom:1.1cqw;display:flex;justify-content:space-between;font-size:1.2cqw;color:#8a7a80}',
    '.s-title{background:var(--l)}.s-title .s-panel{position:absolute;left:9%;right:9%;top:16%;bottom:24%;background:#fff;border:.4cqw solid var(--p);border-radius:3.2cqw;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.6cqw;padding:2cqw;text-align:center}',
    '.s-title h2{margin:0;font-size:4.6cqw;color:var(--d);line-height:1.15}.s-sub{margin:0;font-size:2.2cqw;color:var(--p);font-weight:700}',
    '.s-chip{margin-top:1cqw;padding:.7cqw 3cqw;border:.2cqw dashed var(--p);border-radius:3cqw;background:var(--l);color:var(--d);font-size:1.5cqw;font-weight:700}',
    '.s-school{position:absolute!important;left:0;right:0;bottom:7%;text-align:center;color:var(--d);font-size:1.5cqw}',
    '.s-quiz .q-wrap{flex-direction:column;gap:1.2cqw}.q-t{font-size:2.3cqw;font-weight:800;color:var(--d)}.q-o{font-size:2cqw;margin-left:1.2cqw;line-height:1.35}',
    '.s-answers{background:var(--l)}.s-answers .s-main{flex-direction:column;gap:.8cqw;padding-top:4cqw}.a-t{margin:0 0 1.2cqw;font-size:3cqw;color:var(--d)}',
    '.s-end{background:var(--p)}.s-thanks{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:7cqw;font-weight:800;color:#fff}.s-end .s-school{color:#fff;bottom:20%}',
    '.s-end::before,.s-end::after{background:#fff;opacity:.2}',
    '.s-under{display:flex;gap:12px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;margin-top:12px;font-size:14px}',
    '.notes{flex:1;min-width:240px;background:#fff9e8;border:2px dashed #e0b84a;border-radius:12px 8px 14px 8px/8px 14px 8px 12px;padding:8px 12px;line-height:1.45}',
    '.s-tools{display:flex;gap:8px;flex-wrap:wrap}',
    /* paper */
    '.paper{max-width:820px;margin:0 auto;background:#fff;border:3px solid var(--p);border-radius:6px 10px 6px 12px/10px 6px 12px 6px;box-shadow:5px 6px 0 rgba(90,59,75,.18);padding:46px 56px;font-size:16px;line-height:1.5}',
    '.p-title{margin:0;text-align:center;color:var(--d);font-size:30px}.p-sub{text-align:center;color:var(--p);margin:4px 0 14px;font-size:18px;font-weight:700}',
    '.p-name{font-size:15px;margin:14px 0 6px;white-space:pre-wrap;word-break:break-all}.p-meta{font-size:13px;color:#8a7a80;font-style:italic;margin:0 0 12px}',
    '.p-instr{background:var(--l);border-left:6px solid var(--p);padding:9px 14px;margin:10px 0 18px;border-radius:3px}',
    '.p-head{margin:26px 0 10px;color:var(--d);font-size:21px;border-bottom:2px solid var(--p);padding-bottom:3px}',
    '.p-text{font-style:italic;margin:6px 0 12px}.task{margin:14px 0}.t-head{display:block}.t-head b{color:var(--d)}',
    '.pts{color:#8a7a80;font-size:12px}.opts{margin:4px 0 0 34px;line-height:1.7}',
    '.lines{margin:6px 0 0 22px}.line{height:30px;border-bottom:1.5px solid #c9bcc2}',
    '.p-scale{margin:28px 0 8px;color:var(--d);font-size:17px}.scale{border-collapse:collapse;min-width:260px}.scale th,.scale td{border:1.5px solid #5a3b4b;padding:5px 16px;text-align:center}.scale th{background:var(--l);color:var(--d)}',
    '.p-key{margin-top:34px;padding-top:6px;border-top:3px dashed var(--p)}.k{margin:4px 0}.k b{color:var(--d)}',
    /* sheet */
    '.xl-wrap{max-width:1000px;margin:0 auto}.xl-title{color:var(--d);font-size:28px;margin:0 0 10px}',
    '.xl-tab{display:inline-block;margin-top:14px;padding:4px 16px;background:var(--p);color:#fff;font-weight:800;border-radius:10px 12px 0 0}.xl-tab.key{background:var(--d)}',
    '.xl-scroll{overflow-x:auto;background:#fff;border:2px solid #5a3b4b;border-radius:0 8px 8px 8px}',
    '.xl{border-collapse:collapse;width:100%;font-size:14px}.xl th{background:var(--l);color:var(--d);padding:7px 9px;border:1px solid #d9c9cf;text-align:center}',
    '.xl td{border:1px solid #e3d6db;padding:6px 9px;vertical-align:top}.xl td.c{text-align:center}.xl td.yellow{background:#fff8dc}.xl td.auto{background:#e6f7ee;color:#1f5240;font-size:12px}',
    '.xl-total{margin:8px 2px 0;font-weight:700;color:var(--d);font-size:14px}.xl-total.warn{color:#c0392b;font-weight:600;font-size:13px}',
    /* printing */
    '@media print{.s-tools,.mini{display:none!important}.slide,.paper{box-shadow:none}.slide-wrap{break-inside:avoid;page-break-after:always;margin:0 auto}.s-under{display:none}.ed:hover,.ed:focus{background:none;box-shadow:none}}'
  ].join('\n');

  /* ---------------- standalone web page ---------------- */
  function exportHtml(r, uiLang) {
    var L = lab(r);
    return '<!doctype html><html lang="' + e(r.lang) + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + e(r.title) + '</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">' +
      '<style>body{margin:0;padding:24px 14px 60px;background:#fff9f2;font-family:"Nunito","Segoe UI",Calibri,Arial,sans-serif}' +
      '.bar{max-width:960px;margin:0 auto 22px;display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;color:#5a3b4b}' +
      '.bar button{font:inherit;font-weight:800;cursor:pointer;padding:8px 16px;border:2px solid #5a3b4b;background:#ffd3de;color:#5a3b4b;border-radius:16px 10px 18px 10px/10px 18px 10px 16px}' +
      '.bar small{opacity:.7}@media print{.bar{display:none}' + (r.kind === 'pptx' ? '@page{size:A4 landscape;margin:8mm}' : '') + '}\n' + CSS + '</style></head><body>' +
      '<div class="bar"><div>🌹 <b>' + e(r.title) + '</b><br><small>' + e(I18N.t('html.hint', null, uiLang)) + '</small></div>' +
      '<button onclick="window.print()">' + e(I18N.t('btn.print', null, uiLang)) + '</button></div>' +
      html(r, false) + '</body></html>';
  }

  /* ---------------- slide show ---------------- */
  function slideShow(r) {
    var layout = Build.Deck.layout(r), ctx = { edit: false };
    var items = layout.map(function (ls, n) { return '<div class="deck" style="' + vars(r) + '">' + slideHtml(r, ls, n, ctx) + '</div>'; });
    return items;
  }

  window.Preview = { html: html, setPath: setPath, clean: clean, css: CSS, exportHtml: exportHtml, slideShow: slideShow };
})();
