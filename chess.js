// Chess pieces unicode symbols
const pieces = {
    'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
    'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
};

// Initial board setup
const initialBoard = [
    ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
    ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
    ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
];

let board = JSON.parse(JSON.stringify(initialBoard));
let currentPlayer = 'white';
let selectedSquare = null;
let gameOver = false;
let castlingRights = {
    white: { kingside: true, queenside: true },
    black: { kingside: true, queenside: true }
};
let enPassantTarget = null;

let initBoard=() =>{
    const chessboard = document.querySelector('.chessboard');
   chessboard.innerHTML = '';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;          
            square.dataset.row = row;
            square.dataset.col = col;
            square.addEventListener('click', handleSquareClick);
            
            if (board[row][col]) {
                const piece = document.createElement('span');
                piece.className = 'piece';
                piece.textContent = pieces[board[row][col]];
                square.appendChild(piece);
            }
            
            chessboard.appendChild(square);
        }
    }
}

let handleSquareClick=(event) =>{
    if (gameOver) return;
    
    const row = parseInt(event.currentTarget.dataset.row);
    const col = parseInt(event.currentTarget.dataset.col);
    
    if (selectedSquare) {
        if (selectedSquare.row === row && selectedSquare.col === col) {
            clearSelection();
            return;
        }
        
        if (isValidMove(selectedSquare.row, selectedSquare.col, row, col)) {
            makeMove(selectedSquare.row, selectedSquare.col, row, col);
            clearSelection();
            switchPlayer();
            
            setTimeout(() => {
                if (isCheckmate(currentPlayer)) {
                    const winner = currentPlayer === 'white' ? 'Black' : 'White';
                    alert(`Checkmate! ${winner} wins!`);
                    gameOver = true;
                    document.querySelector('#gameStatus').textContent = `Game Over - ${winner} wins!`;
                } else if (isCheck(currentPlayer)) {
                    alert(`Check! ${currentPlayer === 'white' ? 'White' : 'Black'} king is in check!`);
                    document.querySelector('#gameStatus').textContent = `${currentPlayer === 'white' ? 'White' : 'Black'} is in check!`;
                    highlightKingInCheck();
                } else {
                    document.querySelector('#gameStatus').textContent = 'Game in progress';
                }
            }, 100);
        } else {
            clearSelection();
            selectSquare(row, col);
        }
    } else {
        selectSquare(row, col);
    }
}

function selectSquare(row, col) {
    const piece = board[row][col];
    if (!piece) return;
    
    const pieceColor = piece[0] === 'w' ? 'white' : 'black';
    if (pieceColor !== currentPlayer) return;
    
    selectedSquare = { row, col };
    
    const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    square.classList.add('selected');
    
    highlightPossibleMoves(row, col);
}

function clearSelection() {
    document.querySelectorAll('.square').forEach(square => {
        square.classList.remove('selected', 'possible-move', 'in-check');
    });
    selectedSquare = null;
}

function highlightPossibleMoves(row, col) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (isValidMove(row, col, r, c)) {
                const square = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                square.classList.add('possible-move');
            }
        }
    }
}

function highlightKingInCheck() {
    const kingPos = findKing(currentPlayer);
    if (kingPos) {
        const square = document.querySelector(`[data-row="${kingPos.row}"][data-col="${kingPos.col}"]`);
        square.classList.add('in-check');
    }
}

function isValidMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    if (!piece) return false;
    
    const pieceColor = piece[0] === 'w' ? 'white' : 'black';
    const targetPiece = board[toRow][toCol];
    
    if (targetPiece && targetPiece[0] === piece[0]) return false;
    
    if (!isValidPieceMove(piece, fromRow, fromCol, toRow, toCol)) return false;
    
    // Check if move would leave king in check
    const tempBoard = JSON.parse(JSON.stringify(board));
    tempBoard[toRow][toCol] = tempBoard[fromRow][fromCol];
    tempBoard[fromRow][fromCol] = null;
    
    if (wouldBeInCheck(tempBoard, pieceColor)) return false;
    
    return true;
}

function isValidPieceMove(piece, fromRow, fromCol, toRow, toCol) {
    const pieceType = piece[1];
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    
    switch (pieceType) {
        case 'P': return isValidPawnMove(piece, fromRow, fromCol, toRow, toCol);
        case 'R': return isValidRookMove(fromRow, fromCol, toRow, toCol);
        case 'N': return isValidKnightMove(rowDiff, colDiff);
        case 'B': return isValidBishopMove(fromRow, fromCol, toRow, toCol);
        case 'Q': return isValidQueenMove(fromRow, fromCol, toRow, toCol);
        case 'K': return isValidKingMove(piece, fromRow, fromCol, toRow, toCol);
        default: return false;
    }
}

function isValidPawnMove(piece, fromRow, fromCol, toRow, toCol) {
    const isWhite = piece[0] === 'w';
    const direction = isWhite ? -1 : 1;
    const startRow = isWhite ? 6 : 1;
    const rowDiff = toRow - fromRow;
    const colDiff = Math.abs(toCol - fromCol);
    
    if (colDiff === 0) {
        if (rowDiff === direction && !board[toRow][toCol]) return true;
        if (fromRow === startRow && rowDiff === 2 * direction && !board[toRow][toCol]) return true;
    } else if (colDiff === 1 && rowDiff === direction) {
        if (board[toRow][toCol] && board[toRow][toCol][0] !== piece[0]) return true;
        if (enPassantTarget && toRow === enPassantTarget.row && toCol === enPassantTarget.col) return true;
    }
    
    return false;
}

function isValidRookMove(fromRow, fromCol, toRow, toCol) {
    if (fromRow !== toRow && fromCol !== toCol) return false;
    return isPathClear(fromRow, fromCol, toRow, toCol);
}

function isValidKnightMove(rowDiff, colDiff) {
    return (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) ||
           (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2);
}

function isValidBishopMove(fromRow, fromCol, toRow, toCol) {
    if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
    return isPathClear(fromRow, fromCol, toRow, toCol);
}

function isValidQueenMove(fromRow, fromCol, toRow, toCol) {
    return isValidRookMove(fromRow, fromCol, toRow, toCol) ||
           isValidBishopMove(fromRow, fromCol, toRow, toCol);
}

function isValidKingMove(piece, fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    
    if (rowDiff <= 1 && colDiff <= 1) return true;
    
    // Castling
    if (rowDiff === 0 && colDiff === 2) {
        return canCastle(piece, fromRow, fromCol, toRow, toCol);
    }
    
    return false;
}

function canCastle(piece, fromRow, fromCol, toRow, toCol) {
    const color = piece[0] === 'w' ? 'white' : 'black';
    const isKingside = toCol > fromCol;
    
    if (!castlingRights[color][isKingside ? 'kingside' : 'queenside']) return false;
    
    if (isCheck(color)) return false;
    
    const rookCol = isKingside ? 7 : 0;
    const expectedRook = color === 'white' ? 'wR' : 'bR';
    
    if (board[fromRow][rookCol] !== expectedRook) return false;
    
    const step = isKingside ? 1 : -1;
    for (let col = fromCol + step; col !== rookCol; col += step) {
        if (board[fromRow][col]) return false;
    }
    
    for (let col = fromCol; col !== toCol + step; col += step) {
        const tempBoard = JSON.parse(JSON.stringify(board));
        tempBoard[fromRow][col] = piece;
        tempBoard[fromRow][fromCol] = null;
        if (wouldBeInCheck(tempBoard, color)) return false;
    }
    
    return true;
}

function isPathClear(fromRow, fromCol, toRow, toCol) {
    const rowStep = toRow > fromRow ? 1 : (toRow < fromRow ? -1 : 0);
    const colStep = toCol > fromCol ? 1 : (toCol < fromCol ? -1 : 0);
    
    let row = fromRow + rowStep;
    let col = fromCol + colStep;
    
    while (row !== toRow || col !== toCol) {
        if (board[row][col]) return false;
        row += rowStep;
        col += colStep;
    }
    
    return true;
}

function makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const targetPiece = board[toRow][toCol];
    
    // Handle castling
    if (piece[1] === 'K' && Math.abs(toCol - fromCol) === 2) {
        const isKingside = toCol > fromCol;
        const rookFromCol = isKingside ? 7 : 0;
        const rookToCol = isKingside ? 5 : 3;
        
        board[fromRow][rookToCol] = board[fromRow][rookFromCol];
        board[fromRow][rookFromCol] = null;
        
        const color = piece[0] === 'w' ? 'white' : 'black';
        castlingRights[color].kingside = false;
        castlingRights[color].queenside = false;
    }
    
    // Handle en passant
    if (piece[1] === 'P' && enPassantTarget && toRow === enPassantTarget.row && toCol === enPassantTarget.col) {
        board[fromRow][toCol] = null;
    }
    
    // Set en passant target
    enPassantTarget = null;
    if (piece[1] === 'P' && Math.abs(toRow - fromRow) === 2) {
        enPassantTarget = { row: (fromRow + toRow) / 2, col: fromCol };
    }
    
    // Update castling rights
    if (piece[1] === 'K') {
        const color = piece[0] === 'w' ? 'white' : 'black';
        castlingRights[color].kingside = false;
        castlingRights[color].queenside = false;
    } else if (piece[1] === 'R') {
        const color = piece[0] === 'w' ? 'white' : 'black';
        if (fromCol === 0) castlingRights[color].queenside = false;
        if (fromCol === 7) castlingRights[color].kingside = false;
    }
    
    // Make the move
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = null;
    
    // Pawn promotion
    if (piece[1] === 'P' && (toRow === 0 || toRow === 7)) {
        board[toRow][toCol] = piece[0] + 'Q';
    }
    
    initBoard();
}

function switchPlayer() {
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    document.getElementById('currentPlayer').textContent = 
        currentPlayer === 'white' ? "White's Turn" : "Black's Turn";
}

function isCheck(color) {
    return wouldBeInCheck(board, color);
}

function wouldBeInCheck(testBoard, color) {
    const kingPos = findKingOnBoard(testBoard, color);
    if (!kingPos) return false;
    
    const enemyColor = color === 'white' ? 'black' : 'white';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = testBoard[row][col];
            if (piece && piece[0] === (enemyColor === 'white' ? 'w' : 'b')) {
                if (canPieceAttack(piece, row, col, kingPos.row, kingPos.col, testBoard)) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

function canPieceAttack(piece, fromRow, fromCol, toRow, toCol, testBoard) {
    const pieceType = piece[1];
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    
    switch (pieceType) {
        case 'P':
            const isWhite = piece[0] === 'w';
            const direction = isWhite ? -1 : 1;
            return rowDiff === direction && Math.abs(colDiff) === 1;
        case 'R':
            return (fromRow === toRow || fromCol === toCol) && 
                   isPathClearOnBoard(testBoard, fromRow, fromCol, toRow, toCol);
        case 'N':
            return (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) ||
                   (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2);
        case 'B':
            return Math.abs(rowDiff) === Math.abs(colDiff) && 
                   isPathClearOnBoard(testBoard, fromRow, fromCol, toRow, toCol);
        case 'Q':
            return ((fromRow === toRow || fromCol === toCol) ||
                   (Math.abs(rowDiff) === Math.abs(colDiff))) &&
                   isPathClearOnBoard(testBoard, fromRow, fromCol, toRow, toCol);
        case 'K':
            return Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1;
        default:
            return false;
    }
}

function isPathClearOnBoard(testBoard, fromRow, fromCol, toRow, toCol) {
    const rowStep = toRow > fromRow ? 1 : (toRow < fromRow ? -1 : 0);
    const colStep = toCol > fromCol ? 1 : (toCol < fromCol ? -1 : 0);
    
    let row = fromRow + rowStep;
    let col = fromCol + colStep;
    
    while (row !== toRow || col !== toCol) {
        if (testBoard[row][col]) return false;
        row += rowStep;
        col += colStep;
    }
    
    return true;
}

function findKing(color) {
    return findKingOnBoard(board, color);
}

function findKingOnBoard(testBoard, color) {
    const kingPiece = color === 'white' ? 'wK' : 'bK';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (testBoard[row][col] === kingPiece) {
                return { row, col };
            }
        }
    }
    return null;
}

function isCheckmate(color) {
    if (!isCheck(color)) return false;
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece[0] === (color === 'white' ? 'w' : 'b')) {
                for (let toRow = 0; toRow < 8; toRow++) {
                    for (let toCol = 0; toCol < 8; toCol++) {
                        if (isValidMove(row, col, toRow, toCol)) {
                            return false;
                        }
                    }
                }
            }
        }
    }
    
    return true;
}

function resetGame() {
    board = JSON.parse(JSON.stringify(initialBoard));
    currentPlayer = 'white';
    selectedSquare = null;
    gameOver = false;
    castlingRights = {
        white: { kingside: true, queenside: true },
        black: { kingside: true, queenside: true }
    };
    enPassantTarget = null;
    
    document.getElementById('currentPlayer').textContent = "White's Turn";
    document.getElementById('gameStatus').textContent = 'Game in progress';
    
    initBoard();
}

/* Start the game */
initBoard();