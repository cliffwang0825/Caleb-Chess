const startingPosition = [
  ["black-rook", "black-knight", "black-bishop", "black-queen", "black-king", "black-bishop", "black-knight", "black-rook"],
  Array(8).fill("black-pawn"),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill("white-pawn"),
  ["white-rook", "white-knight", "white-bishop", "white-queen", "white-king", "white-bishop", "white-knight", "white-rook"],
];

const pieceNames = {
  "white-king": "白王",
  "white-queen": "白后",
  "white-rook": "白車",
  "white-bishop": "白象",
  "white-knight": "白馬",
  "white-pawn": "白兵",
  "black-king": "黑王",
  "black-queen": "黑后",
  "black-rook": "黑車",
  "black-bishop": "黑象",
  "black-knight": "黑馬",
  "black-pawn": "黑兵",
};

const board = document.getElementById("chessboard");

startingPosition.forEach((row, rankIdx) => {
  row.forEach((piece, fileIdx) => {
    const square = document.createElement("div");
    square.className = `square ${((rankIdx + fileIdx) % 2 === 0 ? "light" : "dark")}`;
    square.setAttribute("role", "gridcell");
    square.setAttribute("data-square", `${String.fromCharCode(97 + fileIdx)}${8 - rankIdx}`);

    if (piece) {
      const pieceEl = document.createElement("div");
      pieceEl.className = `piece ${piece}`;
      pieceEl.setAttribute("role", "img");
      pieceEl.setAttribute("aria-label", pieceNames[piece]);
      square.appendChild(pieceEl);
    }

    board.appendChild(square);
  });
});
