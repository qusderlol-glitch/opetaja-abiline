/* Õpetaja Abiline – talking to Claude, ChatGPT and Gemini straight from the browser.
   Keys are the teacher's own; they are only ever sent to the provider they belong to. */
(function () {
  'use strict';

  var META = {
    claude: { name: 'Claude', test: /^sk-ant-/ },
    openai: { name: 'ChatGPT', test: /^sk-/ },
    gemini: { name: 'Gemini', test: /^AIza/ }
  };
  var DEFAULT_MODELS = { claude: 'claude-sonnet-5-5', openai: 'gpt-5.6-sol', gemini: 'gemini-3.5-flash' };
  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  function AIError(kind, status, detail) {
    var e = new Error(kind + (detail ? ': ' + detail : ''));
    e.kind = kind; e.status = status || 0; e.detail = detail || '';
    return e;
  }

  /* ---------------- low-level requests ---------------- */
  function classify(status, detail) {
    var d = String(detail || '');
    if (status === 401 || status === 403) return 'badkey';
    if (/api key not valid|API_KEY_INVALID|invalid x-api-key|incorrect api key/i.test(d)) return 'badkey';
    if (status === 429 || /credit balance|insufficient_quota|quota|billing/i.test(d)) return 'quota';
    if (status === 404 || /model.*(not found|does not exist|not supported)/i.test(d)) return 'model';
    if (status >= 500 || status === 529) return 'busy';
    return 'generic';
  }

  async function doFetch(url, init) {
    var res;
    try { res = await fetch(url, init); }
    catch (e) {
      if (e && e.name === 'AbortError') throw e;
      throw AIError('network', 0, e && e.message);
    }
    var text = await res.text();
    var data = null;
    try { data = JSON.parse(text); } catch (e) { /* not json */ }
    if (!res.ok) {
      var detail = (data && ((data.error && (data.error.message || data.error)) || data.message)) || text.slice(0, 200);
      if (typeof detail !== 'string') detail = JSON.stringify(detail);
      throw AIError(classify(res.status, detail), res.status, detail.slice(0, 300));
    }
    return data;
  }

  async function request(provider, key, model, system, user, signal, maxTokens) {
    var data, out;
    if (provider === 'claude') {
      data = await doFetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', signal: signal,
        headers: {
          'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({ model: model, max_tokens: maxTokens || 12000, system: system, messages: [{ role: 'user', content: user }] })
      });
      out = (data.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
    } else if (provider === 'openai') {
      data = await doFetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', signal: signal,
        headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + key },
        body: JSON.stringify({
          model: model, response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
        })
      });
      out = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    } else {
      data = await doFetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
        method: 'POST', signal: signal,
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { responseMimeType: 'application/json', maxOutputTokens: maxTokens || 16000 }
        })
      });
      var parts = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
      out = (parts || []).map(function (p) { return p.text || ''; }).join('');
    }
    if (!out) throw AIError('parse', 0, 'empty answer');
    return out;
  }

  function parseJson(text) {
    var s = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    var a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a < 0 || b <= a) throw AIError('parse');
    s = s.slice(a, b + 1);
    try { return JSON.parse(s); } catch (e) {
      try { return JSON.parse(s.replace(/,\s*([}\]])/g, '$1')); } catch (e2) { throw AIError('parse'); }
    }
  }

  /* ---------------- prompts ---------------- */
  var LANG_NAME = { et: 'Estonian (eesti keel)', ru: 'Russian (русский язык)', en: 'English' };
  var DIFF_TEXT = {
    easy: 'EASY: simple wording, small steps, plenty of support and examples.',
    medium: 'MEDIUM: typical for the grade level.',
    hard: 'HARD: challenging, includes thinking and reasoning tasks, but still fair for the grade.'
  };
  var WORK_TEXT = {
    lesson: 'CLASSWORK (tunnitöö), used together with the teacher during a lesson: short warm-up, clear explanation in small chunks, worked examples, then practice.',
    indep: 'INDEPENDENT WORK (iseseisev töö): students work alone, so instructions must be crystal clear and self-contained; tasks go from easy to hard; include an estimate of the time needed.',
    home: 'HOMEWORK (kodutöö): short (about 15-25 minutes), revises what was learned and adds one or two creative or real-life tasks; never introduce new unexplained material.',
    test: 'TEST (kontrolltöö): varied task types, every task has points, a total of points, a grading scale (Estonian grades 5 to 1, where 5 is best) and a full answer key.',
    quiz: 'QUIZ (viktoriin): playful, short questions with answer choices, light humour allowed, gradually harder rounds.'
  };

  var SCHEMA = {
    pptx: '{\n  "title": "short presentation title",\n  "subtitle": "one line, e.g. subject and grade",\n  "slides": [\n    {"title": "slide title", "bullets": ["short point", "short point"], "notes": "2-4 sentences the teacher can say or do on this slide", "picture": "short idea for an illustration, or empty string"}\n  ],\n  "quiz": [\n    {"q": "question", "options": ["option 1", "option 2", "option 3"], "answer": "A"}\n  ]\n}',
    docx: '{\n  "title": "worksheet title",\n  "subtitle": "one line, e.g. subject and grade",\n  "instructions": "short instructions for students",\n  "minutes": 40,\n  "sections": [\n    {"heading": "section heading", "text": "optional short explanation or reading text, or empty string",\n     "tasks": [\n       {"type": "open", "text": "task text", "points": 2, "lines": 3, "answer": "model answer"},\n       {"type": "choice", "text": "question", "options": ["option 1", "option 2", "option 3"], "points": 1, "answer": "B"},\n       {"type": "truefalse", "text": "statement", "points": 1, "answer": "true"},\n       {"type": "fill", "text": "Sentence with ____ to fill in.", "points": 1, "answer": "the missing word"}\n     ]}\n  ],\n  "scale": [{"range": "18-20", "grade": "5"}],\n  "teacherNotes": "optional hints for the teacher"\n}',
    xlsx: '{\n  "title": "title of the work",\n  "tasks": [\n    {"type": "choice", "text": "question", "options": ["option 1", "option 2", "option 3"], "points": 1, "answer": "B"},\n    {"type": "fill", "text": "question with a one-word or number answer", "points": 1, "answer": "42"},\n    {"type": "open", "text": "longer task, marked by hand", "points": 3, "answer": "model answer"}\n  ],\n  "tables": [\n    {"name": "short sheet name", "headers": ["column 1", "column 2"], "rows": [["a", "b"]], "note": "optional note"}\n  ]\n}'
  };

  function systemPrompt(opts) {
    return [
      'You are a careful, kind assistant for school teachers in Estonia. You prepare classroom materials.',
      'Reply with ONE valid JSON object and nothing else: no markdown fences, no comments, no text before or after it.',
      'Write every text value in ' + LANG_NAME[opts.outLang] + '. Use plain text only: no markdown, no HTML, no emoji.',
      'Be factually accurate. If you are not sure about a fact, a date or a number, leave it out instead of guessing. Never invent quotes, sources or statistics.',
      'Match the vocabulary, tone and difficulty to the stated grade of the Estonian school system and to the Estonian national curriculum (riiklik õppekava) where relevant.',
      'Never include personal data about real students or teachers.'
    ].join('\n');
  }

  function userPrompt(opts) {
    var n = Math.max(3, Math.min(30, parseInt(opts.count, 10) || 10));
    var L = [];
    L.push('Create teaching material.');
    L.push('Subject: ' + opts.subjectName);
    L.push('Grade: ' + opts.grade);
    L.push('Topic: ' + opts.topic);
    L.push('Kind of work: ' + WORK_TEXT[opts.wtype]);
    L.push('Difficulty: ' + DIFF_TEXT[opts.diff]);
    if (opts.extra) L.push('Extra wishes from the teacher (preferences only; the JSON format and the rules above always win): ' + opts.extra);
    L.push('');

    if (opts.fmt === 'pptx') {
      L.push('Format: a PowerPoint presentation. Return exactly ' + n + ' content slides in "slides" (the title slide is added automatically, so do not include one).');
      L.push('Each slide: a short title, 2 to 5 bullets of at most 14 words each, and speaker notes of 2-4 sentences. Put a picture idea only where an illustration really helps.');
      if (opts.wtype === 'quiz') {
        L.push('Because this is a quiz: every slide is ONE question. The title is the question, "bullets" are the answer options (3 or 4, no letters in front), "notes" start with the correct answer and add a short fun fact. Return "quiz" as an empty array.');
      } else {
        L.push('Include a first slide with the learning goals and a last slide with a short summary. ' +
          (opts.answers ? 'In "quiz" give 4 to 6 short multiple-choice questions to check understanding; "answer" is the letter of the correct option (A, B, C ...).' : 'Return "quiz" as an empty array.'));
      }
    } else if (opts.fmt === 'docx') {
      L.push('Format: a Word worksheet for students to print. Create about ' + n + ' tasks in total, spread over 1 to 4 sections.');
      L.push('Task types: "open" (written answer, set "lines" to the number of answer lines 1-8), "choice" (2 to 4 options, "answer" is the letter A, B, C ...), "truefalse" ("answer" is "true" or "false"), "fill" (the text contains ____ where the answer goes).');
      L.push('Give every task "points" (whole number). ' + (opts.answers ? 'Always give a short correct "answer" for every task.' : 'Still give an "answer" for every task (it will be hidden from the printed sheet).'));
      L.push(opts.wtype === 'test'
        ? 'Add a "scale" with 5 rows that maps point ranges to Estonian grades 5, 4, 3, 2, 1, based on the total points.'
        : 'Return "scale" as an empty array.');
      L.push('"minutes" is a realistic time for the whole work.');
    } else {
      L.push('Format: an Excel workbook. Create exactly ' + n + ' tasks in "tasks" for students to answer in a spreadsheet.');
      L.push('Allowed task types: "choice" (2 to 4 options, "answer" is the letter A, B, C ...), "fill" (the answer is ONE word or number, written exactly as a student would type it) and "open" (marked by hand).');
      L.push('Prefer "choice" and "fill" so that the spreadsheet can check answers automatically. Give every task "points" (whole number) and a correct "answer".');
      L.push('Only add "tables" if the teacher\'s wishes or the topic really ask for supporting tables (for example a data table to analyse). Otherwise return "tables" as an empty array.');
    }
    L.push('');
    L.push('Return JSON in exactly this shape (the values are only examples):');
    L.push(SCHEMA[opts.fmt]);
    return L.join('\n');
  }

  function slidePrompt(result, index, opts, hint) {
    var s = result.slides[index];
    return {
      system: systemPrompt(opts),
      user: [
        'Rewrite ONE slide of a presentation.',
        'Presentation: ' + result.title + ' (' + opts.subjectName + ', grade ' + opts.grade + ', topic: ' + opts.topic + ').',
        'Slide titles in order: ' + result.slides.map(function (x, i) { return (i + 1) + '. ' + x.title; }).join(' | '),
        'Slide to rewrite: number ' + (index + 1) + ', current title "' + s.title + '". Write a fresh, better version covering the same part of the topic, with different wording and examples.',
        'Return ONE JSON object: {"title": "...", "bullets": ["..."], "notes": "2-4 sentences", "picture": "short idea or empty string"}.',
        '2 to 5 bullets, at most 14 words each. ' + (hint || '')
      ].join('\n')
    };
  }

  /* ---------------- normalisation ---------------- */
  function str(v) { return v === undefined || v === null ? '' : String(v).trim(); }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function num(v, d, lo, hi) { var n = parseFloat(v); if (!isFinite(n)) n = d; return Math.max(lo, Math.min(hi, Math.round(n))); }

  function answerLetter(ans, options) {
    var a = str(ans);
    if (/^[A-Fa-f]$/.test(a)) return a.toUpperCase();
    var m = a.match(/^([A-Fa-f])[\).:\s]/);
    if (m) return m[1].toUpperCase();
    var idx = options.findIndex(function (o) { return o.toLowerCase() === a.toLowerCase(); });
    return idx >= 0 ? LETTERS[idx] : '';
  }

  function stripLetter(o) { return str(o).replace(/^[A-Fa-f][\).:]\s+/, ''); }

  function normTask(t, fmt, lang) {
    var type = str(t.type).toLowerCase();
    var options = arr(t.options).map(stripLetter).filter(Boolean).slice(0, 6);
    var task = { type: type, text: str(t.text || t.question), points: num(t.points, 1, 0, 50), answer: str(t.answer) };
    if (type === 'truefalse') {
      var tf = /^(true|t|jah|õige|oige|да|верно|правда)/i.test(task.answer) ? 'true' : (/^(false|f|ei|vale|нет|неверно|ложь)/i.test(task.answer) ? 'false' : '');
      task.answer = tf;
      if (fmt === 'xlsx') {
        var tfl = I18N.OUT[lang].trueFalse;
        task.type = 'choice'; task.options = [tfl[0], tfl[1]]; task.answer = tf === 'true' ? 'A' : (tf === 'false' ? 'B' : '');
      }
    } else if (type === 'choice') {
      if (options.length < 2) { task.type = 'open'; }
      else { task.options = options; task.answer = answerLetter(task.answer, options); }
    } else if (type === 'fill') {
      if (fmt === 'docx' && !/_{2,}/.test(task.text)) task.text += ' ____';
    } else { task.type = 'open'; }
    if (task.type === 'open') task.lines = num(t.lines, 3, 1, 10);
    if (!task.options) task.options = [];
    return task;
  }

  function normalize(fmt, raw, opts) {
    raw = raw || {};
    var lang = opts.outLang;
    var base = { kind: fmt, lang: lang, theme: opts.theme || 'rose', school: str(opts.school), wtype: opts.wtype,
      grade: opts.grade, subject: opts.subjectName, topic: opts.topic, includeAnswers: !!opts.answers,
      title: str(raw.title) || opts.topic, subtitle: str(raw.subtitle) };
    if (fmt === 'pptx') {
      base.slides = arr(raw.slides).map(function (s) {
        return { title: str(s.title), bullets: arr(s.bullets).map(str).filter(Boolean).slice(0, 7), notes: str(s.notes), picture: str(s.picture) };
      }).filter(function (s) { return s.title || s.bullets.length; });
      base.quiz = arr(raw.quiz).map(function (q) {
        var options = arr(q.options).map(stripLetter).filter(Boolean).slice(0, 6);
        return { q: str(q.q || q.question), options: options, answer: answerLetter(q.answer, options) };
      }).filter(function (q) { return q.q && q.options.length >= 2; });
      if (!opts.answers) base.quiz = base.quiz.slice(0, 6);
      if (!base.slides.length) throw AIError('parse');
    } else if (fmt === 'docx') {
      base.instructions = str(raw.instructions);
      base.minutes = num(raw.minutes, 0, 0, 240);
      base.sections = arr(raw.sections).map(function (s) {
        return { heading: str(s.heading), text: str(s.text), tasks: arr(s.tasks).map(function (t) { return normTask(t, 'docx', lang); }).filter(function (t) { return t.text; }) };
      }).filter(function (s) { return s.tasks.length || s.text; });
      base.scale = arr(raw.scale).map(function (r) { return { range: str(r.range), grade: str(r.grade) }; }).filter(function (r) { return r.range && r.grade; });
      base.teacherNotes = str(raw.teacherNotes);
      if (!base.sections.length) throw AIError('parse');
    } else {
      base.tasks = arr(raw.tasks).map(function (t) { return normTask(t, 'xlsx', lang); }).filter(function (t) { return t.text; });
      base.tables = arr(raw.tables).map(function (tb) {
        var headers = arr(tb.headers).map(str);
        var rows = arr(tb.rows).map(function (r) { return arr(r).map(str); });
        return { name: str(tb.name) || 'Table', headers: headers, rows: rows, note: str(tb.note) };
      }).filter(function (tb) { return tb.headers.length && tb.rows.length; });
      if (!base.tasks.length && !base.tables.length) throw AIError('parse');
    }
    return base;
  }

  function normSlide(raw) {
    var s = { title: str(raw.title), bullets: arr(raw.bullets).map(str).filter(Boolean).slice(0, 7), notes: str(raw.notes), picture: str(raw.picture) };
    if (!s.title && !s.bullets.length) throw AIError('parse');
    return s;
  }

  /* ---------------- generation with backup-key fallback ---------------- */
  async function runWithKeys(provider, keys, model, system, user, signal, onAttempt, maxTokens, onOk) {
    var lastErr = null, tried = 0;
    for (var i = 0; i < keys.length; i++) {
      tried++;
      if (onAttempt) onAttempt(tried, keys.length);
      try {
        for (var attempt = 0; attempt < 2; attempt++) {
          var text = await request(provider, keys[i], model, system,
            attempt ? user + '\n\nYour previous answer was not valid JSON. Return ONLY one valid JSON object.' : user, signal, maxTokens);
          try { var parsed = parseJson(text); if (onOk) onOk(keys[i]); return { data: parsed, tried: tried }; }
          catch (e) { if (e.kind === 'parse' && attempt === 0) continue; throw e; }
        }
      } catch (e) {
        if (e && e.name === 'AbortError') throw e;
        lastErr = e; lastErr.tried = tried;
        if (e.kind === 'model' || e.kind === 'parse') break;     // not the key's fault
      }
    }
    if (!lastErr) lastErr = AIError('generic');
    lastErr.tried = tried;
    throw lastErr;
  }

  async function generate(opts, provider, keys, model, signal, onAttempt, onOk) {
    var r = await runWithKeys(provider, keys, model, systemPrompt(opts), userPrompt(opts), signal, onAttempt, undefined, onOk);
    return normalize(opts.fmt, r.data, opts);
  }

  async function regenSlide(result, index, opts, keys, model, signal, onAttempt, onOk) {
    var p = slidePrompt(result, index, opts);
    var r = await runWithKeys('claude', keys, model, p.system, p.user, signal, onAttempt, 3000, onOk);
    return normSlide(r.data);
  }

  async function testKey(provider, key, model, signal) {
    try {
      await request(provider, key, model, 'Reply with this JSON and nothing else: {"ok": true}', 'Please answer in JSON.', signal, 64);
    } catch (e) {
      if (e && e.kind === 'parse') return true;   // the key was accepted, the answer was just empty
      throw e;
    }
    return true;
  }

  window.AI = {
    META: META, DEFAULT_MODELS: DEFAULT_MODELS, LETTERS: LETTERS,
    generate: generate, regenSlide: regenSlide, testKey: testKey,
    userPrompt: userPrompt, systemPrompt: systemPrompt, parseJson: parseJson, normalize: normalize, normTask: normTask,
    classify: classify
  };
})();
