import React from 'react';

const BaseballField = ({ baseRunners = [] }) => {
  return (
    <div className="relative w-full h-48">
      {/* SVG Baseball Diamond */}
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full"
        style={{ transform: 'rotate(45deg)' }}
      >
        {/* Infield Grass */}
        <rect x="20" y="20" width="60" height="60" fill="#90EE90" />
        
        {/* Base Lines */}
        <path 
          d="M50 20 L80 50 L50 80 L20 50 Z" 
          fill="none" 
          stroke="#fff" 
          strokeWidth="2"
        />
        
        {/* Bases */}
        <rect 
          x="48" y="18" width="4" height="4" 
          fill={baseRunners.includes('1B') ? '#ff4444' : '#fff'} 
          stroke="#000"
        />
        <rect 
          x="78" y="48" width="4" height="4" 
          fill={baseRunners.includes('2B') ? '#ff4444' : '#fff'} 
          stroke="#000"
        />
        <rect 
          x="48" y="78" width="4" height="4" 
          fill={baseRunners.includes('3B') ? '#ff4444' : '#fff'} 
          stroke="#000"
        />
        
        {/* Home Plate */}
        <polygon 
          points="20,50 18,48 20,46 22,48" 
          fill="#fff" 
          stroke="#000"
        />
        
        {/* Pitcher's Mound */}
        <circle cx="50" cy="50" r="2" fill="#tan" stroke="#000" />
      </svg>
      
      {/* Status Indicators */}
      <div className="absolute top-0 left-0 p-2 flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i}
            className={`w-3 h-3 rounded-full border ${
              i < (baseRunners.length) ? 'bg-red-500' : 'bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default BaseballField;