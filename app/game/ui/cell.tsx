'use client';
import React from 'react';

export interface CellProps {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighbouringMines: number;
  onClick: () => void;
  onRightClick: (e: React.MouseEvent) => void;
}

const Cell: React.FC<CellProps> = ({ neighbouringMines, isMine, isRevealed, isFlagged, onClick, onRightClick }) => {
  const handleClick = () => {
    if (!isFlagged && !isRevealed) {
      onClick();
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isRevealed) {
      onRightClick(e);
    }
  };

  return (
    <div
      className={`w-8 cell ${isRevealed ? 'revealed' : ''} ${isFlagged ? 'flagged' : ''}`}
      onClick={handleClick}
      onContextMenu={handleRightClick}
    >
      {!isRevealed && !isFlagged && '⬜'}
      {!isRevealed && isFlagged && '🚩'}
      {isRevealed && !isMine && neighbouringMines === 0 && '⬛'}
      {isRevealed && !isMine && neighbouringMines !== 0 && neighbouringMines}
      {isRevealed && isMine && '💥'}
    </div>
  );
};

export default Cell;
