/**
 * Memory Grid - Puzzle pathfinding game
 * 
 * Grid-based puzzle where:
 * - Start at top-left, goal at bottom-right
 * - Each cell contains a number (1-5)
 * - That number indicates the EXACT distance you can move from that cell
 * - You can only move to cells at exactly that distance (Manhattan distance)
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

  /**
   * Calcula casillas válidas a una distancia exacta
   * Manhattan distance = |x1-x2| + |y1-y2|
   */
  function getValidMovesFromCell(x, y, distance) {
    const validMoves = [];
    const size = gameState.gridSize;

    for (let ny = 0; ny < size; ny++) {
      for (let nx = 0; nx < size; nx++) {
        const manhattan = Math.abs(nx - x) + Math.abs(ny - y);
        if (manhattan === distance && !(nx === x && ny === y)) {
          validMoves.push({ x: nx, y: ny });
        }
      }
    }

    return validMoves;
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
        
        // Indicador de inicio/salida
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
    
    // Mostrar casillas válidas (a la distancia exacta del número actual)
    container.querySelectorAll('.memorygrid-cell--valid').forEach(c => {
      c.classList.remove('memorygrid-cell--valid');
    });
    
    const currentNumber = gameState.grid[gameState.playerPos.y][gameState.playerPos.x];
    const validMoves = getValidMovesFromCell(
      gameState.playerPos.x,
      gameState.playerPos.y,
      currentNumber
    );
    
    validMoves.forEach(({ x, y }) => {
      const cell = container.querySelector(`[data-x="${x}"][data-y="${y}"]`);
      if (cell) cell.classList.add('memorygrid-cell--valid');
    });
  }

  function tryMove(x, y) {
    if (!gameState.active) return;
    
    // Verificar que es una casilla válida a la distancia exacta
    const currentNumber = gameState.grid[gameState.playerPos.y][gameState.playerPos.x];
    const validMoves = getValidMovesFromCell(
      gameState.playerPos.x,
      gameState.playerPos.y,
      currentNumber
    );
    
    const isValid = validMoves.some(m => m.x === x && m.y === y);
    
    if (!isValid) {
      audioManager.play('miss');
      gameState.mistakes++;
      updateMistakes();
      
      if (gameState.mistakes >= 1) {
        endRound(false, '¡Movimiento inválido! Saliste del tablero.');
      }
      return;
    }
    
    // Movimiento válido
    gameState.playerPos = { x, y };
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
      if (typeof Leaderboard !== 'undefined') {
        Leaderboard.save('memorygrid', gameState.score, gameState.level - 1, {
          movesNeeded: gameState.moves,
          path: gameState.path.length
        });
      }
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
