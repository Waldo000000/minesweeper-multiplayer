'use client';
import React, { useState } from 'react';

export interface CellProps {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighbouringMines: number;
  onClick: () => void;
  onRightClick: (e: React.MouseEvent | React.TouchEvent) => void;
}

const Cell: React.FC<CellProps> = ({ neighbouringMines, isMine, isRevealed, isFlagged, onClick, onRightClick }) => {

  const [startY, setStartY] = useState<number | null>(null);

  const handleClick = () => {
    onClick();
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onRightClick(e);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startY !== null) {
      const deltaY = e.changedTouches[0].clientY - startY;
      if (deltaY < -20) {
        // Treat a swipe up as a right click
        onRightClick(e);
      } else {
        // Treat tap as a click
        onClick();
      }
      setStartY(null);
    }
  };

  return (
    <div
      className={`w-8 align-middle select-none p-0 cursor-default text-center cell ${isRevealed ? 'revealed' : ''} ${isFlagged ? 'flagged' : ''}`}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {!isRevealed && !isFlagged && '⬜'}
      {!isRevealed && isFlagged && '🚩'}
      {isRevealed && !isFlagged && !isMine && neighbouringMines === 0 && '⬛'}
      {isRevealed && !isFlagged && !isMine && neighbouringMines !== 0 && neighbouringMines}
      {isRevealed && !isFlagged && isMine && '💥'}
      {isRevealed && isFlagged && !isMine && '❌'}
      {isRevealed && isFlagged && isMine && '🚩'}
    </div>
  );
};

export default Cell;
