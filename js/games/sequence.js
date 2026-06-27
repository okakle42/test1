(() => {

document.addEventListener("DOMContentLoaded", () => {

    const start = document.getElementById("startSequence");
    if(!start) return;

    const nodes = document.querySelectorAll(".sequence-node");

    const levelEl = document.getElementById("sequenceLevel");
    const progressEl = document.getElementById("sequenceProgress");
    const resultEl = document.getElementById("sequenceResult");

    let level = 1;

    let sequence = [];
    let playerIndex = 0;

    let showing = false;
    let running = false;

    let time = 8;
let timer = null;

    /*=========================
        Generar secuencia
    =========================*/

    function generateSequence(){

        sequence = [];

        const length = level + 2;

        for(let i=0;i<length;i++){

            sequence.push(
                Math.floor(Math.random()*nodes.length)
            );

        }

    }

    /*=========================
        Mostrar secuencia
    =========================*/
function getSequenceSpeed(){

    // Empieza en 650 ms
    // Baja 30 ms por nivel
    // Nunca será menor de 280 ms

    return Math.max(
        280,
        650 - ((level - 1) * 50)
    );

}

    function playSequence(){

        showing = true;
        running = false;

        let i = 0;

        const interval = setInterval(()=>{

            nodes.forEach(n=>n.classList.remove("active"));

            if(i >= sequence.length){

                clearInterval(interval);

                showing = false;
                running = true;
                startTimer();
                return;

            }

            const node = nodes[sequence[i]];

            node.classList.add("active");

           audioManager.play("tone" + (sequence[i] + 1));
            const flashTime = getSequenceSpeed() * 0.55;
            setTimeout(()=>{

                node.classList.remove("active");

            },flashTime);

            i++;

        },getSequenceSpeed());

    }

    /*=========================
        Nivel
    =========================*/

function startLevel(){

    clearInterval(timer);
    timer = null;

    playerIndex = 0;

    resultEl.textContent = "";

    levelEl.textContent = level;

    generateSequence();

    progressEl.textContent =
        `0 / ${sequence.length}`;

    setTimeout(playSequence,500);

}

    /*=========================
        Click jugador
    =========================*/

    nodes.forEach((node,index)=>{

        node.addEventListener("click",()=>{

            if(showing) return;

            if(!running) return;

            node.classList.add("correct");

            setTimeout(()=>{

                node.classList.remove("correct");

            },180);

            audioManager.play("click");

            if(index !== sequence[playerIndex]){

                running = false;

                node.classList.add("wrong");

                audioManager.play("gameover");

                resultEl.textContent =
                    "⛔ ACCESS DENIED";

                start.style.display =
                    "inline-block";

                return;

            }

            playerIndex++;

if(playerIndex >= sequence.length){

    running = false;

    // Detener el temporizador
    clearInterval(timer);
    timer = null;

    audioManager.play("perfect");

    resultEl.textContent = "✔ Nivel completado";

    level++;

    setTimeout(()=>{

        startLevel();

    },800);

}

        });

    });

    /*=========================
        Empezar
    =========================*/

    start.addEventListener("click",()=>{

        start.style.display = "none";

        level = 1;

        startLevel();

    });
    function startTimer(){

    if(timer){

        clearInterval(timer);

        timer = null;

    }

    time = 8;

    const timeEl =
        document.getElementById("sequenceTime");

    timeEl.textContent = time;

    timeEl.classList.remove("danger");

    timer = setInterval(()=>{

        time--;

        timeEl.textContent = time;

        timeEl.classList.toggle(
            "danger",
            time <= 3
        );

        if(time === 3){

            audioManager.play("step2");

        }

        if(time <= 0){

            clearInterval(timer);

            timer = null;

            running = false;

            audioManager.play("gameover");

            resultEl.textContent =
                "⛔ ACCESS DENIED";

            start.style.display =
                "inline-block";

        }

    },1000);

}

    window.stopSequence = function () {
        running = false;
        showing = false;
        if (timer) { clearInterval(timer); timer = null; }
        resultEl.textContent = '';
        start.style.display = 'inline-block';
    };

});

})();