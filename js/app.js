document.addEventListener('DOMContentLoaded', function () {
  const views = document.querySelectorAll('.view');
  const themeSelect = document.getElementById('themeSelect');
backgroundManager.init();

  // ── Conteo dinámico de módulos activos ──
  // Cuenta las cartas de juego reales en el lobby (#gameList) y actualiza
  // todos los lugares de la UI que muestran ese número, para que siempre
  // refleje el total real aunque se agreguen o quiten módulos.
  (function updateModuleCount() {
    const gameListEl = document.getElementById('gameList');
    const totalModules = gameListEl
      ? gameListEl.querySelectorAll('.game-card[data-game]').length
      : document.querySelectorAll('.game-card[data-game]').length;

    const targets = ['modsCountHeader', 'modsCountPill', 'modsCountStats'];
    targets.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = totalModules;
    });
  })();
  // ── Global showView (used by back buttons) ──
  window.showView = function (id) {
    views.forEach(v => {
      if (v.id === id) {
        v.classList.remove("hidden");
      } else {
        v.classList.add("hidden");
      }
    });
    if (id === "typix" && typeof window.startTypix === "function") {
      window.startTypix();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Global backToMenu (used by in-game back buttons) ──
  window.backToMenu = function (id) {
    audioManager.play("back");
    const mazeView = document.getElementById("maze-game");
    if (mazeView && !mazeView.classList.contains("hidden") && typeof window.stopMaze === "function") {
      window.stopMaze();
    }
    const stopFns = [
      "stopKeySpam", "stopProgressTiming", "stopRhythm", "stopSequence",
      "stopRapidLines", "stopCircle", "stopArrow", "stopColorCount",
      "stopHoleMatch", "stopSimon", "stopHacking", "stopLettersFall",
      "stopPairs", "stopTypix", "stopUnlocked"
    ];
    stopFns.forEach(fn => { try { if (typeof window[fn] === "function") window[fn](); } catch(e) {} });
    setTimeout(() => { window.showView(id); }, 80);
  };

  // ── Game card navigation ──
  const gameGrid = document.getElementById('gameList');
  document.querySelectorAll(".game-card").forEach((card,index)=>{
    card.style.animationDelay = (index*80)+"ms";
});
  gameGrid.querySelectorAll(".game-card").forEach(card=>{

    let inside = false;
    card.addEventListener("mouseenter",()=>{
        if(inside) return;
        inside = true;
         audioManager.play("hover");
    });
    card.addEventListener("mouseleave",()=>{
        inside = false;
    });

});
  if (gameGrid) {
    gameGrid.addEventListener('click', e => {
    const card = e.target.closest('.game-card[data-game]');
    if (!card) return;
      audioManager.play("open");
    setTimeout(()=>{
        window.showView(card.dataset.game);
    },80);
});
  }

  // ── Build difficulty dots ──
  document.querySelectorAll('.diff-dots').forEach(el => {
    const level = parseInt(el.dataset.level, 10) || 0;
    const max   = parseInt(el.dataset.max,   10) || 5;
    el.innerHTML = '';
    for (let i = 0; i < max; i++) {
      const dot = document.createElement('span');
      dot.className = 'diff-dot ' + (i < level ? 'diff-dot--filled' : 'diff-dot--empty');
      el.appendChild(dot);
    }
  });

  // ── Hex tick counter ──
  const hexEl = document.getElementById('hexTick');
  if (hexEl) {
    let tick = 0;
    setInterval(() => {
      tick = (tick + 1) & 0xFFFF;
      hexEl.textContent = tick.toString(16).toUpperCase().padStart(4, '0');
    }, 900);
  }

  // ── Theme ──
  function applyTheme(theme) {
    document.body.classList.remove('light-theme', 'dark-theme', 'orange-theme');
    document.body.classList.add(theme + '-theme');
    localStorage.setItem('gameTheme', theme);
  }

  if (themeSelect) {
    const saved = localStorage.getItem('gameTheme') || 'dark';
    themeSelect.value = saved;
    applyTheme(saved);
    themeSelect.addEventListener('change', () => applyTheme(themeSelect.value));
  }

  // ── Game init ──
  const termitaUi = {
    startTermita:  document.getElementById('startTermita'),
    gridEl:        document.getElementById('grid'),
    gridSizeEl:    document.getElementById('gridSize'),
    targetsEl:     document.getElementById('targets'),
    showTimeEl:    document.getElementById('showTime'),
    roundsEl:      document.getElementById('rounds'),
    termitaInfo:   document.getElementById('termitaInfo')
  };

  const simonUi = {
    startSimon:    document.getElementById('startSimon'),
    simonBoard:    document.getElementById('simonBoard'),
    colorCountEl:  document.getElementById('colorCount'),
    baseLengthEl:  document.getElementById('baseLength'),
    simonSpeedEl:  document.getElementById('simonSpeed'),
    simonRoundsEl: document.getElementById('simonRounds'),
    simonInfo:     document.getElementById('simonInfo')
  };

  const hackingUi = {
    startHacking:          document.getElementById('startHacking'),
    hackingBoard:          document.getElementById('hackingBoard'),
    hackingSize:           document.getElementById('hackingSize'),
    hackingLength:         document.getElementById('hackingLength'),
    hackingTime:           document.getElementById('hackingTime'),
    hackingRounds:         document.getElementById('hackingRounds'),
    hackingSets:           document.getElementById('hackingSets'),
    hackingMoveAll:        document.getElementById('hackingMoveAll'),
    hackingHighlightTarget:document.getElementById('hackingHighlightTarget'),
    hackingStreak:         document.getElementById('hackingStreak'),
    hackingMax:            document.getElementById('hackingMax'),
    hackingTimer:          document.getElementById('hackingTimer'),
    hackingTarget:         document.getElementById('hackingTarget'),
    hackingInfo:           document.getElementById('hackingInfo')
  };

  const arrowUi = {
    startArrow:    document.getElementById('startArrow'),
    arrowLevelEl:  document.getElementById('arrowLevel'),
    arrowLengthEl: document.getElementById('arrowLength'),
    arrowTimeInput:document.getElementById('arrowTimeInput'),
    arrowButtons:  document.getElementById('arrowButtons'),
    arrowDisplay:  document.getElementById('arrowDisplay'),
    arrowStep:     document.getElementById('arrowStep'),
    arrowCombo:    document.getElementById('arrowCombo'),
    arrowPercent:  document.getElementById('arrowPercent'),
    arrowProgress: document.getElementById('arrowProgress'),
    arrowRecord:   document.getElementById('arrowRecord'),
    arrowMessage:  document.getElementById('arrowMessage'),
    arrowSequence: document.getElementById('arrowSequence')
  };

  const lettersUi = {
    startLetters:           document.getElementById('startLetters'),
    lettersArea:            document.getElementById('lettersArea'),
    lettersInput:           document.getElementById('lettersInput'),
    lettersLevel:           document.getElementById('lettersLevel'),
    lettersDifficulty:      document.getElementById('lettersDifficulty'),
    lettersDifficultySelect:document.getElementById('lettersDifficultySelect'),
    lettersScore:           document.getElementById('lettersScore'),
    lettersBest:            document.getElementById('lettersBest'),
    lettersLives:           document.getElementById('lettersLives'),
    lettersMessage:         document.getElementById('lettersMessage')
  };

  const holematchUi = {
    startHoleMatch:    document.getElementById('startHoleMatch'),
    difficultySelect:  document.getElementById('holematchDifficulty'),
    targetCountInput:  document.getElementById('holematchTargetCount'),
    progressText:      document.getElementById('holematchProgress'),
    mistakesText:      document.getElementById('holematchMistakes'),
    timerText:         document.getElementById('holematchTimer'),
    messageText:       document.getElementById('holematchMessage'),
    progressBar:       document.getElementById('holematchProgressBar'),
    holematchBoard:    document.getElementById('holematchBoard')
  };

  const colorcountUi = {
    startButton:    document.getElementById('startColorCount'),
    submitButton:   document.getElementById('colorcountSubmit'),
    answerInput:    document.getElementById('colorcountAnswer'),
    difficultySelect:document.getElementById('colorcountDifficulty'),
    timerText:      document.getElementById('colorcountTimer'),
    levelText:      document.getElementById('colorcountLevel'),
    scoreText:      document.getElementById('colorcountScore'),
    questionText:   document.getElementById('colorcountQuestion'),
    gridContainer:  document.getElementById('colorcountGrid'),
    answerList:     document.getElementById('colorcountAnswers'),
    messageBox:     document.getElementById('colorcountMessage')
  };

  initTermita(termitaUi);
  initSimon(simonUi);
  if (window.initArrowGame)     initArrowGame(arrowUi);
  if (window.initLettersFall)   initLettersFall(lettersUi);
  if (window.initHackingDevice) initHackingDevice(hackingUi);
  if (window.initHoleMatch)     initHoleMatch(holematchUi);
  if (window.initColorCount)    initColorCount(colorcountUi);

  const pairsUi = {
    startPairs:    document.getElementById('startPairs'),
    pairsBoard:    document.getElementById('pairsBoard'),
    pairsMovesEl:  document.getElementById('pairsMoves'),
    pairsPairsEl:  document.getElementById('pairsPairs'),
    pairsTimeEl:   document.getElementById('pairsTime'),
    pairsTimerBar: document.getElementById('pairsTimerBar'),
    pairsDiffBtns: document.querySelectorAll('.pairs-diff-btn'),
    pairsMessage:  document.getElementById('pairsMessage')
  };

  if (window.initPairs) initPairs(pairsUi);

  const unlockedUi = {
    canvas:          document.getElementById('unlockedCanvas'),
    startBtn:        document.getElementById('startUnlocked'),
    infoEl:          document.getElementById('unlockedInfo'),
    ringCountEl:     document.getElementById('unlockedRingCount'),
    colorsPerRingEl: document.getElementById('unlockedColors'),
    snapAngleEl:     document.getElementById('unlockedSnap'),
    timeLimitEl:     document.getElementById('unlockedTime'),
    roundsEl:        document.getElementById('unlockedRounds'),
    showTargetsEl:   document.getElementById('unlockedShowTargets'),
    showLabelsEl:    document.getElementById('unlockedShowLabels'),
    scoreEl:         document.getElementById('unlockedScore'),
    timerEl:         document.getElementById('unlockedTimer'),
    roundEl:         document.getElementById('unlockedRound'),
    ringIndicatorEl: document.getElementById('unlockedRingIndicator'),
    prevRingBtn:     document.getElementById('unlockedPrevRing'),
    nextRingBtn:     document.getElementById('unlockedNextRing'),
  };
  if (window.initUnlocked) initUnlocked(unlockedUi);

  // ── Start pairs game when view becomes visible ──
  const _origShowView = window.showView;
  window.showView = function (id) {
    _origShowView(id);
    if (id === 'pairs' && window._pairsStart) window._pairsStart();
  };

  window.showView('home');

});

  // ── ESC → Lobby ──
  // Escucha Escape en todo momento (salvo cuando el foco está en un input/textarea/select)
  // y lleva al usuario de vuelta al lobby llamando backToMenu('home').
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;

    // No interceptar si el foco está en un campo de texto
    const tag = (document.activeElement || {}).tagName || '';
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

    // No hacer nada si ya estamos en el lobby
    const homeView = document.getElementById('home');
    if (homeView && !homeView.classList.contains('hidden')) return;

    if (typeof window.backToMenu === 'function') {
      window.backToMenu('home');
    }
  });

  // ── Category filter bar ──
  // Construye los botones de filtro leyendo los data-tags de cada carta.
  // Filtra al instante al hacer clic; las cartas sin coincidencia reciben
  // la clase game-card--filtered que las oculta con display:none.
  (function initFilterBar() {
    const filterBar = document.getElementById('filterBar');
    const gameList  = document.getElementById('gameList');
    if (!filterBar || !gameList) return;

    // Recoge todos los tags únicos de las cartas (excluye cartas bloqueadas)
    const cards = Array.from(gameList.querySelectorAll('.game-card[data-tags]'));
    const allTags = [];
    cards.forEach(c => {
      (c.dataset.tags || '').split(',').map(t => t.trim()).filter(Boolean).forEach(t => {
        if (!allTags.includes(t)) allTags.push(t);
      });
    });

    // Ordena alfabéticamente y genera un botón por tag
    allTags.sort();
    allTags.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.filter = tag;
      btn.textContent = tag;
      filterBar.appendChild(btn);
    });

    let activeFilter = 'TODOS';

    function applyFilter(tag) {
      activeFilter = tag;

      // Actualizar estado activo de botones
      filterBar.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('filter-btn--active', b.dataset.filter === tag);
      });

      // Mostrar u ocultar cartas
      cards.forEach(card => {
        if (tag === 'TODOS') {
          card.classList.remove('game-card--filtered');
        } else {
          const tags = (card.dataset.tags || '').split(',').map(t => t.trim());
          card.classList.toggle('game-card--filtered', !tags.includes(tag));
        }
      });
    }

    // Delegación de eventos en la barra de filtros
    filterBar.addEventListener('click', function (e) {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      applyFilter(btn.dataset.filter);
    });
  })();

