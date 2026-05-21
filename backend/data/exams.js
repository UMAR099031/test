const EXAMS = {
  html: {
    title: "HTML",
    durationMinutes: 20,
    questions: [
      { q: "Какой тег семантически обозначает основное содержимое страницы?", options: ["<section>", "<main>", "<article>", "<div>"], a: 1 },
      { q: "Как корректно связать <label> с полем ввода?", options: ["Через атрибут name", "Через атрибут for и id", "Через атрибут class", "Нельзя связать"], a: 1 },
      { q: "Что делает атрибут required у <input>?", options: ["Запрещает ввод цифр", "Делает поле обязательным перед отправкой", "Скрывает поле", "Ставит значение по умолчанию"], a: 1 },
      { q: "Какой атрибут у формы определяет URL, куда отправляются данные?", options: ["target", "action", "method", "enctype"], a: 1 },
      { q: "Какой метод формы безопаснее использовать для отправки паролей?", options: ["GET", "POST", "PUT", "TRACE"], a: 1 },
      { q: "Какой тег используется для группировки заголовка/контента в таблице?", options: ["<thead>, <tbody>, <tfoot>", "<tr>, <td>, <th>", "<table>, <caption>, <col>", "<meta>, <link>, <style>"], a: 0 },
      { q: "Как сделать ячейку заголовка таблицы?", options: ["<td>", "<th>", "<header>", "<h3>"], a: 1 },
      { q: "Какая пара тегов задаёт список определений (термин — описание)?", options: ["<ul> + <li>", "<ol> + <li>", "<dl> + <dt>/<dd>", "<list> + <item>"], a: 2 },
      { q: "Какой атрибут задаёт альтернативный текст изображения?", options: ["title", "alt", "srcset", "aria-label"], a: 1 },
      { q: "Какой тег семантически обозначает навигацию?", options: ["<nav>", "<menu>", "<aside>", "<header>"], a: 0 },
      { q: "Какой тег подходит для автономного блока (например, пост/карточка) с заголовком и текстом?", options: ["<article>", "<span>", "<em>", "<small>"], a: 0 },
      { q: "Для чего используется meta viewport на мобильных устройствах?", options: ["Для кеширования", "Для управления масштабом и шириной отображения", "Для подключения шрифтов", "Для SEO заголовка"], a: 1 },
      { q: "Какой тип input позволяет выбрать одну дату?", options: ["datetime", "date", "calendar", "time-date"], a: 1 },
      { q: "Что вернёт <button> внутри <form> без указания type?", options: ["Всегда reset", "По умолчанию submit", "По умолчанию button", "Ничего не делает"], a: 1 },
      { q: "Какой тег используется для встроенного контента другой страницы (например, YouTube)?", options: ["<embed>", "<iframe>", "<object>", "<portal>"], a: 1 },
    ],
  },
  css: {
    title: "CSS",
    durationMinutes: 25,
    questions: [
      { q: "Какой селектор выберет все <p> внутри .card, но не глубже первого уровня (только прямые дети)?", options: [".card p", ".card > p", ".card + p", ".card ~ p"], a: 1 },
      { q: "Что делает box-sizing: border-box?", options: ["Учитывает padding и border внутри заданной ширины/высоты", "Скрывает border", "Делает элементы круглыми", "Запрещает margin"], a: 0 },
      { q: "Как выровнять элементы по главной оси во Flexbox?", options: ["align-items", "justify-content", "place-items", "align-content"], a: 1 },
      { q: "Как сделать перенос flex-элементов на новую строку?", options: ["flex-wrap: wrap", "flex-flow: column", "white-space: wrap", "overflow: wrap"], a: 0 },
      { q: "Какой CSS Grid-свойство задаёт количество колонок?", options: ["grid-template-columns", "grid-auto-flow", "grid-column-gap", "grid-columns"], a: 0 },
      { q: "Что означает fr в grid-template-columns: 1fr 2fr?", options: ["Фиксированные пиксели", "Доли свободного пространства", "Проценты от экрана", "Единицы шрифта"], a: 1 },
      { q: "Какой псевдокласс выбирает элемент при наведении мыши?", options: [":focus", ":active", ":hover", ":visited"], a: 2 },
      { q: "Как анимировать свойство плавно при изменении состояния?", options: ["transition", "transform", "filter", "clip-path"], a: 0 },
      { q: "Какой порядок приоритетов специфичности выше?", options: ["Теги < классы < id", "id < классы < теги", "inline < id < классы", "классы < теги < id"], a: 0 },
      { q: "Как выбрать только первый элемент среди однотипных в родителе?", options: [":first-child", ":first-of-type", ":nth-first", ":only-child"], a: 1 },
      { q: "Что делает position: sticky?", options: ["Всегда фиксирует элемент на экране", "Элемент relative до порога, затем как fixed в пределах контейнера", "Перемещает элемент в конец DOM", "Отключает прокрутку"], a: 1 },
      { q: "Как сделать фон с градиентом?", options: ["background: gradient(...)", "background: linear-gradient(...)", "gradient: linear(...)", "bg: linear(...)"], a: 1 },
      { q: "Как скрыть элемент, оставив место в потоке?", options: ["display: none", "opacity: 0", "visibility: hidden", "position: absolute"], a: 2 },
      { q: "Какой media query проверяет ширину экрана <= 768px?", options: ["@media (min-width: 768px)", "@media (max-width: 768px)", "@media (width <= 768)", "@media (screen: 768px)"], a: 1 },
      { q: "Что верно про transform: translateX(20px)?", options: ["Сдвигает вправо на 20px без влияния на поток", "Увеличивает ширину на 20px", "Добавляет margin-left 20px", "Двигает только текст внутри"], a: 0 },
    ],
  },
  js: {
    title: "JavaScript",
    durationMinutes: 30,
    questions: [
      { q: "Какой метод добавляет обработчик события и позволяет добавлять несколько обработчиков?", options: ["element.onClick()", "element.addEventListener()", "element.attachEvent()", "element.listen()"], a: 1 },
      { q: "Что вернёт document.querySelectorAll('.item')?", options: ["Один элемент", "HTMLCollection", "NodeList", "Array"], a: 2 },
      { q: "Как правильно объявить стрелочную функцию, возвращающую сумму a и b?", options: ["(a,b) => a + b", "function => (a,b) a+b", "=> (a,b) {return a+b}", "(a,b) -> a+b"], a: 0 },
      { q: "Что делает Array.prototype.map?", options: ["Фильтрует элементы", "Изменяет исходный массив", "Создаёт новый массив по результатам колбэка", "Сортирует массив"], a: 2 },
      { q: "Как проверить, что x — массив?", options: ["typeof x === 'array'", "x.isArray()", "Array.isArray(x)", "x instanceof 'Array'"], a: 2 },
      { q: "Что вернёт: '5' == 5 ?", options: ["false", "true", "ошибка", "undefined"], a: 1 },
      { q: "Что вернёт: '5' === 5 ?", options: ["false", "true", "ошибка", "null"], a: 0 },
      { q: "Как безопасно получить user.name, если user может быть null?", options: ["user.name()", "user?.name", "user!name", "user??name"], a: 1 },
      { q: "Что происходит при return 10 из async функции?", options: ["Возвращает 10", "Возвращает Promise, который резолвится в 10", "Блокирует поток", "Вызывает callback"], a: 1 },
      { q: "Как дождаться промиса в async функции?", options: ["wait promise", "promise.then(await)", "await promise", "yield promise"], a: 2 },
      { q: "Что такое делегирование событий?", options: ["Событие на каждом дочернем", "Событие на родителе + проверка event.target", "Удаление событий при клике", "Переопределение событий браузера"], a: 1 },
      { q: "Как остановить всплытие?", options: ["event.cancel()", "event.stopPropagation()", "event.stop()", "event.preventBubble()"], a: 1 },
      { q: "Что делает event.preventDefault()?", options: ["Останавливает всплытие", "Отменяет действие по умолчанию", "Удаляет обработчики", "Сбрасывает форму"], a: 1 },
      { q: "Как сделать shallow copy объекта?", options: ["Object.copy(obj)", "{...obj}", "obj.clone()", "obj = obj"], a: 1 },
      { q: "Что верно про this в стрелочной функции?", options: ["Всегда объект вызова", "Лексически берётся снаружи", "Можно менять bind", "Всегда window"], a: 1 },
    ],
  },
};

function getExamPublic(examType) {
  const exam = EXAMS[examType];
  if (!exam) return null;
  return {
    examType,
    title: exam.title,
    durationMinutes: exam.durationMinutes,
    questions: exam.questions.map((qq, idx) => ({ id: idx + 1, question: qq.q, options: qq.options })),
  };
}

function gradeExam(examType, answers) {
  const exam = EXAMS[examType];
  if (!exam) return null;
  const total = exam.questions.length;
  let score = 0;
  for (let i = 0; i < total; i += 1) {
    const correct = exam.questions[i].a;
    const given = answers[i];
    if (Number.isInteger(given) && given === correct) score += 1;
  }
  const percent = Math.round((score / total) * 100);
  let grade = "F";
  if (percent >= 90) grade = "A";
  else if (percent >= 80) grade = "B";
  else if (percent >= 70) grade = "C";
  else if (percent >= 60) grade = "D";
  return { total, score, percent, grade };
}

module.exports = { EXAMS, getExamPublic, gradeExam };

