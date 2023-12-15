'use client';
import { useState, Touch } from 'react';

export interface CellProps {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighbouringMines: number;
  onRevealClick: () => void;
  onToggleFlagClick: () => void;
}

const Cell: React.FC<CellProps> = ({ neighbouringMines, isMine, isRevealed, isFlagged, onRevealClick, onToggleFlagClick }) => {

  // Track touch positions to detect swipes
  const [touchStart, setTouchStart] = useState<Touch | null>(null);
  const swipeMinDeltaThreshold = 20;

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
    setTouchStart(e.touches[0]);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart !== null) {
      const deltaX = e.changedTouches[0].clientX - touchStart?.clientX;
      const deltaY = e.changedTouches[0].clientY - touchStart?.clientY;
      const isSwipeRight = deltaX > swipeMinDeltaThreshold;
      const isSwipeUp = deltaY < -swipeMinDeltaThreshold;
      if (isSwipeRight || isSwipeUp) {
        e.preventDefault();
        onToggleFlagClick();
      }
      setTouchStart(null);
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
