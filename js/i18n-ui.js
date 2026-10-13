/* Õpetaja Abiline – texts for the menu, the home page and the arrow tour (et / ru / en).
   Loaded after i18n.js; it adds keys and replaces a few older ones. */
(function () {
  'use strict';
  var S = I18N.STR;

  Object.assign(S.et, {
    'nav.home': 'Tere', 'nav.make': 'Tee töö', 'nav.result': 'Tulemus', 'nav.settings': 'Seaded', 'nav.help': 'Õpetus',
    'nav.aria': 'Menüü',
    'home.steps': 'Kuidas see käib?',
    'home.s1.t': 'Võti', 'home.s1.d': 'Vali tehisintellekt ja kleebi tema võti. Gemini on tasuta!',
    'home.s2.t': 'Töö', 'home.s2.d': 'Vali PowerPoint, Word või Excel, klass ja teema.',
    'home.s3.t': 'Valmis', 'home.s3.d': 'Paranda tekst otse lehel ja laadi fail alla.',
    'home.key.ok': '✓ {ai} võti on olemas', 'home.key.none': 'Võtit pole veel lisatud',
    'home.go': 'Alustame ✨', 'home.tour': 'Näita, kuidas 🧭', 'home.first': 'Alusta siit!',
    'help.title': 'Õpetus', 'help.tour': '🧭 Alusta nooltega õpetust', 'help.tour.sub': 'Nooled näitavad täpselt, kuhu vajutada.',
    'help.written': 'Samm-sammult juhend',
    'tour.step': 'Samm {n} / {total}',
    'err.busy': 'Tehisintellekt on praegu ülekoormatud. Proovisime mitut mudelit, aga kõik olid hõivatud.',
    'err.hint.busy': 'See on Google’i / teenuse poole probleem, mitte sinu võtme viga. Oota minut ja vajuta uuesti.',
    'set.page.sub': 'Siin on kõik, mida saab muuta: nimi, tehisintellekt, võtmed ja muusika.',
    'set.sec.ai': 'Tehisintellekt ja võtmed',
    'load.try': 'Proovin mudelit {m} ({n}/{max}) …',
    'set.findmodel': '🔎 Leia töötav mudel',
    'set.findmodel.try': 'Proovin: {m} …',
    'set.findmodel.ok': '✓ Töötab: {m}. Valisin selle sulle.'
  });

  Object.assign(S.ru, {
    'nav.home': 'Главная', 'nav.make': 'Создать', 'nav.result': 'Результат', 'nav.settings': 'Настройки', 'nav.help': 'Помощь',
    'nav.aria': 'Меню',
    'home.steps': 'Как это работает?',
    'home.s1.t': 'Ключ', 'home.s1.d': 'Выберите ИИ и вставьте его ключ. Gemini бесплатный!',
    'home.s2.t': 'Работа', 'home.s2.d': 'Выберите PowerPoint, Word или Excel, класс и тему.',
    'home.s3.t': 'Готово', 'home.s3.d': 'Поправьте текст прямо на странице и скачайте файл.',
    'home.key.ok': '✓ Ключ {ai} добавлен', 'home.key.none': 'Ключ ещё не добавлен',
    'home.go': 'Начнём ✨', 'home.tour': 'Покажи, как это работает 🧭', 'home.first': 'Начните отсюда!',
    'help.title': 'Помощь', 'help.tour': '🧭 Запустить обучение со стрелочками', 'help.tour.sub': 'Стрелочки покажут, куда именно нажимать.',
    'help.written': 'Пошаговая инструкция',
    'tour.step': 'Шаг {n} из {total}',
    'err.busy': 'ИИ сейчас перегружен. Мы попробовали несколько моделей, но все были заняты.',
    'err.hint.busy': 'Это проблема на стороне сервиса, а не вашего ключа. Подождите минуту и нажмите ещё раз.',
    'set.page.sub': 'Здесь всё, что можно изменить: имя, ИИ, ключи и музыка.',
    'set.sec.ai': 'ИИ и ключи',
    'load.try': 'Пробую модель {m} ({n}/{max}) …',
    'set.findmodel': '🔎 Найти рабочую модель',
    'set.findmodel.try': 'Пробую: {m} …',
    'set.findmodel.ok': '✓ Работает: {m}. Я выбрал её для вас.'
  });

  Object.assign(S.en, {
    'nav.home': 'Home', 'nav.make': 'Create', 'nav.result': 'Result', 'nav.settings': 'Settings', 'nav.help': 'Help',
    'nav.aria': 'Menu',
    'home.steps': 'How does it work?',
    'home.s1.t': 'Key', 'home.s1.d': 'Choose an AI and paste its key. Gemini is free!',
    'home.s2.t': 'Work', 'home.s2.d': 'Choose PowerPoint, Word or Excel, the grade and the topic.',
    'home.s3.t': 'Done', 'home.s3.d': 'Edit the text right on the page and download the file.',
    'home.key.ok': '✓ {ai} key added', 'home.key.none': 'No key added yet',
    'home.go': 'Let’s start ✨', 'home.tour': 'Show me how 🧭', 'home.first': 'Start here!',
    'help.title': 'Help', 'help.tour': '🧭 Start the tour with arrows', 'help.tour.sub': 'The arrows show exactly where to press.',
    'help.written': 'Step-by-step guide',
    'tour.step': 'Step {n} of {total}',
    'err.busy': 'The AI is overloaded right now. We tried several models and all of them were busy.',
    'err.hint.busy': 'This is a problem on the service’s side, not with your key. Wait a minute and press again.',
    'set.page.sub': 'Everything you can change is here: name, AI, keys and music.',
    'set.sec.ai': 'AI and keys',
    'load.try': 'Trying model {m} ({n}/{max}) …',
    'set.findmodel': '🔎 Find a working model',
    'set.findmodel.try': 'Trying: {m} …',
    'set.findmodel.ok': '✓ Works: {m}. I picked it for you.'
  });

  /* ---- the arrow tour: go = which page to show, sel = what to point at ---- */
  I18N.TOUR = {
    et: [
      { go: 'home', sel: '#homeName', text: 'Kirjuta siia oma nimi. Siis tervitan sind nimepidi.' },
      { go: 'home', sel: '#uiLang', text: 'Siit saad vahetada lehe keelt: eesti, vene või inglise.' },
      { go: 'home', sel: '#navSettings', text: 'Siit avanevad seaded. Läheme sinna!' },
      { go: 'settings', sel: '#setProvSeg', text: 'Vali ÜKS tehisintellekt. Gemini on tasuta, seega alusta temast.' },
      { go: 'settings', sel: '#keyGroups .as-link', text: 'Vajuta siia: avaneb leht, kust saad oma võtme (see on nagu raamatukogukaart).' },
      { go: 'settings', sel: '#keyGroups .key-in', text: 'Kopeeri võti ja kleebi see siia.' },
      { go: 'settings', sel: '#keyGroups [data-act=testkey]', text: 'Vajuta „Testi“. Roheline linnuke tähendab, et kõik töötab.' },
      { go: 'settings', sel: '#btnSettingsSave', text: 'Ära unusta salvestada!' },
      { go: 'make', sel: '#formatGrid', text: 'Vali, mida soovid teha: esitlus, tööleht või tabel.' },
      { go: 'make', sel: '#typeChips', text: 'Vali töö liik: tunnitöö, iseseisev töö, kodutöö, kontrolltöö või viktoriin.' },
      { go: 'make', sel: '#fTopic', text: 'Kirjuta siia teema või vajuta mõnele soovitusele all.' },
      { go: 'make', sel: '#btnMake', text: 'Ja nüüd vajuta „Valmista“. Ootamise ajal mängib vaikne muusika.' },
      { go: 'make', sel: '#navResult', text: 'Siia ilmub valmis töö. Seal saad teksti parandada ja faili alla laadida.' },
      { go: 'make', sel: '#btnMusic', text: 'Siit lülitad muusika sisse ja välja.' },
      { go: 'home', sel: null, text: 'See ongi kõik! Ilusat tööpäeva 🌹💖' }
    ],
    ru: [
      { go: 'home', sel: '#homeName', text: 'Напишите здесь своё имя. Я буду здороваться с вами по имени.' },
      { go: 'home', sel: '#uiLang', text: 'Здесь можно сменить язык сайта: эстонский, русский или английский.' },
      { go: 'home', sel: '#navSettings', text: 'Здесь открываются настройки. Пойдём туда!' },
      { go: 'settings', sel: '#setProvSeg', text: 'Выберите ОДИН ИИ. Gemini бесплатный, поэтому начните с него.' },
      { go: 'settings', sel: '#keyGroups .as-link', text: 'Нажмите сюда: откроется страница, где можно получить свой ключ (он как читательский билет).' },
      { go: 'settings', sel: '#keyGroups .key-in', text: 'Скопируйте ключ и вставьте его сюда.' },
      { go: 'settings', sel: '#keyGroups [data-act=testkey]', text: 'Нажмите «Проверить». Зелёная галочка значит, что всё работает.' },
      { go: 'settings', sel: '#btnSettingsSave', text: 'Не забудьте сохранить!' },
      { go: 'make', sel: '#formatGrid', text: 'Выберите, что хотите сделать: презентацию, рабочий лист или таблицу.' },
      { go: 'make', sel: '#typeChips', text: 'Выберите вид работы: классная, самостоятельная, домашняя, контрольная или викторина.' },
      { go: 'make', sel: '#fTopic', text: 'Напишите здесь тему или нажмите на одну из подсказок ниже.' },
      { go: 'make', sel: '#btnMake', text: 'А теперь нажмите «Создать». Пока вы ждёте, играет тихая музыка.' },
      { go: 'make', sel: '#navResult', text: 'Сюда придёт готовая работа. Там можно поправить текст и скачать файл.' },
      { go: 'make', sel: '#btnMusic', text: 'Здесь музыка включается и выключается.' },
      { go: 'home', sel: null, text: 'Вот и всё! Хорошего рабочего дня 🌹💖' }
    ],
    en: [
      { go: 'home', sel: '#homeName', text: 'Type your name here. Then I will greet you by name.' },
      { go: 'home', sel: '#uiLang', text: 'You can change the language of the site here: Estonian, Russian or English.' },
      { go: 'home', sel: '#navSettings', text: 'The settings open from here. Let’s go there!' },
      { go: 'settings', sel: '#setProvSeg', text: 'Choose ONE AI. Gemini is free, so start with it.' },
      { go: 'settings', sel: '#keyGroups .as-link', text: 'Press here: a page opens where you can get your key (it is like a library card).' },
      { go: 'settings', sel: '#keyGroups .key-in', text: 'Copy the key and paste it here.' },
      { go: 'settings', sel: '#keyGroups [data-act=testkey]', text: 'Press “Test”. A green tick means everything works.' },
      { go: 'settings', sel: '#btnSettingsSave', text: 'Do not forget to save!' },
      { go: 'make', sel: '#formatGrid', text: 'Choose what you want to make: slides, a worksheet or a table.' },
      { go: 'make', sel: '#typeChips', text: 'Choose the kind of work: classwork, independent work, homework, test or quiz.' },
      { go: 'make', sel: '#fTopic', text: 'Type the topic here, or press one of the ideas below.' },
      { go: 'make', sel: '#btnMake', text: 'And now press “Make it”. Soft music plays while you wait.' },
      { go: 'make', sel: '#navResult', text: 'Your finished work appears here. You can edit the text and download the file there.' },
      { go: 'make', sel: '#btnMusic', text: 'The music is switched on and off here.' },
      { go: 'home', sel: null, text: 'That’s all! Have a lovely day 🌹💖' }
    ]
  };
})();
