import React from 'react';
import dynamic from 'next/dynamic';
import { Cell } from '../lib/minesweeper-game';

const DynamicCell = dynamic(() => import('./cell'), { ssr: false });

interface GridProps {
  board: Cell[][];
  onRevealClick: (row: number, col: number) => void;
  onToggleFlagClick: (row: number, col: number) => void;
}

const Grid: React.FC<GridProps> = ({ board, onRevealClick, onToggleFlagClick }) => {
  return (
    <div className="grid">
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="row flex items-center h-8 text-2xl">
          {row.map((cell, colIndex) => (
            <DynamicCell
              key={`${rowIndex}-${colIndex}`}
              neighbouringMines={cell.neighbouringMines}
              isMine={cell.isMine}
              isRevealed={cell.isRevealed}
              isFlagged={cell.isFlagged}
              onRevealClick={() => onRevealClick(rowIndex, colIndex)}
              onToggleFlagClick={() => onToggleFlagClick(rowIndex, colIndex)}
            />
          ))}
        </div>
      ))}
    </div>
  )
};

export default Grid;
