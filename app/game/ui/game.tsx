'use client';
import { useEffect, useState } from 'react';
import Grid from './grid';
import { MinesweeperGame, State } from '../lib/minesweeper-game';

interface GameProps {
    nRows: number;
    nCols: number;
    nMines: number;
}

const Game: React.FC<GameProps> = ({ nRows, nCols, nMines }) => {
    const [minesweeperGame, setMinesweeperGame] = useState<MinesweeperGame | null>(null);
    const [state, setState] = useState<State | null>(null);

    const newGame = () => new MinesweeperGame(nRows, nCols, nMines, (state) => setState({ ...state }));

    useEffect(() => setMinesweeperGame(newGame()), [nRows, nCols, nMines]);

    const handleReset = () => setMinesweeperGame(newGame());

    return (
        <div>
            <Grid
                board={state?.board ?? []}
                onCellClick={minesweeperGame?.revealCell || (() => { })}
                onCellRightClick={minesweeperGame?.flagCell || (() => { })}
            />
            <button
                onClick={handleReset}
                className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                New Game
            </button>
        </div >
    )
}

export default Game;