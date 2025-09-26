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

const pieceLabels = {
  k: 'K',
  q: 'Q',
  r: 'R',
  b: 'B',
  n: 'N',
  p: 'P'
};

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

let boardElement;
let squareElements = [];
let turnIndicator;
let statusIndicator;
let modeSelect;
let difficultySelect;
let newGameButton;

let gameState = null;

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
  const label = pieceLabels[pieceType] || '';
  const color = getPieceColor(piece);
  const element = document.createElement('div');
  element.classList.add('piece');

  if (color) {
    element.classList.add(color);
  }

  element.classList.add(`piece-${pieceType}`);
  element.textContent = label;
  element.setAttribute('aria-hidden', 'true');

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
    lastMove: move,
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

  const capturedPiece = state.board[move.to.row][move.to.col];
  if (capturedPiece) {
    if (capturedPiece.toLowerCase() === 'r') {
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

  newState.moveHistory.push({ move, piece: movingPiece });

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

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = getSquareElement(row, col);
      const piece = state.board[row][col];
      square.innerHTML = '';
      square.classList.remove('selected', 'legal-move', 'check');

      if (piece) {
        const pieceElement = createPieceElement(piece);
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
  const color = getPieceColor(piece);
  const typeMap = {
    k: 'king',
    q: 'queen',
    r: 'rook',
    b: 'bishop',
    n: 'knight',
    p: 'pawn'
  };
  const type = typeMap[piece.toLowerCase()];
  return `${color} ${type}`;
}

function clearSelection() {
  gameState.selected = null;
  gameState.legalMoves = [];
}

function handleSquareClick(row, col) {
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

function afterMoveUpdate() {
  clearSelection();
  evaluateEndConditions();
  renderBoard(gameState);
  updateStatus(gameState);
  maybeTriggerAI();
}

function isAITurn() {
  if (gameState.mode === 'human') return false;
  return gameState.turn === gameState.aiColor;
}

function maybeTriggerAI() {
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

function startNewGame() {
  const mode = modeSelect.value;
  const difficulty = difficultySelect.value;
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
  modeSelect = document.getElementById('mode-select');
  difficultySelect = document.getElementById('difficulty-select');
  newGameButton = document.getElementById('new-game');

  modeSelect.addEventListener('change', () => {
    gameState.mode = modeSelect.value;
    gameState.aiColor = gameState.mode === 'ai-white' ? 'black' : gameState.mode === 'ai-black' ? 'white' : null;
    startNewGame();
  });

  difficultySelect.addEventListener('change', () => {
    gameState.difficulty = difficultySelect.value;
  });

  newGameButton.addEventListener('click', () => {
    startNewGame();
  });
}

function init() {
  setupUI();
  buildBoard();
  gameState = createInitialState({ mode: modeSelect.value, difficulty: difficultySelect.value });
  renderBoard(gameState);
  updateStatus(gameState);
  maybeTriggerAI();
}

document.addEventListener('DOMContentLoaded', init);
