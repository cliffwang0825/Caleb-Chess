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

const pieceSymbols = {
  k: '\u265A',
  q: '\u265B',
  r: '\u265C',
  b: '\u265D',
  n: '\u265E',
  p: '\u265F',
  K: '\u2654',
  Q: '\u2655',
  R: '\u2656',
  B: '\u2657',
  N: '\u2658',
  P: '\u2659'
};

function createSquare(rankIndex, fileIndex) {
  const square = document.createElement('div');
  square.classList.add('square');

  const isDark = (rankIndex + fileIndex) % 2 === 1;
  square.classList.add(isDark ? 'dark' : 'light');

  const coordinate = `${files[fileIndex]}${ranks[rankIndex]}`;
  square.dataset.coordinate = coordinate;

  const piece = initialBoard[rankIndex][fileIndex];
  if (piece) {
    const span = document.createElement('span');
    span.classList.add('piece');
    span.textContent = pieceSymbols[piece];
    square.appendChild(span);
  }

  square.setAttribute('role', 'gridcell');
  square.setAttribute('aria-label', `Square ${coordinate}${piece ? ` with ${describePiece(piece)}` : ''}`);

  return square;
}

function describePiece(piece) {
  const color = piece === piece.toUpperCase() ? 'white' : 'black';
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

function buildBoard() {
  const boardElement = document.getElementById('chessboard');

  ranks.forEach((rank, rankIndex) => {
    files.forEach((file, fileIndex) => {
      const square = createSquare(rankIndex, fileIndex);
      boardElement.appendChild(square);
    });
  });
}

document.addEventListener('DOMContentLoaded', buildBoard);
