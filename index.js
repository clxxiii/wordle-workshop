let acceptSource;
let answerSource;
let wordLength;
let chances;

let loading = document.querySelector(".loading");
let modal = document.querySelector(".modal");
let keys = document.querySelector(".keys");
let boards = document.querySelector(".boards");
let keyArray = document.querySelectorAll(".key");
let resultButton = document.querySelector("#refresh");

let boardNum;
let chance = 1;
let currentLetter = 0;
let words = [];
let answers = [];
let solves = [];
let running = false;

document.addEventListener("keydown", keydown);
resultButton.addEventListener("mouseup", setup);

async function setup() {
  acceptSource =
    document.querySelector("#guess-words").value != ""
      ? document.querySelector("#guess-words").value
      : "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt";
  answerSource =
    document.querySelector("#answer-words")?.value != ""
      ? document.querySelector("#answer-words")?.value
      : "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt";
  wordLength =
    document.querySelector("#length")?.value != ""
      ? document.querySelector("#length")?.value
      : 5;
  chances =
    document.querySelector("#guesses")?.value != ""
      ? document.querySelector("#guesses")?.value
      : 6;
  boardNum =
    document.querySelector("#boards")?.value != ""
      ? document.querySelector("#boards")?.value
      : 1;

  chance = 1;
  currentLetter = 0;
  modal.style.opacity = 0;
  setTimeout(() => (modal.style.display = "none"), 500);

  while (boards.lastChild) {
    boards.removeChild(boards.lastChild);
  }
  answers = [];
  solves = [];

  for (const key of keyArray) {
    key.classList.remove("green");
    key.classList.remove("yellow");
    key.classList.remove("gray");
  }
  document.getElementById("confetti").focus();

  for (let bi = 0; bi < boardNum; bi++) {
    let board = document.createElement("div");
    board.classList.add("board");
    for (let i = 0; i < chances; i++) {
      let row = document.createElement("div");
      row.classList.add("row");
      for (let j = 0; j < wordLength; j++) {
        let box = document.createElement("div");
        box.classList.add("box");
        row.appendChild(box);
      }
      board.appendChild(row);
    }
    boards.appendChild(board);
  }
  await loadWords();
  await getWords();
  loading.style.opacity = 0;
  keys.style.opacity = 1;
  boards.style.opacity = 1;
  running = true;
}

function keydown(key) {
  if (chance > chances) return;
  if (key.altKey || key.ctrlKey) return;

  let letters = "abcdefghijklmnopqrstuvwxyz".slice("");
  let button = key.key.toLowerCase();
  if (letters.includes(button) && currentLetter < wordLength) {
    for (let i = 0; i < boards.children.length; i++) {
      if (solves[i]) continue;
      let board = boards.children[i];
      let row = board.children[chance - 1];
      let box = row.children[currentLetter];
      box.textContent = button.toUpperCase();
    }
    currentLetter++;
  }

  if (button == "enter" && currentLetter == wordLength) {
    checkWord();
  }

  if (button === "backspace" && currentLetter > 0) {
    currentLetter--;
    for (let i = 0; i < boards.children.length; i++) {
      if (solves[i]) continue;
      let board = boards.children[i];
      let row = board.children[chance - 1];
      let box = row.children[currentLetter];
      box.textContent = "";
    }
  }
}

async function loadWords() {
  let response = await fetch(acceptSource);
  words = (await response.text()).split("\n");
  if (words[0].includes("\r")) {
    words = words.map((x) => x.replace("\r", ""));
  }
  words = words.filter((x) => x.length == wordLength);
}

async function getWords() {
  let response = await fetch(answerSource);
  let answerWords = (await response.text()).split("\n");
  if (answerWords[0].includes("\r")) {
    answerWords = answerWords.map((x) => x.replace("\r", ""));
  }
  answerWords = answerWords.filter((x) => x.length == wordLength);

  for (const _ of boards.children) {
    let answer;
    while (!words.includes(answer)) {
      answer = answerWords[Math.floor(Math.random() * answerWords.length)];
    }
    answers.push(answer);
    solves.push(false);
  }
}

function checkWord() {
  let notaword = false;
  for (let i = 0; i < boards.children.length; i++) {
    if (solves[i]) continue;
    let board = boards.children[i];
    let row = board.children[chance - 1];

    let input = "";
    for (let i = 0; i < wordLength; i++) {
      input += row.children[i].textContent.toLowerCase();
    }
    if (!words.includes(input)) {
      row.style.animation = "shake 0.5s linear";
      setTimeout(() => (row.style.animation = ""), 500);
      notaword = true;
      continue;
    }
    let inputArr = input.split("");

    let wordArr = answers[i].split("");

    for (let i = 0; i < wordArr.length; i++) {
      if (wordArr[i] == inputArr[i]) {
        row.children[i].classList.add("green");
        // Prevent multiple letters having more than one hit
        wordArr[wordArr.indexOf(inputArr[i])] = "-";

        let key = document.querySelector(`.key.${inputArr[i]}`);
        key.classList.add("green");
        key.classList.remove("yellow");
        key.classList.remove("gray");
      } else if (wordArr.includes(inputArr[i])) {
        row.children[i].classList.add("yellow");
        // Prevent multiple letters having more than one hit
        wordArr[wordArr.indexOf(inputArr[i])] = "-";

        let key = document.querySelector(`.key.${inputArr[i]}`);
        if (!key.classList.contains("green")) {
          key.classList.add("yellow");
          key.classList.remove("gray");
        }
      } else {
        row.children[i].classList.add("grey");
        let key = document.querySelector(`.key.${inputArr[i]}`);
        if (
          !key.classList.contains("green") &&
          !key.classList.contains("yellow")
        ) {
          key.classList.add("gray");
        }
      }
    }
    if (input == answers[i]) {
      solves[i] = true;
      board.classList.add("solved");
    }
  }
  let win = true;
  for (const solve of solves) {
    win = win && solve;
  }
  if (win) {
    let confetti = new ConfettiGenerator({
      target: "confetti",
      respawn: false,
    });
    modal.style.display = "flex";
    confetti.render();
    setTimeout(showModal, 2000);
    return;
  }
  if (!notaword) {
    currentLetter = 0;
    chance++;
  }

  if (chance > chances) {
    for (let i = 0; i < boards.children.length; i++) {
      let board = boards.children[i];
      let answerBox = document.createElement("div");
      answerBox.classList.add("urbad");
      answerBox.textContent = answers[i];
      board.appendChild(answerBox);
    }
    setTimeout(showModal, 1000 * answers.length);
  }
}

function showModal() {
  modal.style.opacity = 1;
  boards.style.opacity = 0;
  loading.style.opacity = 1;
  keys.style.opacity = 0;
}
