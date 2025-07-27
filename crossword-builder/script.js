class CrosswordBuilder {
    constructor() {
        this.gridSize = 15; // Default to 15x15
        this.grid = [];
        this.placedWords = [];
        this.selectedWord = null;
        this.clues = { across: [], down: [] };
        this.solvedClues = new Set();
        
        // Track black squares by their source
        this.blackPreceding = new Set(); // Black squares from number placement (preceding constraints)
        this.blackTerminal = new Set();  // Black squares from answer placement (terminal constraints)
        this.blackManual = new Set();    // Black squares manually placed by user
        
        this.init();
    }
    
    init() {
        console.log('Initializing CrosswordBuilder...');
        this.createGrid();
        this.loadClues();
        this.setupEventListeners();
        this.setupGridSizeSelector();
        console.log('CrosswordBuilder initialized');
    }
    
    createGrid() {
        console.log('Creating grid...');
        const gridElement = document.getElementById('crossword-grid');
        gridElement.innerHTML = '';
        
        // Calculate cell size to fit the grid in a reasonable space
        const maxGridSize = 600; // Maximum grid width/height in pixels
        const cellSize = Math.floor(maxGridSize / this.gridSize);
        
        // Set the grid template to match the current grid size with calculated cell size
        gridElement.style.gridTemplateColumns = `repeat(${this.gridSize}, ${cellSize}px)`;
        gridElement.style.gridTemplateRows = `repeat(${this.gridSize}, ${cellSize}px)`;
        console.log(`Grid template set to: ${this.gridSize}x${this.gridSize} with ${cellSize}px cells`);
        
        // Update clue container heights to match grid height
        this.updateClueContainerHeights(cellSize);
        
        // Store cell size for use in other methods
        this.currentCellSize = cellSize;
        
        // Update font sizes based on cell size
        this.updateFontSizes(cellSize);
        
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.draggable = true;
                
                gridElement.appendChild(cell);
                this.grid[row][col] = {
                    element: cell,
                    letter: null,
                    number: null,
                    isBlack: false,
                    blackSource: null, // 'preceding' or 'terminal' or null
                    words: [] // Track which words use this cell
                };
            }
        }
        // Log the number of cells created
        const cellCount = gridElement.querySelectorAll('.cell').length;
        console.log('Grid created with', cellCount, 'cells');
    }
    
    setupGridSizeSelector() {
        const gridSizeSelect = document.getElementById('grid-size');
        if (gridSizeSelect) {
            // Set the current grid size in the selector
            gridSizeSelect.value = this.gridSize.toString();
            
            // Add event listener for grid size changes
            gridSizeSelect.addEventListener('change', (e) => {
                const newSize = parseInt(e.target.value);
                if (newSize !== this.gridSize) {
                    this.changeGridSize(newSize);
                }
            });
        }
    }
    
    changeGridSize(newSize) {
        // Clear all data
        this.grid = [];
        this.placedWords = [];
        this.selectedWord = null;
        this.blackPreceding.clear();
        this.blackTerminal.clear();
        this.blackManual.clear();
        
        // Update grid size
        this.gridSize = newSize;
        
        // Recreate the grid
        this.createGrid();
        
        // Update clue container heights
        this.updateClueContainerHeights();
        
        console.log(`Grid size changed to ${newSize}x${newSize}`);
    }
    
    updateClueContainerHeights(cellSize = 30) {
        const gridHeight = this.gridSize * cellSize + 20; // cellSize per cell + 20px padding
        const acrossClues = document.getElementById('across-clues');
        const downClues = document.getElementById('down-clues');
        
        if (acrossClues) {
            acrossClues.style.height = `${gridHeight}px`;
            console.log(`Set across clues height to ${gridHeight}px`);
        }
        if (downClues) {
            downClues.style.height = `${gridHeight}px`;
            console.log(`Set down clues height to ${gridHeight}px`);
        }
    }
    
    updateFontSizes(cellSize) {
        // Calculate font sizes based on cell size
        const letterFontSize = Math.max(8, Math.min(16, cellSize * 0.4));
        const numberFontSize = Math.max(8, Math.min(14, cellSize * 0.3));
        
        // Update CSS custom properties
        document.documentElement.style.setProperty('--letter-font-size', `${letterFontSize}px`);
        document.documentElement.style.setProperty('--number-font-size', `${numberFontSize}px`);
        
        console.log(`Updated font sizes: letters=${letterFontSize}px, numbers=${numberFontSize}px`);
    }
    
    async loadClues() {
        console.log('Loading clues from input.json...');
        try {
            const response = await fetch('input.json');
            const data = await response.json();

            // New format: data.across and data.down are arrays of strings like '1. Clue text'
            this.clues.across = data.across.map(str => {
                const match = str.match(/^(\d+)\.\s*(.*)$/);
                return match ? { number: parseInt(match[1]), clue: match[2], length: null } : null;
            }).filter(Boolean);
            this.clues.down = data.down.map(str => {
                const match = str.match(/^(\d+)\.\s*(.*)$/);
                return match ? { number: parseInt(match[1]), clue: match[2], length: null } : null;
            }).filter(Boolean);

            this.renderClueList('across-clues', this.clues.across);
            this.renderClueList('down-clues', this.clues.down);
            console.log('Clues loaded from input.json');
        } catch (err) {
            console.error('Failed to load clues from input.json:', err);
        }
    }
    
    renderWordList(containerId, words) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        words.forEach(wordData => {
            const wordElement = document.createElement('div');
            wordElement.className = 'word-item';
            wordElement.dataset.word = wordData.word;
            wordElement.dataset.number = wordData.number;
            wordElement.dataset.direction = containerId.includes('across') ? 'across' : 'down';
            
            wordElement.innerHTML = `
                <span class="word-number">${wordData.number}.</span>
                <span class="word-text">${wordData.word}</span>
            `;
            
            container.appendChild(wordElement);
        });
        console.log('Rendered', words.length, 'words in', containerId);
    }

    renderClueList(containerId, clues) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        clues.forEach(clueData => {
            const clueElement = document.createElement('div');
            clueElement.className = 'clue-item';
            clueElement.dataset.number = clueData.number;
            clueElement.dataset.direction = containerId.includes('across') ? 'across' : 'down';
            clueElement.innerHTML = `
                <span class="clue-number">${clueData.number}.</span>
                <span class="clue-text">${clueData.clue}</span>
            `;
            container.appendChild(clueElement);
        });
        console.log('Rendered', clues.length, 'clues in', containerId);
    }

    solveClue(clueElement) {
        const number = parseInt(clueElement.dataset.number);
        const direction = clueElement.dataset.direction;
        
        // Prompt user for answer
        const clueText = clueElement.querySelector('.clue-text').textContent;
        const promptMsg = `Enter answer for ${number}${direction === 'across' ? 'A' : 'D'}: ${clueText}`;
        const userAnswer = prompt(promptMsg);
        
        if (userAnswer !== null) {
            const answer = userAnswer.toUpperCase().trim();
            
            // Remove previous answer from the grid if it exists
            const prevWordElement = document.querySelector(`#${direction}-words .word-item[data-number='${number}']`);
            if (prevWordElement) {
                // If the previous answer is on the grid, remove it
                if (prevWordElement.classList.contains('placed')) {
                    // Find the placed word in placedWords
                    const placedWord = this.placedWords.find(w => w.number === number && w.direction === direction);
                    if (placedWord) {
                        this.removeWord(placedWord.startRow, placedWord.startCol, direction);
                    }
                }
                // Remove the previous word element from the list
                prevWordElement.remove();
            }
            
            // Mark clue as solved and update its display
            clueElement.classList.add('solved');
            clueElement.dataset.answer = answer;
            this.solvedClues.add(`${direction}-${number}`);
            
            // Update clue display to show answer
            const clueTextEl = clueElement.querySelector('.clue-text');
            clueTextEl.innerHTML = `${clueTextEl.textContent} <span class="clue-answer">→ ${answer}</span>`;
            
            // Move solved clue to bottom of list
            const container = clueElement.parentElement;
            container.appendChild(clueElement);
            
            // Add or update user's answer in the word list
            const wordData = {
                number: number,
                word: answer,
                direction: direction
            };
            
            // Find the word list container
            const containerId = `${direction}-words`;
            const wordContainer = document.getElementById(containerId);
            
            // Create word element
            const wordElement = document.createElement('div');
            wordElement.className = 'word-item';
            wordElement.dataset.word = wordData.word;
            wordElement.dataset.number = wordData.number;
            wordElement.dataset.direction = wordData.direction;
            
            wordElement.innerHTML = `
                <span class="word-number">${wordData.number}.</span>
                <span class="word-text">${wordData.word}</span>
            `;
            
            wordContainer.appendChild(wordElement);
            
            console.log('Solved clue:', number, direction, 'User answer:', answer);
        }
        this.resortClues(direction);
        this.resortAnswers(direction);
    }
    
    setupEventListeners() {
        console.log('Setting up event listeners...');
        // Clue click: prompt for answer, display next to clue, mark as answered
        document.addEventListener('click', (e) => {
            // Clue click
            let clueElement = e.target;
            while (clueElement && !clueElement.classList.contains('clue-item')) {
                clueElement = clueElement.parentElement;
            }
            if (clueElement && clueElement.classList.contains('clue-item')) {
                const number = parseInt(clueElement.dataset.number);
                const direction = clueElement.dataset.direction;
                const clueData = (direction === 'across' ? this.clues.across : this.clues.down).find(c => c.number === number);
                const clueText = clueElement.querySelector('.clue-text').textContent;
                const promptMsg = `Enter answer for ${number}${direction === 'across' ? 'A' : 'D'}: ${clueText}`;
                const userAnswer = prompt(promptMsg);
                const answer = userAnswer ? userAnswer.toUpperCase().trim() : '';
                if (userAnswer !== null) {
                    // Validate answer length (must be at least 3 letters)
                    if (answer !== '' && answer.replace(/\s+/g, '').length < 3) {
                        alert('Answers must be at least 3 letters long.');
                        return;
                    }
                    
                    // Check if the number is already on the grid
                    let numberOnGrid = false;
                    let gridRow = -1, gridCol = -1;
                    for (let r = 0; r < this.gridSize; r++) {
                        for (let c = 0; c < this.gridSize; c++) {
                            const cell = this.grid[r][c];
                            if (cell.number && cell.number.toString().split(',').includes(number.toString())) {
                                numberOnGrid = true;
                                gridRow = r;
                                gridCol = c;
                                break;
                            }
                        }
                        if (numberOnGrid) break;
                    }
                    
                    if (!numberOnGrid) {
                        // Number not on grid - handle empty answer case
                        if (answer === '') {
                            // Clear the answer but don't affect the grid structure
                            delete clueData.userAnswer;
                            clueElement.classList.remove('solved', 'answered');
                            clueElement.dataset.answer = '';
                            // Restore clue text
                            const clueTextEl = clueElement.querySelector('.clue-text');
                            clueTextEl.innerHTML = clueData.clue;
                            this.updateClueOnGridStates();
                            return;
                        }
                    }
                    
                    if (numberOnGrid) {
                        // Number is on grid - handle answer replacement
                        const oldPlaced = this.placedWords.find(w => w.number === number && w.direction === direction);
                        const oldAnswer = oldPlaced ? oldPlaced.word : null;
                        
                        // Remove old answer if it exists
                        if (oldPlaced) {
                            this.removeWord(oldPlaced.startRow, oldPlaced.startCol, direction);
                        }
                        
                        // Try to place new answer
                        if (answer === '' || this.canPlaceAnswerAt(gridRow, gridCol, direction, answer.replace(/\s+/g, ''), number)) {
                            // New answer fits (or is empty) - place it
                            if (answer !== '') {
                                clueData.userAnswer = answer;
                                clueElement.classList.add('solved');
                                clueElement.classList.add('answered');
                                clueElement.dataset.answer = answer;
                                const clueTextEl = clueElement.querySelector('.clue-text');
                                clueTextEl.innerHTML = `${clueData.clue} <span class="clue-answer">→ ${answer}</span>`;
                                this.placeAnswerAt(gridRow, gridCol, direction, answer.replace(/\s+/g, ''), number);
                            } else {
                                // Empty answer - clear the clue
                                delete clueData.userAnswer;
                                clueElement.classList.remove('solved', 'answered');
                                clueElement.dataset.answer = '';
                                const clueTextEl = clueElement.querySelector('.clue-text');
                                clueTextEl.innerHTML = clueData.clue;
                            }
                            this.updateNumberColors();
                            this.updateClueOnGridStates();
                        } else {
                            // New answer doesn't fit - restore old answer
                            if (oldAnswer) {
                                clueData.userAnswer = oldAnswer;
                                clueElement.classList.add('solved');
                                clueElement.classList.add('answered');
                                clueElement.dataset.answer = oldAnswer;
                                const clueTextEl = clueElement.querySelector('.clue-text');
                                clueTextEl.innerHTML = `${clueData.clue} <span class="clue-answer">→ ${oldAnswer}</span>`;
                                this.placeAnswerAt(gridRow, gridCol, direction, oldAnswer, number);
                                this.updateNumberColors();
                            }
                            alert('That answer cannot be placed on the grid at the existing numbered cell.');
                            return;
                        }
                    } else {
                        // Number not on grid - just store answer and update clue display
                        clueData.userAnswer = answer;
                        clueElement.classList.add('solved');
                        clueElement.classList.add('answered');
                        clueElement.dataset.answer = answer;
                        const clueTextEl = clueElement.querySelector('.clue-text');
                        clueTextEl.innerHTML = `${clueData.clue} <span class="clue-answer">→ ${answer}</span>`;
                    }
                }
                return;
            }
            // Grid cell click: prompt for clue number, label cell (no answer required)
            let cellElement = e.target;
            while (cellElement && !cellElement.classList.contains('cell')) {
                cellElement = cellElement.parentElement;
            }
            if (cellElement && cellElement.classList.contains('cell')) {
                const row = parseInt(cellElement.dataset.row);
                const col = parseInt(cellElement.dataset.col);
                const cell = this.grid[row][col];
                
                // If cell already has a number, offer to remove it
                if (cell.number) {
                    const number = parseInt(cell.number.toString().split(',')[0]);
                    const remove = confirm(`Remove number ${number} from this cell?`);
                    if (remove) {
                        // Remove across answer if present
                        const acrossWord = this.placedWords.find(w => w.number === number && w.direction === 'across' && w.startRow === row && w.startCol === col);
                        if (acrossWord) this.removeWord(row, col, 'across');
                        // Remove down answer if present
                        const downWord = this.placedWords.find(w => w.number === number && w.direction === 'down' && w.startRow === row && w.startCol === col);
                        if (downWord) this.removeWord(row, col, 'down');
                        
                        // Remove preceding black squares associated with this number
                        const acrossClue = this.clues.across.find(c => c.number === number);
                        const downClue = this.clues.down.find(c => c.number === number);
                        if (acrossClue) {
                            this.removeBlackSquare(row, col - 1, 'preceding');
                        }
                        if (downClue) {
                            this.removeBlackSquare(row - 1, col, 'preceding');
                        }
                        
                        // Remove number label
                        cell.number = null;
                        const numberSpan = cell.element.querySelector('.number');
                        if (numberSpan) numberSpan.remove();
                        this.updateNumberColors();
                        this.updateClueOnGridStates();
                        
                        // Log grid state after removing number
                        // this.logGridState();
                        // this.logGridArray();
                    }
                    return;
                }
                
                // Prompt for clue number
                let number = prompt('Enter the clue number to place here:');
                if (!number) return;
                number = parseInt(number);
                if (isNaN(number) || number <= 0) {
                    alert('Invalid number.');
                    return;
                }
                
                // Validate number ordering
                if (!this.isValidNumberPlacement(row, col, number)) {
                    alert('Invalid number placement: numbers must increase monotonically from left to right in each row, and numbers in each row must be smaller than those above and larger than those below.');
                    return;
                }
                
                // Check if number is already used elsewhere (for labeling)
                for (let r = 0; r < this.gridSize; r++) {
                    for (let c = 0; c < this.gridSize; c++) {
                        if ((r !== row || c !== col) && this.grid[r][c].number && this.grid[r][c].number.toString().split(',').includes(number.toString())) {
                            alert('That number is already used elsewhere.');
                            return;
                        }
                    }
                }
                // Check if this number has associated clues
                const acrossClue = this.clues.across.find(c => c.number === number);
                const downClue = this.clues.down.find(c => c.number === number);
                
                // Check if we can place the required preceding black squares
                let canPlacePreceding = true;
                if (acrossClue) {
                    // Need black square to the left
                    if (!this.canPlaceBlackSquare(row, col - 1)) {
                        canPlacePreceding = false;
                    }
                }
                if (downClue) {
                    // Need black square above
                    if (!this.canPlaceBlackSquare(row - 1, col)) {
                        canPlacePreceding = false;
                    }
                }
                
                if (!canPlacePreceding) {
                    alert('Cannot place number here: required preceding black squares cannot be placed.');
                    return;
                }
                
                // Check minimum word spacing requirements
                if (!this.isValidWordSpacing(row, col, number)) {
                    // Remove the preceding black squares we just added
                    if (acrossClue) {
                        this.removeBlackSquare(row, col - 1, 'preceding');
                    }
                    if (downClue) {
                        this.removeBlackSquare(row - 1, col, 'preceding');
                    }
                    alert('Cannot assign this number here: minimum word spacing requirements are not met.');
                    return;
                }
                
                // Before labeling the cell, check if any existing answers for this number cannot be placed here
                let canAssign = true;
                ['across', 'down'].forEach(direction => {
                    const clueData = (direction === 'across' ? this.clues.across : this.clues.down).find(c => c.number === number);
                    if (clueData && clueData.userAnswer) {
                        const word = clueData.userAnswer.replace(/\s+/g, '');
                        if (!this.canPlaceAnswerAt(row, col, direction, word, number)) {
                            canAssign = false;
                        }
                    }
                });
                if (!canAssign) {
                    alert('Cannot assign this number here: one or more answers for this clue number cannot be placed at this location.');
                    return;
                }
                
                // All validation passed - now actually place the preceding black squares
                if (acrossClue) {
                    this.setBlackSquare(row, col - 1, 'preceding');
                }
                if (downClue) {
                    this.setBlackSquare(row - 1, col, 'preceding');
                }
                
                // Label the cell (no answer required)
                cell.number = number;
                let numberSpan = cell.element.querySelector('.number');
                if (!numberSpan) {
                    numberSpan = document.createElement('span');
                    numberSpan.className = 'number';
                    numberSpan.textContent = number;
                    // Insert number before letter if letter exists
                    const letterSpan = cell.element.querySelector('.letter');
                    if (letterSpan) {
                        cell.element.insertBefore(numberSpan, letterSpan);
                    } else {
                        cell.element.appendChild(numberSpan);
                    }
                } else {
                    numberSpan.textContent = number;
                }
                this.updateNumberColors();
                // If answers for this number already exist, place them immediately (try both directions)
                ['across', 'down'].forEach(direction => {
                    const clueData = (direction === 'across' ? this.clues.across : this.clues.down).find(c => c.number === number);
                    if (clueData && clueData.userAnswer) {
                        const word = clueData.userAnswer.replace(/\s+/g, '');
                        if (this.canPlaceAnswerAt(row, col, direction, word, number)) {
                            this.placeAnswerAt(row, col, direction, word, number);
                        }
                    }
                });
                
                // Log grid state after placing number
                // this.logGridState();
                // this.logGridArray();
            }
                });
        
        // Right-click context menu for grid operations
        document.addEventListener('contextmenu', (e) => {
            let cellElement = e.target;
            while (cellElement && !cellElement.classList.contains('cell')) {
                cellElement = cellElement.parentElement;
            }
            if (cellElement && cellElement.classList.contains('cell')) {
                e.preventDefault();
                this.showGridContextMenu(e, cellElement);
            }
        });
        
        // Hide context menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                this.hideContextMenu();
            }
        });
        
        console.log('Event listeners set up');
    }

    // New method to validate number placement
    isValidNumberPlacement(row, col, number) {
        // Check if this number would violate the monotonic ordering rules
        
        // Get all numbered cells in the grid
        const numberedCells = [];
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = this.grid[r][c];
                if (cell.number && !(r === row && c === col)) { // Exclude the cell we're placing
                    numberedCells.push({ row: r, col: c, number: parseInt(cell.number.toString().split(',')[0]) });
                }
            }
        }
        
        // Add the new number to the list for validation
        numberedCells.push({ row: row, col: col, number: number });
        
        // Check each row for monotonic ordering (left to right)
        for (let r = 0; r < this.gridSize; r++) {
            const rowNumbers = numberedCells.filter(cell => cell.row === r).sort((a, b) => a.col - b.col);
            for (let i = 1; i < rowNumbers.length; i++) {
                if (rowNumbers[i].number <= rowNumbers[i-1].number) {
                    return false; // Not monotonically increasing
                }
            }
        }
        
        // Check cross-row ordering rules
        for (let r = 0; r < this.gridSize; r++) {
            const rowNumbers = numberedCells.filter(cell => cell.row === r).sort((a, b) => a.col - b.col);
            if (rowNumbers.length === 0) continue;
            
            const smallestInRow = rowNumbers[0].number;
            const largestInRow = rowNumbers[rowNumbers.length - 1].number;
            
            // Check against row above
            if (r > 0) {
                const rowAboveNumbers = numberedCells.filter(cell => cell.row === r - 1).sort((a, b) => a.col - b.col);
                if (rowAboveNumbers.length > 0) {
                    const largestInRowAbove = rowAboveNumbers[rowAboveNumbers.length - 1].number;
                    if (smallestInRow <= largestInRowAbove) {
                        return false; // Smallest number in this row must be larger than largest in row above
                    }
                }
            }
            
            // Check against row below
            if (r < this.gridSize - 1) {
                const rowBelowNumbers = numberedCells.filter(cell => cell.row === r + 1).sort((a, b) => a.col - b.col);
                if (rowBelowNumbers.length > 0) {
                    const smallestInRowBelow = rowBelowNumbers[0].number;
                    if (largestInRow >= smallestInRowBelow) {
                        return false; // Largest number in this row must be smaller than smallest in row below
                    }
                }
            }
        }
        
        return true;
    }
    
    showGridContextMenu(e, cellElement) {
        const row = parseInt(cellElement.dataset.row);
        const col = parseInt(cellElement.dataset.col);
        
        // Check if row/column can be deleted (has content)
        const canDeleteRow = this.canDeleteRow(row);
        const canDeleteCol = this.canDeleteColumn(col);
        
        // Check if we can insert (find empty row/column)
        const emptyRowIndex = this.findEmptyRow();
        const emptyColIndex = this.findEmptyColumn();
        const canInsertRow = emptyRowIndex !== -1;
        const canInsertCol = emptyColIndex !== -1;
        
        // Additional restrictions for insert operations
        const isRightmostCol = (col === this.gridSize - 1);
        const isPenultimateRightCol = (col === this.gridSize - 2);
        const isBottomRow = (row === this.gridSize - 1);
        const isPenultimateBottomRow = (row === this.gridSize - 2);
        
        // Disable specific insert operations
        const canInsertRowAbove = canInsertRow && !isBottomRow;
        const canInsertRowBelow = canInsertRow && !isBottomRow && !isPenultimateBottomRow;
        const canInsertColLeft = canInsertCol && !isRightmostCol;
        const canInsertColRight = canInsertCol && !isRightmostCol && !isPenultimateRightCol;
        
        // Disable delete operations for edge rows/columns
        const canDeleteRowOption = canDeleteRow && !isBottomRow;
        const canDeleteColOption = canDeleteCol && !isRightmostCol;
        
        // Create context menu
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.position = 'absolute';
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
        menu.style.backgroundColor = 'white';
        menu.style.border = '1px solid #ccc';
        menu.style.borderRadius = '4px';
        menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        menu.style.zIndex = '1000';
        menu.style.padding = '4px 0';
        
        // Build menu items array, only including enabled options
        const menuItems = [];
        
        // Always include toggle black square at the top
        menuItems.push({ text: 'Toggle Black Square', action: () => this.toggleManualBlackSquare(cellElement) });
        
        if (canInsertRowAbove) {
            menuItems.push({ text: 'Insert Row Above', action: () => this.insertRow(row) });
        }
        if (canInsertRowBelow) {
            menuItems.push({ text: 'Insert Row Below', action: () => this.insertRow(row + 1) });
        }
        if (canInsertColLeft) {
            menuItems.push({ text: 'Insert Column Left', action: () => this.insertColumn(col) });
        }
        if (canInsertColRight) {
            menuItems.push({ text: 'Insert Column Right', action: () => this.insertColumn(col + 1) });
        }
        if (canDeleteRowOption) {
            menuItems.push({ text: 'Delete Row', action: () => this.deleteRow(row) });
        }
        if (canDeleteColOption) {
            menuItems.push({ text: 'Delete Column', action: () => this.deleteColumn(col) });
        }
        
        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.style.padding = '8px 16px';
            menuItem.style.cursor = 'pointer';
            menuItem.style.color = '#333';
            menuItem.style.fontSize = '14px';
            menuItem.textContent = item.text;
            
            menuItem.addEventListener('click', () => {
                item.action();
                this.hideContextMenu();
            });
            menuItem.addEventListener('mouseenter', () => {
                menuItem.style.backgroundColor = '#f0f0f0';
            });
            menuItem.addEventListener('mouseleave', () => {
                menuItem.style.backgroundColor = 'white';
            });
            
            menu.appendChild(menuItem);
        });
        
        document.body.appendChild(menu);
        this.currentContextMenu = menu;
    }
    
    hideContextMenu() {
        if (this.currentContextMenu) {
            this.currentContextMenu.remove();
            this.currentContextMenu = null;
        }
    }
    
    canDeleteRow(row) {
        // Check if this is an edge row (top or bottom)
        const isEdgeRow = (row === 0 || row === this.gridSize - 1);
        
        for (let col = 0; col < this.gridSize; col++) {
            const cell = this.grid[row][col];
            if (!cell) continue; // Skip undefined cells
            
            // If it's an edge row, only allow black squares or empty cells
            if (isEdgeRow) {
                if (cell.letter || cell.number) {
                    return false; // Edge rows can't have letters or numbers
                }
                // Black squares and empty cells are allowed for edge rows
            } else {
                // For non-edge rows, any content prevents deletion
                if (cell.letter || cell.number || cell.isBlack) {
                    return false;
                }
            }
        }
        return true;
    }
    
    canDeleteColumn(col) {
        // Check if this is an edge column (leftmost or rightmost)
        const isEdgeColumn = (col === 0 || col === this.gridSize - 1);
        
        for (let row = 0; row < this.gridSize; row++) {
            const cell = this.grid[row][col];
            if (!cell) continue; // Skip undefined cells
            
            // If it's an edge column, only allow black squares or empty cells
            if (isEdgeColumn) {
                if (cell.letter || cell.number) {
                    return false; // Edge columns can't have letters or numbers
                }
                // Black squares and empty cells are allowed for edge columns
            } else {
                // For non-edge columns, any content prevents deletion
                if (cell.letter || cell.number || cell.isBlack) {
                    return false;
                }
            }
        }
        return true;
    }
    
    findEmptyRow() {
        for (let row = this.gridSize - 1; row >= 0; row--) {
            if (this.canDeleteRow(row)) {
                return row;
            }
        }
        return -1;
    }
    
    findEmptyColumn() {
        for (let col = this.gridSize - 1; col >= 0; col--) {
            if (this.canDeleteColumn(col)) {
                return col;
            }
        }
        return -1;
    }
    
    insertRow(insertAfterRow) {
        // Find the rightmost empty row and delete it
        const emptyRowIndex = this.findEmptyRow();
        if (emptyRowIndex === -1) return;
        
        // Delete the empty row first
        this.deleteRow(emptyRowIndex);
        
        // Now insert the new row at the specified position
        this.insertRowAt(insertAfterRow);
    }
    
    insertColumn(insertAfterCol) {
        // Find the rightmost empty column and delete it
        const emptyColIndex = this.findEmptyColumn();
        if (emptyColIndex === -1) return;
        
        // Delete the empty column first
        this.deleteColumn(emptyColIndex);
        
        // Now insert the new column at the specified position
        this.insertColumnAt(insertAfterCol);
    }
    
    insertRowAt(rowIndex) {
        // Check if bottom row is completely empty
        if (!this.canDeleteRow(this.gridSize - 1)) {
            alert('Cannot insert row: bottom row is not completely empty');
            return;
        }
        
        // Update row indices for all content at row >= rowIndex
        // This already handles the grid array shifting
        this.updateRowIndices(rowIndex, 1);
        
        // Completely rebuild the visual grid
        this.rebuildVisualGrid();
        
        // Recalculate black squares after grid structure change
        this.recalculateBlackSquares();
        
        // Log grid state after grid structure change
        // this.logGridState();
        // this.logGridArray();
    }
    
    insertColumnAt(colIndex) {
        // Check if rightmost column is completely empty
        if (!this.canDeleteColumn(this.gridSize - 1)) {
            alert('Cannot insert column: rightmost column is not completely empty');
            return;
        }
        
        // Update column indices for all content at col >= colIndex
        // This already handles the grid array shifting
        this.updateColumnIndices(colIndex, 1);
        
        // Completely rebuild the visual grid
        this.rebuildVisualGrid();
        
        // Recalculate black squares after grid structure change
        this.recalculateBlackSquares();
        
        // Log grid state after grid structure change
        // this.logGridState();
        // this.logGridArray();
    }
    
    deleteRow(rowIndex) {
        // Check if row is completely empty
        if (!this.canDeleteRow(rowIndex)) {
            alert('Cannot delete row: row is not completely empty');
            return;
        }
        
        // Update row indices for all content at row > rowIndex (decrement by 1)
        // This already handles the grid array shifting
        this.updateRowIndices(rowIndex + 1, -1);
        
        // Completely rebuild the visual grid
        this.rebuildVisualGrid();
        
        // Recalculate black squares after grid structure change
        this.recalculateBlackSquares();
        
        // Log grid state after grid structure change
        // this.logGridState();
        // this.logGridArray();
    }
    
    deleteColumn(colIndex) {
        // Check if column is completely empty
        if (!this.canDeleteColumn(colIndex)) {
            alert('Cannot delete column: column is not completely empty');
            return;
        }
        
        // Update column indices for all content at col > colIndex (decrement by 1)
        // This already handles the grid array shifting
        this.updateColumnIndices(colIndex + 1, -1);
        
        // Completely rebuild the visual grid
        this.rebuildVisualGrid();
        
        // Recalculate black squares after grid structure change
        this.recalculateBlackSquares();
        
        // Log grid state after grid structure change
        // this.logGridState();
        // this.logGridArray();
    }
    
    updateGridTemplate() {
        const gridElement = document.getElementById('crossword-grid');
        const cellSize = Math.floor(600 / this.gridSize);
        gridElement.style.gridTemplateColumns = `repeat(${this.gridSize}, ${cellSize}px)`;
        gridElement.style.gridTemplateRows = `repeat(${this.gridSize}, ${cellSize}px)`;
        this.updateFontSizes(cellSize);
    }
    
    // Helper method to sync DOM elements with grid array
    syncGridArrayWithDOM() {
        const gridElement = document.getElementById('crossword-grid');
        const domCells = Array.from(gridElement.children);
        
        // Create a temporary backup of the current grid content
        const gridBackup = [];
        for (let row = 0; row < this.gridSize; row++) {
            gridBackup[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                gridBackup[row][col] = {
                    letter: cell.letter,
                    number: cell.number,
                    isBlack: cell.isBlack,
                    blackSource: cell.blackSource,
                    words: [...cell.words] // Copy the words array
                };
            }
        }
        
        // Update the grid array with new DOM elements while preserving content
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const domIndex = row * this.gridSize + col;
                if (domIndex < domCells.length) {
                    const domCell = domCells[domIndex];
                    const backup = gridBackup[row][col];
                    
                    this.grid[row][col] = {
                        element: domCell,
                        letter: backup.letter,
                        number: backup.number,
                        isBlack: backup.isBlack,
                        blackSource: backup.blackSource,
                        words: backup.words
                    };
                    
                    // Update dataset attributes
                    domCell.dataset.row = row;
                    domCell.dataset.col = col;
                    
                    // Restore visual content to the DOM element
                    domCell.innerHTML = ''; // Clear existing content
                    
                    if (backup.isBlack) {
                        domCell.classList.add('black');
                    } else {
                        domCell.classList.remove('black');
                        
                        if (backup.number) {
                            const numberSpan = document.createElement('span');
                            numberSpan.className = 'number';
                            numberSpan.textContent = backup.number;
                            domCell.appendChild(numberSpan);
                        }
                        
                        if (backup.letter) {
                            const letterSpan = document.createElement('span');
                            letterSpan.className = 'letter';
                            letterSpan.textContent = backup.letter;
                            domCell.appendChild(letterSpan);
                        }
                    }
                }
            }
        }
        
        // Update number colors
        this.updateNumberColors();
    }
    
    updateRowIndices(startRow, offset) {
        // Update row indices for all content at row >= startRow
        for (let row = startRow; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                if (cell && cell.element && (cell.letter || cell.number || cell.isBlack)) {
                    const newRow = row + offset;
                    cell.element.dataset.row = newRow;
                    
                    // Update placed words
                    this.placedWords.forEach(word => {
                        if (word.startRow === row) {
                            word.startRow = newRow;
                        }
                    });
                }
            }
        }
        
        // Also update the grid array structure if inserting (offset > 0)
        if (offset > 0) {
            // Shift rows down in the grid array
            for (let row = this.gridSize - 1; row >= startRow; row--) {
                for (let col = 0; col < this.gridSize; col++) {
                    if (row + offset < this.gridSize) {
                        this.grid[row + offset][col] = this.grid[row][col];
                    }
                }
            }
            // Clear the original rows that were shifted
            for (let row = startRow; row < startRow + offset; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    this.grid[row][col] = {
                        element: null,
                        letter: null,
                        number: null,
                        isBlack: false,
                        blackSource: null,
                        words: []
                    };
                }
            }
        } else if (offset < 0) {
            // Shift rows up in the grid array
            for (let row = startRow; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    if (row + offset >= 0) {
                        this.grid[row + offset][col] = this.grid[row][col];
                    }
                }
            }
        }
        
        // Update all DOM element positions to match the grid array
        const gridElement = document.getElementById('crossword-grid');
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                if (cell && cell.element) {
                    cell.element.dataset.row = row;
                    cell.element.dataset.col = col;
                }
            }
        }
    }
    
    updateColumnIndices(startCol, offset) {
        // Update column indices for all content at col >= startCol
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = startCol; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                if (cell && cell.element && (cell.letter || cell.number || cell.isBlack)) {
                    const newCol = col + offset;
                    cell.element.dataset.col = newCol;
                    
                    // Update placed words
                    this.placedWords.forEach(word => {
                        if (word.startCol === col) {
                            word.startCol = newCol;
                        }
                    });
                }
            }
        }
        
        // Also update the grid array structure if inserting (offset > 0)
        if (offset > 0) {
            // Shift columns right in the grid array
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = this.gridSize - 1; col >= startCol; col--) {
                    if (col + offset < this.gridSize) {
                        this.grid[row][col + offset] = this.grid[row][col];
                    }
                }
            }
            // Clear the original columns that were shifted
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = startCol; col < startCol + offset; col++) {
                    this.grid[row][col] = {
                        element: null,
                        letter: null,
                        number: null,
                        isBlack: false,
                        blackSource: null,
                        words: []
                    };
                }
            }
        } else if (offset < 0) {
            // Shift columns left in the grid array
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = startCol; col < this.gridSize; col++) {
                    if (col + offset >= 0) {
                        this.grid[row][col + offset] = this.grid[row][col];
                    }
                }
            }
        }
        
        // Update all DOM element positions to match the grid array
        const gridElement = document.getElementById('crossword-grid');
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                if (cell && cell.element) {
                    cell.element.dataset.row = row;
                    cell.element.dataset.col = col;
                }
            }
        }
    }
    
    recalculateBlackSquares() {
        // Store manual black squares before clearing
        const manualBlackSquares = new Set(this.blackManual);
        
        // Clear all black squares except manual ones
        this.blackPreceding.clear();
        this.blackTerminal.clear();
        
        // Clear visual black squares
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                if (cell.isBlack) {
                    cell.isBlack = false;
                    cell.blackSource = null;
                    cell.element.classList.remove('black');
                }
            }
        }
        
        // Restore manual black squares
        this.blackManual = manualBlackSquares;
        for (const key of this.blackManual) {
            const [row, col] = key.split(',').map(Number);
            if (this.isValidCell(row, col)) {
                const cell = this.grid[row][col];
                if (!cell.letter && !cell.number) {
                    cell.isBlack = true;
                    cell.blackSource = 'manual';
                    cell.element.classList.add('black');
                    cell.element.innerHTML = '';
                }
            }
        }
        
        // Recalculate preceding black squares for all numbers
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                if (cell.number) {
                    const number = parseInt(cell.number.toString().split(',')[0]);
                    const acrossClue = this.clues.across.find(c => c.number === number);
                    const downClue = this.clues.down.find(c => c.number === number);
                    
                    if (acrossClue) {
                        this.setBlackSquare(row, col - 1, 'preceding');
                    }
                    if (downClue) {
                        this.setBlackSquare(row - 1, col, 'preceding');
                    }
                }
            }
        }
        
        // Recalculate terminal black squares for all placed words
        for (const word of this.placedWords) {
            let endRow = word.startRow, endCol = word.startCol;
            if (word.direction === 'across') {
                endCol = word.startCol + word.word.length;
            } else {
                endRow = word.startRow + word.word.length;
            }
            this.setBlackSquare(endRow, endCol, 'terminal');
        }
        
        // Island detection is disabled due to bugs
        
        console.log('Black squares recalculated after grid structure change');
        // this.logGridArray();
    }
    
    // Check minimum word spacing requirements
    isValidWordSpacing(row, col, number) {
        // Check across spacing in this row
        if (!this.isValidAcrossSpacing(row, col, number)) {
            return false;
        }
        
        // Check down spacing in this column
        if (!this.isValidDownSpacing(row, col, number)) {
            return false;
        }
        
        return true;
    }
    
    // Check across word spacing in a row
    isValidAcrossSpacing(row, col, number) {
        // Get all across-relevant numbers in this row
        const acrossNumbers = [];
        for (let c = 0; c < this.gridSize; c++) {
            const cell = this.grid[row][c];
            if (cell.number && !(c === col)) { // Exclude the cell we're placing
                const cellNumber = parseInt(cell.number.toString().split(',')[0]);
                const hasAcrossClue = this.clues.across.find(c => c.number === cellNumber);
                if (hasAcrossClue) {
                    acrossNumbers.push({ col: c, number: cellNumber });
                }
            }
        }
        
        // Add the new number if it has an across clue
        const hasNewAcrossClue = this.clues.across.find(c => c.number === number);
        if (hasNewAcrossClue) {
            acrossNumbers.push({ col: col, number: number });
        }
        
        // If no across numbers in this row, validation passes
        if (acrossNumbers.length === 0) {
            return true;
        }
        
        // Sort by column position
        acrossNumbers.sort((a, b) => a.col - b.col);
        
        // Check spacing between all across numbers
        for (let i = 0; i < acrossNumbers.length; i++) {
            const current = acrossNumbers[i];
            if (current.number === number) {
                // Check spacing with previous across word
                if (i > 0) {
                    const prev = acrossNumbers[i - 1];
                    const prevAcrossClue = this.clues.across.find(c => c.number === prev.number);
                    let minSpacing = 4; // Default minimum: 3 letters + 1 black square
                    if (prevAcrossClue && prevAcrossClue.userAnswer) {
                        const prevWordLength = prevAcrossClue.userAnswer.replace(/\s+/g, '').length;
                        minSpacing = Math.max(prevWordLength + 1, 4);
                    }
                    const actualSpacing = current.col - prev.col;
                    if (actualSpacing < minSpacing) {
                        return false;
                    }
                }
                
                // Check spacing with next across word
                if (i < acrossNumbers.length - 1) {
                    const next = acrossNumbers[i + 1];
                    const nextAcrossClue = this.clues.across.find(c => c.number === next.number);
                    if (nextAcrossClue && nextAcrossClue.userAnswer) {
                        const currentAcrossClue = this.clues.across.find(c => c.number === current.number);
                        let minSpacing = 4; // Default minimum: 3 letters + 1 black square
                        if (currentAcrossClue && currentAcrossClue.userAnswer) {
                            const currentWordLength = currentAcrossClue.userAnswer.replace(/\s+/g, '').length;
                            minSpacing = Math.max(currentWordLength + 1, 4);
                        }
                        const actualSpacing = next.col - current.col;
                        if (actualSpacing < minSpacing) {
                            return false;
                        }
                    }
                }
                
                // Check sequential across number requirements
                console.log('Checking sequential spacing for number:', number, 'in row:', row);
                if (!this.isValidSequentialAcrossSpacing(acrossNumbers, current, i)) {
                    console.log('Sequential spacing validation failed for number:', number);
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // Check sequential across number spacing requirements
    isValidSequentialAcrossSpacing(acrossNumbers, current, currentIndex) {
        // Get all across clue numbers that exist
        const allAcrossNumbers = this.clues.across.map(c => c.number).sort((a, b) => a - b);
        
        // Find the position of the current number in the sequence
        const currentNumberIndex = allAcrossNumbers.indexOf(current.number);
        if (currentNumberIndex === -1) {
            return true; // Not an across number
        }
        
        // Check spacing with other across numbers in this row
        for (let i = 0; i < acrossNumbers.length; i++) {
            if (i === currentIndex) continue; // Skip the current number
            
            const otherNumber = acrossNumbers[i].number;
            const otherNumberIndex = allAcrossNumbers.indexOf(otherNumber);
            if (otherNumberIndex === -1) continue; // Not an across number
            
            // Calculate required spacing using the formula: max(abs(num2 - num1), 3 * abs(ind2 - ind1)) + abs(ind2 - ind1)
            const currentPos = acrossNumbers[currentIndex].col;
            const otherPos = acrossNumbers[i].col;
            const minPos = Math.min(currentPos, otherPos);
            const maxPos = Math.max(currentPos, otherPos);
            const availableSpace = maxPos - minPos; // Space between positions
            
            const currentNumber = acrossNumbers[currentIndex].number;
            const numDiff = Math.abs(otherNumber - currentNumber);
            const indexDiff = Math.abs(otherNumberIndex - currentNumberIndex);
            const requiredSpacing = Math.max(numDiff, 3 * indexDiff) + indexDiff;
            
            if (availableSpace < requiredSpacing) {
                return false;
            }
        }
        
        return true;
    }
    
    // Check down word spacing in a column
    isValidDownSpacing(row, col, number) {
        // Get all down-relevant numbers in this column
        const downNumbers = [];
        for (let r = 0; r < this.gridSize; r++) {
            const cell = this.grid[r][col];
            if (cell.number && !(r === row)) { // Exclude the cell we're placing
                const cellNumber = parseInt(cell.number.toString().split(',')[0]);
                const hasDownClue = this.clues.down.find(c => c.number === cellNumber);
                if (hasDownClue) {
                    downNumbers.push({ row: r, number: cellNumber });
                }
            }
        }
        
        // Add the new number if it has a down clue
        const hasNewDownClue = this.clues.down.find(c => c.number === number);
        if (hasNewDownClue) {
            downNumbers.push({ row: row, number: number });
        }
        
        // If no down numbers in this column, validation passes
        if (downNumbers.length === 0) {
            return true;
        }
        
        // Sort by row position
        downNumbers.sort((a, b) => a.row - b.row);
        
        // Check spacing between all down numbers
        for (let i = 0; i < downNumbers.length; i++) {
            const current = downNumbers[i];
            if (current.number === number) {
                // Check spacing with previous down word
                if (i > 0) {
                    const prev = downNumbers[i - 1];
                    const prevDownClue = this.clues.down.find(c => c.number === prev.number);
                    let minSpacing = 4; // Default minimum: 3 letters + 1 black square
                    if (prevDownClue && prevDownClue.userAnswer) {
                        const prevWordLength = prevDownClue.userAnswer.replace(/\s+/g, '').length;
                        minSpacing = Math.max(prevWordLength + 1, 4);
                    }
                    const actualSpacing = current.row - prev.row;
                    if (actualSpacing < minSpacing) {
                        return false;
                    }
                }
                
                // Check spacing with next down word
                if (i < downNumbers.length - 1) {
                    const next = downNumbers[i + 1];
                    const nextDownClue = this.clues.down.find(c => c.number === next.number);
                    if (nextDownClue && nextDownClue.userAnswer) {
                        const currentDownClue = this.clues.down.find(c => c.number === current.number);
                        let minSpacing = 4; // Default minimum: 3 letters + 1 black square
                        if (currentDownClue && currentDownClue.userAnswer) {
                            const currentWordLength = currentDownClue.userAnswer.replace(/\s+/g, '').length;
                            minSpacing = Math.max(currentWordLength + 1, 4);
                        }
                        const actualSpacing = next.row - current.row;
                        if (actualSpacing < minSpacing) {
                            return false;
                        }
                    }
                }
            }
        }
        
        return true;
    }

    selectWord(wordElement) {
        // Clear previous selection
        this.clearAllSelections();
        
        // Select new word
        wordElement.classList.add('selected');
        this.selectedWord = {
            word: wordElement.dataset.word,
            number: parseInt(wordElement.dataset.number),
            direction: wordElement.dataset.direction,
            source: 'word-list'
        };
        
        console.log('Selected word:', this.selectedWord.word);
    }

    selectPlacedWord(cellElement) {
        const row = parseInt(cellElement.dataset.row);
        const col = parseInt(cellElement.dataset.col);
        const cell = this.grid[row][col];
        
        if (cell.words.length > 0) {
            // Find all words that contain this cell
            const wordsAtCell = this.placedWords.filter(w => {
                const wordRow = w.startRow;
                const wordCol = w.startCol;
                
                for (let i = 0; i < w.word.length; i++) {
                    let checkRow = wordRow;
                    let checkCol = wordCol;
                    
                    if (w.direction === 'across') {
                        checkCol = wordCol + i;
                    } else {
                        checkRow = wordRow + i;
                    }
                    
                    if (checkRow === row && checkCol === col) {
                        return true;
                    }
                }
                return false;
            });
            
            console.log('Words at cell:', wordsAtCell);
            
            // Check if we already have a word selected from this cell
            if (this.selectedWord && this.selectedWord.source === 'grid') {
                const currentWord = this.selectedWord;
                const currentWordObj = this.placedWords.find(w => 
                    w.word === currentWord.word && w.direction === currentWord.direction
                );
                
                if (currentWordObj && wordsAtCell.includes(currentWordObj)) {
                    // Try to select the other direction
                    const otherWord = wordsAtCell.find(w => w.direction !== currentWord.direction);
                    
                    if (otherWord) {
                        console.log('Switching to other direction:', otherWord.word);
                        this.clearAllSelections();
                        this.highlightWord(otherWord);
                        
                        this.selectedWord = {
                            word: otherWord.word,
                            number: otherWord.number,
                            direction: otherWord.direction,
                            source: 'grid',
                            originalRow: otherWord.startRow,
                            originalCol: otherWord.startCol
                        };
                        return;
                    } else {
                        // No other direction, so deselect
                        console.log('Deselecting word');
                        this.clearAllSelections();
                        return;
                    }
                }
            }
            
            // Select the first word that contains this cell
            if (wordsAtCell.length > 0) {
                const word = wordsAtCell[0];
                
                // Clear previous selection
                this.clearAllSelections();
                
                // Highlight the entire word
                this.highlightWord(word);
                
                this.selectedWord = {
                    word: word.word,
                    number: word.number,
                    direction: word.direction,
                    source: 'grid',
                    originalRow: word.startRow,
                    originalCol: word.startCol
                };
                
                console.log('Selected placed word:', word.word);
            }
        }
    }

    placeSelectedWord(cellElement) {
        if (!this.selectedWord) {
            console.log('No word selected');
            return;
        }
        
        const row = parseInt(cellElement.dataset.row);
        const col = parseInt(cellElement.dataset.col);
        
        console.log('Attempting to place word at:', row, col);
        console.log('Selected word:', this.selectedWord);
        console.log('Cell has letter:', cellElement.querySelector('.letter') ? 'yes' : 'no');
        
        // If this is a reposition from grid, check if we're clicking on the original position
        if (this.selectedWord.source === 'grid') {
            const originalRow = this.selectedWord.originalRow;
            const originalCol = this.selectedWord.originalCol;
            
            // If clicking on the original starting position, don't place - just keep selected
            if (row === originalRow && col === originalCol) {
                console.log('Clicked on original position, keeping word selected');
                return;
            }
            
            // If clicking on any part of the selected word, don't place - just keep selected
            const selectedWordObj = this.placedWords.find(w => 
                w.word === this.selectedWord.word && w.direction === this.selectedWord.direction
            );
            
            if (selectedWordObj) {
                for (let i = 0; i < selectedWordObj.word.length; i++) {
                    let wordRow = selectedWordObj.startRow;
                    let wordCol = selectedWordObj.startCol;
                    
                    if (selectedWordObj.direction === 'across') {
                        wordCol = selectedWordObj.startCol + i;
                    } else {
                        wordRow = selectedWordObj.startRow + i;
                    }
                    
                    if (wordRow === row && wordCol === col) {
                        console.log('Clicked on selected word, keeping word selected');
                        return;
                    }
                }
            }
        }
        
        if (this.canPlaceWord(row, col)) {
            console.log('Placement valid, placing word');
            this.placeWord(row, col);
            this.clearAllSelections();
        } else {
            console.log('Cannot place word at this location');
        }
        this.resortAnswers(this.selectedWord.direction);
    }

    clearAllSelections() {
        document.querySelectorAll('.word-item.selected').forEach(el => {
            el.classList.remove('selected');
        });
        document.querySelectorAll('.cell.selected').forEach(el => {
            el.classList.remove('selected');
        });
        this.selectedWord = null;
    }

    highlightWord(word) {
        // Clear any existing highlights
        document.querySelectorAll('.cell.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Highlight all cells in the word
        for (let i = 0; i < word.word.length; i++) {
            let row = word.startRow;
            let col = word.startCol;
            
            if (word.direction === 'across') {
                col = word.startCol + i;
            } else {
                row = word.startRow + i;
            }
            
            if (this.isValidCell(row, col)) {
                const cellElement = this.grid[row][col].element;
                cellElement.classList.add('selected');
            }
        }
    }

    removeWordFromGrid(cellElement) {
        // Only remove if we have a selected word from the grid
        if (!this.selectedWord || this.selectedWord.source !== 'grid') {
            console.log('No grid word selected for removal');
            return;
        }
        
        console.log('Removing selected word from grid:', this.selectedWord.word);
        
        // Remove the selected word from the grid
        this.removeWord(this.selectedWord.originalRow, this.selectedWord.originalCol, this.selectedWord.direction);
        
        // Return it to the word list
        // this.unmarkWordAsPlaced(this.selectedWord.word, this.selectedWord.direction, this.selectedWord.number); // Removed
        
        // Clear the selection
        this.clearAllSelections();
        this.resortAnswers(this.selectedWord.direction);
    }

    clearSelection() {
        this.clearAllSelections();
    }
    
    canPlaceWord(startRow, startCol) {
        const word = this.selectedWord.word.replace(/\s+/g, ''); // Remove all spaces
        const direction = this.selectedWord.direction;
        const number = this.selectedWord.number;
        
        console.log('Checking if can place word:', word, 'at', startRow, startCol, 'direction:', direction);
        
        // Check if word fits within grid
        if (direction === 'across' && startCol + word.length > this.gridSize) {
            console.log('Word too long for across placement');
            return false;
        }
        if (direction === 'down' && startRow + word.length > this.gridSize) {
            console.log('Word too long for down placement');
            return false;
        }
        
        // Check for conflicts with existing letters and black squares
        for (let i = 0; i < word.length; i++) {
            let row = startRow;
            let col = startCol;
            
            if (direction === 'across') {
                col = startCol + i;
            } else {
                row = startRow + i;
            }
            
            const cell = this.grid[row][col];
            
            // Check if cell is black
            if (cell.isBlack) {
                console.log('Cell is black at', row, col);
                return false;
            }
            
            // If cell has a letter, it must match
            if (cell.letter && cell.letter !== word[i]) {
                console.log('Letter mismatch at', row, col, 'expected:', word[i], 'found:', cell.letter);
                return false;
            }
        }
        // Autoblock: check the cell after the end of the word
        let endRow = startRow;
        let endCol = startCol;
        if (direction === 'across') {
            endCol = startCol + word.length;
        } else {
            endRow = startRow + word.length;
        }
        if (this.isValidCell(endRow, endCol)) {
            const endCell = this.grid[endRow][endCol];
            if (endCell.letter || endCell.isBlack) {
                console.log('Cannot autoblock: cell after word is occupied at', endRow, endCol);
                alert('Cannot place word: the cell after the end of the word is already occupied.');
                return false;
            }
        }
        
        // Allow placement in occupied squares - the clash rules will be handled by the letter matching above
        // Only check if the target cell has a different number (not the same number)
        const firstCell = this.grid[startRow][startCol];
        if (firstCell.number) {
            const numbers = firstCell.number.toString().split(',');
            // Allow if the number is already there, or if there's no number conflict
            if (!numbers.includes(number.toString())) {
                // Check if there's a different number that would conflict
                const existingNumbers = numbers.filter(n => n !== number.toString());
                if (existingNumbers.length > 0) {
                    console.log('Number conflict at', startRow, startCol, 'existing:', existingNumbers, 'new:', number);
                    return false;
                }
            }
        }
        
        console.log('Word placement is valid');
        return true;
    }
    
    placeWord(startRow, startCol) {
        const word = this.selectedWord.word.replace(/\s+/g, ''); // Remove all spaces
        const direction = this.selectedWord.direction;
        const number = this.selectedWord.number;

        // If this is a reposition from grid, remove the original word first
        if (this.selectedWord.source === 'grid') {
            this.removeWord(this.selectedWord.originalRow, this.selectedWord.originalCol, this.selectedWord.direction);
        }

        // Add number to first cell
        const firstCell = this.grid[startRow][startCol];
        if (!firstCell.number) {
            firstCell.number = number;
            const numberSpan = document.createElement('span');
            numberSpan.className = 'number';
            numberSpan.textContent = number;
            firstCell.element.appendChild(numberSpan);
        } else {
            // Only add if not already present
            const numbers = firstCell.number.toString().split(',');
            if (!numbers.includes(number.toString())) {
                numbers.push(number);
                firstCell.number = numbers.join(',');
                // Update the number span
                let numberSpan = firstCell.element.querySelector('.number');
                if (numberSpan) {
                    numberSpan.textContent = firstCell.number;
                } else {
                    numberSpan = document.createElement('span');
                    numberSpan.className = 'number';
                    numberSpan.textContent = firstCell.number;
                    firstCell.element.appendChild(numberSpan);
                }
            }
        }

        // Place letters and track word usage
        for (let i = 0; i < word.length; i++) {
            let row = startRow;
            let col = startCol;

            if (direction === 'across') {
                col = startCol + i;
            } else {
                row = startRow + i;
            }

            const cell = this.grid[row][col];
            cell.letter = word[i];
            cell.words.push({ word: word, direction: direction, number: number });

            // Remove existing letter span if any
            const existingLetter = cell.element.querySelector('.letter');
            if (existingLetter) {
                existingLetter.remove();
            }

            const letterSpan = document.createElement('span');
            letterSpan.className = 'letter';
            letterSpan.textContent = word[i];
            cell.element.appendChild(letterSpan);
        }

        // Autoblock: add a black square at the end of the word if possible
        let endRow = startRow;
        let endCol = startCol;
        if (direction === 'across') {
            endCol = startCol + word.length;
        } else {
            endRow = startRow + word.length;
        }
        if (this.isValidCell(endRow, endCol)) {
            const endCell = this.grid[endRow][endCol];
            if (!endCell.letter && !endCell.isBlack) {
                endCell.isBlack = true;
                endCell.element.classList.add('black');
                endCell.element.innerHTML = '';
                endCell.letter = null;
                endCell.number = null;
                endCell.words = [];
            }
        }

        // Record placed word
        this.placedWords.push({
            word: word,
            number: number,
            direction: direction,
            startRow: startRow,
            startCol: startCol
        });

        // Mark word as placed in the list (use original word with spaces for matching)
        // this.markWordAsPlaced(this.selectedWord.word, direction, number); // Removed

        // Update number colors for duplicates
        this.updateNumberColors();
        this.updateClueOnGridStates();

        // this.logGridState();
        // this.logGridArray();
    }

    updateNumberColors() {
        // Get all numbers that appear more than once
        const numberCounts = {};
        this.placedWords.forEach(word => {
            numberCounts[word.number] = (numberCounts[word.number] || 0) + 1;
        });

        // Update colors for all number spans
        document.querySelectorAll('.cell .number').forEach(numberSpan => {
            const number = parseInt(numberSpan.textContent.split(',')[0]); // Get first number if comma-separated
            const cell = numberSpan.closest('.cell');
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const cellData = this.grid[row][col];
            
            // Check if this number appears in multiple different cells
            const cellsWithThisNumber = [];
            this.placedWords.forEach(word => {
                if (word.number === number) {
                    cellsWithThisNumber.push(`${word.startRow},${word.startCol}`);
                }
            });
            
            const uniqueCells = [...new Set(cellsWithThisNumber)];
            
            if (numberCounts[number] > 1 && uniqueCells.length > 1) {
                numberSpan.style.color = '#ff0000'; // Red for duplicates in different cells
            } else {
                numberSpan.style.color = '#666'; // Normal gray
            }
        });
    }

    // Removed markWordAsPlaced and unmarkWordAsPlaced function definitions and all calls to them throughout the file.

    removeWord(startRow, startCol, directionOverride) {
        // Find the word to remove
        const wordIndex = this.placedWords.findIndex(w =>
            w.startRow === startRow && w.startCol === startCol && (!directionOverride || w.direction === directionOverride)
        );
        if (wordIndex !== -1) {
            const word = this.placedWords[wordIndex];
            // Remove letters and word tracking
            for (let i = 0; i < word.word.length; i++) {
                let row = startRow;
                let col = startCol;
                if (word.direction === 'across') {
                    col = startCol + i;
                } else {
                    row = startRow + i;
                }
                const cell = this.grid[row][col];
                // Remove this word from the cell's word list
                cell.words = cell.words.filter(w =>
                    !(w.word === word.word && w.direction === word.direction)
                );
                // If no more words use this cell, clear the letter
                if (cell.words.length === 0) {
                    cell.letter = null;
                    const letterSpan = cell.element.querySelector('.letter');
                    if (letterSpan) {
                        letterSpan.remove();
                    }
                }
            }
            // Remove the word from placed words
            this.placedWords.splice(wordIndex, 1);
            
            // Remove terminal black square after the word
            let endRow = startRow, endCol = startCol;
            if (word.direction === 'across') endCol = startCol + word.word.length;
            else endRow = startRow + word.word.length;
            if (this.isValidCell(endRow, endCol)) {
                this.removeBlackSquare(endRow, endCol, 'terminal');
            }
            
            // Don't remove the number from the grid - numbers should only be removed by explicit grid interaction
            // The number stays on the grid even when words are removed
            this.updateNumberColors();
            this.updateClueOnGridStates();
            
            // Log grid state after removing word
            // this.logGridState();
            // this.logGridArray();
        }
    }
    


    isValidCell(row, col) {
        return row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize;
    }
    
    isValidBlackSquarePosition(row, col) {
        // Black squares can extend beyond the grid boundaries
        return true;
    }
    
    // Helper functions for black square management
    setBlackSquare(row, col, source) {
        if (!this.isValidBlackSquarePosition(row, col)) return false;
        
        // If the position is within the grid, update the cell
        if (this.isValidCell(row, col)) {
            const cell = this.grid[row][col];
            if (cell.letter) return false; // Can't make a cell with a letter black
            if (cell.number) return false; // Can't make a cell with a number black
            
            cell.isBlack = true;
            cell.blackSource = source;
            cell.element.classList.add('black');
            cell.element.innerHTML = '';
            cell.letter = null;
            cell.number = null;
            cell.words = [];
        }
        
        // Add to tracking set (even if outside grid)
        const key = `${row},${col}`;
        if (source === 'preceding') {
            this.blackPreceding.add(key);
        } else if (source === 'terminal') {
            this.blackTerminal.add(key);
        } else if (source === 'manual') {
            this.blackManual.add(key);
        }
        
        // Log grid state after black square change
        // this.logGridState();
        // this.logGridArray();
        return true;
    }
    
    removeBlackSquare(row, col, source) {
        const key = `${row},${col}`;
        
        if (source === 'preceding') {
            this.blackPreceding.delete(key);
        } else if (source === 'terminal') {
            this.blackTerminal.delete(key);
        } else if (source === 'manual') {
            this.blackManual.delete(key);
        }
        
        // If the position is within the grid, update the cell
        if (this.isValidCell(row, col)) {
            const cell = this.grid[row][col];
            // Only remove if no other source requires this cell to be black
            if (!this.blackPreceding.has(key) && !this.blackTerminal.has(key) && !this.blackManual.has(key)) {
                cell.isBlack = false;
                cell.blackSource = null;
                cell.element.classList.remove('black');
            }
        }
        
        // Log grid state after black square removal
        // this.logGridState();
        // this.logGridArray();
    }
    
    canPlaceBlackSquare(row, col) {
        if (!this.isValidBlackSquarePosition(row, col)) return false;
        
        // If the position is within the grid, check for conflicts
        if (this.isValidCell(row, col)) {
            const cell = this.grid[row][col];
            if (cell.letter) return false; // Can't make a cell with a letter black
            if (cell.number) return false; // Can't make a cell with a number black
        }
        
        return true;
    }
    

    
    updateCellBlackState(row, col) {
        if (!this.isValidCell(row, col)) return;
        
        const cell = this.grid[row][col];
        const key = `${row},${col}`;
        
        const shouldBeBlack = this.blackPreceding.has(key) || this.blackTerminal.has(key);
        
        if (shouldBeBlack && !cell.isBlack) {
            cell.isBlack = true;
            cell.blackSource = this.blackPreceding.has(key) ? 'preceding' : 'terminal';
            cell.element.classList.add('black');
            cell.element.innerHTML = '';
            cell.letter = null;
            cell.number = null;
            cell.words = [];
        } else if (!shouldBeBlack && cell.isBlack) {
            cell.isBlack = false;
            cell.blackSource = null;
            cell.element.classList.remove('black');
        }
    }
    
    toggleBlackSquare(cellElement) {
        const row = parseInt(cellElement.dataset.row);
        const col = parseInt(cellElement.dataset.col);
        const cell = this.grid[row][col];
        // Toggle black state
        cell.isBlack = !cell.isBlack;
        if (cell.isBlack) {
            // Make cell black
            cellElement.classList.add('black');
            // Clear any existing content in this cell only
            cellElement.innerHTML = '';
            cell.letter = null;
            cell.number = null;
            cell.words = [];
        } else {
            // Make cell white again
            cellElement.classList.remove('black');
            // Do not restore any content; cell remains empty until user adds number/letter
        }
    }
    
    updateGridDisplay() {
        // Clear all letters and numbers
        document.querySelectorAll('.cell').forEach(cellElement => {
            const row = parseInt(cellElement.dataset.row);
            const col = parseInt(cellElement.dataset.col);
            const cell = this.grid[row][col];
            
            if (!cell.isBlack) {
                cellElement.innerHTML = '';
                cell.letter = null;
                cell.number = null;
                cell.words = [];
            }
        });
        
        // Re-add all placed words
        this.placedWords.forEach(word => {
            this.redrawWord(word);
        });
        
        // Update number colors
        this.updateNumberColors();
        
        // Log grid state after display update
        this.logGridState();
        this.logGridArray();
    }
    
    logGridState() {
        // Grid state logging removed
    }
    
    logGridArray() {
        console.log('=== DETAILED GRID STATE ===');
        
        // Show grid with actual content
        let arr = [];
        for (let row = 0; row < this.gridSize; row++) {
            let rowArr = [];
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                let val = '';
                
                if (cell.isBlack) {
                    val = '███'; // Black square
                } else if (cell.letter) {
                    val = cell.letter.padEnd(3, ' '); // Letter with padding
                } else if (cell.number) {
                    val = cell.number.toString().padEnd(3, ' '); // Number with padding
                } else {
                    val = ' . '; // Empty cell
                }
                
                rowArr.push(val);
            }
            arr.push(rowArr.join(' '));
        }
        
        console.log('Grid Content:');
        arr.forEach((line, index) => {
            console.log(`${index.toString().padStart(2, '0')}: ${line}`);
        });
        
        // Show placed words
        console.log('\nPlaced Words:');
        this.placedWords.forEach(word => {
            console.log(`  ${word.number}${word.direction === 'across' ? 'A' : 'D'}: "${word.word}" at (${word.startRow},${word.startCol})`);
        });
        
        // Show black square sources
        console.log('\nBlack Squares:');
        console.log(`  Preceding: ${this.blackPreceding.size} squares`);
        console.log(`  Terminal: ${this.blackTerminal.size} squares`);
        console.log(`  Manual: ${this.blackManual.size} squares`);
        
        // Show grid size and cell count
        console.log(`\nGrid Size: ${this.gridSize}x${this.gridSize} (${this.gridSize * this.gridSize} cells)`);
        console.log('=== END GRID STATE ===\n');
    }
    
    // Debug method to show raw grid array data
    logRawGridData() {
        console.log('=== RAW GRID ARRAY DATA ===');
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                console.log(`[${row},${col}]:`, {
                    letter: cell.letter,
                    number: cell.number,
                    isBlack: cell.isBlack,
                    blackSource: cell.blackSource,
                    words: cell.words.length,
                    hasElement: !!cell.element
                });
            }
        }
        console.log('=== END RAW DATA ===\n');
    }

    redrawWord(word) {
        // Add number to first cell
        const firstCell = this.grid[word.startRow][word.startCol];
        if (!firstCell.isBlack) {
            if (!firstCell.number) {
                firstCell.number = word.number;
                const numberSpan = document.createElement('span');
                numberSpan.className = 'number';
                numberSpan.textContent = word.number;
                firstCell.element.appendChild(numberSpan);
            } else {
                // Only add if not already present
                const numbers = firstCell.number.toString().split(',');
                if (!numbers.includes(word.number.toString())) {
                    numbers.push(word.number);
                    firstCell.number = numbers.join(',');
                    // Update the number span
                    let numberSpan = firstCell.element.querySelector('.number');
                    if (numberSpan) {
                        numberSpan.textContent = firstCell.number;
                    } else {
                        numberSpan = document.createElement('span');
                        numberSpan.className = 'number';
                        numberSpan.textContent = firstCell.number;
                        firstCell.element.appendChild(numberSpan);
                    }
                }
            }
        }

        // Place letters and track word usage
        for (let i = 0; i < word.word.length; i++) {
            let row = word.startRow;
            let col = word.startCol;

            if (word.direction === 'across') {
                col = word.startCol + i;
            } else {
                row = word.startRow + i;
            }

            const cell = this.grid[row][col];
            if (!cell.isBlack) {
                cell.letter = word.word[i];
                cell.words.push({ word: word.word, direction: word.direction, number: word.number });

                // Remove existing letter span if any
                const existingLetter = cell.element.querySelector('.letter');
                if (existingLetter) {
                    existingLetter.remove();
                }

                const letterSpan = document.createElement('span');
                letterSpan.className = 'letter';
                letterSpan.textContent = word.word[i];
                cell.element.appendChild(letterSpan);
            }
        }
    }

    // Resort clues: unsolved at top, then solved, all sorted by number
    resortClues(direction) {
        const clueListId = direction === 'across' ? 'across-clues' : 'down-clues';
        const clueList = document.getElementById(clueListId);
        const cluesArr = direction === 'across' ? this.clues.across : this.clues.down;
        // Get all clue elements
        const clueElements = Array.from(clueList.querySelectorAll('.clue-item'));
        // Map number to clue element
        const clueMap = {};
        clueElements.forEach(el => {
            clueMap[parseInt(el.dataset.number)] = el;
        });
        // Sort: unsolved first, then solved, all by number
        const unsolved = cluesArr.filter(c => !this.solvedClues.has(`${direction}-${c.number}`)).sort((a, b) => a.number - b.number);
        const solved = cluesArr.filter(c => this.solvedClues.has(`${direction}-${c.number}`)).sort((a, b) => a.number - b.number);
        const sorted = unsolved.concat(solved);
        // Re-append in order
        sorted.forEach((clue, idx) => {
            const el = clueMap[clue.number];
            if (el && clueList.children[idx] !== el) {
                clueList.insertBefore(el, clueList.children[idx]);
            }
        });
    }

    // Resort answers: not on grid at top, then placed, all sorted by number
    resortAnswers(direction) {
        const wordListId = direction === 'across' ? 'across-words' : 'down-words';
        const wordList = document.getElementById(wordListId);
        const wordElements = Array.from(wordList.querySelectorAll('.word-item'));
        // Not placed: no .placed class
        const notPlaced = wordElements.filter(el => !el.classList.contains('placed')).sort((a, b) => parseInt(a.dataset.number) - parseInt(b.dataset.number));
        const placed = wordElements.filter(el => el.classList.contains('placed')).sort((a, b) => parseInt(a.dataset.number) - parseInt(b.dataset.number));
        const sorted = notPlaced.concat(placed);
        // Remove all children and re-append in sorted order
        while (wordList.firstChild) wordList.removeChild(wordList.firstChild);
        sorted.forEach(el => wordList.appendChild(el));
    }

    canPlaceAnswerAt(row, col, direction, word, number) {
        // Check if word fits within grid
        if (direction === 'across' && col + word.length > this.gridSize) return false;
        if (direction === 'down' && row + word.length > this.gridSize) return false;
        // Check for conflicts with existing letters and black squares
        for (let i = 0; i < word.length; i++) {
            let r = row, c = col;
            if (direction === 'across') c = col + i;
            else r = row + i;
            const cell = this.grid[r][c];
            if (cell.isBlack) return false;
            if (cell.letter && cell.letter !== word[i]) return false;
        }
        // Allow black square collision at before/after, but not with letters
        // Check the cell before the start of the word
        let beforeRow = row, beforeCol = col;
        if (direction === 'across') beforeCol = col - 1;
        else beforeRow = row - 1;
        if (this.isValidCell(beforeRow, beforeCol)) {
            const beforeCell = this.grid[beforeRow][beforeCol];
            if (beforeCell.letter) return false;
        }
        // Check the cell after the end of the word
        let endRow = row, endCol = col;
        if (direction === 'across') endCol = col + word.length;
        else endRow = row + word.length;
        if (this.isValidCell(endRow, endCol)) {
            const endCell = this.grid[endRow][endCol];
            if (endCell.letter) return false;
        }
        // Check for number conflicts
        const firstCell = this.grid[row][col];
        if (firstCell.number) {
            const numbers = firstCell.number.toString().split(',');
            if (!numbers.includes(number.toString())) {
                const existingNumbers = numbers.filter(n => n !== number.toString());
                if (existingNumbers.length > 0) return false;
            }
        }
        return true;
    }

    placeAnswerAt(row, col, direction, word, number) {
        // Place letters and track word usage
        for (let i = 0; i < word.length; i++) {
            let r = row, c = col;
            if (direction === 'across') c = col + i;
            else r = row + i;
            const cell = this.grid[r][c];
            cell.letter = word[i];
            cell.words.push({ word: word, direction: direction, number: number });
            // Remove existing letter span if any
            const existingLetter = cell.element.querySelector('.letter');
            if (existingLetter) existingLetter.remove();
            const letterSpan = document.createElement('span');
            letterSpan.className = 'letter';
            letterSpan.textContent = word[i];
            cell.element.appendChild(letterSpan);
        }
        
        // Add terminal black square after the word
        let endRow = row, endCol = col;
        if (direction === 'across') endCol = col + word.length;
        else endRow = row + word.length;
        if (this.isValidCell(endRow, endCol)) {
            this.setBlackSquare(endRow, endCol, 'terminal');
        }
        
        // Record placed word
        this.placedWords.push({
            word: word,
            number: number,
            direction: direction,
            startRow: row,
            startCol: col
        });
        this.updateNumberColors();
        this.updateClueOnGridStates();

        
        // Log grid state after placing answer
        // this.logGridState();
        // this.logGridArray();
    }

    // Helper to update clue visual state for on-grid answers
    updateClueOnGridStates() {
        ['across', 'down'].forEach(direction => {
            const clueListId = direction === 'across' ? 'across-clues' : 'down-clues';
            const clueList = document.getElementById(clueListId);
            const cluesArr = direction === 'across' ? this.clues.across : this.clues.down;
            cluesArr.forEach(clue => {
                const clueElement = clueList.querySelector(`.clue-item[data-number='${clue.number}']`);
                if (!clueElement) return;
                // Is this answer on the grid?
                const isOnGrid = this.placedWords.some(w => w.number === clue.number && w.direction === direction);
                if (isOnGrid) {
                    clueElement.classList.add('on-grid');
                } else {
                    clueElement.classList.remove('on-grid');
                }
                // Add or remove .answered class
                if (clue.userAnswer) {
                    clueElement.classList.add('answered');
                } else {
                    clueElement.classList.remove('answered');
                }
            });
        });
    }

    // Helper method to rebuild visual content from grid array
    rebuildVisualContent() {
        const gridElement = document.getElementById('crossword-grid');
        
        // Clear all visual content
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                if (cell.element) {
                    cell.element.innerHTML = '';
                    cell.element.classList.remove('black');
                }
            }
        }
        
        // Rebuild visual content from grid array
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                if (cell.element) {
                    if (cell.isBlack) {
                        cell.element.classList.add('black');
                    } else {
                        if (cell.number) {
                            const numberSpan = document.createElement('span');
                            numberSpan.className = 'number';
                            numberSpan.textContent = cell.number;
                            cell.element.appendChild(numberSpan);
                        }
                        
                        if (cell.letter) {
                            const letterSpan = document.createElement('span');
                            letterSpan.className = 'letter';
                            letterSpan.textContent = cell.letter;
                            cell.element.appendChild(letterSpan);
                        }
                    }
                }
            }
        }
        
        // Update number colors
        this.updateNumberColors();
    }

    // Helper method to completely rebuild the visual grid from grid array
    rebuildVisualGrid() {
        const gridElement = document.getElementById('crossword-grid');
        
        // Clear all existing DOM elements
        gridElement.innerHTML = '';
        
        // Recreate all DOM elements based on the grid array
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.grid[row][col];
                
                // Create a default cell if it doesn't exist
                if (!cell) {
                    this.grid[row][col] = {
                        element: null,
                        letter: null,
                        number: null,
                        isBlack: false,
                        blackSource: null,
                        words: []
                    };
                }
                
                const cellElement = document.createElement('div');
                cellElement.className = 'cell';
                cellElement.dataset.row = row;
                cellElement.dataset.col = col;
                cellElement.draggable = true;
                
                // Add visual content based on grid array data
                if (cell.isBlack) {
                    cellElement.classList.add('black');
                } else {
                    if (cell.number) {
                        const numberSpan = document.createElement('span');
                        numberSpan.className = 'number';
                        numberSpan.textContent = cell.number;
                        cellElement.appendChild(numberSpan);
                    }
                    
                    if (cell.letter) {
                        const letterSpan = document.createElement('span');
                        letterSpan.className = 'letter';
                        letterSpan.textContent = cell.letter;
                        cellElement.appendChild(letterSpan);
                    }
                }
                
                // Update the grid array to point to the new element
                this.grid[row][col].element = cellElement;
                
                // Add to DOM
                gridElement.appendChild(cellElement);
            }
        }
        
        // Update grid template
        this.updateGridTemplate();
        
        // Update number colors
        this.updateNumberColors();
    }

    toggleManualBlackSquare(cellElement) {
        const row = parseInt(cellElement.dataset.row);
        const col = parseInt(cellElement.dataset.col);
        const cell = this.grid[row][col];
        const key = `${row},${col}`;
        
        // Check if this cell is currently black due to manual placement
        const isManuallyBlack = this.blackManual.has(key);
        
        if (isManuallyBlack) {
            // Remove manual black square
            this.removeBlackSquare(row, col, 'manual');
        } else {
            // Check if we can place a black square here
            if (this.canPlaceBlackSquare(row, col)) {
                this.setBlackSquare(row, col, 'manual');
            } else {
                console.log('Cannot place black square at', row, col, '- cell has letter or number');
            }
        }
    }
}

// Add a guard to prevent double initialization
if (!window.__crosswordBuilderInitialized) {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing CrosswordBuilder');
        new CrosswordBuilder();
        window.__crosswordBuilderInitialized = true;
    });
} 