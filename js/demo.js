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

  function make(opts) {
    var d = D[opts.outLang] || D.et;
    var raw;
    var sub = d.subtitle;
    if (opts.fmt === 'pptx') {
      var slides = opts.wtype === 'quiz'
        ? d.q.map(function (x) { return { title: x.q, bullets: x.o, notes: x.o[x.a.charCodeAt(0) - 65], picture: '' }; })
        : d.slides;
      raw = { title: d.title, subtitle: sub, slides: slides, quiz: opts.wtype === 'quiz' ? [] : d.q.map(function (x) { return { q: x.q, options: x.o, answer: x.a }; }) };
    } else if (opts.fmt === 'docx') {
      raw = {
        title: d.title, subtitle: sub, instructions: d.instr, minutes: 30,
        sections: [
          { heading: d.sec[0], text: '', tasks: d.q.map(function (x) { return { type: 'choice', text: x.q, options: x.o, points: 1, answer: x.a }; }) },
          { heading: d.sec[1], text: '', tasks: d.tf.map(function (x) { return { type: 'truefalse', text: x[0], points: 1, answer: x[1] }; }) },
          { heading: d.sec[2], text: '', tasks: d.fill.map(function (x) { return { type: 'fill', text: x[0], points: 1, answer: x[1] }; }) },
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
        tasks: d.q.map(function (x) { return { type: 'choice', text: x.q, options: x.o, points: 1, answer: x.a }; })
          .concat(d.fill.map(function (x) { return { type: 'fill', text: x[2], points: 1, answer: x[1] }; }))
          .concat([{ type: 'open', text: d.open[0], points: 3, answer: d.open[1] }]),
        tables: []
      };
    }
    return AI.normalize(opts.fmt, raw, opts);
  }

  window.Demo = { make: make };
})();
