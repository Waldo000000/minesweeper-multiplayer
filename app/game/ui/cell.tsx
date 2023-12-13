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
      className={`w-8 cursor-default text-center cell ${isRevealed ? 'revealed' : ''} ${isFlagged ? 'flagged' : ''}`}
      onClick={handleClick}
      onContextMenu={handleRightClick}
    >
      {!isRevealed && !isFlagged && '⬜'}
      {!isRevealed && isFlagged && '🚩'}
      {isRevealed && !isFlagged && !isMine && neighbouringMines === 0 && '⬛'}
      {isRevealed && !isFlagged && !isMine && neighbouringMines !== 0 && neighbouringMines}
      {isRevealed && !isFlagged && isMine && '💥'}
      {isRevealed && isFlagged && !isMine &&  '❌'}
      {isRevealed && isFlagged && isMine && '🚩'}
    </div>
  );
};

export default Cell;
