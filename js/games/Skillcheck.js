// skillchecks.js

(() => {


    document.addEventListener("DOMContentLoaded", () => {

        // ==========================================
        // NAVEGACIÓN
        // ==========================================

 const map = {

    rapidlines: "rapidlines-game",
    circle: "circle-game",
    maze: "maze-game",
    keyspam: "keyspam-game",
    sequence: "sequence-game",
    rhythmclick: "rhythmclick",
    progresstiming: "progresstiming",
    skillbar: "skill-bar"

};

document.querySelectorAll(".skill-cube").forEach(cube => {

    cube.addEventListener("click", () => {

        const game = cube.dataset.game;

        if(map[game]){

            window.showView(map[game]);

        }

    });

});

// ==========================================
// CIRCLE SKILL CHECK
// ==========================================

const needle = document.getElementById("circleNeedle");
const target = document.getElementById("circleTarget");
const startBtn = document.getElementById("startCircle");
const result = document.getElementById("circleResult");

if (!needle || !target || !startBtn || !result) {
console.error("Circle game: faltan elementos HTML");
return;
}

let angle = 0;
let running = false;
let animationId = null;

let speed = 2;
let zoneSize = 50;




let score = 0;
let combo = 0;
let bestScore = Number(
    localStorage.getItem("circleBest")
) || 0;
const scoreEl = document.getElementById("circleScore");
const comboEl = document.getElementById("circleCombo");
const bestEl  = document.getElementById("circleBest");
if(bestEl){
    bestEl.textContent = bestScore;
}




let targetAngle = 0;

const MIN_ZONE_SIZE = 20;
const MAX_SPEED = 5;
const RADIUS = 150;

function placeTarget() {

targetAngle = Math.random() * 360;

const rad = (targetAngle - 90) * Math.PI / 180;

const x = Math.cos(rad) * RADIUS;
const y = Math.sin(rad) * RADIUS;

target.style.left = `calc(50% + ${x}px)`;
target.style.top = `calc(50% + ${y}px)`;

target.style.width = `${zoneSize}px`;

target.style.transform =
    `translate(-50%, -50%) rotate(${targetAngle}deg)`;

}

function animate() {
    if (!running) return;
    angle += speed;
    needle.style.transform =
    `translateX(-50%) rotate(${angle}deg)`;
    animationId = requestAnimationFrame(animate);
}



startBtn.addEventListener("click", e => {
    e.preventDefault();
    startBtn.blur();
    if (running) return;
    speed = 1.5;
    zoneSize = 50;
    angle = Math.random() * 360;
    placeTarget();
    running = true;
    result.textContent = "Pulsa ESPACIO";
    animate();
});

document.addEventListener("keydown", e => {
    if (e.code !== "Space") return;
    e.preventDefault();
    startBtn.blur();
    if (e.repeat) return;
    if (!running) return;
    const pos = angle % 360;
    let diff = Math.abs(pos - targetAngle);
    if (diff > 180) {
        diff = 360 - diff;
    }
  
   const ringRect = document
    .querySelector(".circle-ring")
    .getBoundingClientRect();
const radius = ringRect.width / 2 - 10; // 10 = margen interior
const hitAngle =
    (zoneSize / radius) * (180 / Math.PI) / 2;
const success = diff <= hitAngle;
    if (success) {
   combo++;
    const precision =
        1 - (diff / hitAngle);
    const gained = Math.round(
        100 +
        precision * 100 +
        speed * 20 +
        combo * 5
    );
    score += gained;
    if(scoreEl) scoreEl.textContent = score;
    if(comboEl) comboEl.textContent = combo;
    if(score > bestScore){
        bestScore = score;
        localStorage.setItem(
            "circleBest",
            bestScore
        );
        if(bestEl){
            bestEl.textContent = bestScore;
        }
    }
    zoneSize = Math.max(
        MIN_ZONE_SIZE,
        zoneSize - 1
    );
    speed = Math.min(
        MAX_SPEED,
        speed + 0.5
    );
    placeTarget();
    result.innerHTML =
        `<span style="color:#44ff88">
            ✔ +${gained}
        </span>`;
    } else {
running = false;
cancelAnimationFrame(animationId);

window.stopCircle = function () {
    if (!running) return;
    running = false;
    cancelAnimationFrame(animationId);
};
combo = 0;
if(comboEl){
    comboEl.textContent = combo;
}
result.innerHTML =
`<span style="color:#ff5555">
✖ Fallaste<br>
Score: ${score}
</span>`;
if (window.Leaderboard) window.Leaderboard.save('skillchecks', score);
    }


});

placeTarget();

});

})();