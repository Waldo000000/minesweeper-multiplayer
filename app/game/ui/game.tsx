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

    useEffect(() => {
        const game = new MinesweeperGame(nRows, nCols, nMines, (state) => setState({...state}));
         
        setMinesweeperGame(game);
    }, [nRows, nCols, nMines]);

    return <Grid
        board={state?.board ?? []}
        onCellClick={minesweeperGame?.revealCell || (() => { })}
        onCellRightClick={minesweeperGame?.flagCell || (() => { })}
    />
}

export default Game;