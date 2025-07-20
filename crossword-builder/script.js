class CrosswordBuilder {
    constructor() {
        this.gridSize = 15;
        this.grid = [];
        this.placedWords = [];
        this.selectedWord = null;
        
        this.init();
    }
    
    init() {
        console.log('Initializing CrosswordBuilder...');
        this.createGrid();
        this.loadWords();
        this.setupEventListeners();
        console.log('CrosswordBuilder initialized');
    }
    
    createGrid() {
        console.log('Creating grid...');
        const gridElement = document.getElementById('crossword-grid');
        
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
                    words: [] // Track which words use this cell
                };
            }
        }
        console.log('Grid created with', this.gridSize * this.gridSize, 'cells');
    }
    
    loadWords() {
        console.log('Loading words...');
        // Sample data from grid1.txt
        const acrossWords = [
            { number: 1, word: 'HAS' },
            { number: 4, word: 'OCT' },
            { number: 7, word: 'ALOFT' },
            { number: 12, word: 'AIM' },
            { number: 13, word: 'BOO' },
            { number: 14, word: 'GENRE' },
            { number: 15, word: 'TRANSOM' },
            { number: 17, word: 'RACED' },
            { number: 18, word: 'LIE' },
            { number: 19, word: 'RESETS' },
            { number: 20, word: 'WALL STREET' },
            { number: 24, word: 'ARE' },
            { number: 25, word: 'SEEPS' },
            { number: 26, word: 'HOG' },
            { number: 29, word: 'SIS' },
            { number: 30, word: 'RIO' },
            { number: 31, word: 'ALL' },
            { number: 32, word: 'PAT' },
            { number: 33, word: 'TENSE' },
            { number: 35, word: 'CEE' },
            { number: 36, word: 'POSSESSION' },
            { number: 38, word: 'MEDUSA' },
            { number: 41, word: 'TIE' },
            { number: 42, word: 'OVALS' },
            { number: 43, word: 'STERNER' },
            { number: 47, word: 'SENSE' },
            { number: 48, word: 'HEE' },
            { number: 49, word: 'DEB' },
            { number: 50, word: 'TREES' },
            { number: 51, word: 'YAM' },
            { number: 52, word: 'ALI' }
        ];
        
        const downWords = [
            { number: 1, word: 'HAT' },
            { number: 2, word: 'AIR' },
            { number: 3, word: 'SMALLEST' },
            { number: 4, word: 'OBSESS' },
            { number: 5, word: 'COO' },
            { number: 6, word: 'TOM' },
            { number: 7, word: 'AGREES' },
            { number: 8, word: 'LEAST' },
            { number: 9, word: 'ONCE' },
            { number: 10, word: 'FRET' },
            { number: 11, word: 'TEDS' },
            { number: 16, word: 'NIL' },
            { number: 19, word: 'REPOSE' },
            { number: 20, word: 'WASP' },
            { number: 21, word: 'ARIA' },
            { number: 22, word: 'TERESA' },
            { number: 23, word: 'REINS' },
            { number: 26, word: 'HACIENDA' },
            { number: 26, word: 'OLEO' },
            { number: 28, word: 'GLEN' },
            { number: 33, word: 'TOSSES' },
            { number: 34, word: 'ESTEEM' },
            { number: 36, word: 'PULSE' },
            { number: 37, word: 'SIR' },
            { number: 38, word: 'MOST' },
            { number: 39, word: 'EVER' },
            { number: 40, word: 'DANE' },
            { number: 43, word: 'SHY' },
            { number: 44, word: 'TEA' },
            { number: 45, word: 'EEL' },
            { number: 46, word: 'RBI' }
        ];
        
        this.renderWordList('across-words', acrossWords);
        this.renderWordList('down-words', downWords);
        console.log('Words loaded:', acrossWords.length, 'across,', downWords.length, 'down');
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
    
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Word item click events
        document.addEventListener('click', (e) => {
            console.log('Click event on:', e.target);
            
            // Check if clicking on a word item (including child elements)
            let wordElement = e.target;
            while (wordElement && !wordElement.classList.contains('word-item')) {
                wordElement = wordElement.parentElement;
            }
            
            if (wordElement && wordElement.classList.contains('word-item') && !wordElement.classList.contains('placed')) {
                console.log('Selecting word from list');
                this.selectWord(wordElement);
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            // Check if clicking on a cell or its child elements
            let cellElement = e.target;
            while (cellElement && !cellElement.classList.contains('cell')) {
                cellElement = cellElement.parentElement;
            }
            
            if (cellElement && cellElement.classList.contains('cell')) {
                // If we have a word selected from the list, try to place it first
                if (this.selectedWord && this.selectedWord.source === 'word-list') {
                    console.log('Placing selected word from list on grid');
                    this.placeSelectedWord(cellElement);
                    e.preventDefault();
                    e.stopPropagation();
                } else if (cellElement.querySelector('.letter')) {
                    // If no word selected from list, then try to select/switch grid words
                    console.log('Selecting placed word from grid');
                    this.selectPlacedWord(cellElement);
                    e.preventDefault();
                    e.stopPropagation();
                } else if (!this.selectedWord && !cellElement.querySelector('.letter')) {
                    // If no word selected and clicking on empty cell, toggle black square
                    console.log('Toggling black square');
                    this.toggleBlackSquare(cellElement);
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        });

        // Double-click to remove selected words
        document.addEventListener('dblclick', (e) => {
            console.log('Double-click event on:', e.target);
            
            // Check if clicking on a cell or its child elements
            let cellElement = e.target;
            while (cellElement && !cellElement.classList.contains('cell')) {
                cellElement = cellElement.parentElement;
            }
            
            if (cellElement && cellElement.classList.contains('cell')) {
                // If cell has a letter and is selected, try to remove the word
                if (cellElement.querySelector('.letter') && cellElement.classList.contains('selected')) {
                    console.log('Double-click removing selected word');
                    this.removeWordFromGrid(cellElement);
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        });
        

        
        console.log('Event listeners set up');
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
        this.removeWord(this.selectedWord.originalRow, this.selectedWord.originalCol);
        
        // Return it to the word list
        this.unmarkWordAsPlaced(this.selectedWord.word, this.selectedWord.direction, this.selectedWord.number);
        
        // Clear the selection
        this.clearAllSelections();
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
            this.removeWord(this.selectedWord.originalRow, this.selectedWord.originalCol);
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

        // Record placed word
        this.placedWords.push({
            word: word,
            number: number,
            direction: direction,
            startRow: startRow,
            startCol: startCol
        });

        // Mark word as placed in the list (use original word with spaces for matching)
        this.markWordAsPlaced(this.selectedWord.word, direction, number);

        // Update number colors for duplicates
        this.updateNumberColors();
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

    markWordAsPlaced(word, direction, number) {
        const containerId = direction === 'across' ? 'across-words' : 'down-words';
        const container = document.getElementById(containerId);
        
        // Find the word element
        const wordElements = container.querySelectorAll('.word-item');
        let targetElement = null;
        
        wordElements.forEach(element => {
            if (element.dataset.word === word && 
                parseInt(element.dataset.number) === number &&
                element.dataset.direction === direction) {
                targetElement = element;
            }
        });
        
        if (targetElement) {
            // Mark as placed
            targetElement.classList.add('placed');
            targetElement.draggable = false;
            
            // Move to bottom
            container.appendChild(targetElement);
        }
    }

    unmarkWordAsPlaced(word, direction, number) {
        const containerId = direction === 'across' ? 'across-words' : 'down-words';
        const container = document.getElementById(containerId);
        
        // Find the word element
        const wordElements = container.querySelectorAll('.word-item');
        let targetElement = null;
        
        wordElements.forEach(element => {
            if (element.dataset.word === word && 
                parseInt(element.dataset.number) === number &&
                element.dataset.direction === direction) {
                targetElement = element;
            }
        });
        
        if (targetElement) {
            // Unmark as placed
            targetElement.classList.remove('placed');
            targetElement.draggable = true;
            
            // Move back to original position (this is simplified - you might want more sophisticated sorting)
            // For now, just move it to the top
            container.insertBefore(targetElement, container.firstChild);
        }
    }

    removeWord(startRow, startCol) {
        // Find the word to remove
        const wordIndex = this.placedWords.findIndex(w => 
            w.startRow === startRow && w.startCol === startCol
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
            
            // Update the number display
            const firstCell = this.grid[startRow][startCol];
            if (firstCell.words.length === 0) {
                firstCell.number = null;
                const numberSpan = firstCell.element.querySelector('.number');
                if (numberSpan) {
                    numberSpan.remove();
                }
            } else {
                // Update number to show remaining words
                const numbers = [...new Set(firstCell.words.map(w => w.number))];
                firstCell.number = numbers.join(',');
                let numberSpan = firstCell.element.querySelector('.number');
                if (numberSpan) {
                    numberSpan.textContent = firstCell.number;
                }
            }
            
            // Unmark word as placed in the list
            this.unmarkWordAsPlaced(word.word, word.direction, word.number);
            
            // Update number colors for duplicates
            this.updateNumberColors();
        }
    }
    
    isValidCell(row, col) {
        return row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize;
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
            
            // Clear any existing content
            cellElement.innerHTML = '';
            cell.letter = null;
            cell.number = null;
            cell.words = [];
            
            // Remove this cell from any words that use it
            this.placedWords = this.placedWords.filter(word => {
                let wordUsesThisCell = false;
                for (let i = 0; i < word.word.length; i++) {
                    let wordRow = word.startRow;
                    let wordCol = word.startCol;
                    
                    if (word.direction === 'across') {
                        wordCol = word.startCol + i;
                    } else {
                        wordRow = word.startRow + i;
                    }
                    
                    if (wordRow === row && wordCol === col) {
                        wordUsesThisCell = true;
                        break;
                    }
                }
                return !wordUsesThisCell;
            });
            
            // Update the grid to reflect removed words
            this.updateGridDisplay();
        } else {
            // Make cell white again
            cellElement.classList.remove('black');
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
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing CrosswordBuilder');
    new CrosswordBuilder();
}); 