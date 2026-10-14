/* Õpetaja Abiline – ready-made example (no API key needed) so that everything can be tried first. */
(function () {
  'use strict';

  var D = {
    et: {
      title: 'Päikesesüsteem', subtitle: 'Näidistöö: loodusõpetus',
      slides: [
        { title: 'Õpieesmärgid', bullets: ['Nimetan Päikesesüsteemi planeedid', 'Selgitan, miks Päike on oluline', 'Võrdlen planeete omavahel'], notes: 'Alusta küsimusega: mida sa tead tähtedest ja planeetidest? Kirjuta ideed tahvlile.', picture: 'Joonis Päikesest ja kaheksast planeedist' },
        { title: 'Päike on meie täht', bullets: ['Päike on tohutu kuum gaasikera', 'Ta annab Maale valgust ja soojust', 'Tema ümber tiirlevad kõik planeedid'], notes: 'Rõhuta, et Päike on täht, mitte planeet. Näita pildil, kui suur on Päike Maa kõrval.', picture: '' },
        { title: 'Kaheksa planeeti', bullets: ['Merkuur, Veenus, Maa ja Marss on kivised', 'Jupiter ja Saturn on gaasihiiglased', 'Uraan ja Neptuun on jäähiiglased'], notes: 'Palu õpilastel meelde tuletada planeetide järjekord. Võib kasutada meeldejätmise lauset.', picture: 'Planeetide suuruste võrdlus' },
        { title: 'Meie kodu Maa', bullets: ['Maa on Päikesest kolmas planeet', 'Siin on vesi ja hingatav õhk', 'Sobiv kaugus Päikesest teeb elu võimalikuks'], notes: 'Küsi: mis juhtuks, kui Maa oleks Päikesele palju lähemal?', picture: '' },
        { title: 'Suurused ja kaugused', bullets: ['Jupiter on kõige suurem planeet', 'Merkuur on Päikesele kõige lähemal', 'Mida kaugemal Päikesest, seda külmem'], notes: 'Kontrolli üle, kas õpilased saavad aru, miks kaugemad planeedid on külmemad.', picture: '' },
        { title: 'Kokkuvõte', bullets: ['Päike on täht, planeedid tiirlevad selle ümber', 'Päikesesüsteemis on kaheksa planeeti', 'Maal on elu tänu sobivatele tingimustele'], notes: 'Lase õpilastel kokkuvõte oma sõnadega paarile kaaslasele ümber jutustada.', picture: '' }
      ],
      q: [
        { q: 'Mitu planeeti on Päikesesüsteemis?', o: ['7', '8', '9'], a: 'B' },
        { q: 'Milline planeet on kõige suurem?', o: ['Maa', 'Jupiter', 'Marss'], a: 'B' },
        { q: 'Mis on Päike?', o: ['Planeet', 'Kuu', 'Täht'], a: 'C' },
        { q: 'Mitmes planeet Päikesest on Maa?', o: ['Teine', 'Kolmas', 'Neljas'], a: 'B' },
        { q: 'Milline planeet on Päikesele kõige lähemal?', o: ['Merkuur', 'Veenus', 'Saturn'], a: 'A' }
      ],
      tf: [['Päike on planeet.', 'false'], ['Maa on Päikesest kolmas planeet.', 'true']],
      fill: [['Suurim planeet on ____.', 'Jupiter', 'Mis on suurim planeet?'], ['Päikesele kõige lähem planeet on ____.', 'Merkuur', 'Mis on Päikesele kõige lähem planeet?']],
      open: ['Selgita oma sõnadega, miks Maal on elu.', 'Maa asub Päikesest sobival kaugusel, siin on vesi ja õhk.'],
      instr: 'Loe ülesanded hoolikalt läbi. Vasta täislausetega, kui seda küsitakse.',
      sec: ['A. Vali õige vastus', 'B. Õige või vale', 'C. Täida lüngad', 'D. Kirjuta oma sõnadega'], tnote: 'See on näidis. Päris töö tuleb sinu teemal.'
    },
    ru: {
      title: 'Солнечная система', subtitle: 'Пример работы: природоведение',
      slides: [
        { title: 'Цели урока', bullets: ['Называю планеты Солнечной системы', 'Объясняю, почему Солнце важно', 'Сравниваю планеты между собой'], notes: 'Начните с вопроса: что вы знаете о звёздах и планетах? Запишите идеи на доске.', picture: 'Схема Солнца и восьми планет' },
        { title: 'Солнце — наша звезда', bullets: ['Солнце — огромный раскалённый шар из газа', 'Оно даёт Земле свет и тепло', 'Вокруг него обращаются все планеты'], notes: 'Подчеркните, что Солнце — звезда, а не планета. Покажите на картинке размер Солнца рядом с Землёй.', picture: '' },
        { title: 'Восемь планет', bullets: ['Меркурий, Венера, Земля и Марс — каменные', 'Юпитер и Сатурн — газовые гиганты', 'Уран и Нептун — ледяные гиганты'], notes: 'Попросите учеников вспомнить порядок планет. Можно использовать запоминалку.', picture: 'Сравнение размеров планет' },
        { title: 'Наш дом — Земля', bullets: ['Земля — третья планета от Солнца', 'Здесь есть вода и воздух для дыхания', 'Подходящее расстояние от Солнца делает жизнь возможной'], notes: 'Спросите: что случилось бы, если бы Земля была намного ближе к Солнцу?', picture: '' },
        { title: 'Размеры и расстояния', bullets: ['Юпитер — самая большая планета', 'Меркурий ближе всех к Солнцу', 'Чем дальше от Солнца, тем холоднее'], notes: 'Проверьте, понимают ли ученики, почему дальние планеты холоднее.', picture: '' },
        { title: 'Итоги', bullets: ['Солнце — звезда, планеты вращаются вокруг него', 'В Солнечной системе восемь планет', 'Жизнь на Земле есть благодаря подходящим условиям'], notes: 'Пусть ученики перескажут итоги своими словами соседу по парте.', picture: '' }
      ],
      q: [
        { q: 'Сколько планет в Солнечной системе?', o: ['7', '8', '9'], a: 'B' },
        { q: 'Какая планета самая большая?', o: ['Земля', 'Юпитер', 'Марс'], a: 'B' },
        { q: 'Что такое Солнце?', o: ['Планета', 'Луна', 'Звезда'], a: 'C' },
        { q: 'Какой по счёту от Солнца является Земля?', o: ['Второй', 'Третьей', 'Четвёртой'], a: 'B' },
        { q: 'Какая планета ближе всех к Солнцу?', o: ['Меркурий', 'Венера', 'Сатурн'], a: 'A' }
      ],
      tf: [['Солнце — это планета.', 'false'], ['Земля — третья планета от Солнца.', 'true']],
      fill: [['Самая большая планета — ____.', 'Юпитер', 'Какая планета самая большая?'], ['Ближе всего к Солнцу находится ____.', 'Меркурий', 'Какая планета ближе всех к Солнцу?']],
      open: ['Объясни своими словами, почему на Земле есть жизнь.', 'Земля находится на подходящем расстоянии от Солнца, здесь есть вода и воздух.'],
      instr: 'Внимательно прочитай задания. Отвечай полными предложениями, если это требуется.',
      sec: ['A. Выбери верный ответ', 'B. Верно или неверно', 'C. Заполни пропуски', 'D. Напиши своими словами'], tnote: 'Это пример. Настоящая работа будет по вашей теме.'
    },
    en: {
      title: 'The Solar System', subtitle: 'Sample work: natural science',
      slides: [
        { title: 'Learning goals', bullets: ['I can name the planets of the Solar System', 'I can explain why the Sun is important', 'I can compare the planets'], notes: 'Start by asking: what do you already know about stars and planets? Write the ideas on the board.', picture: 'Diagram of the Sun and eight planets' },
        { title: 'The Sun is our star', bullets: ['The Sun is a huge, hot ball of gas', 'It gives Earth light and warmth', 'All the planets travel around it'], notes: 'Stress that the Sun is a star, not a planet. Show a picture of the Sun next to Earth.', picture: '' },
        { title: 'Eight planets', bullets: ['Mercury, Venus, Earth and Mars are rocky', 'Jupiter and Saturn are gas giants', 'Uranus and Neptune are ice giants'], notes: 'Ask students to recall the order of the planets. A memory sentence can help.', picture: 'Planet size comparison' },
        { title: 'Our home, Earth', bullets: ['Earth is the third planet from the Sun', 'It has water and air we can breathe', 'The right distance from the Sun makes life possible'], notes: 'Ask: what would happen if Earth were much closer to the Sun?', picture: '' },
        { title: 'Sizes and distances', bullets: ['Jupiter is the biggest planet', 'Mercury is closest to the Sun', 'The farther from the Sun, the colder it is'], notes: 'Check that students understand why distant planets are colder.', picture: '' },
        { title: 'Summary', bullets: ['The Sun is a star and the planets orbit it', 'There are eight planets in the Solar System', 'Life on Earth exists thanks to the right conditions'], notes: 'Let students retell the summary in their own words to a partner.', picture: '' }
      ],
      q: [
        { q: 'How many planets are in the Solar System?', o: ['7', '8', '9'], a: 'B' },
        { q: 'Which planet is the biggest?', o: ['Earth', 'Jupiter', 'Mars'], a: 'B' },
        { q: 'What is the Sun?', o: ['A planet', 'A moon', 'A star'], a: 'C' },
        { q: 'Which planet from the Sun is Earth?', o: ['Second', 'Third', 'Fourth'], a: 'B' },
        { q: 'Which planet is closest to the Sun?', o: ['Mercury', 'Venus', 'Saturn'], a: 'A' }
      ],
      tf: [['The Sun is a planet.', 'false'], ['Earth is the third planet from the Sun.', 'true']],
      fill: [['The biggest planet is ____.', 'Jupiter', 'What is the biggest planet?'], ['The planet closest to the Sun is ____.', 'Mercury', 'What is the planet closest to the Sun?']],
      open: ['Explain in your own words why there is life on Earth.', 'Earth is at the right distance from the Sun and has water and air.'],
      instr: 'Read the tasks carefully. Answer in full sentences when asked.',
      sec: ['A. Choose the correct answer', 'B. True or false', 'C. Fill in the gaps', 'D. Write in your own words'], tnote: 'This is an example. A real work will be about your own topic.'
    }
  };


  /* plain Word documents: lesson plan, flashcards, letter, rubric */
  var P = {
    et: {
      plan: { title: 'Tunnikava: Päikesesüsteem', sub: 'Loodusõpetus, 6. klass, 45 min', h: ['Eesmärgid', 'Tunni käik', 'Hindamine ja kodutöö'],
        goals: 'Õpilane nimetab Päikesesüsteemi planeedid ja selgitab, miks Maal on elu.\n\nÕpilane võrdleb planeete suuruse ja kauguse järgi.',
        head: ['Aeg', 'Etapp', 'Tegevus', 'Vahendid'], rows: [['5 min', 'Sissejuhatus', 'Küsimus: mida sa tead planeetidest? Ideed tahvlile.', 'Tahvel'], ['15 min', 'Uus teema', 'Õpetaja selgitab slaidide abil, õpilased teevad märkmeid.', 'Slaidid'], ['15 min', 'Harjutus', 'Paaristöö: planeetide kaardid järjekorda.', 'Kaardid'], ['10 min', 'Kokkuvõte', 'Õpilased jutustavad kokkuvõtte paarilisele.', '—']],
        end: 'Hindamine: kujundav tagasiside paaristöö ajal. Kodutöö: joonista Päikesesüsteem ja kirjuta igale planeedile üks lause.' },
      cards: { title: 'Õppekaardid: planeedid', sub: 'Lõika kaardid välja', head: ['Mõiste', 'Vastus'], rows: [['Päike', 'Meie täht, annab valgust ja soojust'], ['Jupiter', 'Kõige suurem planeet'], ['Merkuur', 'Päikesele kõige lähem planeet'], ['Maa', 'Päikesest kolmas planeet, kus on elu'], ['Marss', 'Punane planeet'], ['Saturn', 'Planeet ilusate rõngastega']] },
      letter: { title: 'Lapsevanemate koosolek', sub: '', text: 'Lugupeetud lapsevanemad!\n\nKutsun teid klassi lastevanemate koosolekule [kuupäev] kell [kellaaeg] klassiruumis [number].\n\nArutame õppeaasta plaane, ülesandeid ja eelseisvaid ettevõtmisi.\n\nKui te ei saa tulla, andke palun teada.\n\nTäname koostöö eest!' },
      rubric: { title: 'Hindamismaatriks: esitlus', sub: '', head: ['Kriteerium', 'Suurepärane (5)', 'Hea (4)', 'Rahuldav (3)', 'Nõrk (2)'], rows: [['Sisu', 'Kõik olulised faktid, täpselt', 'Enamik fakte olemas', 'Mõned faktid puudu', 'Sisu napp või vale'], ['Ülesehitus', 'Selge algus, keskosa ja lõpp', 'Üldiselt selge', 'Osaliselt segane', 'Ülesehitus puudub'], ['Esinemine', 'Selge ja kindel kõne', 'Enamasti selge', 'Loeb palju maha', 'Raske jälgida']] }
    },
    ru: {
      plan: { title: 'План урока: Солнечная система', sub: 'Природоведение, 6 класс, 45 мин', h: ['Цели', 'Ход урока', 'Оценивание и домашнее задание'],
        goals: 'Ученик называет планеты Солнечной системы и объясняет, почему на Земле есть жизнь.\n\nУченик сравнивает планеты по размеру и расстоянию.',
        head: ['Время', 'Этап', 'Деятельность', 'Материалы'], rows: [['5 мин', 'Введение', 'Вопрос: что вы знаете о планетах? Идеи на доску.', 'Доска'], ['15 мин', 'Новая тема', 'Учитель объясняет по слайдам, ученики делают заметки.', 'Слайды'], ['15 мин', 'Практика', 'Работа в парах: расставить карточки планет по порядку.', 'Карточки'], ['10 мин', 'Итоги', 'Ученики пересказывают итоги соседу.', '—']],
        end: 'Оценивание: формирующая обратная связь во время работы в парах. Домашнее задание: нарисовать Солнечную систему и написать по одному предложению о каждой планете.' },
      cards: { title: 'Карточки: планеты', sub: 'Вырежьте карточки', head: ['Понятие', 'Ответ'], rows: [['Солнце', 'Наша звезда, даёт свет и тепло'], ['Юпитер', 'Самая большая планета'], ['Меркурий', 'Ближайшая к Солнцу планета'], ['Земля', 'Третья планета от Солнца, на ней есть жизнь'], ['Марс', 'Красная планета'], ['Сатурн', 'Планета с красивыми кольцами']] },
      letter: { title: 'Родительское собрание', sub: '', text: 'Уважаемые родители!\n\nПриглашаю вас на классное родительское собрание [дата] в [время] в кабинете [номер].\n\nМы обсудим планы на учебный год, задачи и предстоящие мероприятия.\n\nЕсли вы не сможете прийти, пожалуйста, сообщите мне.\n\nСпасибо за сотрудничество!' },
      rubric: { title: 'Критерии оценивания: презентация', sub: '', head: ['Критерий', 'Отлично (5)', 'Хорошо (4)', 'Удовлетворительно (3)', 'Слабо (2)'], rows: [['Содержание', 'Все важные факты, точно', 'Большинство фактов', 'Некоторых фактов нет', 'Содержание скудное или неверное'], ['Структура', 'Ясные начало, середина и конец', 'В целом понятно', 'Частично путано', 'Структуры нет'], ['Выступление', 'Чёткая уверенная речь', 'В основном понятно', 'Много читает с листа', 'Трудно следить']] }
    },
    en: {
      plan: { title: 'Lesson plan: The Solar System', sub: 'Science, grade 6, 45 min', h: ['Goals', 'Lesson flow', 'Assessment and homework'],
        goals: 'The student names the planets of the Solar System and explains why there is life on Earth.\n\nThe student compares planets by size and distance.',
        head: ['Time', 'Stage', 'Activity', 'Materials'], rows: [['5 min', 'Introduction', 'Question: what do you know about planets? Ideas on the board.', 'Board'], ['15 min', 'New topic', 'Teacher explains with slides, students take notes.', 'Slides'], ['15 min', 'Practice', 'Pair work: put the planet cards in order.', 'Cards'], ['10 min', 'Summary', 'Students retell the summary to a partner.', '—']],
        end: 'Assessment: formative feedback during pair work. Homework: draw the Solar System and write one sentence about each planet.' },
      cards: { title: 'Flashcards: planets', sub: 'Cut the cards out', head: ['Term', 'Answer'], rows: [['The Sun', 'Our star, gives light and warmth'], ['Jupiter', 'The biggest planet'], ['Mercury', 'The planet closest to the Sun'], ['Earth', 'The third planet from the Sun, with life'], ['Mars', 'The red planet'], ['Saturn', 'The planet with beautiful rings']] },
      letter: { title: 'Parents’ meeting', sub: '', text: 'Dear parents,\n\nI would like to invite you to the class parents’ meeting on [date] at [time] in room [number].\n\nWe will talk about the plans for the school year, tasks and coming events.\n\nIf you cannot come, please let me know.\n\nThank you for your cooperation!' },
      rubric: { title: 'Rubric: presentation', sub: '', head: ['Criterion', 'Excellent (5)', 'Good (4)', 'Satisfactory (3)', 'Weak (2)'], rows: [['Content', 'All important facts, accurate', 'Most facts present', 'Some facts missing', 'Content thin or wrong'], ['Structure', 'Clear beginning, middle and end', 'Mostly clear', 'Partly confusing', 'No structure'], ['Delivery', 'Clear, confident speech', 'Mostly clear', 'Reads a lot', 'Hard to follow']] }
    }
  };
  var GL = {
    et: [['Planeet', 'Планета'], ['Täht', 'Звезда'], ['Tiirlema', 'Вращаться'], ['Kaugus', 'Расстояние'], ['Gaasihiiglane', 'Газовый гигант'], ['Õhk', 'Воздух']],
    ru: [['Планета', 'Planeet'], ['Звезда', 'Täht'], ['Вращаться', 'Tiirlema'], ['Расстояние', 'Kaugus'], ['Газовый гигант', 'Gaasihiiglane'], ['Воздух', 'Õhk']],
    en: [['Planet', 'Planeet'], ['Star', 'Täht'], ['To orbit', 'Tiirlema'], ['Distance', 'Kaugus'], ['Gas giant', 'Gaasihiiglane'], ['Air', 'Õhk']]
  };

  function makePlain(opts) {
    var p = (P[opts.outLang] || P.et)[opts.wtype];
    var raw = { title: p.title, subtitle: p.sub, sections: [] };
    if (opts.wtype === 'plan') raw.sections = [{ heading: p.h[0], text: p.goals }, { heading: p.h[1], text: '', table: { headers: p.head, rows: p.rows } }, { heading: p.h[2], text: p.end }];
    else if (opts.wtype === 'letter') raw.sections = [{ heading: '', text: p.text }];
    else raw.sections = [{ heading: '', text: '', table: { headers: p.head, rows: p.rows } }];
    return raw;
  }

  function make(opts) {
    var d = D[opts.outLang] || D.et;
    var raw;
    if (opts.fmt === 'docx' && AI.PLAIN[opts.wtype]) return AI.normalize('docx', makePlain(opts), opts);
    var dq = d.q.slice(), dtf = d.tf.slice(), dfill = d.fill.slice();
    if (opts.variant === 'B') { dq.reverse(); dtf.reverse(); dfill.reverse(); }
    var sub = d.subtitle;
    if (opts.fmt === 'pptx') {
      var slides = opts.wtype === 'quiz'
        ? dq.map(function (x) { return { title: x.q, bullets: x.o, notes: x.o[x.a.charCodeAt(0) - 65], picture: '' }; })
        : d.slides;
      raw = { title: d.title, subtitle: sub, slides: slides, quiz: opts.wtype === 'quiz' ? [] : dq.map(function (x) { return { q: x.q, options: x.o, answer: x.a }; }) };
    } else if (opts.fmt === 'docx') {
      raw = {
        title: d.title, subtitle: sub, instructions: d.instr, minutes: 30,
        sections: [
          { heading: d.sec[0], text: '', tasks: dq.map(function (x) { return { type: 'choice', text: x.q, options: x.o, points: 1, answer: x.a }; }) },
          { heading: d.sec[1], text: '', tasks: dtf.map(function (x) { return { type: 'truefalse', text: x[0], points: 1, answer: x[1] }; }) },
          { heading: d.sec[2], text: '', tasks: dfill.map(function (x) { return { type: 'fill', text: x[0], points: 1, answer: x[1] }; }) },
          { heading: d.sec[3], text: '', tasks: [{ type: 'open', text: d.open[0], points: 3, lines: 4, answer: d.open[1] }] }
        ],
        scale: [], teacherNotes: d.tnote
      };
      var total = 5 + 2 + 2 + 3;
      if (opts.wtype === 'test') {
        var cut = function (p) { return Math.ceil(total * p); };
        raw.scale = [
          { range: cut(0.9) + '–' + total, grade: '5' }, { range: cut(0.75) + '–' + (cut(0.9) - 1), grade: '4' },
          { range: cut(0.5) + '–' + (cut(0.75) - 1), grade: '3' }, { range: cut(0.25) + '–' + (cut(0.5) - 1), grade: '2' },
          { range: '0–' + (cut(0.25) - 1), grade: '1' }
        ];
      }
    } else {
      raw = {
        title: d.title,
        tasks: dq.map(function (x) { return { type: 'choice', text: x.q, options: x.o, points: 1, answer: x.a }; })
          .concat(dfill.map(function (x) { return { type: 'fill', text: x[2], points: 1, answer: x[1] }; }))
          .concat([{ type: 'open', text: d.open[0], points: 3, answer: d.open[1] }]),
        tables: []
      };
    }
    if (opts.glossary) raw.glossary = (GL[opts.outLang] || GL.et).map(function (g) { return { term: g[0], translation: g[1] }; });
    return AI.normalize(opts.fmt, raw, opts);
  }

  window.Demo = { make: make };
})();
