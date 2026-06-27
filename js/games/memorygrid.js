/**
 * Memory Grid - Rewritten as a puzzle game
 * 
 * Grid-based puzzle where:
 * - Start at top-left, goal at bottom-right
 * - Each cell contains a number (1-5)
 * - That number indicates how many cells you must move (up/down/left/right)
 * - Reach the goal in minimum moves
 */

(function() {
  let gameState = {
    active: false,
    level: 1,
    gridSize: 5,
    grid: [],
    playerPos: { x: 0, y: 0 },
    goalPos: null,
    moves: 0,
    path: [],
    score: 0,
    mistakes: 0,
    timeElapsed: 0,
    timerInterval: null
  };

  const config = {
    1: { gridSize: 5, minMoves: 8, timeLimit: 60 },
    2: { gridSize: 6, minMoves: 10, timeLimit: 75 },
    3: { gridSize: 7, minMoves: 12, timeLimit: 90 },
    4: { gridSize: 8, minMoves: 14, timeLimit: 120 }
  };

  function getConfig(level) {
    return config[Math.min(level, 4)] || config[4];
  }

  /**
   * Genera un grid con números 1-5
   * Asegura que hay al menos un camino válido desde inicio a salida
   */
  function generateGrid() {
    const cfg = getConfig(gameState.level);
    const size = cfg.gridSize;
    gameState.gridSize = size;
    gameState.grid = [];
    gameState.playerPos = { x: 0, y: 0 };
    gameState.goalPos = { x: size - 1, y: size - 1 };
    gameState.path = [{ x: 0, y: 0 }];
    gameState.moves = 0;

    // Generar grid aleatorio con números 1-5
    for (let y = 0; y < size; y++) {
      gameState.grid[y] = [];
      for (let x = 0; x < size; x++) {
        const num = Math.floor(Math.random() * 5) + 1; // 1-5
        gameState.grid[y][x] = num;
      }
    }
  }

  function createGridUI() {
    const container = document.getElementById('memorygridBoard');
    container.innerHTML = '';
    
    const size = gameState.gridSize;
    container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cell = document.createElement('div');
        cell.className = 'memorygrid-cell';
        cell.dataset.x = x;
        cell.dataset.y = y;
        
        // Número de la casilla
        const numberEl = document.createElement('div');
        numberEl.className = 'memorygrid-cell-number';
        numberEl.textContent = gameState.grid[y][x];
        cell.appendChild(numberEl);
        
        // Indicador de inicio/salida/posición actual
        if (x === 0 && y === 0) {
          cell.classList.add('memorygrid-cell--start');
          const label = document.createElement('div');
          label.className = 'memorygrid-cell-label';
          label.textContent = 'START';
          cell.appendChild(label);
        } else if (x === gameState.goalPos.x && y === gameState.goalPos.y) {
          cell.classList.add('memorygrid-cell--goal');
          const label = document.createElement('div');
          label.className = 'memorygrid-cell-label';
          label.textContent = 'GOAL';
          cell.appendChild(label);
        }
        
        // Click handler
        cell.addEventListener('click', () => tryMove(x, y));
        container.appendChild(cell);
      }
    }
    
    updatePlayerUI();
  }

  function updatePlayerUI() {
    const container = document.getElementById('memorygridBoard');
    
    // Limpiar jugador anterior
    container.querySelectorAll('.memorygrid-cell--player').forEach(c => {
      c.classList.remove('memorygrid-cell--player');
    });
    
    // Marcar posición actual
    const current = container.querySelector(
      `[data-x="${gameState.playerPos.x}"][data-y="${gameState.playerPos.y}"]`
    );
    if (current) {
      current.classList.add('memorygrid-cell--player');
    }
    
    // Mostrar casillas válidas (adyacentes)
    container.querySelectorAll('.memorygrid-cell--valid').forEach(c => {
      c.classList.remove('memorygrid-cell--valid');
    });
    
    const validMoves = getValidMoves();
    validMoves.forEach(({ x, y }) => {
      const cell = container.querySelector(`[data-x="${x}"][data-y="${y}"]`);
      if (cell) cell.classList.add('memorygrid-cell--valid');
    });
  }

  function getValidMoves() {
    // Casillas adyacentes (arriba, abajo, izquierda, derecha)
    const { x, y } = gameState.playerPos;
    const moves = [];
    
    const adjacent = [
      { x: x - 1, y: y }, // izquierda
      { x: x + 1, y: y }, // derecha
      { x: x, y: y - 1 }, // arriba
      { x: x, y: y + 1 }  // abajo
    ];
    
    adjacent.forEach(pos => {
      if (pos.x >= 0 && pos.x < gameState.gridSize && 
          pos.y >= 0 && pos.y < gameState.gridSize) {
        moves.push(pos);
      }
    });
    
    return moves;
  }

  function tryMove(x, y) {
    if (!gameState.active) return;
    
    // Verificar que es una casilla adyacente
    const validMoves = getValidMoves();
    const isValid = validMoves.some(m => m.x === x && m.y === y);
    
    if (!isValid) {
      audioManager.play('miss');
      return;
    }
    
    const numInCell = gameState.grid[y][x];
    const { x: px, y: py } = gameState.playerPos;
    
    // Calcular distancia requerida
    const dx = Math.abs(x - px);
    const dy = Math.abs(y - py);
    const distance = dx + dy; // Manhattan distance
    
    // Mover según el número
    let finalX = px;
    let finalY = py;
    
    if (x < px) finalX -= numInCell; // Izquierda
    else if (x > px) finalX += numInCell; // Derecha
    else if (y < py) finalY -= numInCell; // Arriba
    else if (y > py) finalY += numInCell; // Abajo
    
    // Validar límites
    if (finalX < 0 || finalX >= gameState.gridSize ||
        finalY < 0 || finalY >= gameState.gridSize) {
      audioManager.play('miss');
      gameState.mistakes++;
      updateMistakes();
      
      if (gameState.mistakes >= 1) {
        endRound(false, '¡Saliste del tablero!');
      }
      return;
    }
    
    // Movimiento válido
    gameState.playerPos = { x: finalX, y: finalY };
    gameState.moves++;
    gameState.path.push({ ...gameState.playerPos });
    
    audioManager.play('good');
    updatePlayerUI();
    updateStats();
    
    // Verificar victoria
    if (gameState.playerPos.x === gameState.goalPos.x &&
        gameState.playerPos.y === gameState.goalPos.y) {
      clearInterval(gameState.timerInterval);
      endRound(true);
    }
  }

  function updateStats() {
    const movesEl = document.getElementById('memorygridLevel');
    const pathEl = document.getElementById('memorygridMistakes');
    
    if (movesEl) movesEl.textContent = gameState.moves;
    if (pathEl) pathEl.textContent = gameState.path.length;
  }

  function updateMistakes() {
    const mistakesEl = document.getElementById('memorygridMistakes');
    if (mistakesEl) mistakesEl.textContent = gameState.mistakes;
  }

  function updateTimer() {
    const timerEl = document.getElementById('memorygridTimer');
    if (timerEl) {
      timerEl.textContent = gameState.timeElapsed;
    }
  }

  function startTimer() {
    const cfg = getConfig(gameState.level);
    gameState.timeElapsed = 0;
    
    updateTimer();
    gameState.timerInterval = setInterval(() => {
      gameState.timeElapsed++;
      updateTimer();
      
      if (gameState.timeElapsed >= cfg.timeLimit) {
        clearInterval(gameState.timerInterval);
        endRound(false, '¡Se acabó el tiempo!');
      }
    }, 1000);
  }

  function updateScore() {
    const cfg = getConfig(gameState.level);
    // Puntuación: basada en eficiencia (casillas alcanzables vs movimientos)
    const efficiency = Math.max(0, cfg.minMoves - gameState.moves);
    gameState.score += (100 + efficiency * 10) * gameState.level;
    
    const scoreEl = document.getElementById('memorygridScore');
    if (scoreEl) scoreEl.textContent = gameState.score;
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
      updateScore();
      
      // Flash de victoria
      flashCell(gameState.goalPos);
      
      setTimeout(() => {
        gameState.level++;
        gameState.mistakes = 0;
        prepareRound();
      }, 2000);
      
      updateStatus(`¡Victoria! ${gameState.moves} movimientos. Nivel ${gameState.level}`);
    } else {
      audioManager.play('gameover');
      updateStatus(`${message} — Puntuación final: ${gameState.score}`);
      
      // Guardar puntuación
      Leaderboard.save('memorygrid', gameState.score, gameState.level - 1, {
        movesNeeded: gameState.moves,
        path: gameState.path.length
      });
    }
  }

  function flashCell(pos) {
    const container = document.getElementById('memorygridBoard');
    const cell = container.querySelector(`[data-x="${pos.x}"][data-y="${pos.y}"]`);
    if (cell) {
      cell.classList.add('memorygrid-cell--flash');
      setTimeout(() => cell.classList.remove('memorygrid-cell--flash'), 300);
    }
  }

  function prepareRound() {
    gameState.active = true;
    gameState.mistakes = 0;
    updateMistakes();
    
    const cfg = getConfig(gameState.level);
    generateGrid();
    createGridUI();
    
    const container = document.getElementById('memorygridBoard');
    container.classList.remove('memorygrid-board--disabled');
    
    updateStatus(`Nivel ${gameState.level} - Alcanza la salida (abajo derecha)`);
    
    setTimeout(() => {
      startTimer();
    }, 500);
  }

  // Funciones públicas
  window.initMemoryGrid = function(ui) {
    window.memorygridUI = ui;
    
    if (ui.startButton) {
      ui.startButton.addEventListener('click', startGame);
    }
  };

  function startGame() {
    gameState = {
      active: true,
      level: 1,
      gridSize: 5,
      grid: [],
      playerPos: { x: 0, y: 0 },
      goalPos: null,
      moves: 0,
      path: [],
      score: 0,
      mistakes: 0,
      timeElapsed: 0,
      timerInterval: null
    };
    
    const scoreEl = document.getElementById('memorygridScore');
    if (scoreEl) scoreEl.textContent = 0;
    
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
