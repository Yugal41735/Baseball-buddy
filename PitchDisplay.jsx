import React, { useState, useEffect } from 'react';

const PitchDisplay = ({ lastPitch, gameState }) => {
  const [pitchAnimation, setPitchAnimation] = useState(false);
  
  useEffect(() => {
    if (lastPitch) {
      setPitchAnimation(true);
      setTimeout(() => setPitchAnimation(false), 1000);
    }
  }, [lastPitch]);

  // Generate random pitch location
  const getPitchLocation = () => {
    return {
      x: 30 + Math.random() * 40,
      y: 20 + Math.random() * 60
    };
  };

  const location = getPitchLocation();

  return (
    <div className="border rounded p-4 bg-white">
      <h2 className="font-bold text-lg mb-2">Pitch Visualization</h2>
      <div className="relative w-full" style={{ height: '200px' }}>
        {/* Strike Zone */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Batter's Box */}
          <rect 
            x="20" y="10" 
            width="60" height="80" 
            fill="none" 
            stroke="#ccc" 
            strokeWidth="1"
          />
          
          {/* Strike Zone */}
          <rect 
            x="30" y="20" 
            width="40" height="60" 
            fill="none" 
            stroke="#666" 
            strokeWidth="2" 
            strokeDasharray="4"
          />
          
          {/* Zone Grid */}
          {[1, 2].map(x => (
            <line 
              key={`vertical-${x}`}
              x1={30 + (x * 40/3)} 
              y1="20" 
              x2={30 + (x * 40/3)} 
              y2="80" 
              stroke="#ddd" 
              strokeWidth="1"
            />
          ))}
          {[1, 2].map(y => (
            <line 
              key={`horizontal-${y}`}
              x1="30" 
              y1={20 + (y * 60/3)} 
              x2="70" 
              y2={20 + (y * 60/3)} 
              stroke="#ddd" 
              strokeWidth="1"
            />
          ))}
          
          {/* Pitch Location */}
          {lastPitch && (
            <g className={pitchAnimation ? 'animate-ping' : ''}>
              <circle 
                cx={location.x} 
                cy={location.y} 
                r="2"
                fill={gameState?.lastPlay === 'strike' ? '#ef4444' : '#3b82f6'}
              />
              <circle 
                cx={location.x} 
                cy={location.y} 
                r="4"
                fill="none"
                stroke={gameState?.lastPlay === 'strike' ? '#ef4444' : '#3b82f6'}
                strokeWidth="1"
                opacity="0.5"
              />
            </g>
          )}
        </svg>

        {/* Pitch Info Overlay */}
        {lastPitch && (
          <div className="absolute top-2 right-2 bg-gray-800 text-white p-2 rounded text-sm opacity-80">
            {lastPitch.type}: {lastPitch.speed} MPH
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-2 flex gap-4 text-sm text-gray-600">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-1" />
          Strike
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1" />
          Ball
        </div>
      </div>
    </div>
  );
};

export default PitchDisplay;