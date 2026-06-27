(() => {

let secretWord = "";
let currentRow = 0;
let timer = null;
let timeLeft = 60;

function generateNumberRepeated() {
  let result = "";
  for(let i = 0; i < 5; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
}


function generateNumberUnique() {
  const digits = ["0","1","2","3","4","5","6","7","8","9"];
  let result = "";
  while(result.length < 5) {
    const index =
      Math.floor(Math.random() * digits.length);
    result += digits[index];
    digits.splice(index, 1);
  }
  return result;
}

function generateSecretNumber() {
  const uniqueMode =
    document.getElementById("typixUniqueDigits").checked;
  return uniqueMode
    ? generateNumberUnique()
    : generateNumberRepeated();
}


function createBoard() {

  const board =
    document.getElementById("typixBoard");
  if(!board) return;
  board.innerHTML = "";
  for(let r = 0; r < 6; r++){
    const row = document.createElement("div");
    row.className = "typix-row";
    for(let c = 0; c < 5; c++){
      const cell = document.createElement("div");
      cell.className = "typix-cell";
      row.appendChild(cell);
    }
    board.appendChild(row);
  }
}


function startTypix() {
  clearInterval(timer);
  secretWord = generateSecretNumber();
  currentRow = 0;
  timeLeft = 60;
  document.getElementById("typixTimer").textContent = timeLeft;
  document.getElementById("typixInput").value = "";
  document.getElementById("typixMessage").textContent = "";
  createBoard();
  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("typixTimer").textContent =
      timeLeft;
    if(timeLeft <= 0){
      loseGame();
    }
  },1000);
}


document.addEventListener("click", (e) => {
  if(e.target.id !== "typixGuessBtn")
    return;
  const input =
    document.getElementById("typixInput");
  const guess =
    input.value.trim();
  if(!/^\d{5}$/.test(guess)){
    return;
  }
  evaluateGuess(guess);
  input.value = "";
});


document.addEventListener("keydown", (e) => {
  if(e.key !== "Enter")
    return;
  const input =
    document.getElementById("typixInput");
  if(document.activeElement !== input)
    return;
  const guess =
    input.value.trim();
  if(!/^\d{5}$/.test(guess)){
    return;
  }
  evaluateGuess(guess);
  input.value = "";
});



function evaluateGuess(guess){
  const row =
    document.querySelectorAll(".typix-row")[currentRow];
  let correct = 0;
  let present = 0;
  for(let i = 0; i < 5; i++){
    if(guess[i] === secretWord[i]){
      correct++;
    } else if(secretWord.includes(guess[i])){
      present++;
    }
  }
row.innerHTML = `
  <span class="typix-guess">${guess}</span>
  <span class="typix-result">
    [${"!".repeat(correct)}${"*".repeat(present)}]
  </span>
`;
  if(guess === secretWord){
    clearInterval(timer);
    document.getElementById("typixMessage")
      .textContent = "¡Ganaste!";
    return;
  }
  currentRow++;
  if(currentRow >= 6){
    loseGame();
  }
}

function loseGame(){
  clearInterval(timer);
  document.getElementById("typixMessage")
    .textContent =
    `❌ Perdiste. La palabra era ${secretWord}`;
}

window.stopTypix = function () {
  if (timer) { clearInterval(timer); timer = null; }
};
window.startTypix = startTypix;

document.addEventListener("DOMContentLoaded", () => {
  if(document.getElementById("typixBoard")){
    startTypix();
  }
});

})();