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

const boardThemes = {
  wood: { label: 'Walnut & Ivory' },
  metal: { label: 'Forged Steel' },
  glass: { label: 'Crystal Glass' }
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
let activeThemeLabel;
let sessionDifficultyWrapper;
let inGameSoundStatusLabel;
let inGameAnimationStatusLabel;
let menuThemeOptions;
let inGameThemeSelect;
let menuAnimationToggle;
let inGameAnimationToggle;
let victoryBanner;
let victoryMessage;
let checkAlertElement;
let checkAlertMessage;

let gameState = null;

let soundEnabled = true;
let animationsEnabled = true;
let currentTheme = null;
let pendingSettings = {
  mode: 'human',
  difficulty: 'normal',
  theme: 'wood'
};

let audioContext = null;
let audioUnlockBound = false;

const pieceSymbols = {
  p: { white: '♙', black: '♟' },
  r: { white: '♖', black: '♜' },
  n: { white: '♘', black: '♞' },
  b: { white: '♗', black: '♝' },
  q: { white: '♕', black: '♛' },
  k: { white: '♔', black: '♚' }
};

function getSelectedMenuDifficulty() {
  if (!menuDifficultyOptions || menuDifficultyOptions.length === 0) {
    return pendingSettings.difficulty;
  }
  const selected = Array.from(menuDifficultyOptions).find((input) => input.checked);
  return selected ? selected.value : pendingSettings.difficulty;
}

function getSelectedMenuTheme() {
  if (!menuThemeOptions || menuThemeOptions.length === 0) {
    return pendingSettings.theme;
  }
  const selected = Array.from(menuThemeOptions).find((input) => input.checked);
  return selected ? selected.value : pendingSettings.theme;
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

function setMenuThemeSelection(value) {
  if (!menuThemeOptions || menuThemeOptions.length === 0) return;
  let found = false;
  menuThemeOptions.forEach((input) => {
    const match = input.value === value;
    input.checked = match;
    if (match) {
      found = true;
    }
  });
  if (!found) {
    menuThemeOptions[0].checked = true;
  }
}

function getThemeLabel(themeKey) {
  const theme = boardThemes[themeKey] || boardThemes.wood;
  return theme ? theme.label : '';
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
  setMenuThemeSelection(pendingSettings.theme);
  if (activeModeLabel) {
    activeModeLabel.textContent = modeLabels[pendingSettings.mode] || modeLabels.human;
  }
  if (activeDifficultyLabel) {
    activeDifficultyLabel.textContent = formatDifficultyLabel(pendingSettings.difficulty);
  }
  if (activeThemeLabel) {
    activeThemeLabel.textContent = getThemeLabel(pendingSettings.theme);
  }
  if (inGameThemeSelect) {
    inGameThemeSelect.value = pendingSettings.theme;
  }
  updateDifficultyVisibility();
}

function updateSoundLabels() {
  if (menuSoundToggle) {
    menuSoundToggle.textContent = soundEnabled ? 'Sound On' : 'Sound Off';
    menuSoundToggle.setAttribute('aria-pressed', soundEnabled ? 'true' : 'false');
    menuSoundToggle.classList.toggle('active', soundEnabled);
  }
  if (inGameSoundStatusLabel) {
    inGameSoundStatusLabel.textContent = soundEnabled ? 'Sound On' : 'Sound Off';
  }
}

function updateAnimationLabels() {
  if (menuAnimationToggle) {
    menuAnimationToggle.textContent = animationsEnabled ? 'FX On' : 'FX Off';
    menuAnimationToggle.setAttribute('aria-pressed', animationsEnabled ? 'true' : 'false');
    menuAnimationToggle.classList.toggle('active', animationsEnabled);
  }
  if (inGameAnimationStatusLabel) {
    inGameAnimationStatusLabel.textContent = animationsEnabled ? 'FX On' : 'FX Off';
  }
}

function setSoundEnabled(enabled) {
  soundEnabled = !!enabled;
  if (inGameSoundToggle) {
    inGameSoundToggle.checked = soundEnabled;
  }
  updateSoundLabels();
  if (soundEnabled) {
    bindAudioUnlock();
  }
}

function setAnimationsEnabled(enabled) {
  animationsEnabled = !!enabled;
  if (inGameAnimationToggle) {
    inGameAnimationToggle.checked = animationsEnabled;
  }
  updateAnimationLabels();
  if (!animationsEnabled && squareElements.length) {
    squareElements.forEach((square) => square.classList.remove('capture-flash'));
  }
  if (!animationsEnabled && boardElement) {
    boardElement.classList.remove('board-shake');
    boardElement.querySelectorAll('.move-ghost').forEach((ghost) => ghost.remove());
  }
}

function applyThemeToDocument(themeKey) {
  const key = boardThemes[themeKey] ? themeKey : 'wood';
  if (currentTheme !== key) {
    const body = document.body;
    if (body) {
      Object.keys(boardThemes).forEach((theme) => body.classList.remove(`theme-${theme}`));
      body.classList.add(`theme-${key}`);
    }
    currentTheme = key;
  }
  if (boardElement) {
    boardElement.dataset.theme = key;
  }
  return key;
}

function setThemePreference(themeKey, options = {}) {
  const normalized = boardThemes[themeKey] ? themeKey : 'wood';
  pendingSettings.theme = normalized;
  applyThemeToDocument(normalized);
  if (options.updateUI !== false) {
    applySettingsToGameUI();
  }
  if (options.applyToGame !== false && gameState) {
    gameState.theme = normalized;
    renderBoard(gameState);
  }
}

function showMenuScreen() {
  if (menuScreen) {
    menuScreen.classList.remove('hidden');
  }
  if (gameScreen) {
    gameScreen.classList.add('hidden');
  }
  hideVictoryBanner();
  hideCheckAlert();
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
  const { mode = 'human', difficulty = 'normal', theme = pendingSettings.theme || 'wood' } = options;
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
    theme,
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
  const symbolMap = pieceSymbols[pieceType];
  if (symbolMap && color) {
    const span = document.createElement('span');
    span.className = 'piece-symbol';
    span.textContent = symbolMap[color];
    element.appendChild(span);
  }
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
      resultedInCheck: false,
      checkColor: null
    },
    mode: state.mode,
    aiColor: state.aiColor,
    difficulty: state.difficulty,
    theme: state.theme,
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
    newState.lastMove.checkColor = opponent;
  } else {
    newState.lastMove.checkColor = null;
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
  if (!state || !boardElement) return;
  const themeKey = state.theme || pendingSettings.theme || currentTheme || 'wood';
  applyThemeToDocument(themeKey);
  const whiteKingInCheck = isKingInCheck(state.board, 'white');
  const blackKingInCheck = isKingInCheck(state.board, 'black');
  const lastMove = state.lastMove;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = getSquareElement(row, col);
      const piece = state.board[row][col];
      square.innerHTML = '';
      square.classList.remove('selected', 'legal-move', 'check', 'last-from', 'last-to', 'capture-flash');

      if (piece) {
        const pieceElement = createPieceElement(piece);
        if (animationsEnabled && lastMove && lastMove.to && lastMove.to.row === row && lastMove.to.col === col) {
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

function showVictoryBanner(message) {
  if (!victoryBanner || !victoryMessage) return;
  victoryMessage.textContent = message;
  victoryBanner.classList.remove('hidden');
}

function hideVictoryBanner() {
  if (!victoryBanner || !victoryMessage) return;
  victoryMessage.textContent = '';
  if (!victoryBanner.classList.contains('hidden')) {
    victoryBanner.classList.add('hidden');
  }
}

function showCheckAlert(color) {
  if (!checkAlertElement || !checkAlertMessage) return;
  let message;
  if (color === 'white' || color === 'black') {
    message = `Check! ${capitalize(color)} king is under attack.`;
  } else if (color === 'both') {
    message = 'Check! Both kings are under attack.';
  } else {
    message = 'Check!';
  }
  checkAlertMessage.textContent = message;
  checkAlertElement.setAttribute('aria-hidden', 'false');
  checkAlertElement.classList.remove('is-visible');
  void checkAlertElement.offsetWidth;
  checkAlertElement.classList.add('is-visible');
}

function hideCheckAlert() {
  if (!checkAlertElement) return;
  checkAlertElement.classList.remove('is-visible');
  checkAlertElement.setAttribute('aria-hidden', 'true');
  if (checkAlertMessage) {
    checkAlertMessage.textContent = '';
  }
}

function updateCheckAlert(state, whiteCheck, blackCheck) {
  if (!checkAlertElement) return;
  if (!state || state.gameOver) {
    hideCheckAlert();
    return;
  }

  const whiteInCheck = typeof whiteCheck === 'boolean' ? whiteCheck : isKingInCheck(state.board, 'white');
  const blackInCheck = typeof blackCheck === 'boolean' ? blackCheck : isKingInCheck(state.board, 'black');

  if (whiteInCheck && blackInCheck) {
    showCheckAlert('both');
    return;
  }

  if (whiteInCheck) {
    showCheckAlert('white');
    return;
  }

  if (blackInCheck) {
    showCheckAlert('black');
    return;
  }

  hideCheckAlert();
}

function updateStatus(state) {
  if (!state) return;
  const turnText = state.turn === 'white' ? 'White to move' : 'Black to move';
  turnIndicator.textContent = turnText;

  if (state.gameOver) {
    const message = state.winner
      ? `Checkmate! ${capitalize(state.winner)} wins.`
      : 'Draw by stalemate.';
    statusIndicator.textContent = message;
    if (state.winner) {
      showVictoryBanner(message);
    } else {
      hideVictoryBanner();
    }
    hideCheckAlert();
    return;
  }

  hideVictoryBanner();
  const whiteInCheck = isKingInCheck(state.board, 'white');
  const blackInCheck = isKingInCheck(state.board, 'black');

  if (whiteInCheck && blackInCheck) {
    statusIndicator.textContent = 'Check! Both kings are under attack.';
  } else if (whiteInCheck) {
    statusIndicator.textContent = 'Check! White king is under attack.';
  } else if (blackInCheck) {
    statusIndicator.textContent = 'Check! Black king is under attack.';
  } else {
    statusIndicator.textContent = 'Game in progress';
  }

  updateCheckAlert(state, whiteInCheck, blackInCheck);
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

function triggerMoveAnimations(state) {
  if (!animationsEnabled || !state || !state.lastMove || !boardElement) return;
  const { from, to, movingPiece, promotion, captured } = state.lastMove;
  if (!from || !to) return;
  const fromSquare = getSquareElement(from.row, from.col);
  const toSquare = getSquareElement(to.row, to.col);
  if (!fromSquare || !toSquare) return;
  const boardRect = boardElement.getBoundingClientRect();
  const fromRect = fromSquare.getBoundingClientRect();
  const toRect = toSquare.getBoundingClientRect();
  if (!fromRect.width || !toRect.width) return;

  const ghostContainer = document.createElement('div');
  ghostContainer.className = 'move-ghost';

  const boardPiece = state.board[to.row][to.col];
  const pieceForGhost = boardPiece || promotion || movingPiece;
  const ghostPiece = createPieceElement(pieceForGhost);
  ghostPiece.classList.remove('piece-enter');
  ghostPiece.setAttribute('aria-hidden', 'true');
  ghostContainer.appendChild(ghostPiece);

  const squareWidth = fromRect.width;
  const squareHeight = fromRect.height;
  ghostContainer.style.width = `${squareWidth}px`;
  ghostContainer.style.height = `${squareHeight}px`;

  const startX = fromRect.left - boardRect.left;
  const startY = fromRect.top - boardRect.top;
  const endX = toRect.left - boardRect.left;
  const endY = toRect.top - boardRect.top;

  ghostContainer.style.transform = `translate3d(${startX}px, ${startY}px, 0)`;
  boardElement.appendChild(ghostContainer);

  requestAnimationFrame(() => {
    ghostContainer.style.transform = `translate3d(${endX}px, ${endY}px, 0)`;
  });

  const finalize = () => {
    ghostContainer.classList.add('fade-out');
    ghostContainer.addEventListener(
      'transitionend',
      () => {
        ghostContainer.remove();
      },
      { once: true }
    );
  };

  ghostContainer.addEventListener('transitionend', finalize, { once: true });

  if (captured) {
    toSquare.classList.add('capture-flash');
    boardElement.classList.add('board-shake');
    setTimeout(() => {
      toSquare.classList.remove('capture-flash');
      boardElement.classList.remove('board-shake');
    }, 280);
  }
}

function triggerMoveEffects(state) {
  if (!state.lastMove) return;
  triggerMoveAnimations(state);
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
  const theme = options.theme || pendingSettings.theme;
  pendingSettings.mode = mode;
  pendingSettings.difficulty = difficulty;
  pendingSettings.theme = theme;
  applySettingsToGameUI();
  applyThemeToDocument(theme);
  gameState = createInitialState({ mode, difficulty, theme });
  clearSelection();
  hideVictoryBanner();
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
  menuThemeOptions = document.querySelectorAll('input[name="menu-theme"]');
  menuSoundToggle = document.getElementById('sound-toggle');
  menuAnimationToggle = document.getElementById('animation-toggle');
  inGameSoundToggle = document.getElementById('in-game-sound-toggle');
  inGameAnimationToggle = document.getElementById('in-game-animation-toggle');
  inGameThemeSelect = document.getElementById('in-game-theme');
  playButton = document.getElementById('play-button');
  backToMenuButton = document.getElementById('back-to-menu');
  activeModeLabel = document.getElementById('active-mode');
  activeDifficultyLabel = document.getElementById('active-difficulty');
  activeThemeLabel = document.getElementById('active-theme');
  sessionDifficultyWrapper = document.querySelector('.session-difficulty');
  inGameSoundStatusLabel = document.getElementById('game-sound-status');
  inGameAnimationStatusLabel = document.getElementById('game-animation-status');
  newGameButton = document.getElementById('new-game');
  victoryBanner = document.getElementById('victory-banner');
  victoryMessage = document.getElementById('victory-message');
  checkAlertElement = document.getElementById('check-alert');
  checkAlertMessage = document.getElementById('check-message');

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

  if (menuThemeOptions) {
    menuThemeOptions.forEach((input) => {
      input.addEventListener('change', () => {
        setThemePreference(input.value);
      });
    });
  }

  if (menuSoundToggle) {
    menuSoundToggle.addEventListener('click', () => {
      setSoundEnabled(!soundEnabled);
    });
  }

  if (menuAnimationToggle) {
    menuAnimationToggle.addEventListener('click', () => {
      setAnimationsEnabled(!animationsEnabled);
    });
  }

  if (inGameSoundToggle) {
    inGameSoundToggle.addEventListener('change', () => {
      setSoundEnabled(inGameSoundToggle.checked);
    });
  }

  if (inGameAnimationToggle) {
    inGameAnimationToggle.addEventListener('change', () => {
      setAnimationsEnabled(inGameAnimationToggle.checked);
    });
  }

  if (inGameThemeSelect) {
    inGameThemeSelect.addEventListener('change', () => {
      setThemePreference(inGameThemeSelect.value);
    });
  }

  if (playButton) {
    playButton.addEventListener('click', () => {
      const selectedMode = menuModeSelect ? menuModeSelect.value : pendingSettings.mode;
      const selectedDifficulty = getSelectedMenuDifficulty();
      const selectedTheme = getSelectedMenuTheme();

      pendingSettings.mode = selectedMode;
      pendingSettings.difficulty = selectedDifficulty;
      pendingSettings.theme = selectedTheme;

      setSoundEnabled(soundEnabled);
      setAnimationsEnabled(animationsEnabled);
      applySettingsToGameUI();
      showGameScreen();
      startNewGame({ mode: selectedMode, difficulty: selectedDifficulty, theme: selectedTheme });
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
  pendingSettings.theme = getSelectedMenuTheme();
  hideVictoryBanner();
}

function init() {
  setupUI();
  applyThemeToDocument(pendingSettings.theme);
  buildBoard();
  setMenuDifficulty(pendingSettings.difficulty);
  updateDifficultyVisibility();
  applySettingsToGameUI();
  setSoundEnabled(soundEnabled);
  setAnimationsEnabled(animationsEnabled);
  showMenuScreen();
}

document.addEventListener('DOMContentLoaded', init);
