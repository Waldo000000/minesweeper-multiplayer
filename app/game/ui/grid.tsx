import React from 'react';
import dynamic from 'next/dynamic';
import { Cell } from '../lib/minesweeper-game';

const DynamicCell = dynamic(() => import('./cell'), { ssr: false });

interface GridProps {
  board: Cell[][];
  onCellClick: (row: number, col: number) => void;
  onCellRightClick: (row: number, col: number) => void;
}

const Grid: React.FC<GridProps> = ({ board, onCellClick, onCellRightClick }) => {
  return (
    <div className="grid">
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="row flex">
          {row.map((cell, colIndex) => (
            <DynamicCell
              key={`${rowIndex}-${colIndex}`}
              neighbouringMines={cell.neighbouringMines}
              isMine={cell.isMine}
              isRevealed={cell.isRevealed}
              isFlagged={cell.isFlagged}
              onClick={() => onCellClick(rowIndex, colIndex)}
              onRightClick={(e) => {
                e.preventDefault();
                onCellRightClick(rowIndex, colIndex);
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
};

export default Grid;
