import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const GameStats = ({ gameState }) => {
  console.log("GameStats received gameState:",gameState);
  const calculatePitchPercentages = () => {
    if (!gameState?.pitcher?.pitchCount) return [];
    
    const total = gameState.pitcher.pitchCount;
    return [
      {
        name: 'Strikes',
        percentage: (gameState.pitcher.strikeouts / total) * 100
      },
      {
        name: 'Balls',
        percentage: ((total - gameState.pitcher.strikeouts) / total) * 100
      }
    ];
  };

  return (
    <div className="border rounded p-4 bg-white">
      <h2 className="font-bold text-lg mb-4">Game Statistics</h2>
      
      <div className="space-y-4">
        {/* Pitch Distribution */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Pitch Distribution</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={calculatePitchPercentages()}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="percentage" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-sm text-gray-500">Pitch Count</p>
            <p className="text-xl font-bold">{gameState?.pitcher?.pitchCount || 0}</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-sm text-gray-500">Strikeouts</p>
            <p className="text-xl font-bold">{gameState?.pitcher?.strikeouts || 0}</p>
          </div>
        </div>

        {/* Last Pitch Details */}
        {gameState?.lastPitch && (
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <h3 className="text-sm font-medium">Last Pitch Analysis</h3>
            <div className="mt-1 text-sm text-gray-600">
              <p>Type: {gameState.lastPitch.type}</p>
              <p>Speed: {gameState.lastPitch.speed} MPH</p>
              <p>Result: {gameState.lastPitch.result}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameStats;