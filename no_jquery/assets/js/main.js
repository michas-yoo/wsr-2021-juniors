const $ = el => document.querySelector(el);
const $$ = el => document.querySelectorAll(el);

let game = null;
let player = null;

$("input").oninput = function (e) {
  if (e.target.value)
    $(".submit_button").disabled = "";
  else
    $(".submit_button").disabled = "disabled";
}

$(".submit_button").onclick = function (e) {
  e.preventDefault();

  setupVariables();
}

function setCurrentScreen(id) {
  $(".current").classList.remove("current");

  $("#" + id).classList.add("current");
}

function setupVariables() {
  setCurrentScreen("screenGame");
  game = null;
  player = null;

  game = new Game($(".username").value);
}

class Game {
  constructor(name) {
    this.min = 0;
    this.sec = 0;
    this.timeString = "00:00";

    this.username = name;
    this.score = 0;

    this.size = {};
    this.interval = null;

    this.setupInterval();
    this.setupGround();
    this.setObjects("heart");
    this.setObjects("stone");

    $("#hudUsername").innerText = this.username;
    $("#hudHearts").innerText = "0/10";
    $("#hudTime").innerText = "00:00"
  }

  setObjects(what) {

    for (let i = 0; i < 10; i++) {
      let el = $$(".ground")[Math.floor(Math.random() * $$(".ground").length)];

      el.classList.remove("ground")
      el.classList.add(what)
    }
  }

  timerFunction() {
    this.sec++;

    if (this.sec === 60) {
      this.sec = 0;
      this.min++;
    }

    this.timeString = ("0" + this.min).slice(-2) + ":" + ("0" + this.sec).slice(-2);

    $("#hudTime").innerText = this.timeString;
  }

  setupInterval() {
    this.interval = setInterval(() => {
      this.timerFunction();
    }, 1000)
  }

  setupGround() {
    let field = $(".field");
    this.size = {
      w: Math.floor(field.offsetWidth / 64),
      h: Math.floor(field.offsetHeight / 64),
    };

    for (let i = 0; i < this.size.w; i++) {
      for (let j = 0; j < this.size.h; j++) {
        field.innerHTML += `<div class='cell ground' style="left: ${i * 64}px; top: ${j * 64}px"></div>`;
      }
    }

    $(".cell").classList.remove("ground");

    field.innerHTML += `<div class="cell player" style="top: 0; left: 0"></div>`;

    player = new Player($(".player"), this.size);
  }

  updateScore() {
    this.score++;
    $("#hudHearts").innerText = `${this.score}/10`;

    if (this.score === 10)
      this.win();
  }

  win() {
    clearInterval(this.interval);
    $$(".cell").forEach(el => el.remove());
    setCurrentScreen("screenRating");

    $(".info").innerHTML = `<h2>Имя: ${this.username}</h2><p>Время: ${this.timeString}</p>`;
  }

  die() {
    clearInterval(this.interval);
    $$(".cell").forEach(el => el.remove());
    setCurrentScreen("screenLoss");
  }
}

class Player {
  constructor(el, size) {
    this.el = el;
    this.size = {
      w: size.w * 64,
      h: size.h * 64,
    };

    this.setupMoveListener();
  }

  setupMoveListener() {
    document.body.onkeydown = (e) => {
      switch (e.code) {
        case "KeyW":
          this.move("up");
          break;
        case "KeyS":
          this.move("down");
          break;
        case "KeyA":
          this.move("left");
          break;
        case "KeyD":
          this.move("right");
          break;
        default:
          return;
      }
    };
  }

  getElementAtPosition(x, y) {
    return Array.from($$(".cell:not(.player)")).filter(el => el.style.top === y + "px" && el.style.left === x + "px")[0];
  }

  getElClassNameAtPosition(x, y) {
    let el = this.getElementAtPosition(x, y);
    return el ? el.className.replace("cell", "").replace(" ", "") : "";
  }

  move(dir) {
    this.x = parseInt(this.el.style.left);
    this.y = parseInt(this.el.style.top);

    switch (dir) {
      case "up":
        if (this.y > 0 && this.getElClassNameAtPosition(this.x, this.y - 64) !== "stone")
          this.y -= 64;
        break;
      case "down":
        if (this.y < this.size.h - 64 && this.getElClassNameAtPosition(this.x, this.y + 64) !== "stone")
          this.y += 64;
        break;
      case "left":
        if (this.x > 0 && this.getElClassNameAtPosition(this.x - 64, this.y) !== "stone")
          this.x -= 64;
        break;
      case "right":
        if (this.x < this.size.w - 64 && this.getElClassNameAtPosition(this.x + 64, this.y) !== "stone")
          this.x += 64;
        break;
    }

    this.el.style.left = this.x + "px";
    this.el.style.top = this.y + "px";

    this.removeBottomBlock();
  }

  removeBottomBlock() {
    let element = this.getElementAtPosition(this.x, this.y);

    if (element) {
      if (element.classList.contains("heart"))
        game.updateScore();

      element.className = "cell";

      this.checkIfElementUpCanFall(this.x, this.y - 64);
    }
  }

  isPlayerAtPosition(x, y) {
    return $(".player").style.top === y && $('.player').style.left === x;
  }

  checkIfElementUpCanFall(x, y) {
    setTimeout(() => {
      let el = this.getElementAtPosition(x, y);
      let elClass = this.getElClassNameAtPosition(x, y);

      if (elClass === "stone" || elClass === "heart") {
        let fallingInterval = setInterval(() => {
          let cur_y = parseInt(el.style.top);
          let className = this.getElClassNameAtPosition(x, cur_y + 64);

          if (!$(".current").classList.contains("game")) {
            clearInterval(fallingInterval);
            return;
          }

          if (className === "" && cur_y < this.size.h - 64) {
            if (this.isPlayerAtPosition(el.style.left, parseInt(el.style.top) + 64 + "px")) {
              if (elClass === "stone")
                game.die();
              else {
                el.className = "cell";
                game.updateScore();
              }
              clearInterval(fallingInterval);
            } else
              el.style.top = cur_y + 64 + "px";
          } else {
            clearInterval(fallingInterval);
          }
        }, 1000);

        this.checkIfElementUpCanFall(x, y - 64);
      }
    }, 1000);
  }
}
