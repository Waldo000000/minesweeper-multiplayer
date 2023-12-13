export type Cell = {
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    neighbouringMines: number;
};

type Board = Cell[][];

export type State = {
    board: Board;
};

export type MinesweeperEvent = CellsRevealedEvent | CellFlaggedEvent | CellUnflaggedEvent | GameLostEvent;

export type Coord = { row: number; col: number };

export type CellsRevealedEvent = {
    type: 'cellsRevealed';
    cells: Coord[];
};

export type CellFlaggedEvent = {
    type: 'cellFlagged';
    row: number;
    col: number;
};

export type CellUnflaggedEvent = {
    type: 'cellUnflagged';
    row: number;
    col: number;
};

export type GameLostEvent = {
    type: 'gameLost';
};

export class MinesweeperGame {
    private eventQueue: MinesweeperEvent[] = [];

    private rows: number;
    private cols: number;
    private totalMines: number;
    private onStateChangeCallback: (state: State) => void;

    private state: State;

    constructor(rows: number, cols: number, totalMines: number, onStateChangeCallback: (state: State) => void) {
        this.rows = rows;
        this.cols = cols;
        this.totalMines = totalMines;
        this.onStateChangeCallback = onStateChangeCallback;

        this.state = {
            board: this.createBoard()
        };
        this.placeMines();
        this.calculateNeighbouringMines();
        this.onStateChanged();
    }

    private createBoard(): Board {
        const board: Board = [];

        for (let row = 0; row < this.rows; row++) {
            const newRow: Cell[] = [];
            for (let col = 0; col < this.cols; col++) {
                newRow.push({
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighbouringMines: 0
                });
            }
            board.push(newRow);
        }

        return board;
    }

    private placeMines(): void {
        let minesToPlace = this.totalMines;

        while (minesToPlace > 0) {
            const randomRow = Math.floor(Math.random() * this.rows);
            const randomCol = Math.floor(Math.random() * this.cols);

            if (!this.state.board[randomRow][randomCol].isMine) {
                this.state.board[randomRow][randomCol].isMine = true;
                minesToPlace--;
            }
        }
    }

    private calculateNeighbouringMines(): void {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.state.board[row][col].isMine) {
                    let count = 0;

                    for (let i = -1; i <= 1; i++) {
                        for (let j = -1; j <= 1; j++) {
                            const newRow = row + i;
                            const newCol = col + j;

                            if (
                                newRow >= 0 &&
                                newRow < this.rows &&
                                newCol >= 0 &&
                                newCol < this.cols &&
                                this.state.board[newRow][newCol].isMine
                            ) {
                                count++;
                            }
                        }
                    }

                    this.state.board[row][col].neighbouringMines = count;
                }
            }
        }
    }

    revealCell = (row: number, col: number) => {
        const cell = this.state.board[row][col];
        const revealedCells = [{ row, col }];

        // Queue additional events for revealing neighboring empty cells
        if (cell.neighbouringMines === 0) {
            this.addNeighborsToRevealedCells(revealedCells, row, col);
        }

        this.publishEvent({
            type: 'cellsRevealed',
            cells: revealedCells
        });

        if (cell.isMine) {
            this.publishEvent({
                type: 'gameLost'
            });
        }
        this.onStateChanged();
    }

    private publishEvent(event: MinesweeperEvent): void {
        this.eventQueue.push(event);
        this.processEventQueue();
    }

    private processEventQueue(): void {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            if (event) {
                this.processEvent(event);
            }
        }
    }

    flagCell = (row: number, col: number) => {
        const cell = this.state.board[row][col];
        if (!cell.isRevealed) {
            cell.isFlagged = !cell.isFlagged;
        }
        this.onStateChanged();
    }

    processEvent(event: MinesweeperEvent): void {
        switch (event.type) {
            case 'cellsRevealed':
                this.processCellsRevealedEvent(event);
                break;
            case 'cellFlagged':
                this.processCellFlaggedEvent(event);
                break;
            case 'cellUnflagged':
                this.processCellUnflaggedEvent(event);
                break;
            case 'gameLost':
                this.processGameLostEvent(event);
                break;
        }
    }

    private processCellsRevealedEvent(event: CellsRevealedEvent): void {
        event.cells.forEach(({ row, col }) => {
            const cell = this.state.board[row][col];
            cell.isRevealed = true;
            cell.isFlagged = false;
        });
    }

    private processCellFlaggedEvent(event: CellFlaggedEvent): void {
        const { row, col } = event;
        this.toggleFlag(row, col, true);
    }

    private processCellUnflaggedEvent(event: CellUnflaggedEvent): void {
        const { row, col } = event;
        this.toggleFlag(row, col, false);
    }

    private processGameLostEvent(event: GameLostEvent): void {
        this.forceRevealAll();
    }

    private toggleFlag(row: number, col: number, isFlagged: boolean): void {
        const cell = this.state.board[row][col];
        if (!cell.isRevealed) {
            cell.isFlagged = isFlagged;
            this.onStateChanged();
        }
    }

    private addNeighborsToRevealedCells(revealedCells: Coord[], row: number, col: number) {
        const directions = [
            { row: -1, col: -1 },
            { row: -1, col: 0 },
            { row: -1, col: 1 },
            { row: 0, col: -1 },
            { row: 0, col: 1 },
            { row: 1, col: -1 },
            { row: 1, col: 0 },
            { row: 1, col: 1 }
        ];
    
        for (const direction of directions) {
            const newRow = row + direction.row;
            const newCol = col + direction.col;
    
            if (this.isValidCell(newRow, newCol)) {
                const neighborCell = this.state.board[newRow][newCol];
                if (!revealedCells.some((cell) => cell.row === newRow && cell.col === newCol)) {
                    revealedCells.push({ row: newRow, col: newCol });

                    // Recursively add neighbors for empty cells
                    if (neighborCell.neighbouringMines === 0) {
                        this.addNeighborsToRevealedCells(revealedCells, newRow, newCol);
                    }
                }
            }
        }
    }

    private isValidCell(row: number, col: number): boolean {
        return row >= 0 && row < this.state.board.length && col >= 0 && col < this.state.board[0].length;
    }

    private forceRevealAll(): void {
        this.state.board.forEach((row) => {
            row.forEach((cell) => {
                cell.isRevealed = true;
            });
        });
        this.onStateChanged();
    }

    private onStateChanged() {
        this.onStateChangeCallback({ ...this.state });
    }
}
