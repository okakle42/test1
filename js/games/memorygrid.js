/**
 * Memory Grid
 * Juego de memoria visual: memorizar casillas iluminadas y repetirlas.
 * 
 * Fases:
 * 1. Memorizar: casillas se iluminan en secuencia (escaneo)
 * 2. Ocultar: vuelven al color base
 * 3. Jugador selecciona las casillas que recuerda
 */

(function() {
  let gameState = {
    active: false,
    level: 1,
    gridSize: 5,
    pattern: [],
    playerPattern: [],
    score: 0,
    mistakes: 0,
    maxMistakes: 1,
    timeRemaining: 0,
    timerInterval: null
  };

  const config = {
    1: { gridSize: 5, patternLength: 5, memorizeTime: 4, timePerRound: 15, difficulty: 'fácil' },
    2: { gridSize: 6, patternLength: 7, memorizeTime: 3.5, timePerRound: 14, difficulty: 'normal' },
    3: { gridSize: 7, patternLength: 10, memorizeTime: 3, timePerRound: 13, difficulty: 'difícil' },
    4: { gridSize: 8, patternLength: 14, memorizeTime: 2.5, timePerRound: 12, difficulty: 'extremo' }
  };

  function getConfig(level) {
    return config[Math.min(level, 4)] || config[4];
  }

  function createGrid() {
    const container = document.getElementById('memorygridBoard');
    container.innerHTML = '';
    
    const cfg = getConfig(gameState.level);
    gameState.gridSize = cfg.gridSize;
    
    const gridSize = cfg.gridSize;
    container.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    
    for (let i = 0; i < gridSize * gridSize; i++) {
      const cell = document.createElement('div');
      cell.className = 'memorygrid-cell';
      cell.dataset.index = i;
      cell.addEventListener('click', () => cellClicked(i));
      container.appendChild(cell);
    }
  }

  function generatePattern() {
    const cfg = getConfig(gameState.level);
    const gridTotal = gameState.gridSize * gameState.gridSize;
    const patternLength = Math.min(cfg.patternLength, gridTotal);
    
    gameState.pattern = [];
    while (gameState.pattern.length < patternLength) {
      const random = Math.floor(Math.random() * gridTotal);
      if (!gameState.pattern.includes(random)) {
        gameState.pattern.push(random);
      }
    }
    
    gameState.playerPattern = [];
  }

  function startMemorizePhase() {
    const cfg = getConfig(gameState.level);
    const container = document.getElementById('memorygridBoard');
    
    // Desactivar clics durante memorización
    container.classList.add('memorygrid-board--disabled');
    
    // Mostrar mensaje
    updateStatus(`Memoriza ${gameState.pattern.length} casillas...`);
    
    // Animar aparición en secuencia (escaneo)
    let delay = 0;
    const stepDelay = (cfg.memorizeTime * 1000) / gameState.pattern.length;
    
    gameState.pattern.forEach((index, order) => {
      setTimeout(() => {
        const cell = container.querySelector(`[data-index="${index}"]`);
        if (cell) cell.classList.add('memorygrid-cell--active');
        audioManager.play('step1');
      }, delay);
      
      delay += stepDelay;
    });
    
    // Después de memorizar, ocultar
    setTimeout(() => {
      startPlayPhase();
    }, cfg.memorizeTime * 1000 + 500);
  }

  function startPlayPhase() {
    const cfg = getConfig(gameState.level);
    const container = document.getElementById('memorygridBoard');
    
    // Ocultar todas las casillas
    container.querySelectorAll('.memorygrid-cell').forEach(cell => {
      cell.classList.remove('memorygrid-cell--active');
    });
    
    // Activar clics
    container.classList.remove('memorygrid-board--disabled');
    
    // Iniciar temporizador
    gameState.timeRemaining = cfg.timePerRound;
    startTimer();
    
    updateStatus('¡Tu turno! Haz clic en las casillas...');
  }

  function startTimer() {
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    
    updateTimer();
    gameState.timerInterval = setInterval(() => {
      gameState.timeRemaining--;
      updateTimer();
      
      if (gameState.timeRemaining <= 0) {
        clearInterval(gameState.timerInterval);
        endRound(false, 'Se acabó el tiempo');
      }
    }, 1000);
  }

  function updateTimer() {
    const timerEl = document.getElementById('memorygridTimer');
    if (timerEl) {
      timerEl.textContent = gameState.timeRemaining;
      if (gameState.timeRemaining <= 3) {
        timerEl.classList.add('memorygrid-timer--warning');
      }
    }
  }

  function cellClicked(index) {
    if (!gameState.active || gameState.pattern.length === 0) return;
    
    const container = document.getElementById('memorygridBoard');
    const cell = container.querySelector(`[data-index="${index}"]`);
    
    // Feedback visual
    cell.classList.add('memorygrid-cell--clicked');
    
    // Sonido
    const toneIndex = (index % 6) + 1;
    audioManager.play(`tone${toneIndex}`);
    
    // Guardar respuesta
    gameState.playerPattern.push(index);
    
    // Verificar
    if (gameState.pattern[gameState.playerPattern.length - 1] !== index) {
      // Error
      audioManager.play('miss');
      cell.classList.add('memorygrid-cell--error');
      gameState.mistakes++;
      
      updateMistakes();
      
      if (gameState.mistakes >= gameState.maxMistakes) {
        clearInterval(gameState.timerInterval);
        endRound(false, '¡Casilla incorrecta!');
      }
      return;
    }
    
    // Acierto
    audioManager.play('good');
    
    // Si completó el patrón
    if (gameState.playerPattern.length === gameState.pattern.length) {
      clearInterval(gameState.timerInterval);
      setTimeout(() => endRound(true), 300);
    }
  }

  function updateMistakes() {
    const mistakesEl = document.getElementById('memorygridMistakes');
    if (mistakesEl) {
      mistakesEl.textContent = gameState.mistakes;
    }
  }

  function updateStatus(text) {
    const statusEl = document.getElementById('memorygridStatus');
    if (statusEl) statusEl.textContent = text;
  }

  function endRound(success, message = '') {
    gameState.active = false;
    clearInterval(gameState.timerInterval);
    
    const container = document.getElementById('memorygridBoard');
    container.classList.add('memorygrid-board--disabled');
    
    if (success) {
      audioManager.play('perfect');
      gameState.score += gameState.pattern.length * gameState.level;
      updateScore();
      
      // Flash de victoria
      flashCells(gameState.pattern);
      
      setTimeout(() => {
        gameState.level++;
        gameState.mistakes = 0;
        prepareRound();
      }, 2000);
      
      updateStatus(`¡Correcto! Nivel ${gameState.level}`);
    } else {
      audioManager.play('gameover');
      updateStatus(`${message} — Juego terminado. Puntuación: ${gameState.score}`);
      
      // Guardar puntuación
      Leaderboard.save('memorygrid', gameState.score, gameState.level - 1, null);
    }
  }

  function flashCells(indices) {
    const container = document.getElementById('memorygridBoard');
    indices.forEach((index, order) => {
      setTimeout(() => {
        const cell = container.querySelector(`[data-index="${index}"]`);
        if (cell) {
          cell.classList.add('memorygrid-cell--flash');
          setTimeout(() => cell.classList.remove('memorygrid-cell--flash'), 300);
        }
      }, order * 100);
    });
  }

  function updateScore() {
    const scoreEl = document.getElementById('memorygridScore');
    if (scoreEl) scoreEl.textContent = gameState.score;
  }

  function prepareRound() {
    gameState.active = true;
    gameState.playerPattern = [];
    gameState.mistakes = 0;
    updateMistakes();
    
    const cfg = getConfig(gameState.level);
    generatePattern();
    
    updateStatus(`Nivel ${gameState.level} (${cfg.difficulty})`);
    
    setTimeout(() => {
      startMemorizePhase();
    }, 1000);
  }

  // Funciones públicas
  window.initMemoryGrid = function(ui) {
    // Guardar referencias de UI
    window.memorygridUI = ui;
    
    // Botón start
    if (ui.startButton) {
      ui.startButton.addEventListener('click', startGame);
    }
  };

  function startGame() {
    gameState = {
      active: true,
      level: 1,
      gridSize: 5,
      pattern: [],
      playerPattern: [],
      score: 0,
      mistakes: 0,
      maxMistakes: 1,
      timeRemaining: 0,
      timerInterval: null
    };
    
    createGrid();
    updateScore();
    updateMistakes();
    prepareRound();
  }

  window.stopMemoryGrid = function() {
    gameState.active = false;
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    
    const container = document.getElementById('memorygridBoard');
    if (container) {
      container.classList.add('memorygrid-board--disabled');
      container.innerHTML = '';
    }
  };

})();
