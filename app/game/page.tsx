import React from 'react';
import Game from './ui/game';

export default function Page() {
  return (
    <div>
      <h1>Minesweeper Game</h1>
      <Game nRows={8} nCols={8} nMines={10}></Game>
    </div>
  );
};
