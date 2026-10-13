/* Õpetaja Abiline – builds real .pptx / .docx / .xlsx files in the browser. */
(function (root) {
  'use strict';

  var IS_BROWSER = typeof document !== 'undefined' && typeof document.createElement === 'function';
  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  function theme(r) { return root.I18N.THEMES[r.theme] || root.I18N.THEMES.rose; }
  function labels(r) { return root.I18N.OUT[r.lang] || root.I18N.OUT.et; }

  function fileBase(r) {
    var s = String(r.title || 'work').replace(/[\\\/:*?"<>|\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
    return s || 'work';
  }

  function totalPoints(r) {
    var n = 0;
    if (r.kind === 'docx') r.sections.forEach(function (s) { s.tasks.forEach(function (t) { n += t.points || 0; }); });
    if (r.kind === 'xlsx') r.tasks.forEach(function (t) { n += t.points || 0; });
    return n;
  }

  function answerText(t, L) {
    if (t.type === 'choice') {
      var i = LETTERS.indexOf(t.answer);
      return t.answer ? t.answer + (i >= 0 && t.options[i] ? ') ' + t.options[i] : '') : '';
    }
    if (t.type === 'truefalse') return t.answer === 'true' ? L.trueFalse[0] : (t.answer === 'false' ? L.trueFalse[1] : '');
    return t.answer || '';
  }

  /* ================= logical slide layout (shared with the preview) ================= */
  var Deck = {
    layout: function (r) {
      var out = [{ type: 'title' }];
      r.slides.forEach(function (s, i) { out.push({ type: 'content', i: i }); });
      if (r.quiz && r.quiz.length) {
        var per = 3;
        for (var p = 0; p * per < r.quiz.length; p++) {
          var idx = [];
          for (var k = p * per; k < Math.min(r.quiz.length, (p + 1) * per); k++) idx.push(k);
          out.push({ type: 'quiz', items: idx, page: p, pages: Math.ceil(r.quiz.length / per) });
        }
        if (r.includeAnswers) out.push({ type: 'answers' });
      }
      out.push({ type: 'end' });
      return out;
    },
    bulletSize: function (s) {
      var total = s.bullets.reduce(function (a, b) { return a + b.length; }, 0);
      if (s.bullets.length <= 3 && total < 170) return 26;
      if (s.bullets.length <= 5 && total < 320) return 22;
      return 18;
    }
  };

  /* ================= PowerPoint ================= */
  async function buildPptx(r) {
    var th = theme(r), L = labels(r);
    var PptxGenJS = root.PptxGenJS;
    var pres = new PptxGenJS();
    pres.layout = 'LAYOUT_WIDE';            // 13.33 x 7.5 in
    pres.title = r.title; pres.subject = r.subject || ''; pres.author = '';
    var F = 'Calibri';
    var SH = pres.ShapeType;
    var layout = Deck.layout(r);

    function dots(s, light) {
      s.addShape(SH.ellipse, { x: 11.5, y: -1.3, w: 3.6, h: 3.6, fill: { color: th.a, transparency: 55 }, line: { color: th.a, width: 0 } });
      s.addShape(SH.ellipse, { x: -0.9, y: 6.1, w: 2.4, h: 2.4, fill: { color: th.a, transparency: 60 }, line: { color: th.a, width: 0 } });
      if (!light) s.addShape(SH.ellipse, { x: 12.35, y: 6.65, w: 0.35, h: 0.35, fill: { color: th.p }, line: { color: th.p, width: 0 } });
    }
    function foot(s, n) {
      if (r.school) s.addText(r.school, { x: 1.9, y: 6.95, w: 8, h: 0.35, fontFace: F, fontSize: 12, color: '8A7A80' });
      s.addText(String(n), { x: 12.0, y: 6.95, w: 0.8, h: 0.35, fontFace: F, fontSize: 12, color: '8A7A80', align: 'right' });
    }

    layout.forEach(function (ls, n) {
      var s = pres.addSlide();
      if (ls.type === 'title') {
        s.background = { color: th.l };
        dots(s, true);
        s.addShape(SH.roundRect, { x: 1.2, y: 1.2, w: 10.93, h: 4.5, rectRadius: 0.45, fill: { color: 'FFFFFF' }, line: { color: th.p, width: 3 } });
        s.addText(r.title, { x: 1.7, y: 1.6, w: 9.93, h: 2.1, fontFace: F, fontSize: 44, bold: true, color: th.d, align: 'center', valign: 'middle', fit: 'shrink' });
        if (r.subtitle) s.addText(r.subtitle, { x: 1.7, y: 3.7, w: 9.93, h: 0.8, fontFace: F, fontSize: 22, color: th.p, align: 'center', valign: 'middle', fit: 'shrink' });
        var meta = [L.work[r.wtype], r.grade ? L.gradeN(r.grade) : '', r.subject].filter(Boolean).join('  ·  ');
        s.addShape(SH.roundRect, { x: 3.4, y: 4.65, w: 6.53, h: 0.6, rectRadius: 0.3, fill: { color: th.l }, line: { color: th.p, width: 1.5, dashType: 'dash' } });
        s.addText(meta, { x: 3.4, y: 4.65, w: 6.53, h: 0.6, fontFace: F, fontSize: 16, color: th.d, align: 'center', valign: 'middle' });
        if (r.school) s.addText(r.school, { x: 1.2, y: 6.2, w: 10.93, h: 0.4, fontFace: F, fontSize: 14, color: th.d, align: 'center' });
        s.addNotes(r.title);
      } else if (ls.type === 'content') {
        var sl = r.slides[ls.i];
        s.background = { color: 'FFFFFF' };
        dots(s);
        s.addShape(SH.roundRect, { x: 0.5, y: 0.4, w: 12.33, h: 1.15, rectRadius: 0.3, fill: { color: th.l }, line: { color: th.p, width: 2.5 } });
        s.addText(sl.title, { x: 0.9, y: 0.4, w: 11.5, h: 1.15, fontFace: F, fontSize: 30, bold: true, color: th.d, valign: 'middle', fit: 'shrink' });
        var pic = !!sl.picture;
        var size = Deck.bulletSize(sl);
        if (sl.bullets.length) {
          s.addText(sl.bullets.map(function (b) {
            return { text: b, options: { bullet: { code: '25CF' }, breakLine: true, paraSpaceAfter: 14 } };
          }), { x: 0.8, y: 1.9, w: pic ? 7.5 : 11.7, h: 4.8, fontFace: F, fontSize: size, color: '3B2E33', valign: 'top', fit: 'shrink' });
        }
        if (pic) {
          s.addShape(SH.roundRect, { x: 8.7, y: 2.0, w: 3.9, h: 4.2, rectRadius: 0.3, fill: { color: th.l }, line: { color: th.p, width: 2, dashType: 'dash' } });
          s.addText([{ text: L.picture, options: { bold: true, breakLine: true, fontSize: 14 } }, { text: sl.picture, options: { italic: true, fontSize: 15 } }],
            { x: 8.9, y: 2.2, w: 3.5, h: 3.8, fontFace: F, color: th.d, align: 'center', valign: 'middle', fit: 'shrink' });
        }
        foot(s, n + 1);
        if (sl.notes) s.addNotes(sl.notes);
      } else if (ls.type === 'quiz') {
        s.background = { color: 'FFFFFF' };
        dots(s);
        s.addShape(SH.roundRect, { x: 0.5, y: 0.4, w: 12.33, h: 1.15, rectRadius: 0.3, fill: { color: th.a }, line: { color: th.p, width: 2.5 } });
        s.addText(L.checkYourself + (ls.pages > 1 ? '  (' + (ls.page + 1) + '/' + ls.pages + ')' : ''), { x: 0.9, y: 0.4, w: 11.5, h: 1.15, fontFace: F, fontSize: 30, bold: true, color: th.d, valign: 'middle' });
        var runs = [];
        ls.items.forEach(function (qi) {
          var q = r.quiz[qi];
          runs.push({ text: (qi + 1) + '. ' + q.q, options: { bold: true, breakLine: true, fontSize: 24, color: th.d, paraSpaceBefore: 8 } });
          q.options.forEach(function (o, k) { runs.push({ text: LETTERS[k] + ')  ' + o, options: { breakLine: true, fontSize: 21, color: '3B2E33' } }); });
        });
        s.addText(runs, { x: 0.8, y: 1.8, w: 11.7, h: 5.0, fontFace: F, valign: 'top', fit: 'shrink' });
        foot(s, n + 1);
        s.addNotes(L.answers + ': ' + ls.items.map(function (qi) { return (qi + 1) + '=' + (r.quiz[qi].answer || '?'); }).join(', '));
      } else if (ls.type === 'answers') {
        s.background = { color: th.l };
        dots(s, true);
        s.addText(L.answers + '  (' + L.teacherNote.toLowerCase() + ')', { x: 0.8, y: 0.5, w: 11.7, h: 1, fontFace: F, fontSize: 30, bold: true, color: th.d, valign: 'middle' });
        s.addText(r.quiz.map(function (q, qi) {
          var k = LETTERS.indexOf(q.answer);
          return { text: (qi + 1) + '.  ' + (q.answer || '?') + (k >= 0 && q.options[k] ? ')  ' + q.options[k] : ''), options: { breakLine: true, paraSpaceAfter: 10 } };
        }), { x: 0.9, y: 1.7, w: 11.5, h: 5.0, fontFace: F, fontSize: 20, color: '3B2E33', valign: 'top', fit: 'shrink' });
        foot(s, n + 1);
        s.addNotes(L.teacherNote);
      } else {
        s.background = { color: th.p };
        s.addShape(SH.ellipse, { x: 9.6, y: -1.6, w: 5.2, h: 5.2, fill: { color: 'FFFFFF', transparency: 80 }, line: { color: 'FFFFFF', width: 0 } });
        s.addShape(SH.ellipse, { x: -1.4, y: 4.6, w: 4.4, h: 4.4, fill: { color: 'FFFFFF', transparency: 82 }, line: { color: 'FFFFFF', width: 0 } });
        s.addText(L.thanks, { x: 1, y: 2.3, w: 11.33, h: 2, fontFace: F, fontSize: 66, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
        if (r.school) s.addText(r.school, { x: 1, y: 4.5, w: 11.33, h: 0.6, fontFace: F, fontSize: 20, color: 'FFFFFF', align: 'center' });
      }
    });

    var data = await pres.write({ outputType: IS_BROWSER ? 'blob' : 'nodebuffer' });
    return { data: data, ext: 'pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
  }

  /* ================= Word ================= */
  async function buildDocx(r) {
    var D = root.docx, th = theme(r), L = labels(r);
    var FONT = 'Calibri';
    var total = totalPoints(r);

    function run(text, o) { o = o || {}; o.text = text; o.font = FONT; return new D.TextRun(o); }
    function para(children, o) { o = o || {}; o.children = children; return new D.Paragraph(o); }
    var ink = '3B2E33', grey = '8A7A80';

    var kids = [];
    kids.push(para([run(r.title, { bold: true, size: 40, color: th.d })], { alignment: D.AlignmentType.CENTER, spacing: { after: 60 } }));
    if (r.subtitle) kids.push(para([run(r.subtitle, { size: 24, color: th.p })], { alignment: D.AlignmentType.CENTER, spacing: { after: 160 } }));
    var us = function (n) { return new Array(n + 1).join('_'); };
    kids.push(para([run(L.name + ': ' + us(26) + '    ' + L.cls + ': ' + us(8) + '    ' + L.date + ': ' + us(12), { size: 22, color: ink })], { spacing: { before: 120, after: 120 } }));
    var meta = [];
    if (r.minutes) meta.push(L.time + ': ' + r.minutes + ' ' + L.minutes);
    if (total) meta.push(L.total + ': ' + total + ' ' + L.points);
    if (meta.length) kids.push(para([run(meta.join('   ·   '), { size: 20, color: grey, italics: true })], { spacing: { after: 160 } }));
    if (r.instructions) {
      kids.push(para([run(L.instructions + ': ', { bold: true, size: 22, color: th.d }), run(r.instructions, { size: 22, color: ink })], {
        shading: { type: D.ShadingType.CLEAR, fill: th.l, color: 'auto' },
        border: { left: { style: D.BorderStyle.SINGLE, size: 24, color: th.p, space: 8 } },
        spacing: { before: 80, after: 240 }, indent: { left: 160 }
      }));
    }

    var n = 0;
    r.sections.forEach(function (sec) {
      if (sec.heading) {
        kids.push(para([run(sec.heading, { bold: true, size: 30, color: th.d })], {
          spacing: { before: 320, after: 120 }, keepNext: true,
          border: { bottom: { style: D.BorderStyle.SINGLE, size: 8, color: th.p, space: 2 } }
        }));
      }
      if (sec.text) kids.push(para([run(sec.text, { size: 22, color: ink, italics: true })], { spacing: { after: 160 } }));
      sec.tasks.forEach(function (t) {
        n++;
        var head = [run(n + '. ', { bold: true, size: 24, color: th.d }), run(t.text, { size: 24, color: ink })];
        if (t.points) head.push(run('   (' + t.points + ' ' + L.points + ')', { size: 18, color: grey }));
        kids.push(para(head, { spacing: { before: 200, after: 80 }, indent: { left: 360, hanging: 360 }, keepNext: t.type !== 'fill' }));
        if (t.type === 'choice') {
          t.options.forEach(function (o, k) {
            kids.push(para([run(LETTERS[k] + ')  ' + o, { size: 23, color: ink })], { indent: { left: 720 }, spacing: { after: 40 } }));
          });
        } else if (t.type === 'truefalse') {
          kids.push(para([run('☐ ' + L.trueFalse[0] + '        ☐ ' + L.trueFalse[1], { size: 23, color: ink })], { indent: { left: 720 }, spacing: { after: 60 } }));
        } else if (t.type === 'open') {
          for (var i = 0; i < (t.lines || 3); i++) {
            // a tab with an underscore leader draws a full line and never merges with its neighbours
            kids.push(new D.Paragraph({
              spacing: { before: 160, after: 0 }, indent: { left: 360 },
              tabStops: [{ type: D.TabStopType.RIGHT, position: 9000, leader: D.LeaderType.UNDERSCORE }],
              children: [new D.TextRun({ children: [new D.Tab()], font: FONT, size: 24, color: 'B8A9AF' })]
            }));
          }
        }
      });
    });

    if (r.scale && r.scale.length) {
      kids.push(para([run(L.grading, { bold: true, size: 26, color: th.d })], { spacing: { before: 360, after: 120 }, keepNext: true }));
      var cell = function (txt, head) {
        return new D.TableCell({
          children: [para([run(txt, { size: 22, bold: !!head, color: head ? th.d : ink })], { alignment: D.AlignmentType.CENTER })],
          shading: head ? { type: D.ShadingType.CLEAR, fill: th.l, color: 'auto' } : undefined,
          margins: { top: 60, bottom: 60, left: 120, right: 120 }
        });
      };
      kids.push(new D.Table({
        width: { size: 55, type: D.WidthType.PERCENTAGE },
        rows: [new D.TableRow({ children: [cell(L.range, true), cell(L.grade, true)] })].concat(
          r.scale.map(function (x) { return new D.TableRow({ children: [cell(x.range), cell(x.grade)] }); }))
      }));
    }

    if (r.includeAnswers) {
      kids.push(new D.Paragraph({ children: [new D.PageBreak()] }));
      kids.push(para([run(L.answerKey, { bold: true, size: 34, color: th.d })], { spacing: { after: 200 }, border: { bottom: { style: D.BorderStyle.SINGLE, size: 8, color: th.p, space: 2 } } }));
      var k2 = 0;
      r.sections.forEach(function (sec) {
        sec.tasks.forEach(function (t) {
          k2++;
          kids.push(para([run(k2 + '. ', { bold: true, size: 22, color: th.d }), run(answerText(t, L) || '–', { size: 22, color: ink })], { indent: { left: 360, hanging: 360 }, spacing: { after: 80 } }));
        });
      });
      if (r.teacherNotes) {
        kids.push(para([run(L.teacherNote + ': ', { bold: true, size: 22, color: th.d }), run(r.teacherNotes, { size: 22, color: ink })], {
          spacing: { before: 240 }, shading: { type: D.ShadingType.CLEAR, fill: th.l, color: 'auto' }
        }));
      }
    }

    var doc = new D.Document({
      creator: '', title: r.title,
      styles: { default: { document: { run: { font: FONT, size: 24 } } } },
      sections: [{
        properties: { page: { margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 } } },
        footers: {
          default: new D.Footer({
            children: [new D.Paragraph({
              alignment: D.AlignmentType.CENTER,
              children: [run((r.school ? r.school + '   ·   ' : ''), { size: 18, color: grey }), new D.TextRun({ children: [D.PageNumber.CURRENT], size: 18, color: grey, font: FONT })]
            })]
          })
        },
        children: kids
      }]
    });
    var data = IS_BROWSER ? await D.Packer.toBlob(doc) : await D.Packer.toBuffer(doc);
    return { data: data, ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
  }

  /* ================= Excel ================= */
  function safeSheetName(name, used) {
    var s = String(name || 'Sheet').replace(/[\[\]:*?\/\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 28) || 'Sheet';
    var base = s, i = 2;
    while (used.indexOf(s.toLowerCase()) >= 0) { s = base.slice(0, 25) + ' ' + i; i++; }
    used.push(s.toLowerCase());
    return s;
  }

  async function buildXlsx(r) {
    var th = theme(r), L = labels(r);
    var wb = new root.ExcelJS.Workbook();
    wb.creator = ''; wb.created = new Date();
    var used = [];
    var argb = function (h) { return 'FF' + h; };
    var thin = { style: 'thin', color: { argb: 'FFD9C9CF' } };
    var border = { top: thin, left: thin, bottom: thin, right: thin };
    var tests = r.tasks || [];

    if (tests.length) {
      var testName = safeSheetName(L.sheetTest, used);
      var ansName = safeSheetName(L.sheetAnswers, used);
      var ws = wb.addWorksheet(testName, { views: [{ state: 'frozen', ySplit: 3 }] });
      ws.columns = [{ width: 6 }, { width: 62 }, { width: 42 }, { width: 9 }, { width: 24 }, { width: 11 }];
      ws.mergeCells('A1:F1');
      ws.getCell('A1').value = r.title;
      ws.getCell('A1').font = { name: 'Calibri', size: 20, bold: true, color: { argb: argb(th.d) } };
      ws.getCell('A1').alignment = { vertical: 'middle' };
      ws.getRow(1).height = 34;
      ws.mergeCells('A2:F2');
      ws.getCell('A2').value = L.name + ': ____________________    ' + L.cls + ': ______    ' + L.date + ': ____________' + (r.includeAnswers ? '    ·    ' + L.autoCheck : '');
      ws.getCell('A2').font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF8A7A80' } };
      var head = ['#', L.task, L.options, L.pointsFull, L.studentAnswer, L.score];
      var hr = ws.getRow(3);
      head.forEach(function (h, i) {
        var c = hr.getCell(i + 1);
        c.value = h; c.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(th.p) } };
        c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; c.border = border;
      });
      hr.height = 24;

      var first = 4;
      tests.forEach(function (t, i) {
        var rowN = first + i;
        var row = ws.getRow(rowN);
        row.getCell(1).value = i + 1;
        row.getCell(2).value = t.text;
        row.getCell(3).value = t.options.length ? t.options.map(function (o, k) { return LETTERS[k] + ') ' + o; }).join('\n') : '';
        row.getCell(4).value = t.points || 0;
        var ans = row.getCell(5), sc = row.getCell(6);
        ans.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF8DC' } };
        if (t.type === 'choice' && t.options.length) {
          ans.dataValidation = { type: 'list', allowBlank: true, formulae: ['"' + LETTERS.slice(0, t.options.length).join(',') + '"'] };
        }
        var auto = r.includeAnswers && t.type !== 'open' && t.answer;
        if (auto) {
          var k = i + 2;
          sc.value = { formula: 'IF(E' + rowN + '="","",IF(UPPER(TRIM(E' + rowN + '))=UPPER(TRIM(\'' + ansName + '\'!B' + k + ')),D' + rowN + ',0))' };
        } else {
          sc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEFB0' } };
        }
        for (var c = 1; c <= 6; c++) {
          var cell = row.getCell(c);
          cell.border = border; cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF3B2E33' } };
          cell.alignment = { vertical: 'top', wrapText: true, horizontal: (c === 1 || c >= 4) ? 'center' : 'left' };
        }
        var lines = Math.max(1, Math.ceil(t.text.length / 62), t.options.length);
        row.height = Math.max(22, 16 * lines + 6);
      });
      var last = first + tests.length - 1, tr = last + 2;
      var put = function (rr, label, value, fmt) {
        ws.getCell('B' + rr).value = label; ws.getCell('B' + rr).font = { name: 'Calibri', bold: true, color: { argb: argb(th.d) } };
        ws.getCell('B' + rr).alignment = { horizontal: 'right' };
        ws.getCell('D' + rr).value = value; ws.getCell('D' + rr).font = { name: 'Calibri', bold: true, size: 12 };
        ws.getCell('D' + rr).alignment = { horizontal: 'center' };
        ws.getCell('D' + rr).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(th.l) } };
        if (fmt) ws.getCell('D' + rr).numFmt = fmt;
      };
      put(tr, L.maxPoints, { formula: 'SUM(D' + first + ':D' + last + ')' });
      put(tr + 1, L.total, { formula: 'SUM(F' + first + ':F' + last + ')' });
      put(tr + 2, L.percent, { formula: 'IF(D' + tr + '=0,0,D' + (tr + 1) + '/D' + tr + ')' }, '0%');

      if (r.includeAnswers) {
        var wa = wb.addWorksheet(ansName);
        wa.columns = [{ width: 6 }, { width: 30 }, { width: 9 }, { width: 70 }];
        var ah = wa.getRow(1);
        ['#', L.answers, L.pointsFull, L.task].forEach(function (h, i) {
          var c = ah.getCell(i + 1); c.value = h; c.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' } };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(th.d) } }; c.border = border; c.alignment = { horizontal: 'center' };
        });
        tests.forEach(function (t, i) {
          var row = wa.getRow(i + 2);
          var val = t.type === 'choice' ? t.answer : (t.answer || '');
          row.getCell(1).value = i + 1;
          row.getCell(2).value = val;   // always kept as text
          row.getCell(3).value = t.points || 0;
          row.getCell(4).value = t.type === 'choice' ? t.text + '  →  ' + (answerText(t, L)) : t.text;
          for (var c = 1; c <= 4; c++) { row.getCell(c).border = border; row.getCell(c).alignment = { vertical: 'top', wrapText: true }; }
        });
        var nr = tests.length + 3;
        wa.getCell('A' + nr).value = L.removeSheet;
        wa.getCell('A' + nr).font = { name: 'Calibri', italic: true, color: { argb: 'FFC0392B' } };
      }
    }

    (r.tables || []).forEach(function (tb) {
      var w = wb.addWorksheet(safeSheetName(tb.name, used), { views: [{ state: 'frozen', ySplit: 1 }] });
      var cols = tb.headers.length;
      var widths = tb.headers.map(function (h, c) {
        var m = String(h).length;
        tb.rows.forEach(function (row) { m = Math.max(m, String(row[c] || '').length); });
        return Math.min(50, Math.max(10, m + 3));
      });
      w.columns = widths.map(function (x) { return { width: x }; });
      var hrow = w.getRow(1);
      tb.headers.forEach(function (h, i) {
        var c = hrow.getCell(i + 1); c.value = h; c.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(th.p) } }; c.border = border;
        c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });
      tb.rows.forEach(function (row, ri) {
        var rr = w.getRow(ri + 2);
        for (var c = 0; c < cols; c++) {
          var v = row[c] === undefined ? '' : row[c];
          var cell = rr.getCell(c + 1);
          cell.value = (/^-?\d+([.,]\d+)?$/.test(v) && v.length < 10) ? parseFloat(String(v).replace(',', '.')) : v;
          cell.border = border; cell.alignment = { vertical: 'top', wrapText: true };
          if (ri % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(th.l) } };
        }
      });
      if (tb.note) { w.getCell('A' + (tb.rows.length + 3)).value = tb.note; w.getCell('A' + (tb.rows.length + 3)).font = { name: 'Calibri', italic: true, color: { argb: 'FF8A7A80' } }; }
    });

    var buf = await wb.xlsx.writeBuffer();
    var data = IS_BROWSER ? new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) : Buffer.from(buf);
    return { data: data, ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
  }

  /* The big libraries (about 2.7 MB together) are only fetched when a file is really built,
     so the site itself opens fast, even on a slow school connection. */
  var LIBS = { pptx: ['PptxGenJS', 'vendor/pptxgen.bundle.js'], docx: ['docx', 'vendor/docx.iife.js'], xlsx: ['ExcelJS', 'vendor/exceljs.min.js'] };
  var loading = {};
  function ensureLib(kind) {
    var L = LIBS[kind];
    if (!L || !IS_BROWSER || root[L[0]]) return Promise.resolve();
    if (!loading[kind]) {
      loading[kind] = new Promise(function (res, rej) {
        var el = document.createElement('script');
        el.src = L[1]; el.async = true;
        el.onload = function () { root[L[0]] ? res() : rej(new Error('library missing: ' + L[0])); };
        el.onerror = function () { delete loading[kind]; rej(new Error('could not load ' + L[1])); };
        document.head.appendChild(el);
      });
    }
    return loading[kind];
  }

  var Build = {
    Deck: Deck, fileBase: fileBase, totalPoints: totalPoints, answerText: answerText,
    make: async function (r) {
      await ensureLib(r.kind);
      if (r.kind === 'pptx') return buildPptx(r);
      if (r.kind === 'docx') return buildDocx(r);
      return buildXlsx(r);
    }
  };

  root.Build = Build;
  if (typeof module !== 'undefined' && module.exports) module.exports = Build;
})(typeof window !== 'undefined' ? window : globalThis);
