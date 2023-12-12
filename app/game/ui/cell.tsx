'use client';
import React from 'react';

interface CellProps {
  value: number;
  revealed: boolean;
  flagged: boolean;
  onClick: () => void;
  onRightClick: (e: React.MouseEvent) => void;
}

const Cell: React.FC<CellProps> = ({ value, revealed, flagged, onClick, onRightClick }) => {
  const handleClick = () => {
    if (!flagged && !revealed) {
      onClick();
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!revealed) {
      onRightClick(e);
    }
  };

  return (
    <div
      className={`cell ${revealed ? 'revealed' : ''} ${flagged ? 'flagged' : ''}`}
      onClick={handleClick}
      onContextMenu={handleRightClick}
    >
      {revealed && !flagged ? (value === 0 ? "[empty]" : value) : flagged ? '🚩' : "[hidden]"}
    </div>
  );
};

export default Cell;
