import React from 'react';
import clsx from 'clsx';
import './GlassCard.css';

const GlassCard = ({ children, className, glowColor, onClick }) => {
  return (
    <div 
      className={clsx('glass-panel', className, { clickable: !!onClick })}
      onClick={onClick}
      style={glowColor ? { '--custom-glow': glowColor } : {}}
    >
      {children}
    </div>
  );
};

export default GlassCard;
