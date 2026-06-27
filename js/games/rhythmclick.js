(() => {

document.addEventListener("DOMContentLoaded", () => {

    const start = document.getElementById("startRhythm");
    if(!start) return;

    const arena = document.getElementById("rhythmArena");

    const levelEl = document.getElementById("rhythmLevel");
    const scoreEl = document.getElementById("rhythmScore");
    const timeEl = document.getElementById("rhythmTime");
    const resultEl = document.getElementById("rhythmResult");

    let running = false;

    let level = 1;
    let score = 0;

    let time = 30;
    let timer = null;

    let spawnInterval = null;
    let spawnDelay = 1000;

    let activeCores = 0;
let maxCores = 1;

    /*=========================
        TEMPORIZADOR
    =========================*/

    function startTimer(){

        if(timer){
            clearInterval(timer);
        }

        time = 30;

        timeEl.textContent = time;
        timeEl.classList.remove("danger");

        timer = setInterval(()=>{

            time--;

            timeEl.textContent = time;

            timeEl.classList.toggle("danger", time <= 10);

            if(time === 10){
                audioManager.play("beep");
            }

            if(time <= 0){

                clearInterval(timer);
                timer = null;

                if(spawnInterval){
                    clearInterval(spawnInterval);
                    spawnInterval = null;
                }

                running = false;

                audioManager.play("gameover");

                resultEl.textContent = "⛔ Tiempo agotado";

                start.style.display = "inline-block";

            }

        },1000);

    }

    /*=========================
        GENERADOR
    =========================*/

    function startSpawner(){

        if(spawnInterval){
            clearInterval(spawnInterval);
        }

        spawnInterval = setInterval(()=>{

            if(!running) return;

            if(activeCores < maxCores){

    spawnCore();

}

        }, spawnDelay);

    }

    /*=========================
        CREAR NÚCLEO
    =========================*/

    function spawnCore(){

        const core = document.createElement("div");

        core.className = "rhythm-core";

        core.innerHTML = `
            <div class="core-ring"></div>
            <div class="core-center"></div>
        `;

        const size = 70;

        const x = Math.random() * (arena.clientWidth - size);
        const y = Math.random() * (arena.clientHeight - size);

        core.style.left = x + "px";
        core.style.top = y + "px";

        arena.appendChild(core);
        activeCores++;

        const ring = core.querySelector(".core-ring");
        const center = core.querySelector(".core-center");

        let scale = 3;
        let clicked = false;

            // Velocidad de cierre según el nivel
    const shrinkSpeed = 0.012 + level * 0.002;

        center.addEventListener("click",()=>{

            if(!running || clicked) return;

            clicked = true;

            if(scale >= 0.95 && scale <= 1.05){

                audioManager.play("perfect");

                score += 100;

                resultEl.textContent = "PERFECT";

            }
            else if(scale >= 0.85 && scale <= 1.15){

                audioManager.play("click");

                score += 50;

                resultEl.textContent = "GOOD";

            }
            else{

                audioManager.play("gameover");

                resultEl.textContent = "MISS";

            }

            scoreEl.textContent = score;
            if(score >= level * 250){

    level++;

    levelEl.textContent = level;

    maxCores = Math.min(5, level);

}

            core.remove();

activeCores = Math.max(0, activeCores - 1);

        });

        function animate(){

            if(!running){

                core.remove();

activeCores = Math.max(0, activeCores - 1);

                return;

            }

            scale -= shrinkSpeed;

            ring.style.transform = `scale(${scale})`;

            // PERFECT
if(scale >= 0.97 && scale <= 1.03){

    ring.classList.add("perfect");

}
// GOOD
else if(scale >= 0.88 && scale <= 1.12){

    ring.classList.add("good");

}

            if(scale <= 0.70){

                if(!clicked){

                    audioManager.play("gameover");

                    resultEl.textContent = "MISS";

                }

                core.remove();

activeCores = Math.max(0, activeCores - 1);

                return;

            }

            requestAnimationFrame(animate);

        }

        animate();

    }

    /*=========================
        EMPEZAR PARTIDA
    =========================*/

function startGame(){

    running = true;

    level = 1;
    score = 0;

    activeCores = 0;
    maxCores = 1;

    levelEl.textContent = level;
    scoreEl.textContent = score;

    resultEl.textContent = "";

    arena.innerHTML = "";

    start.style.display = "none";

    startTimer();

    spawnCore();

    startSpawner();

}

    /*=========================
        BOTÓN START
    =========================*/

    start.addEventListener("click", startGame);

    /*=========================
        LIMPIEZA
    =========================*/

    window.stopRhythm = function(){

        running = false;

        if(timer){

            clearInterval(timer);

            timer = null;

        }

        if(spawnInterval){

            clearInterval(spawnInterval);

            spawnInterval = null;

        }

        arena.innerHTML = "";

        resultEl.textContent = "";

        start.style.display = "inline-block";

    };

});

})();