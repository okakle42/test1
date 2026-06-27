(() => {

class RapidLines{
    constructor(){
        this.arena = document.getElementById("rapidArena");
        this.center = document.getElementById("rapidCenter");
        this.effects = document.getElementById("rapidEffects");
        this.startBtn = document.getElementById("startRapid");
        this.result = document.getElementById("rapidResult");
        this.scoreEl = document.getElementById("rapidScore");
        this.comboEl = document.getElementById("rapidCombo");
        this.bestEl = document.getElementById("rapidBest");
        this.timeEl = document.getElementById("rapidTime");
        

        this.running = false;
        this.arrows = [];
        this.score = 0;
        this.combo = 0;
        this.best =
            Number(
                localStorage.getItem("rapidBest")
            ) || 0;
        this.bestEl.textContent = this.best;
        this.timer = null;
        this.time = 60;
        this.config = {
            startSpeed:6,
            currentSpeed:6,
            speedIncrease:0.15,
            maxSpeed:14,
            arrows:1,
            perfectRadius:18,
            goodRadius:45,
            duration:60
        };
        this.bindEvents();
    }
bindEvents(){
    this.startBtn.addEventListener(
        "click",
        ()=>this.start()
    );
    document.addEventListener(
        "keydown",
        e=>this.keyDown(e)
    );
}


start(){
    audioManager.play("perfect");
    if(this.running) return;
    this.running=true;
    this.score=0;
    this.combo=0;
    this.scoreEl.textContent=0;
    this.comboEl.textContent=0;
    this.result.textContent="";
    this.config.currentSpeed=
        this.config.startSpeed;
    this.time=this.config.duration;
    this.timeEl.textContent=this.time;
    this.clearArena();
    this.fillArena();
    this.startTimer();
    requestAnimationFrame(
        ()=>this.update()
    );
}
startTimer(){
    clearInterval(this.timer);
    this.timer=setInterval(()=>{
    this.time--;
        this.timeEl.textContent=this.time;
        if(this.time<=0){
            this.gameOver(
                "Tiempo agotado"
            );

        }

    },1000);

}
gameOver(text){
    this.running=false;
    clearInterval(this.timer);
    this.result.innerHTML=
    `<span style="color:#ff5555">
        ${text}
    </span>`;
    this.clearArena();
}



clearArena(){
    this.arrows.forEach(a=>{
        a.element.remove();
    });
    this.arrows=[];
}


fillArena(){
    const dirs=[
        "left",
        "right",
        "top",
        "bottom"
    ];
    while(
        this.arrows.length <
        this.config.arrows
    ){
this.spawnArrow(
    dirs[Math.floor(Math.random() * dirs.length)]
);
    }
}

spawnArrow(direction){
    const arrow =
        new RapidArrow(this,direction);
    this.arrows.push(arrow);
}

update(){
    if(!this.running) return;
    const centerX =
        this.arena.clientWidth/2;
    const centerY =
        this.arena.clientHeight/2;
    for(
        let i=this.arrows.length-1;
        i>=0;
        i--
    ){
        const a=this.arrows[i];
        a.x+=a.dx*a.speed;
        a.y+=a.dy*a.speed;
        a.element.style.left=a.x+"px";
        a.element.style.top=a.y+"px";
        let rotation=0;
        switch(a.direction){
            case "left":
                rotation=0;
                break;
            case "right":
                rotation=180;
                break;
            case "top":
                rotation=90;
                break;
            case "bottom":
                rotation=-90;
                break;
        }
        a.element.style.transform=
        `translate(-50%,-50%) rotate(${rotation}deg)`;
        let tipX=a.x;
        let tipY=a.y;
        const offset=a.length/2;
        switch(a.direction){
            case "left":
                tipX+=offset;
                break;
            case "right":
                tipX-=offset;
                break;
            case "top":
                tipY+=offset;
                break;
            case "bottom":
                tipY-=offset;
            break;
        }
        const dist=Math.hypot(
            tipX-centerX,
            tipY-centerY
        );
        if(dist<12){
            this.gameOver("MISS");
            return;
        }
    }
    requestAnimationFrame(
        ()=>this.update()
    );
}


keyDown(e){
    if(!this.running) return;
    if(this.arrows.length===0) return;
    const arrow=this.arrows[0];
    // ignorar otras teclas
    if(
        e.code!=="KeyW" &&
        e.code!=="KeyA" &&
        e.code!=="KeyS" &&
        e.code!=="KeyD"
    ){
        return;
    }
    // tecla incorrecta
    if(e.code!==arrow.key){
        this.combo=0;
        this.comboEl.textContent=0;
        this.gameOver("Tecla incorrecta");
        return;
    }
    //------------------------------------
    // Calcular punta de la flecha
    //------------------------------------
    let tipX=arrow.x;
    let tipY=arrow.y;
    const offset=arrow.length/2;
    switch(arrow.direction){
        case "left":
            tipX+=offset;
            break;
        case "right":
            tipX-=offset;
            break;
        case "top":
            tipY+=offset;
            break;
        case "bottom":
            tipY-=offset;
            break;
    }
    //------------------------------------
    // Distancia al centro
    //------------------------------------
    const centerX=this.arena.clientWidth/2;
    const centerY=this.arena.clientHeight/2;
    const dist=Math.hypot(
        tipX-centerX,
        tipY-centerY
    );
    //------------------------------------
    // MISS
    //------------------------------------
    if(dist>this.config.goodRadius){
        this.combo=0;
        this.comboEl.textContent=0;
        this.gameOver("MISS"); 
       audioManager.play("miss");
        return;
    }
    //------------------------------------
    // PERFECT / GOOD
    //------------------------------------
    let text;
    let gained;
    if(dist<=this.config.perfectRadius){
        text="PERFECT";
        gained=150;
                audioManager.play("perfect");
    }
    else{
        text="GOOD";
        gained=90;
           audioManager.play("good");
    }
    gained+=
        this.combo*10+
        this.config.currentSpeed*15;
    this.combo++;
    this.score+=Math.round(gained);
    this.scoreEl.textContent=this.score;
    this.comboEl.textContent=this.combo;
    //-----------------------------------
    // Best Score
    //------------------------------------
    if(this.score>this.best){
        this.best=this.score;
        this.bestEl.textContent=this.best;
        localStorage.setItem(
            "rapidBest",
            this.best
        );
    }
    //------------------------------------
    // Texto HUD
    //------------------------------------
    this.result.innerHTML=
    `<span style="color:#44ff88">
        ${text}<br>
        +${Math.round(gained)}
    </span>`;
    //-----------------------------------
    // Texto flotante
    //------------------------------------
    this.showHitText(
        tipX,
        tipY,
        text,
        text==="PERFECT"
            ? "#00ff88"
            : "#ffd54a"
    );
        this.spawnParticles(
    tipX,
    tipY,
    text==="PERFECT"
        ? "#00ff88"
        : "#ffd54a"
    );
    //-----------------------------------
    // eliminar flecha
    //------------------------------------
    arrow.element.remove();
    this.arrows.shift();
    //-----------------------------------
    // subir velocidad
    //------------------------------------
    this.config.currentSpeed=
        Math.min(
            this.config.maxSpeed,
            this.config.currentSpeed+
            this.config.speedIncrease
        );
    //------------------------------------
    // crear otra flecha
    //------------------------------------
    this.fillArena();
}

showHitText(x,y,text,color){
    const hit=document.createElement("div");
    hit.className="rapid-hit-text";
    hit.textContent=text;
    hit.style.left=x+"px";
    hit.style.top=y+"px";
    hit.style.color=color;
    this.arena.appendChild(hit);
    requestAnimationFrame(()=>{
        hit.style.transform=
            "translate(-50%,-90px) scale(1.3)";
        hit.style.opacity="0";
    });
    setTimeout(()=>{
        hit.remove();
    },700);
}

showHit(x,y,text,color){
    const hit =
        document.createElement("div");
    hit.className="rapid-hit";
    hit.textContent=text;
    hit.style.left=x+"px";
    hit.style.top=y+"px";
    hit.style.color=color;
    this.effects.appendChild(hit);
    setTimeout(()=>{
        hit.remove();
    },650);
}
spawnParticles(x,y,color){
    for(let i=0;i<12;i++){
        const p =
        document.createElement("div");
        p.className="rapid-particle";
        p.style.left=x+"px";
        p.style.top=y+"px";
        p.style.background=color;
        this.effects.appendChild(p);
        const angle =
      Math.random()*Math.PI*2;
        const speed =
       40+Math.random()*70;
        const dx =
    Math.cos(angle)*speed;
        const dy =
         Math.sin(angle)*speed;
        p.animate([
      {
          transform:
        "translate(-50%,-50%)",
       opacity:1
       },
      {
         transform:
         `translate(${dx}px,${dy}px)`,
        opacity:0
          }
        ],{
            duration:500,
            easing:"ease-out"
        });
        setTimeout(
            ()=>p.remove(),
            500
        );
    }
}
flashCenter(){
    this.center.animate([
        {
            transform:
                "translate(-50%,-50%) scale(1)"
        },
        {
            transform:
                "translate(-50%,-50%) scale(1.6)"
        },
        {
            transform:
                "translate(-50%,-50%) scale(1)"
        }
    ],{
        duration:180
    });
}
shakeArena(){
    this.arena.animate([
        {transform:"translateX(0px)"},
        {transform:"translateX(-6px)"},
        {transform:"translateX(6px)"},
        {transform:"translateX(-4px)"},
        {transform:"translateX(4px)"},
        {transform:"translateX(0px)"}
    ],{
        duration:220
    });
}
}





class RapidArrow{
    constructor(game,direction){
        this.game = game;
        this.direction = direction;
        this.speed = game.config.currentSpeed;
        this.length = 220;
        this.element =
            document.createElement("div");
        this.element.className =
            "rapid-arrow";
        game.arena.appendChild(
            this.element
        );
        switch(direction){
            case "left":
                this.key = "KeyA";
                this.x = -220;
                this.y =
                    game.arena.clientHeight/2;
                this.dx = 1;
                this.dy = 0;
                this.rotation = 0;
                break;
            case "right":
              this.key = "KeyD";
              this.x =
               game.arena.clientWidth+220;
                this.y =
               game.arena.clientHeight/2;
                this.dx = -1;
                this.dy = 0;
                this.rotation = 180;
                break;
            case "top":
                this.key = "KeyW";
                this.x =
                    game.arena.clientWidth/2;
                this.y = -220;
                this.dx = 0;
                this.dy = 1;
                this.rotation = 90;
                break;
            case "bottom":
             this.key = "KeyS";
                this.x =
                    game.arena.clientWidth/2;
                this.y =
                    game.arena.clientHeight+220;
                this.dx = 0;
                this.dy = -1;
                this.rotation = -90;
                break;
        }
    }

update(){
    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed;
    this.draw();
}

    draw(){
    this.element.style.left = this.x + "px";
    this.element.style.top = this.y + "px";
    this.element.style.transform =
     `translate(-50%,-50%) rotate(${this.rotation}deg)`;
}
remove(){
    this.element.remove();
}
getTipPosition(){
    let tipX = this.x;
    let tipY = this.y;
    const offset = this.length / 2;
    switch(this.direction){
        case "left":
            tipX += offset;
            break;
        case "right":
            tipX -= offset;
            break;
        case "top":
            tipY += offset;
            break;
        case "bottom":
            tipY -= offset;
            break;
    }
    return {
        x: tipX,
        y: tipY
    };
}

}
window.addEventListener("DOMContentLoaded",()=>{

    window.rapidLines =
        new RapidLines();

    window.stopRapidLines = function () {
        if (window.rapidLines && window.rapidLines.running) window.rapidLines.stop();
    };

});


})();
