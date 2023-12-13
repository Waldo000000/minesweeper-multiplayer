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

export class MinesweeperGame {
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
        this.calculateneighbouringMines();
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

    private calculateneighbouringMines(): void {
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
        if (!cell.isRevealed) {
            cell.isRevealed = true;
            if (cell.isMine) {
                this.revealAll();
            }
        }
        this.onStateChanged();
    }

    flagCell = (row: number, col: number) => {
        const cell = this.state.board[row][col];
        if (!cell.isRevealed) {
            cell.isFlagged = !cell.isFlagged;
        }
        this.onStateChanged();
    }

    private revealAll(): void {
        this.state.board.forEach((row) => {
            row.forEach((cell) => {
                cell.isRevealed = true;
            });
        });
        this.onStateChanged();
    }
    
    private onStateChanged() {
        this.onStateChangeCallback({...this.state});
    }
}