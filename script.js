let gridWidth = 5;
let gridLength = 8;
let gridSize = gridWidth * gridLength;
let selectedMax = 1;
let isRowSelected = true;
let editableInds = [];
let selectedSet = [];
let inputIndex = 0;
let isPlayerSide = true;

if (selectedMax > 1) {
    var flipToolTip = "Select cells to flip...";
} else {
    var flipToolTip = "Select a cell to flip...";
}

// read valid_words.txt into array
let validWords = [];
const fileUrl = "./valid_words.txt";
fetch(fileUrl).then(r => r.text()).then(t => {
    validWords = t.split(/\r\n?|\n/);
}).catch(e => {
    console.error(e);
});

const SCRABBLE_VALUES = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4,
    'I': 1, 'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3,
    'Q': 10, 'R': 1, 'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8,
    'Y': 4, 'Z': 10, '*': 0
};

// game states
let gameStates = ["playerEntry","playerFlip","aiTurn","gameEnd"]
let gameState = gameStates[0];
let playerGrid = [];
let aiGrid = [];
let playerTotal = 0;
let aiTotal = 0;
let playerWords = [];
let aiWords = [];

// DOM Elements
const gridElement = document.getElementById('main-grid');
const playerScoreElement = document.getElementById('player-score');
const aiScoreElement = document.getElementById('ai-score');
const playerWordsElement = document.getElementById('player-words');
const aiWordsElement = document.getElementById('ai-words');
const keyboardElement = document.getElementById('keyboard-cont');
const toolTipTextElement = document.getElementById('tool-tip-text');
toolTipTextElement.textContent = "Enter a word...";

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
                originalSide: isPlayer ? 'player' : 'ai',
                editable: true
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
            originalSide: isPlayer ? 'player' : 'ai',
            editable: false
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
                originalSide: isPlayer ? 'player' : 'ai',
                editable: true
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
                originalSide: isPlayer ? 'player' : 'ai',
                editable: true
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
                originalSide: isPlayer ? 'player' : 'ai',
                editable: false
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
            // if flipped, add flipped class
            if (frontCell.flipped) {
                cellInnerElement.classList.add('flipped');
            }
            // if locked-in, add locked-in class
            if (!frontCell.editable && (frontCell.type !== 'block') && (frontCell.type !== 'wildcard')) {
                cellContentFrontElement.classList.add('locked-in');
                cellContentFrontElement.textContent = frontCell.content;
            }
            // append cellElement to gridElement
            gridElement.appendChild(cellElement);
        }
    }
}

function updateScoreboard() {
    // score boards
    let playerScores = scoreAllWords(playerGrid);
    let aiScores = scoreAllWords(aiGrid);
    // display scores line-by-line, ignoring words that contain "_"
    playerScores = playerScores.filter(([word, score]) => !word.includes('_') && score > 0);
    aiScores = aiScores.filter(([word, score]) => !word.includes('_') && score > 0);
    playerTotal = playerScores.reduce((acc, [word, score]) => acc + score, 0);
    aiTotal = aiScores.reduce((acc, [word, score]) => acc + score, 0);
    playerScoreElement.textContent = playerTotal + "\r\n" + playerScores.map(([word, score]) => `${word}: ${score}`).join(', ');
    aiScoreElement.textContent = aiTotal + "\r\n" + aiScores.map( ([word, score]) => `${word}: ${score}`).join(', ');
    // playerWordsElement.textContent = playerWords.join(', ');
    // aiWordsElement.textContent = aiWords.join(', ');
}

// add event listener for grid clicks
gridElement.addEventListener('click', function (event) {
    const cellElement = event.target.closest('.grid-cell');
    if (cellElement) {
        // get position of cellElement in grid
        let cellIndex = Array.from(cellElement.parentNode.children).indexOf(cellElement);
        let cellRow = Math.floor(cellIndex / gridWidth);
        let cellCol = cellIndex % gridWidth;
        // get cellObject from grid
        let cellObject = playerGrid[cellRow][cellCol];

        if (gameState === gameStates[0] && cellObject.editable) { // playerEntry
            let selectedInds = [];
            clearInputSelectText();
            if (!cellElement.children[0].classList.contains('input-select')) {
                isRowSelected = true;
                selectedInds = highlightInput(cellRow, cellCol, isRowSelected);
            } else {
                isRowSelected = !isRowSelected;
                selectedInds = highlightInput(cellRow, cellCol, isRowSelected);
            }
            // convert to set
            selectedSet = new Set(selectedInds);
            // determine indices corresponding to editable cells
            editableInds = [];
            for (let ind of selectedSet) {
                const [row, col] = ind.split(',').map(Number);
                if (playerGrid[row][col].editable) {
                    editableInds.push(ind);
                }
            }
            
            // sort indices
            if (isRowSelected) {
                editableInds.sort((a, b) => {
                    const [rowA, colA] = a.split(',').map(Number);
                    const [rowB, colB] = b.split(',').map(Number);
                    return colA - colB;
                }); 
            } else {
                editableInds.sort((a, b) => {
                    const [rowA, colA] = a.split(',').map(Number);
                    const [rowB, colB] = b.split(',').map(Number);
                    return rowA - rowB;
                });
            }
            // set inputIndex to index of selected cell in editableInds
            inputIndex = editableInds.indexOf(`${cellRow},${cellCol}`);
            // if not found, set inputIndex to 0
            if (inputIndex === -1) {
                inputIndex = 0;
                // reset cursor
                gridElement.querySelectorAll('.input-cursor').forEach(cell => {
                    cell.classList.remove('input-cursor');
                });
                // add input-cursor to first cell in editableInds
                let [r, c] = editableInds[inputIndex].split(',').map(Number);
                gridElement.children[r * gridWidth + c].children[0].classList.add('input-cursor');
            }
        } else if (gameState === gameStates[1]) { // playerFlip
            // get number of cells with .selected class
            let selectedNum = Array.from(gridElement.querySelectorAll('.selected')).length;
            if (!cellObject.flipped) {
                // if has selected class
                if (cellElement.children[0].classList.contains('selected')) {
                    // remove .selected class from cellElement
                    cellElement.children[0].classList.remove('selected');
                } else if (selectedNum < selectedMax) {
                    // add .selected class to cellElement
                    cellElement.children[0].classList.add('selected');
                } else if (selectedMax === 1) {
                    // remove .selected class from all cells
                    gridElement.querySelectorAll('.selected').forEach(cell => {
                        cell.classList.remove('selected');
                    });
                    // add .selected class to cellElement
                    cellElement.children[0].classList.add('selected');
                }
            } else {
                return;
            }
        } else if (gameState === gameStates[2]) { // aiTurn
            return;
        } else if (gameState === gameStates[3]) { // gameEnd
            return;
        }
    }
});

function clearInputSelectText() {
    gridElement.querySelectorAll('.input-select').forEach(cell => {
        // if not wildcard and if not locked-in
        if (!cell.children[0].classList.contains('wildcard') && !cell.children[0].classList.contains('locked-in')) {
        // get coordinates of selected cell
            let cellIndex = Array.from(cell.parentNode.parentNode.children).indexOf(cell.parentNode);
            let cellRow = Math.floor(cellIndex / gridWidth);
            let cellCol = cellIndex % gridWidth;
            // clear content from cellObject in playerGrid
            playerGrid[cellRow][cellCol].content = '';
        }
    });
    // render grid
    renderGrid(playerGrid, aiGrid);
}

function checkForGameOver() {
    // if all cells are not editable on playerGrid and aiGrid
    if (playerGrid.every(row => row.every(cell => !cell.editable)) && aiGrid.every(row => row.every(cell => !cell.editable))) {
        gameState = gameStates[3];
        let winner = playerTotal > aiTotal ? "player" : "AI";
        toolTipTextElement.textContent = "Game over... " + winner + " wins! (hit Tab to toggle grids)";
    }
}

function highlightInput(row, col, isRowSelected) {

    updateScoreboard();

    gridElement.querySelectorAll('.input-cursor').forEach(cell => {
        cell.classList.remove('input-cursor');
    });

    // add input-cursor to selected cell
    gridElement.children[row * gridWidth + col].children[0].classList.add('input-cursor');

    let indices = [];

    if (!isRowSelected) {
        while (row >= 0 && playerGrid[row][col].type !== 'block') {
            indices.push(`${row},${col}`);
            row--;
        }
        row = row + 1;
        while (row < gridLength && playerGrid[row][col].type !== 'block') {
            indices.push(`${row},${col}`);
            row++;
        }
    } else {
        while (col >= 0 && playerGrid[row][col].type !== 'block') {
            indices.push(`${row},${col}`);
            col--;
        }
        col = col + 1;
        while (col < gridWidth && playerGrid[row][col].type !== 'block') {
            indices.push(`${row},${col}`);
            col++;
        }
    }

    indices.forEach(cell => {
        const [row, col] = cell.split(',').map(Number);
        gridElement.children[row * gridWidth + col].children[0].classList.add('input-select');
    });

    return indices;
}

function getPossibleWordIndices(grid) {
    // return a list of lists of indices of possible words in the grid, accounting for blocks
    let possibleWordIndices = [];
    // horizontal words
    for (let i = 0; i < grid.length; i++) {
        let word = [];
        let j = 0;
        while (j < grid[0].length) {
            if (grid[i][j].type !== 'block') {
                word.push([i,j]);
            } else {
                if (word.length >= 1) {
                    possibleWordIndices.push(word);
                }
                word = [];
            }
            j++;
        }
        if (word.length >= 1) {
            possibleWordIndices.push(word);
        }
    }
    // vertical words
    for (let j = 0; j < grid[0].length; j++) {
        let word = [];
        let i = 0;
        while (i < grid.length) {
            if (grid[i][j].type !== 'block') {
                word.push([i,j]);
            } else {
                if (word.length >= 1) {
                    possibleWordIndices.push(word);
                }
                word = [];
            }
            i++;
        }
        if (word.length >= 1) {
            possibleWordIndices.push(word);
        }
    }
    return possibleWordIndices;
}

function scoreAllWords(grid) {
    let possibleWordIndices = getPossibleWordIndices(grid);
    let scores = [];
    for (let word of possibleWordIndices) {
        let wordBonusCount = 0;
        let score = 0;
        // get word text, replacing "" with the character "_"
        let wordText = word.map(cell => grid[cell[0]][cell[1]].content === '' ? '_' : grid[cell[0]][cell[1]].content).join('');
        // if each index is filled
        if (word.every(cell => grid[cell[0]][cell[1]].content !== '')) {
            // check if word in valid words
            if (validWords.includes(wordText.toLowerCase())) {
                for (let cell of word) {
                    let [row, col] = cell;
                    if (grid[row][col].type === 'letter-bonus') {
                        score += SCRABBLE_VALUES[grid[row][col].content] * 2;
                    } else {
                        score += SCRABBLE_VALUES[grid[row][col].content];
                    }
                    if (grid[row][col].type === 'word-bonus') {
                        wordBonusCount++;
                    }
                }
                scores.push([wordText,score*(2**wordBonusCount)]);
            } else {
                scores.push([wordText,0]);
                continue;
            }
        } else {
            scores.push([wordText,0]);
            continue;
        }
        
    }
    return scores;
}

// add event listener for keyboard clicks
keyboardElement.addEventListener('click', function (event) {
    const keyElement = event.target.closest('.keyboard-button');
    // dispatch keyboard event
    if (keyElement) {
        const key = keyElement.textContent;
        // if is a letter key, dispatch keydown event
        if (key.length === 1) {
            const event = new KeyboardEvent('keydown', { key });
            document.dispatchEvent(event);
        } else {
            if (key === "Tab") {
                const event = new KeyboardEvent('keydown', { key });
                document.dispatchEvent(event);
            } else if (key === "Del") {
                const event = new KeyboardEvent('keydown', { key: "Backspace" });
                document.dispatchEvent(event);
            } else if (key === "Submit") {
                if (gameState === gameStates[0]) {
                    // get letters from selected cells
                    let word = Array.from(gridElement.querySelectorAll('.input-select .grid-cell-front')).map(cell => cell.textContent).join('');
                    if (word.length < selectedSet.size || word.length === 0) {
                        return;
                    } else {
                        // set editable to false for cells in playerGrid corresponding to selected cells
                        gridElement.querySelectorAll('.input-select').forEach(cell => {
                            // get coordinates of selected cell
                            let cellIndex = Array.from(cell.parentNode.parentNode.children).indexOf(cell.parentNode);
                            let cellRow = Math.floor(cellIndex / gridWidth);
                            let cellCol = cellIndex % gridWidth;
                            // set content of cellObject in playerGrid
                            playerGrid[cellRow][cellCol].editable = false;
                            // add locked-in class
                            cell.classList.add('locked-in');
                        });
                        // player flip phase
                        gameState = gameStates[1];
                        gridElement.querySelectorAll('.input-cursor').forEach(cell => {
                            cell.classList.remove('input-cursor');
                        });
                        gridElement.querySelectorAll('.input-select').forEach(cell => {
                            cell.classList.remove('input-select');
                        });
                        toolTipTextElement.textContent = flipToolTip;
                    }
                    
                } else if (gameState === gameStates[1]) {
                    
                    
                    flipCells(gridElement.querySelectorAll('.selected'));

                    // AI turn
                    gameState = gameStates[2];
                    toolTipTextElement.textContent = "My turn...";

                    if (aiGrid.every(row => row.every(cell => !cell.editable))) {
                        checkForGameOver();
                    } else {
                        let posssibleWordIndices = getPossibleWordIndices(aiGrid);
                        // while all of the indices are filled
                        let wordInds = null;
                        wordInds = posssibleWordIndices[Math.floor(Math.random() * posssibleWordIndices.length)];
                        while (posssibleWordIndices.every(word => wordInds.every(cell => aiGrid[cell[0]][cell[1]].content !== ''))) {
                            // get random word
                            wordInds = posssibleWordIndices[Math.floor(Math.random() * posssibleWordIndices.length)];
                        }
                        console.log(wordInds);
                        // get valid words of the same length
                        let possibleWords = validWords.filter(word => word.length === wordInds.length);
                        // for each cell in the word
                        for (let wordInd = 0; wordInd < wordInds.length; wordInd++) {
                            let [row, col] = wordInds[wordInd];
                            if (aiGrid[row][col].content !== '') {
                                // remove words from possibleWords that do not have the same letter at the same index
                                possibleWords = possibleWords.filter(word => word[wordInd] === aiGrid[row][col].content.toLowerCase());
                            }
                        }
                        // if possibleWords is empty
                        if (possibleWords.length === 0) {
                            console.log("No possible words found.");
                            // fill empty cells with random letters
                            for (let cell of wordInds) {
                                let [row, col] = cell;
                                if (aiGrid[row][col].content === '') {
                                    aiGrid[row][col].content = String.fromCharCode(65 + Math.floor(Math.random() * 26)).toUpperCase();
                                    // set content of cellObject in playerGrid
                                    aiGrid[row][col].editable = false;
                                    // add locked-in class to cellElement
                                    gridElement.children[row * gridWidth + col].children[0].classList.add('locked-in');
                                }
                            }
                        } else {
                            // pick a random word from the list of possible words
                            let randomWord = possibleWords[Math.floor(Math.random() * possibleWords.length)];
                            console.log(randomWord);
                            // fill empty cells with letters from randomWord
                            for (let wordInd = 0; wordInd < wordInds.length; wordInd++) {
                                let [row, col] = wordInds[wordInd];
                                if (aiGrid[row][col].content === '') {
                                    aiGrid[row][col].content = randomWord[wordInd].toUpperCase();
                                    // set content of cellObject in playerGrid
                                    aiGrid[row][col].editable = false;
                                    // add locked-in class to cellElement
                                    gridElement.children[row * gridWidth + col].children[0].classList.add('locked-in');
                                }
                            }
                        }
                        
                    }
                    
                    // if all cells are flipped
                    if (!(playerGrid.every(row => row.every(cell => cell.flipped)))) {
                        // highlight cell
                        let el = null;
                        setTimeout(() => {
                            let row = Math.floor(Math.random() * gridLength);
                            let col = Math.floor(Math.random() * gridWidth);
                            while (playerGrid[row][col].flipped) {
                                row = Math.floor(Math.random() * gridLength);
                                col = Math.floor(Math.random() * gridWidth);
                            }
                            el = gridElement.children[row * gridWidth + col];
                            el.children[0].classList.add('selected');
                        }, 500);

                        // set timeout
                        setTimeout(() => {
                            flipCells([el.children[0]]);
                        }, 2200);
                    }

                    // set timeout
                    setTimeout(() => {
                        gameState = gameStates[0];
                        toolTipTextElement.textContent = "Enter a word...";
                        // if the playergrid has no editable cells
                        if (playerGrid.every(row => row.every(cell => !cell.editable))) {
                            // go to player flip phase
                            gameState = gameStates[1];
                            toolTipTextElement.textContent = "No empty cells. " + flipToolTip;
                            checkForGameOver();
                        }
                    }, 2500);
                    
                } else if (gameState === gameStates[2]) {

                } else if (gameState === gameStates[3]) {

                } else if (gameState === gameStates[4]) {

                }
            }
        }
    }
});

function flipCells(cells) {
    let flippedIndices = [];
    for (let cell of cells) {
        cell.style.transform = 'rotateY(180deg)';
        let cellIndex = Array.from(cell.parentNode.parentNode.children).indexOf(cell.parentNode);
        let cellRow = Math.floor(cellIndex / gridWidth);
        let cellCol = cellIndex % gridWidth;
        flippedIndices.push(`${cellRow},${cellCol}`);
    }
    for (let ind of flippedIndices) {
        let [cellRow, cellCol] = ind.split(',').map(Number);
        // flip cellObject in playerGrid and aiGrid
        playerGrid[cellRow][cellCol].flipped = true;
        aiGrid[cellRow][cellCol].flipped = true;
        // exchange front and back objects
        let temp = playerGrid[cellRow][cellCol];
        playerGrid[cellRow][cellCol] = aiGrid[cellRow][cellCol];
        aiGrid[cellRow][cellCol] = temp;
        // set transform to 0deg
        gridElement.children[cellRow * gridWidth + cellCol].style.transform = 'rotateY(0deg)';
        updateScoreboard();
    }
    gridElement.querySelectorAll('.selected').forEach(cell => {
        cell.classList.remove('selected');
    });
    // set timeout
    setTimeout(() => {
        renderGrid(playerGrid, aiGrid);
    }, 300);
}

// listener for keyboard
document.addEventListener('keydown', function (event) {
    // if is a letter key
    if (gameState === gameStates[0] && editableInds.length > 0) {
        let [row, col] = editableInds[inputIndex].split(',').map(Number);
        if (event.key.match(/[a-z]/i) && event.key.length === 1) {
            playerGrid[row][col].content = event.key.toUpperCase();
            renderGrid(playerGrid, aiGrid);
            // increment inputIndex
            inputIndex = (inputIndex + 1) % editableInds.length;
            const [nextRow, nextCol] = editableInds[inputIndex].split(',').map(Number);
            highlightInput(nextRow, nextCol, isRowSelected);
        } else if (event.key === "Tab" || ((event.key === "ArrowUp" || event.key === "ArrowDown") & isRowSelected) || ((event.key === "ArrowLeft" || event.key === "ArrowRight") & !isRowSelected)) {
            // prevent default
            event.preventDefault();
            // simulate click on selected cell
            gridElement.children[row * gridWidth + col].click();
        } else if (event.key === "Backspace") {
            playerGrid[row][col].content = '';
            renderGrid(playerGrid, aiGrid);
            // decrement inputIndex
            inputIndex = (inputIndex - 1 + editableInds.length) % editableInds.length;
            const [nextRow, nextCol] = editableInds[inputIndex].split(',').map(Number);
            highlightInput(nextRow, nextCol, isRowSelected);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            // prevent default
            event.preventDefault();
            // decrement inputIndex
            inputIndex = (inputIndex - 1 + editableInds.length) % editableInds.length;
            const [nextRow, nextCol] = editableInds[inputIndex].split(',').map(Number);
            highlightInput(nextRow, nextCol, isRowSelected);
        } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            // prevent default
            event.preventDefault();
            // increment inputIndex
            inputIndex = (inputIndex + 1) % editableInds.length;
            const [nextRow, nextCol] = editableInds[inputIndex].split(',').map(Number);
            highlightInput(nextRow, nextCol, isRowSelected);
        }
        updateScoreboard();
    }
    if (event.key === "Enter") {
        // simulate click on check-button id
        document.getElementById('check-button').click();
    }
    if (gameState === gameStates[3]) {
        if (event.key === "Tab") {
            // toggle isPlayerSide
            isPlayerSide = !isPlayerSide;
            if (isPlayerSide) {
                renderGrid(playerGrid, aiGrid);
                toolTipTextElement.textContent = "Player's grid...";
            } else {
                renderGrid(aiGrid, playerGrid);
                toolTipTextElement.textContent = "My grid...";
            }
        }
    }
});

// --- Game Initialization ---
function init() {
    // set root --num_cols variable in css file
    document.documentElement.style.setProperty('--num_cols', gridWidth);
    playerGrid = generateRandomGrid(gridWidth, gridLength, true);
    aiGrid = generateRandomGrid(gridWidth, gridLength, false);
    renderGrid(playerGrid, aiGrid);
    updateScoreboard();
}

init(); // Start the game