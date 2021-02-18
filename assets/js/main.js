// Пока не введем значение в имя, играть нельзя
function validateName(e) {
  if (e.target.value)
    $(".submit_button").removeAttr("disabled")
  else
    $(".submit_button").attr("disabled", "disabled");
}

// Подвязываем событие инпута
$("#username").on("input", validateName);

// При нажатии на форму начала игры нужно задать переменные
// Но т.к. она в форме,  изначально она type=submit, так что нужно
// Отключить стандартный функционал через e.preventDefault()
$(".submit_button").on("click", function (e) {
  e.preventDefault();

  setupVaraibles();
});

/**
 * Устанавливает текущий экран по его id
 * @param id
 */
function setCurrentScreen(id) {
  $(".current").removeClass("current");
  $(".active").removeClass("active");

  $("#" + id).addClass("current");
  $(`#${id} .box-wrapper`).addClass("active")
}

// Глобальные объекты игры и игрока
let game = null;
let player = null;

/**
 * Задаем стандартные значения переменных, открываем игровое поле
 */
function setupVaraibles() {
  setCurrentScreen("game");

  game = null;
  player = null;

  game = new Game($("#username").val());
}

/**
 * Главный класс игры
 */
class Game {
  constructor(name) {
    //  Время
    this.min = 0;
    this.sec = 0;
    this.timeString = "00:00";

    // Имя игрока и счёт
    this.username = name;
    this.score = 0;

    // Размер поля
    this.size = {};

    // Главный интервал игры
    this.interval = null;

    this.setupInterval();
    this.setupGround();
    this.setObject("heart");
    this.setObject("stone");

    // Сбрасываем стандартные значения
    $("#hudUsername").text(this.username);
    $("#hudHearts").text("0/10");
    $("#hudTime").text("00:00");
  }

  /**
   * Главный таймер
   */
  timerFunction() {
    this.sec++;

    if (this.sec === 60) {
      this.sec = 0;
      this.min++
    }

    /**
     * Мы берем текущее значение времени, и первым символом ставим 0
     * А далее просто достаем последние 2 числа
     * Если было 10, то будет 010, и последние 2 числа – 10
     * Если было 5, то будет 05, и последние 2 числа – 05
     */
    this.timeString = ("0" + this.min).slice(-2) + ":" + ("0" + this.sec).slice(-2);

    $("#hudTime").text(this.timeString);
  }

  /**
   * Интервал, который запускает таймер
   */
  setupInterval() {
    this.interval = setInterval(() => {
      this.timerFunction()
    }, 1000);
  }

  /**
   * Генерируем поле
   */
  setupGround() {
    let field = $(".field")[0];

    // Рассчитываем размер в зависимости от размера экрана
    this.size = {
      w: Math.floor(field.offsetWidth / 64),
      h: Math.floor(field.offsetHeight / 64)
    };

    // Заполняем поле землей
    for (let i = 0; i < this.size.w; i++) {
      for (let j = 0; j < this.size.h; j++) {
        field.innerHTML += `<div class="cell ground" style="left: ${i * 64}px; top: ${j * 64}px;"></div>`
      }
    }

    // У первого блока будет игрок, класс земли ему не нужен
    $(field).find(".cell").first().removeClass("ground")

    // Добавляем игрока
    field.innerHTML += "<div class='cell player' style='top: 0; left: 0'></div>"

    // Инициализируем нового
    player = new Player($(".player"), this.size);
  }

  /**
   * Добавляем 10 объектов (сердец или камней)
   * @param name
   */
  setObject(name) {
    for (let i = 0; i < 10; i++) {
      $(".ground").eq(Math.floor(Math.random() * $(".ground").length))
        .addClass(name)
        .removeClass("ground")
    }
  }

  /**
   * Обновляем счёт
   * Если он равен 10 (кол-во сердечек на поле), то мы победили
   * Условие победы так же можно поменять на $(".heart").length > 0 – на поле ещё есть сердца
   */
  updateScore() {
    this.score++;
    $("#hudHearts").text(`${this.score}/10`);

    if (this.score === 10)
      this.win();
  }

  /**
   * В случае победы мы очистим интервал таймера, уберем все ячейки
   * Вызовем метод win() игрока, и покажем экран победы
   */
  win() {
    clearInterval(this.interval);
    $(".cell").remove();
    setCurrentScreen("screenRating")
  }

  /**
   * Если мы попали под камень, то мы останавливаем интервал, убираем все ячейки
   * И показываем экран проигрыша
   */
  die() {
    clearInterval(this.interval);
    $(".cell").remove();
    setCurrentScreen("screenLoss")
  }
}

/**
 * Главный класс игрока
 */
class Player {
  constructor(el, size) {
    this.el = el;

    // Размер игрового поля * 64
    this.size = {
      w: size.w * 64,
      h: size.h * 64,
    };

    // Добавляем обработчики события
    this.setupMoveListeners();
  }

  /**
   * Обновляем значение метода onkeydown
   */
  setupMoveListeners() {
    document.body.onkeydown = this.movingListener.bind(this);
  }

  /**
   * Определяем на какую клавишу мы нажали, чтобы вызвать движение
   * @param e
   */
  movingListener(e) {
    switch (e.key) {
      case "w":
      case "ц":
        this.move("up");
        break;
      case "s":
      case "ы":
        this.move("down");
        break;
      case "a":
      case "ф":
        this.move("left");
        break;
      case "d":
      case "в":
        this.move("right");
        break;
      default:
        return;
    }
  }

  /**
   * Находим элемент в нужной позиции
   * @param x – число (координата или style.left)
   * @param y – число (координата или style.top)
   * @returns {object} – див с нужным полем
   */
  getElementAtPosition(x, y) {
    return Array.from(document.querySelectorAll(".cell:not(.player)")).filter(el => el.style.top === y + "px" && el.style.left === x + "px")[0]
  }

  /**
   * Берем позицию, ищем элемент и возвращаем его класс
   * @param x
   * @param y
   * @returns {string|string}
   */
  getElClassNameAtPosition(x, y) {
    let el = this.getElementAtPosition(x, y);
    return el ? el.className.replace('cell', "").replace(" ", "") : "";
  }

  /**
   * Функция движения игрока
   * @param dir
   */
  move(dir) {
    // Берем текущие координаты
    this.x = parseInt(this.el.css("left"));
    this.y = parseInt(this.el.css("top"));

    switch (dir) { // проверяем не выходим ли мы за границы поля, и не заходим ли мы на камень
      case "up":
        if (this.y > 0 && this.getElClassNameAtPosition(this.x, this.y - 64) !== "stone")
          this.y -= 64;
        break;
      case "down":
        if (this.y < this.size.h - 64 && this.getElClassNameAtPosition(this.x, this.y + 64) !== "stone")
          this.y += 64;
        break;
      case "right":
        if (this.x < this.size.w - 64 && this.getElClassNameAtPosition(this.x + 64, this.y) !== "stone")
          this.x += 64;
        break;
      default:
        if (this.x > 0 && this.getElClassNameAtPosition(this.x - 64, this.y) !== "stone")
          this.x -= 64;
        break
    }

    // Обновляем стиль
    this.el.css({
      top: this.y,
      left: this.x
    });

    // Удаляем блок, на который залезли
    this.removeBottomBlock();
  }

  removeBottomBlock() {
    // Берем элемент, на который встал игрок
    let element = this.getElementAtPosition(this.x, this.y);

    // Проверка на null, иногда вылетала странная ошибка
    if (element) {
      // Если мы зашли на сердечко, то увеличим  счёт
      if (element.classList.contains("heart"))
        game.updateScore();

      // Удалим текстуру
      element.className = "cell";

      // Проверим, может этот элемент может упасть
      this.checkIfElementUpIsStone(parseInt(element.style.left), parseInt(element.style.top) - 64)
    }
  }

  /**
   * Проверяем что игрок в указанной позиции
   * @param x
   * @param y
   * @returns {boolean}
   */
  isPlayerAtPosition(x, y) {
    return $(".player").css("top") === y && $(".player").css("left") === x;
  }

  /**
   * Рекурсивная функция, которая берет координаты и проверяет, есть ли блоком ниже пустое пространство
   * Пока оно есть, каждую секунду блок будет падать вниз
   * @param x
   * @param y
   */
  checkIfElementUpIsStone(x, y) {
    // По заданию нужно ждать 1 сек
    setTimeout(() => {
      // Достаем текущий элемент и его позицию
      let el = this.getElementAtPosition(x, y);
      let elClass = this.getElClassNameAtPosition(x, y);

      // Работаем только если падает камень или сердце
      if (elClass === "stone" || elClass === "heart") {

        // Пока нам есть куда падать, каждую  секунду будем опускать блок
        let fallingInterval = setInterval(() => {
          // Берем класс блока, на на который упадем
          let className = this.getElClassNameAtPosition(x, parseInt(el.style.top) + 64);

          // Если класс пустой (просто cell), и наш блок в пределах игрового поля
          if (className === "" && parseInt(el.style.top) < this.size.h - 64) {
            // Вдруг наш игрок как раз в этом поле?
            if (this.isPlayerAtPosition(el.style.left, parseInt(el.style.top) + 64 + "px")) {
              if (elClass === "stone") { // Если сейчас падает камень, то игрок проиграл
                game.die();
              } else { // А если сердце, то получил очко и сбросил текстуру
                el.className = "cell";
                game.updateScore();
              }
              // Больше падать не нужно, очищаем интервал
              clearInterval(fallingInterval);
            } else // Игрока под падающим блоком нет, так что можем просто падать дальше
              el.style.top = parseInt(el.style.top) + 64 + "px";
          } else // Под падающим блоком есть текстура (не пустая cell), так что больше не падаем
            clearInterval(fallingInterval);
        }, 1000);

        // Рекурсивно вызываем функцию падения, чтобы проверить, что над текущим падающим нет других
        // Например, колонна из двух камней. Если не сделать эту проверку, то упадет только нижний камень
        this.checkIfElementUpIsStone(x, y - 64);
      }
    }, 1000);
  }
}
