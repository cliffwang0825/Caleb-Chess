const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

const initialBoard = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

const pieceValues = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

const difficultyDepth = {
  easy: 1,
  normal: 2,
  hard: 3,
  pro: 4
};

const leaderboardData = [
  { name: 'Caleb', rating: 2480 },
  { name: 'Ivy', rating: 2365 },
  { name: 'Noah', rating: 2290 },
  { name: 'Mira', rating: 2215 },
  { name: 'Aris', rating: 2140 }
];

const modeLabels = {
  human: 'Two Players (Local)',
  'ai-white': 'Single Player — You Play White',
  'ai-black': 'Single Player — You Play Black'
};

const pieceTypeNames = {
  k: 'king',
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
  p: 'pawn'
};

let boardElement;
let squareElements = [];
let turnIndicator;
let statusIndicator;
let newGameButton;
let menuScreen;
let gameScreen;
let menuModeSelect;
let menuDifficultyOptions;
let menuDifficultyGroup;
let menuSoundToggle;
let inGameSoundToggle;
let playButton;
let backToMenuButton;
let activeModeLabel;
let activeDifficultyLabel;
let sessionDifficultyWrapper;
let leaderboardList;
let menuSoundStatusLabel;
let inGameSoundStatusLabel;

let gameState = null;

let soundEnabled = true;
let pendingSettings = {
  mode: 'human',
  difficulty: 'normal'
};

let audioContext = null;
let audioUnlockBound = false;

const svgNS = 'http://www.w3.org/2000/svg';
let gradientCounter = 0;

function createSvgElement(tag, attributes = {}) {
  const element = document.createElementNS(svgNS, tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

function createGradient(svg, color) {
  const gradientId = `piece-gradient-${color}-${gradientCounter++}`;
  const defs = createSvgElement('defs');
  const gradient = createSvgElement('linearGradient', {
    id: gradientId,
    x1: '0%',
    y1: '0%',
    x2: '0%',
    y2: '100%'
  });

  const stops = color === 'white'
    ? [
        { offset: '0%', color: '#ffffff', opacity: '1' },
        { offset: '55%', color: '#dde4f5', opacity: '1' },
        { offset: '100%', color: '#b6c0d6', opacity: '1' }
      ]
    : [
        { offset: '0%', color: '#6f7b92', opacity: '1' },
        { offset: '55%', color: '#232a38', opacity: '1' },
        { offset: '100%', color: '#090d15', opacity: '1' }
      ];

  stops.forEach((stop) => {
    gradient.appendChild(
      createSvgElement('stop', {
        offset: stop.offset,
        'stop-color': stop.color,
        'stop-opacity': stop.opacity
      })
    );
  });

  defs.appendChild(gradient);
  svg.appendChild(defs);
  return gradientId;
}

const pieceArtFactories = {
  p: ({ group, accentColor }) => {
    const head = createSvgElement('circle', { cx: '50', cy: '26', r: '12' });
    const collar = createSvgElement('rect', { x: '40', y: '38', width: '20', height: '6', rx: '3' });
    const body = createSvgElement('path', {
      d: 'M35 78 H65 V68 C65 58 57 54 57 46 C57 39 60 36 52 32 H48 C40 36 43 39 43 46 C43 54 35 58 35 68 Z'
    });
    const base = createSvgElement('path', { d: 'M28 86 H72 V94 H28 Z' });
    group.append(head, collar, body, base);

    const highlight = createSvgElement('path', {
      d: 'M40 66 Q50 58 60 66',
      fill: 'none',
      stroke: accentColor,
      'stroke-width': '3',
      'stroke-linecap': 'round'
    });
    return [highlight];
  },
  r: ({ group, accentColor }) => {
    const tower = createSvgElement('rect', { x: '32', y: '36', width: '36', height: '38', rx: '6' });
    const parapet = createSvgElement('path', {
      d: 'M28 36 H72 V24 H64 V18 H56 V24 H50 V18 H42 V24 H36 V18 H28 V24 H28 Z'
    });
    const midBand = createSvgElement('rect', { x: '32', y: '60', width: '36', height: '8', rx: '4' });
    const base = createSvgElement('rect', { x: '26', y: '82', width: '48', height: '8', rx: '3' });
    const footing = createSvgElement('rect', { x: '24', y: '90', width: '52', height: '6', rx: '3' });
    group.append(parapet, tower, midBand, base, footing);

    const slit = createSvgElement('line', {
      x1: '50',
      y1: '40',
      x2: '50',
      y2: '72',
      stroke: accentColor,
      'stroke-width': '3',
      'stroke-linecap': 'round'
    });
    return [slit];
  },
  n: ({ group, accentColor }) => {
    const body = createSvgElement('path', {
      d: 'M70 80 H34 L40 66 C32 58 34 44 46 42 L40 28 L54 18 L68 22 L64 32 C74 40 74 56 66 64 L74 68 Z'
    });
    const base = createSvgElement('rect', { x: '26', y: '82', width: '48', height: '8', rx: '3' });
    const footing = createSvgElement('rect', { x: '24', y: '90', width: '52', height: '6', rx: '3' });
    group.append(body, base, footing);

    const mane = createSvgElement('path', {
      d: 'M52 24 C60 30 62 40 56 48',
      fill: 'none',
      stroke: accentColor,
      'stroke-width': '3',
      'stroke-linecap': 'round'
    });
    const eye = createSvgElement('circle', { cx: '58', cy: '36', r: '3.2', fill: accentColor, stroke: 'none' });
    return [mane, eye];
  },
  b: ({ group, accentColor, shadowColor }) => {
    const cap = createSvgElement('circle', { cx: '50', cy: '24', r: '11' });
    const body = createSvgElement('path', {
      d: 'M50 12 C38 12 32 28 42 38 L36 54 C32 64 38 72 44 78 V82 H56 V78 C62 72 68 64 64 54 L58 38 C68 28 62 12 50 12 Z'
    });
    const collar = createSvgElement('rect', { x: '36', y: '72', width: '28', height: '8', rx: '4' });
    const base = createSvgElement('rect', { x: '26', y: '86', width: '48', height: '8', rx: '3' });
    const footing = createSvgElement('rect', { x: '24', y: '92', width: '52', height: '6', rx: '3' });
    group.append(cap, body, collar, base, footing);

    const cut = createSvgElement('path', {
      d: 'M50 22 C56 32 44 40 58 54',
      fill: 'none',
      stroke: accentColor,
      'stroke-width': '3',
      'stroke-linecap': 'round'
    });
    const shadow = createSvgElement('path', {
      d: 'M42 74 Q50 68 58 74',
      fill: 'none',
      stroke: shadowColor,
      'stroke-width': '3',
      'stroke-linecap': 'round'
    });
    return [cut, shadow];
  },
  q: ({ group, accentColor }) => {
    const skirt = createSvgElement('path', { d: 'M30 84 H70 L62 48 H38 Z' });
    const bodice = createSvgElement('rect', { x: '38', y: '48', width: '24', height: '12', rx: '6' });
    const torso = createSvgElement('path', { d: 'M44 48 C36 32 40 22 50 18 C60 22 64 32 56 48 Z' });
    const collar = createSvgElement('rect', { x: '36', y: '72', width: '28', height: '8', rx: '4' });
    const base = createSvgElement('rect', { x: '24', y: '88', width: '52', height: '8', rx: '4' });
    const footing = createSvgElement('rect', { x: '22', y: '94', width: '56', height: '6', rx: '3' });
    group.append(skirt, bodice, torso, collar, base, footing);

    const crown = createSvgElement('polygon', {
      points: '40,20 46,8 50,20 54,8 60,20 50,26',
      fill: accentColor,
      stroke: 'none',
      opacity: '0.85'
    });
    const jewel = createSvgElement('circle', { cx: '46', cy: '12', r: '2.4', fill: '#ffd166', stroke: 'none' });
    const jewelTwo = createSvgElement('circle', { cx: '54', cy: '12', r: '2.4', fill: '#ffd166', stroke: 'none' });
    const tiara = createSvgElement('path', {
      d: 'M40 20 Q50 28 60 20',
      fill: 'none',
      stroke: accentColor,
      'stroke-width': '3',
      'stroke-linecap': 'round'
    });
    return [crown, jewel, jewelTwo, tiara];
  },
  k: ({ group, accentColor }) => {
    const skirt = createSvgElement('path', { d: 'M32 84 H68 L60 50 H40 Z' });
    const bodice = createSvgElement('rect', { x: '40', y: '50', width: '20', height: '14', rx: '6' });
    const torso = createSvgElement('path', { d: 'M44 50 C38 38 42 24 50 20 C58 24 62 38 56 50 Z' });
    const collar = createSvgElement('rect', { x: '36', y: '72', width: '28', height: '8', rx: '4' });
    const base = createSvgElement('rect', { x: '24', y: '88', width: '52', height: '8', rx: '4' });
    const footing = createSvgElement('rect', { x: '22', y: '94', width: '56', height: '6', rx: '3' });
    group.append(skirt, bodice, torso, collar, base, footing);

    const crossVertical = createSvgElement('rect', { x: '47', y: '12', width: '6', height: '20', rx: '3' });
    const crossHorizontal = createSvgElement('rect', { x: '42', y: '18', width: '16', height: '6', rx: '3' });
    const crownBand = createSvgElement('rect', { x: '38', y: '32', width: '24', height: '6', rx: '3' });
    crossVertical.setAttribute('fill', accentColor);
    crossHorizontal.setAttribute('fill', accentColor);
    crownBand.setAttribute('fill', accentColor);
    return [crossVertical, crossHorizontal, crownBand];
  }
};

function createPieceArt(pieceType, color) {
  const svg = createSvgElement('svg', { viewBox: '0 0 100 100', class: 'piece-art', role: 'presentation', focusable: 'false' });
  const gradientId = createGradient(svg, color);
  const group = createSvgElement('g', {
    fill: `url(#${gradientId})`,
    stroke: color === 'white' ? 'rgba(40, 52, 82, 0.45)' : 'rgba(255, 255, 255, 0.35)',
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round'
  });

  const accentColor = color === 'white' ? 'rgba(255, 255, 255, 0.78)' : 'rgba(255, 255, 255, 0.65)';
  const shadowColor = color === 'white' ? 'rgba(60, 72, 104, 0.45)' : 'rgba(0, 0, 0, 0.55)';

  const factory = pieceArtFactories[pieceType];
  const overlays = factory ? factory({ group, color, accentColor, shadowColor }) : [];

  svg.appendChild(group);
  if (Array.isArray(overlays)) {
    overlays.forEach((overlay) => {
      if (overlay) {
        if (!overlay.getAttribute('stroke') && overlay.tagName !== 'circle') {
          overlay.setAttribute('stroke', 'none');
        }
        svg.appendChild(overlay);
      }
    });
  }

  return svg;
}

function renderLeaderboard() {
  if (!leaderboardList) return;
  leaderboardList.innerHTML = '';
  leaderboardData.forEach((entry) => {
    const item = document.createElement('li');
    item.textContent = `${entry.name} — ${entry.rating}`;
    leaderboardList.appendChild(item);
  });
}

function getSelectedMenuDifficulty() {
  if (!menuDifficultyOptions || menuDifficultyOptions.length === 0) {
    return pendingSettings.difficulty;
  }
  const selected = Array.from(menuDifficultyOptions).find((input) => input.checked);
  return selected ? selected.value : pendingSettings.difficulty;
}

function setMenuDifficulty(value) {
  if (!menuDifficultyOptions || menuDifficultyOptions.length === 0) return;
  let found = false;
  menuDifficultyOptions.forEach((input) => {
    const match = input.value === value;
    input.checked = match;
    if (match) {
      found = true;
    }
  });
  if (!found) {
    menuDifficultyOptions[0].checked = true;
  }
}

function updateDifficultyVisibility() {
  const isSinglePlayer = pendingSettings.mode !== 'human';
  if (menuDifficultyGroup) {
    menuDifficultyGroup.classList.toggle('hidden', !isSinglePlayer);
  }
  if (sessionDifficultyWrapper) {
    sessionDifficultyWrapper.classList.toggle('hidden', !isSinglePlayer);
  }
}

function formatDifficultyLabel(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function applySettingsToGameUI() {
  if (menuModeSelect) {
    menuModeSelect.value = pendingSettings.mode;
  }
  setMenuDifficulty(pendingSettings.difficulty);
  if (activeModeLabel) {
    activeModeLabel.textContent = modeLabels[pendingSettings.mode] || modeLabels.human;
  }
  if (activeDifficultyLabel) {
    activeDifficultyLabel.textContent = formatDifficultyLabel(pendingSettings.difficulty);
  }
  updateDifficultyVisibility();
}

function updateSoundLabels() {
  if (menuSoundStatusLabel) {
    menuSoundStatusLabel.textContent = soundEnabled ? 'Enabled' : 'Muted';
  }
  if (inGameSoundStatusLabel) {
    inGameSoundStatusLabel.textContent = soundEnabled ? 'Sound On' : 'Sound Off';
  }
}

function setSoundEnabled(enabled) {
  soundEnabled = !!enabled;
  if (menuSoundToggle) {
    menuSoundToggle.checked = soundEnabled;
  }
  if (inGameSoundToggle) {
    inGameSoundToggle.checked = soundEnabled;
  }
  updateSoundLabels();
  if (soundEnabled) {
    bindAudioUnlock();
  }
}

function showMenuScreen() {
  if (menuScreen) {
    menuScreen.classList.remove('hidden');
  }
  if (gameScreen) {
    gameScreen.classList.add('hidden');
  }
}

function showGameScreen() {
  if (menuScreen) {
    menuScreen.classList.add('hidden');
  }
  if (gameScreen) {
    gameScreen.classList.remove('hidden');
  }
}

const SOUND_PROFILES = {
  move: { frequency: 620, duration: 0.22, type: 'triangle', gain: 0.25 },
  capture: { frequency: 460, duration: 0.28, type: 'sawtooth', gain: 0.28 },
  check: { frequency: 920, duration: 0.34, type: 'square', gain: 0.3 }
};

function ensureAudioContext() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) {
    audioContext = new Ctor();
  }
  return audioContext;
}

function unlockAudioContext() {
  const ctx = ensureAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

function bindAudioUnlock() {
  if (audioUnlockBound) return;
  audioUnlockBound = true;
  const handler = () => {
    unlockAudioContext();
    window.removeEventListener('pointerdown', handler);
    window.removeEventListener('keydown', handler);
  };
  window.addEventListener('pointerdown', handler);
  window.addEventListener('keydown', handler);
}

function playSoundCue(kind) {
  if (!soundEnabled) return;
  const profile = SOUND_PROFILES[kind];
  if (!profile) return;
  const ctx = ensureAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = profile.type;
  oscillator.frequency.setValueAtTime(profile.frequency, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(profile.gain, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + profile.duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + profile.duration + 0.05);
}

function cloneBoard(board) {
  return board.map((row) => row.slice());
}

function createInitialState(options = {}) {
  const { mode = 'human', difficulty = 'normal' } = options;
  const aiColor = mode === 'ai-white' ? 'black' : mode === 'ai-black' ? 'white' : null;

  return {
    board: cloneBoard(initialBoard),
    turn: 'white',
    castlingRights: {
      white: { king: true, queen: true },
      black: { king: true, queen: true }
    },
    enPassant: null,
    moveHistory: [],
    selected: null,
    legalMoves: [],
    lastMove: null,
    mode,
    aiColor,
    difficulty,
    gameOver: false,
    winner: null
  };
}

function buildBoard() {
  boardElement.innerHTML = '';
  squareElements = [];

  ranks.forEach((rank, rankIndex) => {
    files.forEach((file, fileIndex) => {
      const square = document.createElement('div');
      square.classList.add('square');
      const isDark = (rankIndex + fileIndex) % 2 === 1;
      square.classList.add(isDark ? 'dark' : 'light');
      const coordinate = `${files[fileIndex]}${ranks[rankIndex]}`;
      square.tabIndex = 0;
      square.setAttribute('role', 'gridcell');
      square.setAttribute('aria-label', `Square ${coordinate}`);
      square.addEventListener('click', () => handleSquareClick(rankIndex, fileIndex));
      square.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleSquareClick(rankIndex, fileIndex);
        }
      });
      boardElement.appendChild(square);
      squareElements.push(square);
    });
  });
}

function getSquareElement(row, col) {
  return squareElements[row * 8 + col];
}

function getPieceColor(piece) {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? 'white' : 'black';
}

function createPieceElement(piece) {
  const pieceType = piece.toLowerCase();
  const color = getPieceColor(piece);
  const element = document.createElement('div');
  element.classList.add('piece');

  if (color) {
    element.classList.add(color);
  }

  element.classList.add(`piece-${pieceType}`);
  const art = createPieceArt(pieceType, color);
  element.appendChild(art);
  element.setAttribute('role', 'img');
  element.setAttribute('aria-label', describePiece(piece));

  return element;
}

function toCoordinate(row, col) {
  return `${files[col]}${ranks[row]}`;
}

function findKingPosition(board, color) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.toLowerCase() === 'k' && getPieceColor(piece) === color) {
        return { row, col };
      }
    }
  }
  return null;
}

function isInsideBoard(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function isSquareAttacked(board, row, col, attackerColor) {
  const direction = attackerColor === 'white' ? -1 : 1;

  // Pawn attacks
  const pawnRows = row + direction;
  for (const dc of [-1, 1]) {
    const c = col + dc;
    if (isInsideBoard(pawnRows, c)) {
      const piece = board[pawnRows][c];
      if (piece && piece.toLowerCase() === 'p' && getPieceColor(piece) === attackerColor) {
        return true;
      }
    }
  }

  // Knight attacks
  const knightMoves = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1]
  ];
  for (const [dr, dc] of knightMoves) {
    const r = row + dr;
    const c = col + dc;
    if (!isInsideBoard(r, c)) continue;
    const piece = board[r][c];
    if (piece && piece.toLowerCase() === 'n' && getPieceColor(piece) === attackerColor) {
      return true;
    }
  }

  // Bishop/Queen diagonal attacks
  const diagonalDirections = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1]
  ];
  for (const [dr, dc] of diagonalDirections) {
    let r = row + dr;
    let c = col + dc;
    while (isInsideBoard(r, c)) {
      const piece = board[r][c];
      if (piece) {
        const color = getPieceColor(piece);
        const type = piece.toLowerCase();
        if (color === attackerColor && (type === 'b' || type === 'q')) {
          return true;
        }
        break;
      }
      r += dr;
      c += dc;
    }
  }

  // Rook/Queen straight attacks
  const straightDirections = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
  ];
  for (const [dr, dc] of straightDirections) {
    let r = row + dr;
    let c = col + dc;
    while (isInsideBoard(r, c)) {
      const piece = board[r][c];
      if (piece) {
        const color = getPieceColor(piece);
        const type = piece.toLowerCase();
        if (color === attackerColor && (type === 'r' || type === 'q')) {
          return true;
        }
        break;
      }
      r += dr;
      c += dc;
    }
  }

  // King attacks
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (!isInsideBoard(r, c)) continue;
      const piece = board[r][c];
      if (piece && piece.toLowerCase() === 'k' && getPieceColor(piece) === attackerColor) {
        return true;
      }
    }
  }

  return false;
}

function isKingInCheck(board, color) {
  const kingPosition = findKingPosition(board, color);
  if (!kingPosition) {
    return false;
  }
  const opponent = color === 'white' ? 'black' : 'white';
  return isSquareAttacked(board, kingPosition.row, kingPosition.col, opponent);
}

function generatePseudoMoves(state, row, col) {
  const board = state.board;
  const piece = board[row][col];
  if (!piece) return [];

  const color = getPieceColor(piece);
  const opponent = color === 'white' ? 'black' : 'white';
  const moves = [];
  const type = piece.toLowerCase();

  if (type === 'p') {
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;
    const promotionRow = color === 'white' ? 0 : 7;

    const oneForward = row + direction;
    if (isInsideBoard(oneForward, col) && !board[oneForward][col]) {
      if (oneForward === promotionRow) {
        moves.push({
          from: { row, col },
          to: { row: oneForward, col },
          promotion: color === 'white' ? 'Q' : 'q',
          type: 'promotion'
        });
      } else {
        moves.push({
          from: { row, col },
          to: { row: oneForward, col },
          type: 'quiet'
        });
      }

      const twoForward = row + 2 * direction;
      if (row === startRow && !board[twoForward][col]) {
        moves.push({
          from: { row, col },
          to: { row: twoForward, col },
          type: 'doublePawn',
          enPassantTarget: { row: row + direction, col }
        });
      }
    }

    for (const dc of [-1, 1]) {
      const targetRow = row + direction;
      const targetCol = col + dc;
      if (!isInsideBoard(targetRow, targetCol)) continue;
      const targetPiece = board[targetRow][targetCol];
      if (targetPiece && getPieceColor(targetPiece) === opponent) {
        if (targetRow === promotionRow) {
          moves.push({
            from: { row, col },
            to: { row: targetRow, col: targetCol },
            promotion: color === 'white' ? 'Q' : 'q',
            type: 'promotion'
          });
        } else {
          moves.push({
            from: { row, col },
            to: { row: targetRow, col: targetCol },
            type: 'capture'
          });
        }
      }
    }

    if (state.enPassant) {
      const { row: epRow, col: epCol } = state.enPassant;
      if (epRow === row + direction && Math.abs(epCol - col) === 1) {
        moves.push({
          from: { row, col },
          to: { row: epRow, col: epCol },
          type: 'enPassant',
          capture: { row, col: epCol }
        });
      }
    }
  } else if (type === 'n') {
    const knightMoves = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1]
    ];
    for (const [dr, dc] of knightMoves) {
      const r = row + dr;
      const c = col + dc;
      if (!isInsideBoard(r, c)) continue;
      const target = board[r][c];
      if (!target || getPieceColor(target) === opponent) {
        moves.push({
          from: { row, col },
          to: { row: r, col: c },
          type: target ? 'capture' : 'quiet'
        });
      }
    }
  } else if (type === 'b' || type === 'r' || type === 'q') {
    const directions = [];
    if (type === 'b' || type === 'q') {
      directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    }
    if (type === 'r' || type === 'q') {
      directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
    }
    for (const [dr, dc] of directions) {
      let r = row + dr;
      let c = col + dc;
      while (isInsideBoard(r, c)) {
        const target = board[r][c];
        if (!target) {
          moves.push({
            from: { row, col },
            to: { row: r, col: c },
            type: 'quiet'
          });
        } else {
          if (getPieceColor(target) === opponent) {
            moves.push({
              from: { row, col },
              to: { row: r, col: c },
              type: 'capture'
            });
          }
          break;
        }
        r += dr;
        c += dc;
      }
    }
  } else if (type === 'k') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = row + dr;
        const c = col + dc;
        if (!isInsideBoard(r, c)) continue;
        const target = board[r][c];
        if (!target || getPieceColor(target) === opponent) {
          moves.push({
            from: { row, col },
            to: { row: r, col: c },
            type: target ? 'capture' : 'quiet'
          });
        }
      }
    }

    const rights = state.castlingRights[color];
    if (rights) {
      const baseRow = color === 'white' ? 7 : 0;
      if (row === baseRow && col === 4) {
        if (rights.king) {
          if (!board[baseRow][5] && !board[baseRow][6]) {
            moves.push({
              from: { row, col },
              to: { row: baseRow, col: 6 },
              type: 'castle',
              rookFrom: { row: baseRow, col: 7 },
              rookTo: { row: baseRow, col: 5 }
            });
          }
        }
        if (rights.queen) {
          if (!board[baseRow][1] && !board[baseRow][2] && !board[baseRow][3]) {
            moves.push({
              from: { row, col },
              to: { row: baseRow, col: 2 },
              type: 'castle',
              rookFrom: { row: baseRow, col: 0 },
              rookTo: { row: baseRow, col: 3 }
            });
          }
        }
      }
    }
  }

  return moves;
}

function applyMove(state, move) {
  const board = cloneBoard(state.board);
  const movingPiece = board[move.from.row][move.from.col];
  const movingColor = getPieceColor(movingPiece);
  const opponent = movingColor === 'white' ? 'black' : 'white';
  const capturePiece =
    move.type === 'enPassant' && move.capture
      ? state.board[move.capture.row][move.capture.col]
      : state.board[move.to.row][move.to.col];

  const newState = {
    board,
    turn: opponent,
    castlingRights: {
      white: { ...state.castlingRights.white },
      black: { ...state.castlingRights.black }
    },
    enPassant: null,
    moveHistory: state.moveHistory.slice(),
    selected: null,
    legalMoves: [],
    lastMove: {
      ...move,
      movingPiece,
      captured: capturePiece || null,
      resultedInCheck: false
    },
    mode: state.mode,
    aiColor: state.aiColor,
    difficulty: state.difficulty,
    gameOver: state.gameOver,
    winner: state.winner
  };

  board[move.from.row][move.from.col] = null;

  if (move.type === 'enPassant' && move.capture) {
    board[move.capture.row][move.capture.col] = null;
  }

  if (move.type === 'castle') {
    const rookPiece = board[move.rookFrom.row][move.rookFrom.col];
    board[move.rookFrom.row][move.rookFrom.col] = null;
    board[move.rookTo.row][move.rookTo.col] = rookPiece;
  }

  const placedPiece = move.promotion ? move.promotion : movingPiece;
  board[move.to.row][move.to.col] = placedPiece;

  // Update castling rights when king or rook moves or is captured
  if (movingPiece.toLowerCase() === 'k') {
    newState.castlingRights[movingColor] = { king: false, queen: false };
  }
  if (movingPiece.toLowerCase() === 'r') {
    if (movingColor === 'white') {
      if (move.from.row === 7 && move.from.col === 0) newState.castlingRights.white.queen = false;
      if (move.from.row === 7 && move.from.col === 7) newState.castlingRights.white.king = false;
    } else {
      if (move.from.row === 0 && move.from.col === 0) newState.castlingRights.black.queen = false;
      if (move.from.row === 0 && move.from.col === 7) newState.castlingRights.black.king = false;
    }
  }

  if (capturePiece) {
    if (capturePiece.toLowerCase() === 'r') {
      if (opponent === 'white') {
        if (move.to.row === 7 && move.to.col === 0) newState.castlingRights.white.queen = false;
        if (move.to.row === 7 && move.to.col === 7) newState.castlingRights.white.king = false;
      } else {
        if (move.to.row === 0 && move.to.col === 0) newState.castlingRights.black.queen = false;
        if (move.to.row === 0 && move.to.col === 7) newState.castlingRights.black.king = false;
      }
    }
  }

  if (move.type === 'doublePawn' && move.enPassantTarget) {
    newState.enPassant = move.enPassantTarget;
  }

  if (isKingInCheck(board, opponent)) {
    newState.lastMove.resultedInCheck = true;
  }

  newState.moveHistory.push({ move: newState.lastMove, piece: movingPiece, captured: capturePiece || null });

  return newState;
}

function moveLeavesKingSafe(state, move, color) {
  const nextState = applyMove(state, move);
  return !isKingInCheck(nextState.board, color);
}

function getLegalMovesFrom(state, row, col) {
  const piece = state.board[row][col];
  if (!piece) return [];
  const color = getPieceColor(piece);
  const pseudoMoves = generatePseudoMoves(state, row, col);
  const legalMoves = [];

  for (const move of pseudoMoves) {
    if (move.type === 'castle') {
      if (!canCastle(state, move, color)) {
        continue;
      }
    }
    if (moveLeavesKingSafe(state, move, color)) {
      legalMoves.push(move);
    }
  }
  return legalMoves;
}

function canCastle(state, move, color) {
  const { row } = move.from;
  const board = state.board;
  const opponent = color === 'white' ? 'black' : 'white';
  const rook = board[move.rookFrom.row][move.rookFrom.col];
  if (!rook || rook.toLowerCase() !== 'r' || getPieceColor(rook) !== color) {
    return false;
  }
  const pathCols = move.to.col === 6 ? [4, 5, 6] : [4, 3, 2];
  for (const col of pathCols) {
    if (isSquareAttacked(board, row, col, opponent)) {
      return false;
    }
  }
  return true;
}

function getAllLegalMoves(state, color = state.turn) {
  const moves = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col];
      if (!piece || getPieceColor(piece) !== color) continue;
      const pseudoMoves = generatePseudoMoves(state, row, col);
      for (const move of pseudoMoves) {
        if (move.type === 'castle' && !canCastle(state, move, color)) {
          continue;
        }
        if (moveLeavesKingSafe(state, move, color)) {
          moves.push(move);
        }
      }
    }
  }
  return moves;
}

function evaluateBoard(state) {
  let score = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col];
      if (!piece) continue;
      const value = pieceValues[piece.toLowerCase()];
      const color = getPieceColor(piece);
      score += color === 'white' ? value : -value;
    }
  }
  return score;
}

function evaluateForColor(state, color) {
  const base = evaluateBoard(state);
  return color === 'white' ? base : -base;
}

const CHECKMATE_SCORE = 100000;

function minimax(state, depth, alpha, beta, maximizing, aiColor) {
  const currentColor = state.turn;
  const legalMoves = getAllLegalMoves(state, currentColor);

  if (depth === 0 || legalMoves.length === 0) {
    if (legalMoves.length === 0) {
      if (isKingInCheck(state.board, currentColor)) {
        const mateScore = CHECKMATE_SCORE - depth * 10;
        return currentColor === aiColor ? -mateScore : mateScore;
      }
      return 0;
    }
    return evaluateForColor(state, aiColor);
  }

  if (maximizing) {
    let best = -Infinity;
    for (const move of legalMoves) {
      const nextState = applyMove(state, move);
      const score = minimax(nextState, depth - 1, alpha, beta, false, aiColor);
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  let best = Infinity;
  for (const move of legalMoves) {
    const nextState = applyMove(state, move);
    const score = minimax(nextState, depth - 1, alpha, beta, true, aiColor);
    best = Math.min(best, score);
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

function pickAIMove(state) {
  const aiColor = state.aiColor;
  const depth = difficultyDepth[state.difficulty] ?? 2;
  const legalMoves = getAllLegalMoves(state, state.turn);
  if (legalMoves.length === 0) return null;

  let bestMove = null;
  let bestScore = state.turn === aiColor ? -Infinity : Infinity;

  for (const move of legalMoves) {
    const nextState = applyMove(state, move);
    const score = minimax(
      nextState,
      depth - 1,
      -Infinity,
      Infinity,
      nextState.turn === aiColor,
      aiColor
    );

    if (state.turn === aiColor) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }

  return bestMove;
}

function renderBoard(state) {
  const whiteKingInCheck = isKingInCheck(state.board, 'white');
  const blackKingInCheck = isKingInCheck(state.board, 'black');
  const lastMove = state.lastMove;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = getSquareElement(row, col);
      const piece = state.board[row][col];
      square.innerHTML = '';
      square.classList.remove('selected', 'legal-move', 'check', 'last-from', 'last-to');

      if (piece) {
        const pieceElement = createPieceElement(piece);
        if (lastMove && lastMove.to && lastMove.to.row === row && lastMove.to.col === col) {
          pieceElement.classList.add('piece-enter');
        }
        square.appendChild(pieceElement);
        square.setAttribute('aria-label', `Square ${toCoordinate(row, col)} with ${describePiece(piece)}`);
      } else {
        square.setAttribute('aria-label', `Square ${toCoordinate(row, col)}`);
      }

      if (state.selected && state.selected.row === row && state.selected.col === col) {
        square.classList.add('selected');
      }

      if (state.legalMoves.some((move) => move.to.row === row && move.to.col === col)) {
        square.classList.add('legal-move');
      }
    }
  }

  if (lastMove) {
    const { from, to } = lastMove;
    if (from) {
      const fromSquare = getSquareElement(from.row, from.col);
      fromSquare.classList.add('last-from');
    }
    if (to) {
      const toSquare = getSquareElement(to.row, to.col);
      toSquare.classList.add('last-to');
    }
  }

  if (whiteKingInCheck) {
    const king = findKingPosition(state.board, 'white');
    if (king) {
      getSquareElement(king.row, king.col).classList.add('check');
    }
  }

  if (blackKingInCheck) {
    const king = findKingPosition(state.board, 'black');
    if (king) {
      getSquareElement(king.row, king.col).classList.add('check');
    }
  }
}

function describePiece(piece) {
  if (!piece) return 'empty square';
  const color = getPieceColor(piece);
  const type = pieceTypeNames[piece.toLowerCase()];
  if (!color || !type) return 'empty square';
  return `${color} ${type}`;
}

function clearSelection() {
  gameState.selected = null;
  gameState.legalMoves = [];
}

function handleSquareClick(row, col) {
  if (!gameState) return;
  if (gameState.gameOver) return;
  if (isAITurn()) return;

  const piece = gameState.board[row][col];
  const color = getPieceColor(piece);

  if (gameState.selected) {
    const move = gameState.legalMoves.find(
      (m) => m.to.row === row && m.to.col === col
    );
    if (move) {
      gameState = applyMove(gameState, move);
      afterMoveUpdate();
      return;
    }
  }

  if (!piece || color !== gameState.turn) {
    clearSelection();
    renderBoard(gameState);
    return;
  }

  gameState.selected = { row, col };
  gameState.legalMoves = getLegalMovesFrom(gameState, row, col);
  renderBoard(gameState);
}

function updateStatus(state) {
  if (!state) return;
  const turnText = state.turn === 'white' ? 'White to move' : 'Black to move';
  turnIndicator.textContent = turnText;

  if (state.gameOver) {
    statusIndicator.textContent = state.winner
      ? `Checkmate! ${capitalize(state.winner)} wins.`
      : 'Draw by stalemate.';
    return;
  }

  const inCheck = isKingInCheck(state.board, state.turn);
  statusIndicator.textContent = inCheck ? 'Check!' : 'Game in progress';
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function evaluateEndConditions() {
  const currentColor = gameState.turn;
  const legalMoves = getAllLegalMoves(gameState, currentColor);

  if (legalMoves.length === 0) {
    if (isKingInCheck(gameState.board, currentColor)) {
      gameState.gameOver = true;
      gameState.winner = currentColor === 'white' ? 'black' : 'white';
    } else {
      gameState.gameOver = true;
      gameState.winner = null;
    }
  } else {
    gameState.gameOver = false;
    gameState.winner = null;
  }
}

function triggerMoveEffects(state) {
  if (!state.lastMove) return;
  const { captured, resultedInCheck } = state.lastMove;
  if (resultedInCheck) {
    playSoundCue('check');
  } else if (captured) {
    playSoundCue('capture');
  } else {
    playSoundCue('move');
  }
}

function afterMoveUpdate() {
  clearSelection();
  evaluateEndConditions();
  renderBoard(gameState);
  updateStatus(gameState);
  triggerMoveEffects(gameState);
  maybeTriggerAI();
}

function isAITurn() {
  if (!gameState) return false;
  if (gameState.mode === 'human') return false;
  return gameState.turn === gameState.aiColor;
}

function maybeTriggerAI() {
  if (!gameState) return;
  if (!isAITurn() || gameState.gameOver) return;
  setTimeout(() => {
    const move = pickAIMove(gameState);
    if (move) {
      gameState = applyMove(gameState, move);
      afterMoveUpdate();
    } else {
      evaluateEndConditions();
      updateStatus(gameState);
    }
  }, 200);
}

function startNewGame(options = {}) {
  const mode = options.mode || pendingSettings.mode;
  const difficulty = options.difficulty || pendingSettings.difficulty;
  pendingSettings = { mode, difficulty };
  applySettingsToGameUI();
  gameState = createInitialState({ mode, difficulty });
  clearSelection();
  renderBoard(gameState);
  updateStatus(gameState);
  maybeTriggerAI();
}

function setupUI() {
  boardElement = document.getElementById('chessboard');
  turnIndicator = document.getElementById('turn-indicator');
  statusIndicator = document.getElementById('game-status');
  menuScreen = document.getElementById('menu-screen');
  gameScreen = document.getElementById('game-screen');
  menuModeSelect = document.getElementById('menu-mode');
  menuDifficultyOptions = document.querySelectorAll('input[name="menu-difficulty"]');
  menuDifficultyGroup = document.getElementById('difficulty-menu-group');
  menuSoundToggle = document.getElementById('sound-toggle');
  inGameSoundToggle = document.getElementById('in-game-sound-toggle');
  playButton = document.getElementById('play-button');
  backToMenuButton = document.getElementById('back-to-menu');
  activeModeLabel = document.getElementById('active-mode');
  activeDifficultyLabel = document.getElementById('active-difficulty');
  sessionDifficultyWrapper = document.querySelector('.session-difficulty');
  leaderboardList = document.getElementById('leaderboard-list');
  menuSoundStatusLabel = document.querySelector('#menu-screen .sound-group .toggle-label');
  inGameSoundStatusLabel = document.querySelector('#game-screen .inline-toggle .toggle-label');
  newGameButton = document.getElementById('new-game');

  bindAudioUnlock();

  if (menuModeSelect) {
    menuModeSelect.addEventListener('change', () => {
      pendingSettings.mode = menuModeSelect.value;
      updateDifficultyVisibility();
      applySettingsToGameUI();
    });
  }

  if (menuDifficultyOptions) {
    menuDifficultyOptions.forEach((input) => {
      input.addEventListener('change', () => {
        pendingSettings.difficulty = getSelectedMenuDifficulty();
        applySettingsToGameUI();
      });
    });
  }

  if (menuSoundToggle) {
    menuSoundToggle.addEventListener('change', () => {
      setSoundEnabled(menuSoundToggle.checked);
    });
  }

  if (inGameSoundToggle) {
    inGameSoundToggle.addEventListener('change', () => {
      setSoundEnabled(inGameSoundToggle.checked);
    });
  }

  if (playButton) {
    playButton.addEventListener('click', () => {
      pendingSettings.mode = menuModeSelect ? menuModeSelect.value : pendingSettings.mode;
      pendingSettings.difficulty = getSelectedMenuDifficulty();
      setSoundEnabled(menuSoundToggle ? menuSoundToggle.checked : soundEnabled);
      applySettingsToGameUI();
      showGameScreen();
      startNewGame();
    });
  }

  if (backToMenuButton) {
    backToMenuButton.addEventListener('click', () => {
      showMenuScreen();
      statusIndicator.textContent = 'Select Play from the menu to begin.';
      turnIndicator.textContent = 'White to move';
    });
  }

  if (newGameButton) {
    newGameButton.addEventListener('click', () => {
      startNewGame();
    });
  }

  pendingSettings.mode = menuModeSelect ? menuModeSelect.value : pendingSettings.mode;
  pendingSettings.difficulty = getSelectedMenuDifficulty();
}

function init() {
  setupUI();
  buildBoard();
  renderLeaderboard();
  setMenuDifficulty(pendingSettings.difficulty);
  updateDifficultyVisibility();
  applySettingsToGameUI();
  setSoundEnabled(soundEnabled);
  showMenuScreen();
}

document.addEventListener('DOMContentLoaded', init);
