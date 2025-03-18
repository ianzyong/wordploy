let gridWidth = 5;
let gridLength = 8;
let gridSize = gridWidth * gridLength;

// read valid_words.txt into array
const fileUrl = "./valid_words.txt";
fetch(fileUrl).then(r => r.text()).then(t => {
    validWords = t.split(/\r\n?|\n/);
    updateProgress();
}).catch(e => {
    console.error(e);
});

const SCRABBLE_VALUES = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4,
    'I': 1, 'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3,
    'Q': 10, 'R': 1, 'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8,
    'Y': 4, 'Z': 10
};

// game state
// ["playerEntry","playerFlip","aiTurn","gameEnd"]
let gameState = "playerEntry";
let playerGrid = [];
let aiGrid = [];
let playerScore = 0;
let aiScore = 0;
let playerWords = [];
let aiWords = [];
let flippedCells = new Set(); // Store coordinates of flipped cells as strings ("row,col")

// DOM Elements
const gridElement = document.getElementById('main-grid');
const playerScoreElement = document.getElementById('player-score');
const aiScoreElement = document.getElementById('ai-score');
const playerWordsElement = document.getElementById('player-words');
const aiWordsElement = document.getElementById('ai-words');

// --- Utility Functions ---
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function generateRandomGrid(gridWidth, gridLength, isPlayer) {
    const grid = [];
    // determine number of blocks
    const numBlocks = Math.floor(gridSize * 0.2);
    const numLetterBonuses = Math.floor(gridSize * 0.1);
    const numWordBonuses = Math.floor(gridSize * 0.05);
    const numWildcards = Math.floor(gridSize * 0.05);
    
    // initialize all grid objects
    for (let i = 0; i < gridLength; i++) {
        grid[i] = [];
        for (let j = 0; j < gridWidth; j++) {
            grid[i][j] = {
                type: "space",
                content: "",
                flipped: false,
                originalSide: isPlayer ? 'player' : 'ai'  //Keep track of original side
            };
        }
    }
    let row = 0;
    let col = 0;
    let occupiedCells = new Set(); // Keep track of occupied cells
    // choose numBlocks random cells to be blocks
    const blockCells = new Set();
    while (blockCells.size < numBlocks) {
        row = Math.floor(Math.random() * gridLength);
        col = Math.floor(Math.random() * gridWidth);
        blockCells.add(`${row},${col}`);
        occupiedCells.add(`${row},${col}`);
        grid[row][col] = {
            type: "block",
            content: "",
            flipped: false,
            originalSide: isPlayer ? 'player' : 'ai'  //Keep track of original side
        };
    }
    // choose numLetterBonuses random cells to be letter bonuses
    const letterBonusCells = new Set();
    while (letterBonusCells.size < numLetterBonuses) {
        row = Math.floor(Math.random() * gridLength);
        col = Math.floor(Math.random() * gridWidth);
        if (occupiedCells.has(`${row},${col}`)) {
            continue; // Skip occupied cells
        } else {
            letterBonusCells.add(`${row},${col}`);
            occupiedCells.add(`${row},${col}`);
            grid[row][col] = {
                type: "letter-bonus",
                content: "",
                flipped: false,
                originalSide: isPlayer ? 'player' : 'ai'  //Keep track of original side
            };
        }
    }
    // choose numWordBonuses random cells to be word bonuses
    const wordBonusCells = new Set();
    while (wordBonusCells.size < numWordBonuses) {
        row = Math.floor(Math.random() * gridLength);
        col = Math.floor(Math.random() * gridWidth);
        if (occupiedCells.has(`${row},${col}`)) {
            continue; // Skip occupied cells
        } else {
            wordBonusCells.add(`${row},${col}`);
            occupiedCells.add(`${row},${col}`);
            grid[row][col] = {
                type: "word-bonus",
                content: "",
                flipped: false,
                originalSide: isPlayer ? 'player' : 'ai'  //Keep track of original side
            };
        }
    }
    // choose numWildcards random cells to be wildcards
    const wildcardCells = new Set();
    while (wildcardCells.size < numWildcards) {
        row = Math.floor(Math.random() * gridLength);
        col = Math.floor(Math.random() * gridWidth);
        if (occupiedCells.has(`${row},${col}`)) {
            continue; // Skip occupied cells
        } else {
            wildcardCells.add(`${row},${col}`);
            occupiedCells.add(`${row},${col}`);
            grid[row][col] = {
                type: "wildcard",
                content: "*",
                flipped: false,
                originalSide: isPlayer ? 'player' : 'ai'  //Keep track of original side
            };
        }
    }

    return grid;
}

function renderGrid(frontGrid, backGrid) {
    gridElement.innerHTML = ''; // Clear existing grid

    let gridSize = frontGrid.length;
    for (let i = 0; i < gridLength; i++) {
        for (let j = 0; j < gridWidth; j++) {
            const frontCell = frontGrid[i][j];
            const backCell = backGrid[i][j];
            const cellElement = document.createElement('div');
            cellElement.classList.add('grid-cell');
            // append child div cellInnerElement
            const cellInnerElement = document.createElement('div');
            cellInnerElement.classList.add('grid-cell-inner');
            cellInnerElement.classList.add(frontCell.type);
            cellElement.appendChild(cellInnerElement);
            // append child div cellContentFrontElement
            const cellContentFrontElement = document.createElement('div');
            cellContentFrontElement.classList.add('grid-cell-front');
            cellContentFrontElement.classList.add('grid-cell-content');
            cellContentFrontElement.textContent = frontCell.content;
            cellContentFrontElement.classList.add(frontCell.type);
            cellInnerElement.appendChild(cellContentFrontElement);
            // append child div cellContentBackElement
            const cellContentBackElement = document.createElement('div');
            cellContentBackElement.classList.add('grid-cell-back');
            cellContentFrontElement.classList.add('grid-cell-content');
            cellContentBackElement.textContent = backCell.content;
            cellContentBackElement.classList.add(backCell.type);
            cellInnerElement.appendChild(cellContentBackElement);
            // append cellElement to gridElement
            gridElement.appendChild(cellElement);
        }
    }
}

function updateScoreboard() {
    playerScoreElement.textContent = playerScore;
    aiScoreElement.textContent = aiScore;
    playerWordsElement.textContent = playerWords.join(', ');
    aiWordsElement.textContent = aiWords.join(', ');
}

// --- Game Initialization ---
function init() {
    // set root --num_cols variable in css file
    document.documentElement.style.setProperty('--num_cols', gridWidth);

    playerGrid = generateRandomGrid(gridWidth, gridLength, true);
    aiGrid = generateRandomGrid(gridWidth, gridLength, false);
    renderGrid(playerGrid, aiGrid);
    updateScoreboard();
    // while (playerGrid.flat().some(cell => (cell.type !== 'block') && cell.content === '') && aiGrid.flat().some(cell => (cell.type !== 'block') && cell.content === '')) {
    //     // player turn

    //     // wait
    // }
}

init(); // Start the game