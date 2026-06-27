class ColorCountGame {
  constructor(ui) {
    this.ui = ui;
    this.state = this.initialState();
    this.revealTimeout = null;
    this.bindEvents();
    this.renderGrid();
    this.updateUI();
  }

  initialState() {
    return {
      active: false,
      gridSize: 8,
      targetColor: 'red',
      colors: ['red', 'blue', 'yellow', 'green'],
      cells: [],
      answer: '',
      message: 'Pulsa iniciar para comenzar.',
      result: null,
      showGrid: false,
      awaitingAnswer: false,
      revealTime: 2800,
      difficulty: 'normal'
    };
  }

  bindEvents() {
    if (this.ui.startButton) {
      this.ui.startButton.addEventListener('click', () => this.start());
    }
    if (this.ui.submitButton) {
      this.ui.submitButton.addEventListener('click', () => this.submitAnswer());
    }
    if (this.ui.answerInput) {
      this.ui.answerInput.addEventListener('input', (event) => {
        this.state.answer = event.target.value;
      });
      this.ui.answerInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && this.state.awaitingAnswer) {
          this.submitAnswer();
        }
      });
    }
    if (this.ui.difficultySelect) {
      this.ui.difficultySelect.addEventListener('change', (event) => {
        this.state.difficulty = event.target.value;
      });
    }
  }

  start() {
    this.clearRevealTimeout();
    this.state.active = true;
    this.state.cells = this.generateCells(this.state.gridSize);
    this.state.targetColor = this.chooseTargetColor();
    this.state.answer = '';
    this.state.result = null;
    this.state.showGrid = true;
    this.state.awaitingAnswer = false;
    this.state.message = 'Observa el tablero... memoriza el color objetivo.';
    this.renderGrid();
    this.updateUI();

    this.revealTimeout = setTimeout(() => this.askForAnswer(), this.state.revealTime);
  }

  askForAnswer() {
    this.state.showGrid = false;
    this.state.awaitingAnswer = true;
    this.state.message = `Escribe cuántos cuadros ${this.state.targetColor} viste.`;
    this.renderGrid();
    this.updateUI();
    if (this.ui.answerInput) {
      this.ui.answerInput.focus();
    }
  }

  generateCells(size) {
    const palette = ['red', 'blue', 'yellow', 'green'];
    const totalCells = size * size;
    
    // Determinar cuántos cuadros pintados según dificultad
    const paintedRatios = {
      easy: 0.4,
      normal: 0.6,
      hard: 0.75,
      extreme: 0.9
    };
    const ratio = paintedRatios[this.state.difficulty] || 0.6;
    const paintedCount = Math.ceil(totalCells * ratio);
    
    const cells = Array(totalCells).fill('gray');
    const indices = Array.from({ length: totalCells }, (_, i) => i);
    
    // Mezclar índices
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    // Pintar cuadros según cantidad
    for (let i = 0; i < paintedCount; i++) {
      const color = palette[Math.floor(Math.random() * palette.length)];
      cells[indices[i]] = color;
    }
    
    return cells;
  }

  chooseTargetColor() {
    const palette = ['red', 'blue', 'yellow', 'green'];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  renderGrid() {
    if (!this.ui.gridContainer) return;
    const size = this.state.gridSize;
    this.ui.gridContainer.innerHTML = '';
    this.ui.gridContainer.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;
    this.ui.gridContainer.style.justifyItems = 'stretch';
    this.ui.gridContainer.style.alignItems = 'stretch';

    const displayColors = this.state.active && this.state.showGrid
      ? this.state.cells
      : Array.from({ length: size * size }, () => 'hidden');

    displayColors.forEach((color) => {
      const square = document.createElement('div');
      square.className = 'colorcount-square';
      square.style.background = color === 'hidden' ? this.getHiddenBackground() : this.getCellBackground(color);
      if (color !== 'hidden') {
        square.setAttribute('aria-label', `Cuadro de color ${color}`);
      }
      this.ui.gridContainer.appendChild(square);
    });
  }

  getCellBackground(color) {
    const map = {
      red: 'linear-gradient(145deg, #d32f2f, #ef5350)',
      blue: 'linear-gradient(145deg, #1976d2, #64b5f6)',
      yellow: 'linear-gradient(145deg, #fbc02d, #fff176)',
      green: 'linear-gradient(145deg, #388e3c, #66bb6a)',
      gray: 'linear-gradient(145deg, #8d8d8d, #b0b0b0)'
    };
    return map[color] || map.gray;
  }

  getHiddenBackground() {
    return 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.08))';
  }

  submitAnswer() {
    if (!this.state.awaitingAnswer) return;
    const answerValue = parseInt(this.state.answer, 10);
    if (Number.isNaN(answerValue)) {
      this.state.message = 'Ingresa un número válido antes de enviar.';
      this.updateUI();
      return;
    }

    const actualCount = this.getActualCount();
    const correct = answerValue === actualCount;
    this.state.awaitingAnswer = false;
    this.state.showGrid = true;
    this.state.result = correct ? 'success' : 'failed';
    this.state.message = correct
      ? `Correcto. Había ${actualCount} cuadros ${this.state.targetColor}.`
      : `Incorrecto. La respuesta correcta era ${actualCount}.`;
    this.renderGrid();
    this.updateUI();
  }

  getActualCount() {
    return this.state.cells.filter((color) => color === this.state.targetColor).length;
  }

  clearRevealTimeout() {
    if (this.revealTimeout) {
      clearTimeout(this.revealTimeout);
      this.revealTimeout = null;
    }
  }

  updateUI() {
    if (this.ui.questionText) {
      if (!this.state.active) {
        this.ui.questionText.textContent = 'Pulsa iniciar para comenzar';
      } else if (this.state.awaitingAnswer) {
        this.ui.questionText.textContent = `¿Cuántos cuadros ${this.state.targetColor} viste?`;
      } else {
        this.ui.questionText.textContent = `Observa los cuadros ${this.state.targetColor}`;
      }
    }

    if (this.ui.messageBox) {
      this.ui.messageBox.textContent = this.state.message;
      this.ui.messageBox.className = 'colorcount-message';
      if (this.state.result === 'success') this.ui.messageBox.classList.add('colorcount-success');
      if (this.state.result === 'failed') this.ui.messageBox.classList.add('colorcount-failed');
    }

    if (this.ui.answerInput) {
      this.ui.answerInput.disabled = !this.state.awaitingAnswer;
      if (!this.state.awaitingAnswer) {
        this.ui.answerInput.value = '';
      }
    }
    if (this.ui.submitButton) {
      this.ui.submitButton.disabled = !this.state.awaitingAnswer;
    }
  }
}

function initColorCount(ui) {
  const game = new ColorCountGame(ui);
  window._colorCountGame = game;
}

window.stopColorCount = function () {
  if (window._colorCountGame) window._colorCountGame.state.active = false;
};

window.initColorCount = initColorCount;
