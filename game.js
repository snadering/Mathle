// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CONFIG = {
  maxGuesses: 6,
  operators: ['+', '-', '*', '/'],
};

// Display symbol map — internal value → pretty symbol
const OP_DISPLAY = { '+': '+', '-': '−', '*': '×', '/': '÷' };
function displayOp(op) { return OP_DISPLAY[op] || op; }

// ─── STATE ────────────────────────────────────────────────────────────────────
let state = {
  puzzle: null,       // { numbers, operators, result }
  guesses: [],        // array of operator arrays e.g. [['+','-','*','/'], ...]
  feedbacks: [],      // array of feedback arrays e.g. [['green','grey','yellow','green'], ...]
  status: 'playing',  // 'playing' | 'won' | 'lost' | 'freeplay'
  currentGuess: [],   // operators picked so far for the current row
  date: '',
};

// ─── PUZZLE SELECTION ─────────────────────────────────────────────────────────
function getTodayString() {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
}

function getPuzzle(dateStr) {
  const epoch = new Date('2026-01-01');
  const today = new Date(dateStr);
  const dayIndex = Math.floor((today - epoch) / 86400000);
  return PUZZLES[((dayIndex % PUZZLES.length) + PUZZLES.length) % PUZZLES.length];
}

// ─── EQUATION EVALUATION ─────────────────────────────────────────────────────
function evalEquation(numbers, operators) {
  const tokens = [];
  for (let i = 0; i < numbers.length; i++) {
    tokens.push(numbers[i]);
    if (i < operators.length) tokens.push(operators[i]);
  }
  // Pass 1: resolve * and /
  let i = 1;
  while (i < tokens.length) {
    if (tokens[i] === '*' || tokens[i] === '/') {
      const a = tokens[i - 1], b = tokens[i + 1];
      const val = tokens[i] === '*' ? a * b : a / b;
      tokens.splice(i - 1, 3, val);
    } else {
      i += 2;
    }
  }
  // Pass 2: resolve + and -
  let result = tokens[0];
  for (let j = 1; j < tokens.length; j += 2) {
    result = tokens[j] === '+' ? result + tokens[j + 1] : result - tokens[j + 1];
  }
  return result;
}

// ─── FEEDBACK ALGORITHM ───────────────────────────────────────────────────────
function getFeedback(guessOps, answerOps) {
  const result = Array(answerOps.length).fill('grey');
  const answerConsumed = Array(answerOps.length).fill(false);

  // Pass 1: greens
  for (let i = 0; i < answerOps.length; i++) {
    if (guessOps[i] === answerOps[i]) {
      result[i] = 'green';
      answerConsumed[i] = true;
    }
  }
  // Pass 2: yellows
  for (let i = 0; i < answerOps.length; i++) {
    if (result[i] === 'green') continue;
    for (let j = 0; j < answerOps.length; j++) {
      if (!answerConsumed[j] && guessOps[i] === answerOps[j]) {
        result[i] = 'yellow';
        answerConsumed[j] = true;
        break;
      }
    }
  }
  return result;
}

// ─── PERSISTENCE ─────────────────────────────────────────────────────────────
const STORAGE_KEY = 'mathle_state';
const STATS_KEY   = 'mathle_stats';

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.date === getTodayString()) return saved;
  } catch (_) {}
  return null;
}

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) || defaultStats(); }
  catch (_) { return defaultStats(); }
}

function defaultStats() {
  return { played: 0, wins: 0, currentStreak: 0, maxStreak: 0, distribution: [0,0,0,0,0,0], lastWonDate: null };
}

function getYesterday() {
  const d = new Date(getTodayString());
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA');
}

function saveStats(guessCount, won) {
  const stats = loadStats();
  const today = getTodayString();

  // Don't double-count if the game was already saved today (e.g. page reload)
  if (stats.lastPlayedDate === today) return stats;
  stats.lastPlayedDate = today;

  stats.played++;
  if (won) {
    stats.wins++;
    if (guessCount >= 1 && guessCount <= 6) stats.distribution[guessCount - 1]++;

    // Streak continues only if last win was yesterday (or today — safety guard)
    if (stats.lastWonDate === getYesterday() || stats.lastWonDate === today) {
      stats.currentStreak++;
    } else {
      stats.currentStreak = 1; // broken or first ever win
    }
    if (stats.currentStreak > stats.maxStreak) stats.maxStreak = stats.currentStreak;
    stats.lastWonDate = today;
  } else {
    stats.currentStreak = 0;
  }

  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch (_) {}
  return stats;
}

// Returns the streak to display — resets to 0 if the player skipped a day
function getDisplayStreak(stats) {
  if (!stats.lastWonDate) return 0;
  const today = getTodayString();
  if (stats.lastWonDate === today || stats.lastWonDate === getYesterday()) {
    return stats.currentStreak;
  }
  return 0; // missed a day, streak is broken
}

// ─── UI HELPERS ───────────────────────────────────────────────────────────────
function showToast(msg, duration = 1800) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast--visible'));
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function shakeEquation() {
  const eq = document.getElementById('equation-display');
  eq.classList.add('shake');
  eq.addEventListener('animationend', () => eq.classList.remove('shake'), { once: true });
}

// ─── EQUATION DISPLAY (shown once, always visible) ───────────────────────────
function buildEquationDisplay() {
  const container = document.getElementById('equation-display');
  container.innerHTML = '';
  const nums = state.puzzle.numbers;

  nums.forEach((num, i) => {
    const numTile = document.createElement('div');
    numTile.className = 'tile tile--number';
    numTile.textContent = num;
    container.appendChild(numTile);

    if (i < nums.length - 1) {
      const slot = document.createElement('div');
      slot.className = 'tile tile--slot';
      slot.dataset.col = i;
      container.appendChild(slot);
    }
  });

  const eqTile = document.createElement('div');
  eqTile.className = 'tile tile--equals';
  eqTile.textContent = '=';
  container.appendChild(eqTile);

  const resTile = document.createElement('div');
  resTile.className = 'tile tile--result';
  resTile.textContent = state.puzzle.result;
  container.appendChild(resTile);
}

function lockEquationDisplay(ops) {
  const slots = document.querySelectorAll('#equation-display .tile--slot');
  slots.forEach((slot, i) => {
    slot.classList.remove('tile--slot-active', 'tile--slot-filled');
    slot.classList.add('tile--slot-solved');
    slot.textContent = displayOp(ops[i]);
  });
}

function renderCurrentGuess() {
  if (state.status === 'won') return;
  const slots = document.querySelectorAll('#equation-display .tile--slot');
  slots.forEach((slot, i) => {
    slot.classList.remove('tile--slot-active');
    slot.textContent = state.currentGuess[i] ? displayOp(state.currentGuess[i]) : '';
    slot.classList.toggle('tile--slot-filled', !!state.currentGuess[i]);
  });
  const nextEmpty = state.currentGuess.length;
  if (nextEmpty < slots.length) {
    slots[nextEmpty].classList.add('tile--slot-active');
  }
}

// ─── GUESS HISTORY ────────────────────────────────────────────────────────────
function buildGuessHistory() {
  document.getElementById('guess-history').innerHTML = '';
}

// Restore all past guesses from state (used on page reload)
function renderGuesses() {
  const history = document.getElementById('guess-history');
  history.innerHTML = '';
  state.guesses.forEach((ops, rowIdx) => {
    const feedback = state.feedbacks[rowIdx] || null;
    const inFreePlay = rowIdx >= CONFIG.maxGuesses || state.status === 'freeplay';
    const row = createGuessRow(ops, inFreePlay ? null : feedback);
    history.appendChild(row);
  });
}

function createGuessRow(ops, feedback) {
  const row = document.createElement('div');
  row.className = 'guess-row';
  ops.forEach((op, i) => {
    const tile = document.createElement('div');
    tile.className = 'tile tile--op-result';
    tile.textContent = displayOp(op);
    if (feedback) {
      tile.classList.add(feedback[i]);
    } else {
      tile.classList.add('no-color');
    }
    row.appendChild(tile);
  });
  return row;
}

function revealGuessRow(ops, feedback, onComplete) {
  const history = document.getElementById('guess-history');
  const row = document.createElement('div');
  row.className = 'guess-row';

  ops.forEach((op) => {
    const tile = document.createElement('div');
    tile.className = 'tile tile--op-result tile--pending';
    tile.textContent = displayOp(op);
    row.appendChild(tile);
  });

  history.appendChild(row);

  const tiles = row.querySelectorAll('.tile--op-result');
  const FLIP_DURATION = 500;
  const STAGGER = 320;

  tiles.forEach((tile, i) => {
    setTimeout(() => {
      tile.classList.add('flip');
      setTimeout(() => {
        tile.classList.remove('tile--pending', 'flip');
        tile.classList.add(feedback[i], 'flipped');
        if (i === tiles.length - 1) {
          setTimeout(() => onComplete && onComplete(), 200);
        }
      }, FLIP_DURATION / 2);
    }, i * STAGGER);
  });
}

function addFreePlayRow(ops) {
  const history = document.getElementById('guess-history');
  const row = createGuessRow(ops, null);
  row.classList.add('freeplay-row');
  history.appendChild(row);
}

// ─── KEYBOARD COLORS ──────────────────────────────────────────────────────────
function updateKeyboard(feedback, guessOps) {
  guessOps.forEach((op, i) => {
    const key = document.querySelector(`.key[data-op="${op}"]`);
    if (!key) return;
    const rank = { '': 0, 'grey': 1, 'yellow': 2, 'green': 3 };
    const current = key.dataset.state || '';
    const next = feedback[i];
    if ((rank[next] || 0) > (rank[current] || 0)) {
      key.dataset.state = next;
      key.classList.remove('green', 'yellow', 'grey');
      key.classList.add(next);
    }
  });
}

// ─── SUBMIT GUESS ─────────────────────────────────────────────────────────────
let isAnimating = false;

function submitGuess() {
  if (isAnimating) return;

  const opCount = state.puzzle.operators.length;
  if (state.currentGuess.length < opCount) {
    showToast('Fill all operator slots first');
    shakeEquation();
    return;
  }

  const rowIdx = state.guesses.length;
  const feedback = getFeedback(state.currentGuess, state.puzzle.operators);
  const submittedOps = [...state.currentGuess];
  state.guesses.push(submittedOps);
  state.feedbacks.push(feedback);
  state.currentGuess = [];
  renderCurrentGuess(); // clear the slots immediately

  if (state.status === 'freeplay') {
    const won = feedback.every(f => f === 'green');
    if (won) {
      state.status = 'won';
      lockEquationDisplay(submittedOps);
      saveState();
      setTimeout(() => showToast('You solved it! 🎉', 2500), 200);
    } else {
      saveState();
      setTimeout(() => showToast('Not quite — keep trying!', 1800), 100);
    }
    return;
  }

  // Normal play — animate reveal
  isAnimating = true;
  revealGuessRow(submittedOps, feedback, () => {
    isAnimating = false;
    updateKeyboard(feedback, submittedOps);

    const won = feedback.every(f => f === 'green');
    if (won) {
      state.status = 'won';
      lockEquationDisplay(submittedOps);
      saveState();
      const stats = saveStats(rowIdx + 1, true);
      setTimeout(() => showResultModal(true, rowIdx + 1, stats), 400);
    } else if (state.guesses.length >= CONFIG.maxGuesses) {
      state.status = 'lost';
      saveState();
      const stats = saveStats(state.guesses.length, false);
      setTimeout(() => showResultModal(false, state.guesses.length, stats), 400);
    } else {
      saveState();
    }
  });
}

// ─── OPERATOR INPUT ───────────────────────────────────────────────────────────
function inputOperator(op) {
  if (state.status === 'won') return;
  if (state.currentGuess.length >= state.puzzle.operators.length) return;
  state.currentGuess.push(op);
  renderCurrentGuess();
}

function deleteOperator() {
  if (state.status === 'won') return;
  if (state.currentGuess.length === 0) return;
  state.currentGuess.pop();
  renderCurrentGuess();
}

// ─── RESULT MODAL ─────────────────────────────────────────────────────────────
function showResultModal(won, guessCount, stats) {
  const modal = document.getElementById('result-modal');
  document.getElementById('result-title').textContent = won ? 'Solved!' : 'Game Over';
  document.getElementById('result-subtitle').textContent = won
    ? `You got it in ${guessCount} guess${guessCount === 1 ? '' : 'es'}!`
    : `Keep trying in free play!`;

  document.getElementById('stat-played').textContent = stats.played;
  document.getElementById('stat-winpct').textContent = stats.played
    ? Math.round((stats.wins / stats.played) * 100) + '%' : '0%';
  document.getElementById('stat-streak').textContent = getDisplayStreak(stats);
  document.getElementById('stat-maxstreak').textContent = stats.maxStreak;

  document.getElementById('free-play-btn').style.display = won ? 'none' : 'block';
  modal.showModal();
}

function buildShareText() {
  const lines = state.feedbacks.map(fb =>
    fb.map(f => f === 'green' ? '🟩' : f === 'yellow' ? '🟨' : '⬛').join('')
  );
  return `Mathle ${state.date} ${state.status === 'won' ? state.guesses.length : 'X'}/${CONFIG.maxGuesses}\n\n${lines.join('\n')}`;
}

// ─── KEYBOARD (on-screen) ─────────────────────────────────────────────────────
function buildKeyboard() {
  const keyboard = document.getElementById('keyboard');
  keyboard.innerHTML = '';

  CONFIG.operators.forEach(op => {
    const key = document.createElement('button');
    key.className = 'key';
    key.dataset.op = op;
    key.textContent = displayOp(op); // show × and ÷
    key.addEventListener('click', () => inputOperator(op));
    keyboard.appendChild(key);
  });

  const delKey = document.createElement('button');
  delKey.className = 'key key--action';
  delKey.textContent = 'DEL';
  delKey.addEventListener('click', deleteOperator);
  keyboard.appendChild(delKey);

  const enterKey = document.createElement('button');
  enterKey.className = 'key key--action key--enter';
  enterKey.textContent = 'ENTER';
  enterKey.addEventListener('click', submitGuess);
  keyboard.appendChild(enterKey);
}

// Physical keyboard support
document.addEventListener('keydown', (e) => {
  if (document.querySelector('dialog[open]')) return;
  if (e.key === 'Enter')     { submitGuess(); return; }
  if (e.key === 'Backspace') { deleteOperator(); return; }
  if (['+', '-', '*', '/'].includes(e.key)) { inputOperator(e.key); }
});

// ─── INIT ─────────────────────────────────────────────────────────────────────
function init() {
  const today = getTodayString();
  const saved = loadState();

  if (saved) {
    state = saved;
  } else {
    state = {
      puzzle: getPuzzle(today),
      guesses: [],
      feedbacks: [],
      status: 'playing',
      currentGuess: [],
      date: today,
    };
  }

  buildEquationDisplay();
  buildGuessHistory();
  buildKeyboard();
  renderGuesses(); // restore past guesses on reload

  // Restore keyboard colors
  state.feedbacks.forEach((fb, i) => updateKeyboard(fb, state.guesses[i]));

  if (state.status === 'playing' || state.status === 'freeplay') {
    renderCurrentGuess();
  }

  if (state.status === 'freeplay') {
    document.getElementById('freeplay-banner').style.display = 'flex';
  }

  if (state.status === 'won' || state.status === 'lost') {
    const stats = loadStats();
    setTimeout(() => showResultModal(state.status === 'won', state.guesses.length, stats), 600);
  }

  document.getElementById('help-btn').addEventListener('click', () => {
    document.getElementById('help-modal').showModal();
  });

  document.getElementById('share-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(buildShareText())
      .then(() => showToast('Copied to clipboard!'))
      .catch(() => showToast('Copy failed'));
  });

  document.getElementById('free-play-btn').addEventListener('click', () => {
    state.status = 'freeplay';
    saveState();
    document.getElementById('result-modal').close();
    document.getElementById('freeplay-banner').style.display = 'flex';
    renderCurrentGuess();
  });

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('dialog').close());
  });
}

document.addEventListener('DOMContentLoaded', init);
