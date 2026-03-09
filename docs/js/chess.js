// Chess implementation replacing Reversi
// Board representation: 8x8 array, values: 0 empty, positive white, negative black
// Piece types: 1=pawn, 2=knight, 3=bishop, 4=rook, 5=queen, 6=king

// Constants
const EMPTY = 0;
const PAWN = 1, KNIGHT = 2, BISHOP = 3, ROOK = 4, QUEEN = 5, KING = 6;
const WHITE = 1, BLACK = -1;

// Emoji mapping (white and black chess symbols)
const PIECE_EMOJI = {
  [WHITE * PAWN]: '♙',   // white pawn
  [WHITE * KNIGHT]: '♘',
  [WHITE * BISHOP]: '♗',
  [WHITE * ROOK]: '♖',
  [WHITE * QUEEN]: '♕',
  [WHITE * KING]: '♔',
  [BLACK * PAWN]: '♟',   // black pawn
  [BLACK * KNIGHT]: '♞',
  [BLACK * BISHOP]: '♝',
  [BLACK * ROOK]: '♜',
  [BLACK * QUEEN]: '♛',
  [BLACK * KING]: '♚',
  [EMPTY]: ' '            // empty square (space)
};

// Piece-square tables for evaluation (from white's perspective, positive good for white)
const PIECE_SQUARE_TABLES = {
  [PAWN]: [
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5,  5, 10, 25, 25, 10,  5,  5,
    0,  0,  0, 20, 20,  0,  0,  0,
    5, -5,-10,  0,  0,-10, -5,  5,
    5, 10, 10,-20,-20, 10, 10,  5,
    0,  0,  0,  0,  0,  0,  0,  0
  ],
  [KNIGHT]: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
  ],
  [BISHOP]: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20
  ],
  [ROOK]: [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
  ],
  [QUEEN]: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
    -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
  ],
  [KING]: [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
    20, 20,  0,  0,  0,  0, 20, 20,
    20, 30, 10,  0,  0, 10, 30, 20
  ]
};

// Material values
const MATERIAL = {
  [PAWN]: 100,
  [KNIGHT]: 320,
  [BISHOP]: 330,
  [ROOK]: 500,
  [QUEEN]: 900,
  [KING]: 20000
};

// Helper to get piece type and color
function pieceType(piece) { return Math.abs(piece); }
function pieceColor(piece) { return piece > 0 ? WHITE : (piece < 0 ? BLACK : 0); }

// ChessBoard class
class ChessBoard {
  constructor(orig) {
    if (!orig) {
      // Initial board setup
      this.board = Array(8).fill().map(() => Array(8).fill(EMPTY));
      // Place white pieces (row 7 and 6, since top-left is a8)
      // row 0: a8 (top) black pieces, row 7: a1 white pieces
      // White back rank at row 7, pawns at row 6
      // Black back rank at row 0, pawns at row 1
      this.board[7] = [ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK].map(p => WHITE * p);
      this.board[6] = Array(8).fill(WHITE * PAWN);
      this.board[1] = Array(8).fill(BLACK * PAWN);
      this.board[0] = [ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK].map(p => BLACK * p);

      this.whoseMove = WHITE;  // White to move
      this.computerIs = WHITE; // Computer plays black by default
    } else {
      this.board = orig.board.map(row => [...row]);
      this.whoseMove = orig.whoseMove;
      this.computerIs = orig.computerIs;
    }
  }

  // Get piece at [x, y] (x file, y rank, 0-based from top-left)
  state([x, y]) {
    return this.board[y][x];
  }

  setState([x, y], val) {
    this.board[y][x] = val;
  }

  sameAs(other) {
    if (this.whoseMove !== other.whoseMove || this.computerIs !== other.computerIs) return false;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (this.board[y][x] !== other.board[y][x]) return false;
      }
    }
    return true;
  }

  // Apply a move (assumed legal) and switch turn
  doMove(move) {
    if (move.length === 0) { // pass equivalent? In chess we treat as resign? But we'll handle separately
      this.pass();
      return true;
    }
    const [fx, fy, tx, ty, promotion] = move;
    const piece = this.state([fx, fy]);
    if (piece === EMPTY) return false;
    // Capture is automatic
    this.setState([fx, fy], EMPTY);
    // Pawn promotion: default to queen
    let newPiece = piece;
    if (pieceType(piece) === PAWN && (ty === 0 || ty === 7)) {
      const prom = promotion || QUEEN;
      newPiece = (pieceColor(piece) === WHITE ? WHITE : BLACK) * prom;
    }
    this.setState([tx, ty], newPiece);
    this.whoseMove = -this.whoseMove;
    return true;
  }

  pass() {
    // In chess, pass is not a legal move, but we use it to resign or new game.
    // We'll treat it as switching turn only if no legal moves? Actually handled elsewhere.
    this.whoseMove = -this.whoseMove;
  }

  // Generate all pseudo-legal moves for a given color (without checking if leave king in check)
  pseudoLegalMoves(color) {
    const moves = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const piece = this.board[y][x];
        if (pieceColor(piece) !== color) continue;
        const type = pieceType(piece);
        switch (type) {
          case PAWN: this.addPawnMoves(x, y, color, moves); break;
          case KNIGHT: this.addKnightMoves(x, y, color, moves); break;
          case BISHOP: this.addSlidingMoves(x, y, color, moves, [[1,1],[1,-1],[-1,1],[-1,-1]]); break;
          case ROOK: this.addSlidingMoves(x, y, color, moves, [[1,0],[-1,0],[0,1],[0,-1]]); break;
          case QUEEN: this.addSlidingMoves(x, y, color, moves, [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]]); break;
          case KING: this.addKingMoves(x, y, color, moves); break;
        }
      }
    }
    return moves;
  }

  addPawnMoves(x, y, color, moves) {
    const dir = color === WHITE ? -1 : 1; // white moves up (decreasing y), black moves down
    const startRow = color === WHITE ? 6 : 1;
    const promoteRow = color === WHITE ? 0 : 7;
    // One step forward
    let nx = x, ny = y + dir;
    if (ny >= 0 && ny < 8 && this.board[ny][nx] === EMPTY) {
      if (ny === promoteRow) {
        // Promotion to queen, rook, bishop, knight
        [QUEEN, ROOK, BISHOP, KNIGHT].forEach(p => moves.push([x, y, nx, ny, p]));
      } else {
        moves.push([x, y, nx, ny]);
      }
      // Two steps from start
      if (y === startRow) {
        ny = y + 2 * dir;
        if (this.board[ny][nx] === EMPTY) {
          moves.push([x, y, nx, ny]);
        }
      }
    }
    // Captures
    const captureDirs = [[-1, dir], [1, dir]];
    captureDirs.forEach(([dx, dy]) => {
      nx = x + dx; ny = y + dy;
      if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
        const target = this.board[ny][nx];
        if (target !== EMPTY && pieceColor(target) === -color) {
          if (ny === promoteRow) {
            [QUEEN, ROOK, BISHOP, KNIGHT].forEach(p => moves.push([x, y, nx, ny, p]));
          } else {
            moves.push([x, y, nx, ny]);
          }
        }
      }
    });
    // En passant not implemented for simplicity
  }

  addKnightMoves(x, y, color, moves) {
    const deltas = [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
    deltas.forEach(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
        const target = this.board[ny][nx];
        if (target === EMPTY || pieceColor(target) !== color) {
          moves.push([x, y, nx, ny]);
        }
      }
    });
  }

  addSlidingMoves(x, y, color, moves, directions) {
    directions.forEach(([dx, dy]) => {
      let nx = x + dx, ny = y + dy;
      while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
        const target = this.board[ny][nx];
        if (target === EMPTY) {
          moves.push([x, y, nx, ny]);
        } else {
          if (pieceColor(target) !== color) {
            moves.push([x, y, nx, ny]);
          }
          break;
        }
        nx += dx; ny += dy;
      }
    });
  }

  addKingMoves(x, y, color, moves) {
    const deltas = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
    deltas.forEach(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
        const target = this.board[ny][nx];
        if (target === EMPTY || pieceColor(target) !== color) {
          moves.push([x, y, nx, ny]);
        }
      }
    });
    // Castling not implemented
  }

  // Check if the king of given color is in check
  isCheck(color) {
    // Find king position
    let kingX, kingY;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const p = this.board[y][x];
        if (pieceType(p) === KING && pieceColor(p) === color) {
          kingX = x; kingY = y;
          break;
        }
      }
    }
    // Check if any opponent piece attacks the king
    const opponent = -color;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const p = this.board[y][x];
        if (pieceColor(p) !== opponent) continue;
        const moves = this.pseudoLegalMovesForPiece(x, y, opponent, true); // without check validation to avoid recursion
        for (const move of moves) {
          if (move[2] === kingX && move[3] === kingY) return true;
        }
      }
    }
    return false;
  }

  // Pseudo-legal moves for a specific piece (used for attack detection)
  pseudoLegalMovesForPiece(x, y, color, ignoreCheck = true) {
    const piece = this.board[y][x];
    const type = pieceType(piece);
    const moves = [];
    switch (type) {
      case PAWN: this.addPawnMoves(x, y, color, moves); break;
      case KNIGHT: this.addKnightMoves(x, y, color, moves); break;
      case BISHOP: this.addSlidingMoves(x, y, color, moves, [[1,1],[1,-1],[-1,1],[-1,-1]]); break;
      case ROOK: this.addSlidingMoves(x, y, color, moves, [[1,0],[-1,0],[0,1],[0,-1]]); break;
      case QUEEN: this.addSlidingMoves(x, y, color, moves, [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]]); break;
      case KING: this.addKingMoves(x, y, color, moves); break;
    }
    return moves;
  }

  // Legal moves (pseudo-legal and not leaving king in check)
  legalMoves(color) {
    const pseudo = this.pseudoLegalMoves(color);
    const legal = [];
    for (const move of pseudo) {
      const newBoard = this.makeMove(move);
      if (!newBoard.isCheck(color)) {
        legal.push(move);
      }
    }
    return legal;
  }

  // Return a new board after applying move (assumes move is pseudo-legal)
  makeMove(move) {
    const newBoard = new ChessBoard(this);
    newBoard.doMove(move);
    return newBoard;
  }

  // Check if the current player has no legal moves
  hasNoMoves() {
    return this.legalMoves(this.whoseMove).length === 0;
  }

  // Evaluation from white's perspective (positive = white advantage)
  evaluate() {
    let score = 0;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const piece = this.board[y][x];
        if (piece === EMPTY) continue;
        const type = pieceType(piece);
        const color = pieceColor(piece);
        const material = MATERIAL[type];
        const squareIdx = y * 8 + x; // 0-based from top-left
        let positional = PIECE_SQUARE_TABLES[type][squareIdx];
        // For black, we need to flip the table (since tables are from white's perspective)
        if (color === BLACK) {
          // Flip vertically (mirror rank)
          const flippedIdx = (7 - y) * 8 + x;
          positional = PIECE_SQUARE_TABLES[type][flippedIdx];
          // Also positional bonus is from black's perspective, so subtract for white
          positional = -positional;
        }
        score += (material + positional) * (color === WHITE ? 1 : -1);
      }
    }
    return score;
  }

  // For compatibility with AI search: score() returns evaluation from white's perspective.
  score() {
    return this.evaluate();
  }

  // Generate ordered best moves for AI, with optional promote (first move to consider)
  bestMoves(promote) {
    const moves = this.legalMoves(this.whoseMove);
    if (moves.length === 0) return [[]]; // pass-like

    // If promote is given, put that move first
    let result = [];
    if (promote) {
      const idx = moves.findIndex(m => m[0]===promote[0] && m[1]===promote[1] && m[2]===promote[2] && m[3]===promote[3]);
      if (idx >= 0) {
        result.push(moves[idx]);
        moves.splice(idx, 1);
      }
    }

    // Sort remaining moves by simple heuristic: captures first, then by piece-square value
    moves.sort((a, b) => {
      const scoreA = this.moveHeuristic(a);
      const scoreB = this.moveHeuristic(b);
      return scoreB - scoreA;
    });
    result = result.concat(moves);
    return result;
  }

  moveHeuristic(move) {
    const [fx, fy, tx, ty] = move;
    const target = this.board[ty][tx];
    if (target !== EMPTY) {
      // Capturing: value of captured piece minus value of moving piece (rough)
      return MATERIAL[pieceType(target)] * 10 - MATERIAL[pieceType(this.board[fy][fx])];
    }
    // Otherwise use positional bonus
    const piece = this.board[fy][fx];
    const type = pieceType(piece);
    const squareIdx = ty * 8 + tx;
    let pos = PIECE_SQUARE_TABLES[type][squareIdx];
    if (pieceColor(piece) === BLACK) {
      const flippedIdx = (7 - ty) * 8 + tx;
      pos = -PIECE_SQUARE_TABLES[type][flippedIdx];
    }
    return pos;
  }

  // Count pieces (for UI)
  countPieces() {
    let white = 0, black = 0;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const p = this.board[y][x];
        if (p > 0) white++;
        else if (p < 0) black++;
      }
    }
    return [white, black, 64 - white - black];
  }
}

// ----------------------------------------------------------------------
// AI search classes (adapted from Reversi but using ChessBoard)
// ----------------------------------------------------------------------

class Node {
  constructor(board, depth, move, adverse, first) {
    this.move = move;
    this.board = new ChessBoard(board);
    if (move && move.length > 0) this.board.doMove(move);
    this.depth = depth;
    const promote = first?.length ? first.shift() : null;
    this.first = first;
    this.childMoves = depth <= 0 ? [] : this.board.bestMoves(promote);
    this.adverse = adverse;
    this.best = depth === 0 ? this.board.score() : null;
    this.bestSeq = null;
  }

  advanceDepth() {
    this.depth++;
    this.first = this.bestSeq;
    this.childMoves = this.board.bestMoves(this.first?.shift());
    this.best = null;
  }

  nextChild() {
    if (!this.childMoves.length) return null;
    const move = this.childMoves.shift();
    return new Node(this.board, this.depth - 1, move, this.best, this.first);
  }

  better(s1, s2) {
    if (s1 === null) return false;
    if (s2 === null) return true;
    // Since score() returns from white perspective, we want higher for white's turn, lower for black's
    return this.board.whoseMove === WHITE ? s1 > s2 : s1 < s2;
  }

  finishChild(move, score, seq) {
    if (this.better(score, this.best)) {
      this.best = score;
      this.bestSeq = [move, ...(seq || [])];
      if (this.adverse !== null && !this.better(this.adverse, score)) {
        this.childMoves.length = 0; // prune
      }
    }
  }

  stalemate() {
    if (!this.bestSeq || this.bestSeq.length < 2) return false;
    const last = this.bestSeq[this.bestSeq.length - 1];
    const secondLast = this.bestSeq[this.bestSeq.length - 2];
    return last.length === 0 && secondLast.length === 0;
  }
}

class SearchStack {
  constructor(board, choice) {
    this.stack = [new Node(board, 2, choice, null, null)];
    this.bestMove = this.stack[0].childMoves[0];
    this.bestDepth = 1;
  }

  advance() {
    if (!this.stack.length) return false;
    const n = this.stack[this.stack.length - 1];
    const c = n.nextChild();
    if (c) {
      this.stack.push(c);
    } else {
      this.stack.pop();
      if (this.stack.length) {
        this.stack[this.stack.length - 1].finishChild(n.move, n.best, n.bestSeq);
      } else {
        this.bestMove = n.bestSeq ? n.bestSeq[0] : [];
        this.bestDepth = n.depth;
        if (!n.stalemate() && n.best < 10000 && n.best > -10000) {
          n.advanceDepth();
          this.stack.push(n);
        } else {
          return false;
        }
      }
    }
    return true;
  }

  getBestMove() {
    return this.stack.length && this.stack[0].bestMove ? this.stack[0].bestMove : this.bestMove;
  }

  sameAs(b) {
    return this.stack.length && this.stack[0].board.sameAs(b);
  }
}

class SearchSpace {
  constructor() {
    this.stacks = [];
    this.currentStack = 0;
  }

  setBoard(board) {
    if (board.whoseMove === board.computerIs) {
      let newStack = this.stacks.find(s => s.sameAs(board));
      if (!newStack) {
        newStack = new SearchStack(board, null);
      } else {
        log(`Starting at depth ${newStack.bestDepth}`);
      }
      this.stacks = [newStack];
    } else {
      // For human turn, we still might precompute? Not needed.
      this.stacks = [];
    }
    this.currentStack = 0;
  }

  advance(iterations) {
    if (!this.stacks.length) return false;
    let finished = 0;
    while (iterations > 0) {
      const stack = this.stacks[this.currentStack++];
      if (this.currentStack >= this.stacks.length) this.currentStack = 0;
      while (iterations > 0) {
        if (!stack.advance()) {
          finished++;
          break;
        }
        iterations--;
      }
      if (finished >= this.stacks.length) return false;
    }
    return true;
  }

  bestMove() {
    return this.stacks.length ? this.stacks[0].getBestMove() : [];
  }

  bestDepth() {
    return this.stacks.length ? this.stacks[0].bestDepth : 0;
  }
}

// ----------------------------------------------------------------------
// UI and game state
// ----------------------------------------------------------------------

const undoStack = [];
const redoStack = [];
let mainBoard = new ChessBoard();
const ai = new SearchSpace();

// Selected square for human move
let selectedSquare = null;

// URL params
const params = new URLSearchParams(window.location.search);
const easy = params.has('easy'); // not used in chess
const small = params.has('small');
const playwhite = params.has('white');
const notext = params.has('quiet');

// Helper functions
const log = (msg) => { if (console) console.log(msg); };
const coords = (cell) => {
  const id = cell.id;
  return [parseInt(id[1]), parseInt(id[2])];
};
const colorName = (n) => (n === WHITE ? 'white' : 'black');

// DOM shortcuts
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// Draw board
const drawAll = (board) => {
  $$('.rsquare').forEach(cell => {
    const [x, y] = coords(cell);
    const piece = board.state([x, y]);
    const span = cell.querySelector('span');
    if (span) {
      span.textContent = PIECE_EMOJI[piece] || ' ';
    }
    
    // Kare rengini ayarla (açık/koyu)
    const isLight = (x + y) % 2 === 0; // (0,0) a8 açık kare olsun
    cell.classList.remove('light', 'dark');
    cell.classList.add(isLight ? 'light' : 'dark');
    
    // Remove any selection highlight (but we'll handle with class)
    cell.classList.remove('selected');
  });
  
  // Highlight selected square if any
  if (selectedSquare) {
    const [x, y] = selectedSquare;
    const cell = $(`#r${x}${y}`);
    if (cell) cell.classList.add('selected');
  }
  drawText(board);
};

const drawText = (board) => {
  const counts = board.countPieces();
  $('#whitenum').textContent = counts[0] < 10 ? ` ${counts[0]}` : counts[0];
  $('#blacknum').textContent = counts[1] < 10 ? ` ${counts[1]}` : counts[1];

  const currentPlayer = colorName(board.whoseMove);
  const opponent = colorName(-board.whoseMove);
  $(`#${currentPlayer}pointer`).style.visibility = 'visible';
  $(`#${currentPlayer}pointer`).title = `${currentPlayer} to move`;
  $(`#${opponent}pointer`).style.visibility = 'hidden';
  $(`#${opponent}pointer`).removeAttribute('title');

  const humanPlayer = colorName(-board.computerIs);
  const computerPlayer = colorName(board.computerIs);
  $(`#${humanPlayer}line`).title = `you are ${humanPlayer}`;
  $(`#${computerPlayer}line`).title = `click to play as ${computerPlayer}`;
  $(`#${humanPlayer}computer`).hidden = true;
  $(`#${computerPlayer}computer`).hidden = false;

  $('#undo').disabled = !undoStack.length;

  // Determine game over
  const legalMoves = board.legalMoves(board.whoseMove);
  const isGameOver = legalMoves.length === 0;
  const inCheck = board.isCheck(board.whoseMove);
  const gameOverMsg = inCheck ? 'Checkmate' : 'Stalemate';

  if (redoStack.length) {
    $('#pass').textContent = 'Redo';
    $('#pass').disabled = false;
  } else if (isGameOver) {
    $('#pass').textContent = 'New Game';
    $('#pass').disabled = false;
  } else {
    $('#pass').textContent = 'Resign';
    $('#pass').disabled = false; // Resign always available
  }
};

const pickPlayer = (p) => {
  if (mainBoard.computerIs === -p) return;
  undoStack.push(new ChessBoard(mainBoard));
  redoStack.length = 0;
  mainBoard.computerIs = -p;
  selectedSquare = null;
  drawAll(mainBoard);
  startAI(mainBoard);
};

// Handle square click
const doClick = (c) => {
  if (mainBoard.computerIs === mainBoard.whoseMove) return; // computer's turn

  const [x, y] = c;
  const piece = mainBoard.state(c);

  if (selectedSquare === null) {
    // No piece selected: if square has a piece of current player, select it
    if (piece !== EMPTY && pieceColor(piece) === mainBoard.whoseMove) {
      selectedSquare = c;
      drawAll(mainBoard);
    }
  } else {
    // Piece selected: try to move
    const move = [selectedSquare[0], selectedSquare[1], x, y];
    // Check if move is legal
    const legalMoves = mainBoard.legalMoves(mainBoard.whoseMove);
    const found = legalMoves.find(m =>
      m[0] === move[0] && m[1] === move[1] && m[2] === move[2] && m[3] === move[3] &&
      (m.length === 4 || m[4] === QUEEN) // ignore promotion for comparison
    );
    if (found) {
      const saved = new ChessBoard(mainBoard);
      if (mainBoard.doMove(found)) {
        undoStack.push(saved);
        redoStack.length = 0;
        selectedSquare = null;
        drawAll(mainBoard);
        startAI(mainBoard);
      }
    } else {
      // If clicked on own piece, change selection
      if (piece !== EMPTY && pieceColor(piece) === mainBoard.whoseMove) {
        selectedSquare = c;
        drawAll(mainBoard);
      } else {
        // Deselect
        selectedSquare = null;
        drawAll(mainBoard);
      }
    }
  }
};

const doPass = () => {
  const counts = mainBoard.countPieces();
  const legalMoves = mainBoard.legalMoves(mainBoard.whoseMove);
  const isGameOver = legalMoves.length === 0;

  if (redoStack.length) {
    doRedo();
  } else if (isGameOver) {
    // New game
    undoStack.push(new ChessBoard(mainBoard));
    redoStack.length = 0;
    mainBoard = new ChessBoard();
    selectedSquare = null;
    drawAll(mainBoard);
    startAI(mainBoard);
    log('Starting new game');
  } else {
    // Resign: treat as loss for current player, switch computer? For simplicity, just pass turn? But better: end game.
    // We'll just do a pass (switch turns) but in chess it's illegal. Instead, we can force a win for opponent.
    // Let's just make it resign: disable further moves and show message.
    log(`${colorName(mainBoard.whoseMove)} resigns`);
    // For UI, we can just switch computer turn? But to keep simple, we'll treat as game over.
    // We'll just do nothing for now.
    alert('Resignation not implemented. Use New Game.');
  }
};

const doRedo = () => {
  if (redoStack.length) {
    undoStack.push(new ChessBoard(mainBoard));
    mainBoard = redoStack.pop();
    selectedSquare = null;
    log(`redo to ${undoStack.length}`);
    drawAll(mainBoard);
    startAI(mainBoard);
  }
};

const doUndo = () => {
  if (undoStack.length) {
    redoStack.push(new ChessBoard(mainBoard));
    mainBoard = undoStack.pop();
    selectedSquare = null;
    log(`undo to ${undoStack.length}`);
    drawAll(mainBoard);
    startAI(mainBoard);
  }
};

// AI timing
let moveTimer = null;
let earlyTimer = null;
let cycleTimer = null;

const stopTimers = () => {
  clearTimeout(moveTimer);
  clearTimeout(earlyTimer);
  clearTimeout(cycleTimer);
  moveTimer = earlyTimer = cycleTimer = null;
};

const startAI = (board) => {
  stopTimers();
  ai.setBoard(board);
  if (board.whoseMove === board.computerIs) {
    const remaining = board.countPieces()[2]; // empty squares
    const ms = 500 + (64 - remaining) * 150; // similar timing
    moveTimer = setTimeout(finishAI, ms);
    earlyTimer = setTimeout(earlyAI, 1000);
  }
  cycleTimer = setTimeout(advanceAI, 1);
};

const advanceAI = () => {
  if (!ai.advance(20)) {
    if (!earlyTimer) {
      finishAI();
    } else {
      clearTimeout(moveTimer);
      moveTimer = null;
    }
    return;
  }
  clearTimeout(cycleTimer);
  cycleTimer = setTimeout(advanceAI, 1);
};

const earlyAI = () => {
  if (!moveTimer) {
    finishAI();
  } else {
    clearTimeout(earlyTimer);
    earlyTimer = null;
  }
};

const finishAI = () => {
  stopTimers();
  if (mainBoard.computerIs !== mainBoard.whoseMove) return;
  const bestMove = ai.bestMove();
  if (bestMove.length === 0) {
    // No legal moves: game over
    log('Computer has no moves');
    drawText(mainBoard);
    return;
  }
  if (!mainBoard.doMove(bestMove)) {
    log(`Problem move: ${bestMove}`);
    return;
  }
  log(`Depth ${ai.bestDepth()}: ${bestMove}`);
  drawAll(mainBoard);
  startAI(mainBoard);
};

// Create board squares (with spans instead of images)
const createBoard = () => {
  const boardEl = $('#board');
  // y'yi 7'den 0'a doğru azaltarak siyah taşların üstte olmasını sağla
  for (let y = 7; y >= 0; y--) {
    for (let x = 0; x < 8; x++) {
      const cell = document.createElement('div');
      cell.className = 'rsquare';
      cell.id = `r${x}${y}`;
      const span = document.createElement('span');
      span.className = 'piece';
      cell.appendChild(span);
      boardEl.appendChild(cell);
    }
  }
};

// Initialize
const init = () => {
  createBoard();
  if (small) document.body.classList.add('small');
  if (notext) document.body.classList.add('no-text');

  $$('.rsquare').forEach(cell => {
    cell.addEventListener('mousedown', (e) => {
      doClick(coords(cell));
      e.preventDefault();
    });
  });

  $$('.player-label').forEach(label => {
    label.addEventListener('click', () => {
      const player = label.dataset.player === 'white' ? WHITE : BLACK;
      pickPlayer(player);
    });
  });

  $('#undo').addEventListener('click', doUndo);
  $('#pass').addEventListener('click', doPass);

  // Set initial computer player based on URL param
  if (playwhite) {
    mainBoard.computerIs = BLACK; // human plays white
  } else {
    mainBoard.computerIs = WHITE; // human plays black by default
  }

  drawAll(mainBoard);
  startAI(mainBoard);
};

document.addEventListener('DOMContentLoaded', init);
