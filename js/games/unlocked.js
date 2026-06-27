function initUnlocked(ui) {
  const {
    canvas, startBtn, infoEl,
    ringCountEl, colorsPerRingEl, granularityEl,
    timeLimitEl, roundsEl, showTargetsEl, showLabelsEl,
    scoreEl, timerEl, roundEl, ringIndicatorEl,
    prevRingBtn, nextRingBtn
  } = ui;

  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const PALETTE = [
    '#f97316', '#818cf8', '#34d399',
    '#f43f5e', '#fbbf24', '#22d3ee',
    '#a78bfa', '#ec4899'
  ];

  let timerInterval = null;
  let flashState    = null;
  let penaltyParts  = [];
  let shakeFrames   = 0;
  let shakeAmt      = 0;

  const state = {
    phase: 'idle',
    rings: [],
    selected: 0,
    ringCount: 3,
    colorsN: 3,
    granularity: 4,
    snapDeg: 30,
    timeLimit: 0,
    totalRounds: 3,
    currentRound: 0,
    score: 0,
    timeLeft: 0,
    solvedRings: [],
    allSolved: false,
    ripples: [],
    startTime: 0,
    penaltyValue: 5,   // seconds to subtract on error
    mistakeCount: 0,
  };

  /* ── math helpers ── */
  const TAU = Math.PI * 2;
  function degToRad(d) { return d * Math.PI / 180; }
  function modAngle(a)  { return ((a % 360) + 360) % 360; }
  function angleDiffDeg(a, b) {
    const d = modAngle(a - b);
    return d > 180 ? d - 360 : d;
  }
  function computeSnap(N, gran) { return (360 / N) / gran; }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ══════════════════════════════════════════════
     BUILD ROUND — redesigned logic
     ══════════════════════════════════════════════
     Each ring has N "slots" evenly spaced around it.
     We pick N random ANGLES (multiples of snapDeg) as the
     TARGET positions for the slots — these are fixed and
     unique per ring per round.

     ring.targets[i] = { angle: deg, color: col }
       → a small arc drawn at that fixed angle on that ring
       → color of the arc matches the dot that must land there

     ring.dotColors[i]  = color of dot i (they rotate together)
     ring.dotOffsets[i] = base offset of dot i (spaced 360/N apart,
                          starting from 0)

     ring.angle = current rotation of all dots (starts random)
     ring.solutionAngle = the rotation value at which dot i lands
                          exactly on target i for ALL i simultaneously.

     Since dots are evenly spaced at k*(360/N) and targets are at
     arbitrary angles, the solution requires a bijection between dots
     and targets — we simply assign target i to dot i and compute:

       solutionAngle = target[0].angle - dotOffsets[0]
                     = target[0].angle   (because dotOffsets[0] = 0)

     Then we verify all other dots also land on their target:
       dot i lands at: solutionAngle + dotOffsets[i]
       target i is at: target[i].angle
       → solutionAngle + i*(360/N) === target[i].angle  (mod 360)
       → target[i].angle = target[0].angle + i*(360/N)

     This means targets must also be evenly spaced!  So targets are
     N evenly-spaced angles starting at a random offset:
       target[i].angle = baseAngle + i*(360/N)   where baseAngle is random

     The solution is simply:  ring.angle = baseAngle

     Summary: rotate the ring to baseAngle → every dot i sits at
     baseAngle + i*(360/N) = target[i].angle  ✓

     Colors assigned randomly: target[i].color = perm[i]
     Dot colors match: ring.dotColors[i] = perm[i]
     So dot i (color perm[i]) must land on arc at target[i] (also color perm[i]).
  ══════════════════════════════════════════════ */
  function buildRound() {
    state.rings       = [];
    state.solvedRings = [];
    state.allSolved   = false;
    state.mistakeCount = 0;
    penaltyParts      = [];

    const N    = state.colorsN;
    const snap = state.snapDeg;
    const colors = PALETTE.slice(0, N);

    // total snap steps in a full circle
    const totalSteps = Math.round(360 / snap);

    for (let r = 0; r < state.ringCount; r++) {
      // Random color assignment for this ring's dots/arcs
      const perm = shuffle(colors);

      // Pick a random base angle (snap-aligned) as the solution
      const solStep     = Math.floor(Math.random() * totalSteps);
      const solutionAngle = modAngle(solStep * snap);

      // Targets: evenly spaced starting at solutionAngle
      // target[i].angle = solutionAngle + i*(360/N)
      const targets = perm.map((col, i) => ({
        color: col,
        angle: modAngle(solutionAngle + i * (360 / N)),
      }));

      // Start at a random angle != solutionAngle
      let startStep = Math.floor(Math.random() * totalSteps);
      if (startStep === solStep) startStep = (startStep + 1) % totalSteps;

      state.rings.push({
        angle: startStep * snap,   // current rotation (changes with A/D)
        solutionAngle,             // win condition
        dotColors: perm,           // dot i has color perm[i]
        targets,                   // target arc i expects color perm[i] at fixed angle
      });
      state.solvedRings.push(false);
    }
    state.selected = 0;
  }

  /* dot i of ring sits at: modAngle(ring.angle + i*(360/N)) */
  function dotAngle(ring, di) {
    return modAngle(ring.angle + di * (360 / state.colorsN));
  }

  /* ring is solved when ring.angle ≈ solutionAngle */
  function checkRing(ring) {
    const diff = Math.abs(angleDiffDeg(modAngle(ring.angle), ring.solutionAngle));
    return diff < state.snapDeg * 0.5 + 0.01;
  }
  function checkAll() { return state.rings.every(r => checkRing(r)); }

  /* ── rotation ── */
  function rotateSelected(dir) {
    if (state.phase !== 'playing') return;
    const ring = state.rings[state.selected];
    if (!ring || state.solvedRings[state.selected]) return;

    const oldDiff  = Math.abs(angleDiffDeg(ring.angle, ring.solutionAngle));
    ring.angle     = modAngle(ring.angle + dir * state.snapDeg);
    const newDiff  = Math.abs(angleDiffDeg(ring.angle, ring.solutionAngle));
    const nowSolved = checkRing(ring);

    if (nowSolved) {
      state.solvedRings[state.selected] = true;
      addRipple(state.selected);
      triggerFlash('#34d399', 0.18);
    } else if (newDiff > oldDiff + state.snapDeg * 0.1) {
      applyPenalty();
    }

    if (checkAll() && !state.allSolved) {
      state.allSolved = true;
      onRoundWin();
    }
  }

  /* ── penalty (time only) ── */
  function applyPenalty() {
    state.mistakeCount++;
    triggerShake(7, 12);
    triggerFlash('#f43f5e', 0.28);
    spawnPenaltyParts();
    if (state.timeLimit > 0) {
      state.timeLeft = Math.max(0, state.timeLeft - state.penaltyValue);
      updateTimerUI();
      setInfo(`⚠ -${state.penaltyValue}s de penalización`);
      if (state.timeLeft <= 0) { clearInterval(timerInterval); if (!state.allSolved) onTimeout(); }
    } else {
      setInfo(`⚠ Error — ${state.mistakeCount} fallo${state.mistakeCount !== 1 ? 's' : ''}`);
    }
  }

  /* ── effects ── */
  function addRipple(ri)    { state.ripples.push({ ring: ri, t: 0 }); }
  function triggerShake(f, a) { shakeFrames = f; shakeAmt = a; }
  function triggerFlash(col, a) { flashState = { col, a, t: 0, dur: 18 }; }
  function spawnPenaltyParts() {
    const cx = canvas.width / 2, cy = canvas.height / 2;
    for (let i = 0; i < 12; i++) {
      const ang = Math.random() * TAU, spd = 2 + Math.random() * 4;
      penaltyParts.push({
        x: cx + (Math.random() - 0.5) * 60, y: cy + (Math.random() - 0.5) * 60,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        life: 1, decay: 0.04 + Math.random() * 0.04, size: 2 + Math.random() * 3,
      });
    }
  }

  /* ── UI ── */
  function setInfo(msg)     { if (infoEl)   infoEl.textContent  = msg; }
  function updateScoreUI()  { if (scoreEl)  scoreEl.textContent = state.score; }
  function updateTimerUI()  {
    if (!timerEl) return;
    if (state.timeLimit <= 0) { timerEl.textContent = '∞'; timerEl.style.color = ''; return; }
    timerEl.textContent   = String(state.timeLeft).padStart(2, '0') + 's';
    timerEl.style.color   = state.timeLeft <= 5 ? '#f43f5e' : '';
    timerEl.dataset.urgent = state.timeLeft <= 5 ? 'true' : 'false';
  }
  function updateUI() {
    if (roundEl)       roundEl.textContent       = `${state.currentRound}/${state.totalRounds}`;
    if (ringIndicatorEl) ringIndicatorEl.textContent = `ANILLO ${state.selected + 1} / ${state.rings.length}`;
    updateScoreUI(); updateTimerUI();
  }

  /* ── round flow ── */
  function onRoundWin() {
    state.score++;
    clearInterval(timerInterval);
    const elapsed = Math.round((Date.now() - state.startTime) / 1000);
    const bonus   = state.mistakeCount === 0 ? ' 🏆 ¡Sin errores!' : '';
    setInfo(`✓ ¡Desbloqueado! Ronda ${state.currentRound}/${state.totalRounds} — ${elapsed}s${bonus}`);
    updateScoreUI();
    if (state.currentRound >= state.totalRounds) setTimeout(finishGame, 900);
    else setTimeout(nextRound, 1100);
  }
  function nextRound() {
    state.currentRound++;
    buildRound();
    startTimer();
    updateUI();
  }
  function finishGame() {
    state.phase = 'done';
    clearInterval(timerInterval);
    setInfo(`Juego terminado — ${state.score}/${state.totalRounds}`);
    startBtn.disabled = false;
    if (window.Leaderboard) window.Leaderboard.save('unlocked', state.score, state.totalRounds,
      `${state.ringCount}R·${state.colorsN}C·${state.granularity}G`);
    updateUI();
  }
  function onTimeout() {
    state.phase = 'done';
    triggerFlash('#f43f5e', 0.45); triggerShake(18, 15);
    setInfo(`⏱ Tiempo agotado — ${state.score}/${state.totalRounds}`);
    startBtn.disabled = false;
    if (window.Leaderboard) window.Leaderboard.save('unlocked', state.score, state.totalRounds,
      `${state.ringCount}R·${state.colorsN}C·${state.granularity}G`);
    updateUI();
  }
  function startTimer() {
    clearInterval(timerInterval);
    state.startTime = Date.now();
    if (state.timeLimit <= 0) return;
    state.timeLeft = state.timeLimit;
    updateTimerUI();
    timerInterval = setInterval(() => {
      state.timeLeft--;
      updateTimerUI();
      if (state.timeLeft <= 0) { clearInterval(timerInterval); if (!state.allSolved) onTimeout(); }
    }, 1000);
  }

  /* ══════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════ */
  function drawFrame() {
    const W = canvas.width, H = canvas.height;
    if (W < 10 || H < 10) return;

    let sx = 0, sy = 0;
    if (shakeFrames > 0) {
      sx = (Math.random() - 0.5) * shakeAmt;
      sy = (Math.random() - 0.5) * shakeAmt;
      shakeFrames--;
    }

    const cx  = W / 2 + sx;
    const cy  = H / 2 + sy;
    const N   = state.colorsN;
    const maxR = Math.min(W, H) * 0.43;
    const minR = maxR * 0.20;
    const ringCount = Math.max(state.rings.length, 1);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#090400';
    ctx.fillRect(0, 0, W, H);

    /* flash */
    if (flashState) {
      const alpha = flashState.a * (1 - flashState.t / flashState.dur);
      ctx.fillStyle = flashState.col + Math.round(alpha * 255).toString(16).padStart(2, '0');
      ctx.fillRect(0, 0, W, H);
      flashState.t++;
      if (flashState.t >= flashState.dur) flashState = null;
    }

    /* grid */
    ctx.strokeStyle = 'rgba(249,115,22,0.04)'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    /* particles */
    penaltyParts = penaltyParts.filter(p => p.life > 0);
    penaltyParts.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x+sx, p.y+sy, p.size*p.life, 0, TAU);
      ctx.fillStyle = `rgba(244,63,94,${p.life*0.85})`; ctx.fill();
      p.x+=p.vx; p.y+=p.vy; p.vx*=0.92; p.vy*=0.92; p.life-=p.decay;
    });

    /* rings */
    state.rings.forEach((ring, ri) => {
      const radius     = minR + (maxR - minR) * (ri + 1) / ringCount;
      const isSelected = ri === state.selected && state.phase === 'playing';
      const isSolved   = state.solvedRings[ri];

      // arc thickness scales with gap between rings
      const gap          = (maxR - minR) / ringCount;
      const arcThickness = Math.max(5, gap * 0.32);
      // arc angular span: slightly less than one slot so gaps are visible
      const slotRad  = TAU / N;
      const arcSpan  = slotRad * 0.52;

      /* ripple */
      const rip = state.ripples.find(rp => rp.ring === ri);
      if (rip) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius + rip.t * 30, 0, TAU);
        ctx.strokeStyle = `rgba(52,211,153,${(1-rip.t)*0.6})`; ctx.lineWidth = 3; ctx.stroke();
      }

      /* ── TARGET ARCS (fixed, per-ring) ── */
      ring.targets.forEach((tgt, ti) => {
        // tgt.angle is the fixed angle where dot ti must land
        // tgt.color is the expected color
        const tRad   = degToRad(tgt.angle);
        const aStart = tRad - arcSpan / 2;
        const aEnd   = tRad + arcSpan / 2;

        // Is the matching dot currently on this arc?
        const dA     = dotAngle(ring, ti);          // where dot ti actually is
        const diff   = Math.abs(angleDiffDeg(dA, tgt.angle));
        const hit    = diff < state.snapDeg * 0.5 + 0.5;

        if (isSolved || hit) {
          ctx.beginPath(); ctx.arc(cx, cy, radius, aStart, aEnd);
          ctx.strokeStyle  = tgt.color;
          ctx.lineWidth    = arcThickness;
          ctx.shadowColor  = tgt.color; ctx.shadowBlur = 16;
          ctx.stroke(); ctx.shadowBlur = 0;
        } else {
          /* dim arc */
          ctx.beginPath(); ctx.arc(cx, cy, radius, aStart, aEnd);
          ctx.strokeStyle = tgt.color + '45';
          ctx.lineWidth   = arcThickness;
          ctx.stroke();
          /* center tick */
          const tx = cx + Math.cos(tRad) * radius;
          const ty = cy + Math.sin(tRad) * radius;
          ctx.beginPath(); ctx.arc(tx, ty, arcThickness * 0.25, 0, TAU);
          ctx.fillStyle = tgt.color + '70'; ctx.fill();
        }
      });

      /* base ring stroke */
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, TAU);
      if (isSolved) {
        ctx.strokeStyle = 'rgba(52,211,153,0.70)';
        ctx.lineWidth   = 2.5;
        ctx.shadowColor = '#34d399'; ctx.shadowBlur = 14;
        ctx.stroke(); ctx.shadowBlur = 0;
      } else if (isSelected) {
        ctx.strokeStyle = 'rgba(249,115,22,0.85)';
        ctx.lineWidth   = 2.5;
        ctx.shadowColor = '#f97316'; ctx.shadowBlur = 12;
        ctx.stroke(); ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = 'rgba(249,115,22,0.15)';
        ctx.lineWidth   = 1; ctx.stroke();
      }

      /* ring label */
      const la = degToRad(-82);
      const lrx = cx + Math.cos(la) * (radius - 10);
      const lry = cy + Math.sin(la) * (radius - 10);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (isSolved) {
        ctx.font = `${Math.max(9, W*0.020)}px monospace`;
        ctx.fillStyle = 'rgba(52,211,153,0.85)'; ctx.fillText('🔒', lrx, lry);
      } else if (state.phase === 'playing') {
        ctx.font = `bold ${Math.max(8, W*0.018)}px monospace`;
        ctx.fillStyle = isSelected ? 'rgba(249,115,22,0.9)' : 'rgba(249,115,22,0.25)';
        ctx.fillText(`R${ri+1}`, lrx, lry);
      }

      /* ── DOTS (rotate with ring.angle) ── */
      const dotR = Math.max(6, W * 0.014);
      ring.dotColors.forEach((col, di) => {
        const dDeg = dotAngle(ring, di);
        const dRad = degToRad(dDeg);
        const dx   = cx + Math.cos(dRad) * radius;
        const dy   = cy + Math.sin(dRad) * radius;

        // Is this dot on its assigned target arc?
        const diff    = Math.abs(angleDiffDeg(dDeg, ring.targets[di].angle));
        const onTarget = diff < state.snapDeg * 0.5 + 0.5;

        if (onTarget) {
          ctx.beginPath(); ctx.arc(dx, dy, dotR+6, 0, TAU);
          ctx.fillStyle = col + '28'; ctx.fill();
          ctx.shadowColor = col; ctx.shadowBlur = 18;
        }
        ctx.beginPath(); ctx.arc(dx, dy, dotR, 0, TAU);
        ctx.fillStyle = col; ctx.fill(); ctx.shadowBlur = 0;
        ctx.strokeStyle = onTarget ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.28)';
        ctx.lineWidth = onTarget ? 2.5 : 1.5; ctx.stroke();
      });
    });

    /* center orb */
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 11);
    g.addColorStop(0, '#ffd580'); g.addColorStop(1, '#f97316');
    ctx.beginPath(); ctx.arc(cx, cy, 9, 0, TAU);
    ctx.fillStyle = g; ctx.shadowColor = '#f97316'; ctx.shadowBlur = 16;
    ctx.fill(); ctx.shadowBlur = 0;

    /* overlays */
    if (state.phase === 'idle') {
      ctx.fillStyle = 'rgba(9,4,0,0.65)'; ctx.fillRect(0,0,W,H);
      ctx.font = `bold ${Math.max(14,W*0.036)}px monospace`;
      ctx.fillStyle = 'rgba(249,115,22,0.9)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('PULSE INICIAR', cx-sx, cy-sy);
    }
    if (state.phase === 'done') {
      ctx.fillStyle = 'rgba(9,4,0,0.68)'; ctx.fillRect(0,0,W,H);
      ctx.font = `bold ${Math.max(13,W*0.034)}px monospace`;
      ctx.fillStyle = '#34d399';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`FIN · ${state.score}/${state.totalRounds}`, cx-sx, cy-sy-12);
      ctx.font = `${Math.max(9,W*0.020)}px monospace`;
      ctx.fillStyle = 'rgba(249,115,22,0.65)';
      ctx.fillText('PULSE INICIAR PARA REPETIR', cx-sx, cy-sy+14);
    }
  }

  function animLoop() {
    state.ripples = state.ripples.filter(r => { r.t += 0.045; return r.t < 1; });
    drawFrame();
    requestAnimationFrame(animLoop);
  }

  /* ── input ── */
  function isActive() {
    const s = document.getElementById('unlocked');
    return s && !s.classList.contains('hidden');
  }
  function onKey(e) {
    if (!isActive() || state.phase !== 'playing') return;
    switch (e.key) {
      case 'a': case 'A': e.preventDefault(); rotateSelected(-1); break;
      case 'd': case 'D': e.preventDefault(); rotateSelected(1);  break;
      case 'q': case 'Q':
        state.selected = (state.selected - 1 + state.rings.length) % state.rings.length;
        updateUI(); break;
      case 'e': case 'E':
        state.selected = (state.selected + 1) % state.rings.length;
        updateUI(); break;
      case 'Tab':
        e.preventDefault();
        state.selected = e.shiftKey
          ? (state.selected - 1 + state.rings.length) % state.rings.length
          : (state.selected + 1) % state.rings.length;
        updateUI(); break;
    }
  }
  document.addEventListener('keydown', onKey);

  canvas.addEventListener('click', e => {
    if (state.phase !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const px   = (e.clientX - rect.left) * (canvas.width  / rect.width);
    const py   = (e.clientY - rect.top)  * (canvas.height / rect.height);
    const lcx  = canvas.width / 2, lcy = canvas.height / 2;
    const dist = Math.hypot(px - lcx, py - lcy);
    const maxR = Math.min(canvas.width, canvas.height) * 0.43;
    const minR = maxR * 0.20;
    for (let ri = 0; ri < state.rings.length; ri++) {
      const r = minR + (maxR - minR) * (ri + 1) / state.rings.length;
      if (Math.abs(dist - r) < 24) { state.selected = ri; updateUI(); return; }
    }
  });

  canvas.addEventListener('dblclick', e => {
    if (state.phase !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (canvas.width / rect.width);
    rotateSelected(px < canvas.width / 2 ? -1 : 1);
  });

  /* ── resize ── */
  function resizeCanvas() {
    const sec = document.getElementById('unlocked');
    if (!sec || sec.classList.contains('hidden')) return;
    const w = canvas.parentElement.clientWidth;
    if (w < 20) return;
    canvas.width = canvas.height = Math.min(w, 500);
  }
  window._unlockedOnShow = resizeCanvas;
  window.addEventListener('resize', () => {
    if (!document.getElementById('unlocked')?.classList.contains('hidden')) resizeCanvas();
  });
  canvas.width = canvas.height = 480;

  /* ── start ── */
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      state.ringCount   = Math.max(1, Math.min(5,  parseInt(ringCountEl?.value      || 3)));
      state.colorsN     = Math.max(2, Math.min(8,  parseInt(colorsPerRingEl?.value  || 3)));
      state.granularity = Math.max(1, Math.min(16, parseInt(granularityEl?.value    || 4)));
      state.snapDeg     = computeSnap(state.colorsN, state.granularity);
      state.timeLimit   = parseInt(timeLimitEl?.value || 0);
      state.totalRounds = Math.max(1, Math.min(15, parseInt(roundsEl?.value         || 3)));

      const pVal = document.getElementById('unlockedPenaltyValue');
      state.penaltyValue = pVal ? parseInt(pVal.value || 5) : 5;

      state.score = 0; state.currentRound = 1;
      state.phase = 'playing';
      state.ripples = []; penaltyParts = []; flashState = null; shakeFrames = 0;
      startBtn.disabled = true;
      resizeCanvas();
      buildRound();
      startTimer();
      updateUI();
      setInfo('A/D girar · Q/E cambiar anillo · Alinea los puntos con los arcos de color');
    });
  }

  if (prevRingBtn) prevRingBtn.addEventListener('click', () => {
    if (state.phase !== 'playing') return;
    state.selected = (state.selected - 1 + state.rings.length) % state.rings.length;
    updateUI();
  });
  if (nextRingBtn) nextRingBtn.addEventListener('click', () => {
    if (state.phase !== 'playing') return;
    state.selected = (state.selected + 1) % state.rings.length;
    updateUI();
  });

  drawFrame();
  animLoop();
}

window.stopUnlocked = function () {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  if (typeof state !== 'undefined') state.phase = 'idle';
};
window.initUnlocked = initUnlocked;
