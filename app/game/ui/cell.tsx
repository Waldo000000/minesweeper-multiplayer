'use client';
import React, { useState } from 'react';

export interface CellProps {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighbouringMines: number;
  onRevealClick: () => void;
  onToggleFlagClick: () => void;
}

const Cell: React.FC<CellProps> = ({ neighbouringMines, isMine, isRevealed, isFlagged, onRevealClick, onToggleFlagClick }) => {

  const [startY, setStartY] = useState<number | null>(null);

  const handleClick = () => {
    if (!isRevealed && !isFlagged) {
      onRevealClick();
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    if (!isRevealed) {
      e.preventDefault();
      onToggleFlagClick();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startY !== null) {
      const deltaY = e.changedTouches[0].clientY - startY;
      if (deltaY < -20) {
        // On "swipe up", toggle flag
        e.preventDefault();
        onToggleFlagClick();
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
