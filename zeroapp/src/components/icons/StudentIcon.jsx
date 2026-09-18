import React from 'react';

const StudentIcon = ({ className }) => {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <path d="M 20 100 Q 50 50 80 100" fill="#3b82f6" />
      <circle cx="50" cy="40" r="18" fill="#fcd34d" />
      <path d="M 25 28 L 50 15 L 75 28 L 50 41 Z" fill="#1e3a8a" />
      <path d="M 35 34 L 35 48 Q 50 55 65 48 L 65 34" fill="none" stroke="#1e3a8a" strokeWidth="3.5" />
      <line x1="50" y1="28" x2="78" y2="38" stroke="#fbbf24" strokeWidth="2.5" />
      <circle cx="78" cy="38" r="3" fill="#fbbf24" />
    </svg>
  );
};

export default StudentIcon;
