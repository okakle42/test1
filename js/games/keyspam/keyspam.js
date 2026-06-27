(() => {
document.addEventListener("DOMContentLoaded", () => {

    let keySpamRunning = false;

window.stopKeySpam = function(){

    keySpamRunning = false;
    running = false;

    if(timer){
        clearInterval(timer);
        timer = null;
    }

    hits = 0;
    time = 8;

    progress.style.width = "0%";
    hitsElement.textContent = "0 / 20";
    document.getElementById("keyspamTime").textContent = "8";

    result.textContent = "";

    start.style.display = "inline-block";

};


    const start = document.getElementById("startKeySpam");
    if(!start) return;
    const keyElement = document.getElementById("keyspamKey");
    const hitsElement = document.getElementById("keyspamHits");
    const progress = document.getElementById("keyspamProgressFill");
    const result = document.getElementById("keyspamResult");
    const levelElement = document.getElementById("keyspamLevel");
    const KEYS = [
        "E",
        "Q",
        "R",
        "F",
        "ENTER"
    ];
    let running = false;
    let level = 1;
    let target = 20;
    let hits = 0;
    let currentKey = "E";
    let time = 8;
    let timer = null;
    function randomKey(){
        currentKey =
            KEYS[Math.floor(Math.random() * KEYS.length)];
        keyElement.textContent =
                currentKey === "ENTER"
                    ? "⏎"
                    : currentKey;
    }
    function updateHUD(){
        hitsElement.textContent =
            `${hits} / ${target}`;
        progress.style.width =
            ((hits / target) * 100) + "%";
        levelElement.textContent =
            level;
    }
    function startTimer(){
    if(timer){
        clearInterval(timer);
        timer = null;
    }
    time = 8;
    const timeEl =
        document.getElementById("keyspamTime");
    timeEl.textContent = time;
    timeEl.classList.remove("danger");
    timer = setInterval(() => {
        time--;
        timeEl.textContent = time;
        timeEl.classList.toggle(
            "danger",
            time <= 3
        );
        if(time <= 0){
            clearInterval(timer);
            timer = null;
            running = false;
            result.textContent =
                "⛔ ACCESS DENIED";
            start.style.display =
                "inline-block";
        }
    },1000);
}

    function startLevel(){
        keySpamRunning = true;
        running = true;
        hits = 0;
        result.textContent = "";
        start.style.display = "none";
        randomKey();
        updateHUD();
        startTimer();
    }

    start.addEventListener("click", () => {
        level = 1;
        target = 20;
        startLevel();
    });

    document.addEventListener("keydown",(e)=>{
        if (e.repeat) return;
     const view = document.getElementById("keyspam-game");
        if(
    !keySpamRunning ||
    !view ||
    view.classList.contains("hidden")
){
    return;
}
        if(!running) return;
        let pressed =
            e.key.toUpperCase();
        if(e.key === "Enter")
            pressed = "ENTER";
        if(pressed !== currentKey)
            return;
        hits++;
        const sound = Math.floor(Math.random() * 3) + 1;
        audioManager.play("key" + sound);
        keyElement.classList.add("pressed");
        keyElement.classList.add("flash");
        setTimeout(()=>{
            keyElement.classList.remove("pressed");
            keyElement.classList.remove("flash");
        },80);
        updateHUD();
        if(hits >= target){
            running = false;
            result.textContent =
                "✔ Nivel completado";
            level++;
            target += 5;
            clearInterval(timer);
            timer = null;
            setTimeout(()=>{
                startLevel();
            },500);
        }
    });
});
})();