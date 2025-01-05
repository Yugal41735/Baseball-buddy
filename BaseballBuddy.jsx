import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Video, Brain, Settings, PlayCircle, PauseCircle, Book, Calendar } from 'lucide-react';
import CommentaryGenerator from '../services/commentaryGenerator';
import BaseballField from './BaseballField';
import PitchDisplay from './PitchDisplay';
import GameStats from './GameStats';
import PitchSequence from './PitchSequence';
import LearningMode from './LearningMode';
import GameSelector from './GameSelector';
import MLBDataService from '../services/mlbDataService';

const BaseballBuddy = () => {
  const [commentaryGen] = useState(new CommentaryGenerator());
  const [gameState, setGameState] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedMode, setSelectedMode] = useState('casual');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [isLearningModeVisible, setIsLearningModeVisible] = useState(false);
  const [isGameSelectorVisible, setIsGameSelectorVisible] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [mlbService] = useState(new MLBDataService());
  const [simulationState, setSimulationState] = useState({
    isLoaded: false,
    currentPlayIndex: 0,
    speed: 1, // playback speed multiplier
    totalPlays: 0
  });
  

  const personalityModes = [
    { id: 'casual', name: 'Casual Fan', description: 'Easy-going, fun explanations' },
    { id: 'stats', name: 'Stats Nerd', description: 'Deep dive into numbers' },
    { id: 'history', name: 'History Buff', description: 'Historical context and stories' }
  ];

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  

  const handleGameSelect = async (gameId) => {
    setSelectedGameId(gameId);
    setIsPlaying(false);
    setMessages([]);
    setGameState(null);
    
    // First check the game status
    console.log("Game selected:", gameId);
    const gameData = await mlbService.getLiveGameData(gameId);
    console.log("Game status:", gameData.status);
    console.log("Game state:", gameData.gameState);


    
    if (gameData.status === 'Final') {
        // Load historical game data
        const historicalData = await mlbService.loadHistoricalGame(gameId);
        if (historicalData.status === 'loaded') {
            setSimulationState(prev => ({
                ...prev,
                isLoaded: true,
                currentPlayIndex: 0,
                totalPlays: historicalData.totalPlays
            }));
            
            setMessages([{
                type: 'ai',
                content: `Welcome to ${historicalData.gameInfo.awayTeam} vs ${historicalData.gameInfo.homeTeam} at ${historicalData.gameInfo.venue}!`,
                timestamp: Date.now()
            }]);
        }
    } else {
        // Reset simulation state for live games
        setSimulationState(prev => ({
            ...prev,
            isLoaded: false,
            currentPlayIndex: 0
        }));
        
        // Set initial game state for live game
        if (gameData.gameState) {
            setGameState(gameData.gameState);
        }
    }
  };

  const closeGameSelector = () => {
    setIsGameSelectorVisible(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update this useEffect in BaseballBuddy.jsx
  useEffect(() => {
    let interval;
    if (isPlaying && selectedGameId) {
      const updateGameState = async () => {
        console.log("Simulation state:", simulationState);
        if (simulationState.isLoaded) {
          console.log("Getting next play..."); 
          const nextPlay = mlbService.simulateNextPlay();
          console.log("Next play:", nextPlay);
          if (nextPlay) {
            console.log("Score update:", nextPlay?.score);
            setGameState({
              ...nextPlay,
              currentPlay: nextPlay
            });
            const commentary = commentaryGen.generateCommentary(nextPlay, selectedMode);
            setMessages(prev => [...prev, {
              type: 'ai',
              content: commentary,
              timestamp: Date.now()
            }]);
          } else {
            setIsPlaying(false);
          }
          return;
        }
        const gameData = await mlbService.getLiveGameData(selectedGameId);

        if (gameData.status === 'Final' || gameData.gameData?.status?.abstractGameState === 'Final') {
          // Get final game state
          console.log('Game is completed, getting final state');
          const finalGameData = await mlbService.getCompletedGameData(selectedGameId);
          setGameState(finalGameData);
          setIsPlaying(false); // Stop the updates for completed games
        } else if (gameData.status === 'Live') {
          console.log(gameData.status);
          setGameState(prevState => {
            // Only update if the state has changed
            if (JSON.stringify(prevState) !== JSON.stringify(gameData.gameState)) {
              const commentary = commentaryGen.generateCommentary(gameData.gameState, selectedMode);
              setMessages(prev => [...prev, {
                type: 'ai',
                content: commentary,
                timestamp: Date.now()
              }]);
              return gameData.gameState;
            }
            return prevState;
          });
        }
      };

      // Initial update
      updateGameState();
      // Set interval for updates
      interval = setInterval(updateGameState, simulationState.isLoaded? 10000 : 20000); // Update every 20 seconds
    }
    return () => clearInterval(interval);
  }, [isPlaying, selectedGameId, selectedMode, mlbService, simulationState.isLoaded, commentaryGen]);

  const handleUserMessage = (message) => {
    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content: message,
      timestamp: Date.now()
    }]);
    
    // Generate AI response based on current state and mode
    const response = commentaryGen.generateCommentary(gameState, selectedMode);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'ai',
        content: response,
        timestamp: Date.now()
      }]);
    }, 500);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">⚾ BaseballBuddy</h1>
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 hover:bg-blue-700 rounded flex items-center gap-2"
              onClick={() => setIsGameSelectorVisible(true)}
            >
              <Calendar className="w-6 h-6" />
              <span className="text-sm">Select Game</span>
            </button>
            <button 
              className="p-2 hover:bg-blue-700 rounded flex items-center gap-2"
              onClick={() => setIsLearningModeVisible(true)}
            >
              <Book className="w-6 h-6" />
              <span className="text-sm">Learning Mode</span>
            </button>
              <button className="p-2 hover:bg-blue-700 rounded">
                <Settings className="w-6 h-6" />
              </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full p-4 flex gap-4">
        {/* Game View */}
        <div className="flex-1 space-y-4">
          {/* Video Feed */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="relative">
              <div className="bg-gray-200 h-64 rounded flex items-center justify-center">
                <Video className="w-12 h-12 text-gray-400" />
                <span className="ml-2 text-gray-500">Game Feed Will Appear Here</span>
              </div>
              
              {/* Playback Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <button 
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? 
                    <PauseCircle className="w-8 h-8 text-blue-600" /> : 
                    <PlayCircle className="w-8 h-8 text-blue-600" />
                  }
                </button>
                {simulationState.isLoaded && (
                    <div className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                        Historical Playback
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* Game Visualizations */}
          <div className="grid grid-cols-2 gap-4">
            <PitchDisplay lastPitch={gameState?.lastPitch} gameState={gameState} />
            <GameStats gameState={gameState} />
            <PitchSequence gameState={gameState} />
          </div>

          {/* Field and Game Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="font-bold text-lg mb-2">Field View</h2>
              <BaseballField baseRunners={gameState?.baseRunners || []} />
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="font-bold text-lg mb-2">Game Info</h2>
              {gameState ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      {gameState.inningHalf} {gameState.inning}
                    </span>
                    <span className="text-lg font-bold">
                      {gameState.score.away}-{gameState.score.home}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-sm text-gray-500">At Bat</p>
                      <p className="font-medium">
                        {gameState.batter?.name || "No batter"}
                      </p>
                      <p className="text-sm text-gray-600">
                        AVG: {gameState.batter?.average || '.000'}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-sm text-gray-500">Pitching</p>
                      <p className="font-medium">
                        {gameState.pitcher?.name || "No pitcher"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Pitches: {gameState.pitcher?.pitchCount || 0} | K: {gameState.pitcher?.strikeouts || 0}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-sm">
                      Count: {gameState.balls}-{gameState.strikes} | 
                      Outs: {gameState.outs}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Waiting for game to start...</p>
              )}
            </div>
          </div>
        </div>

        {/* AI Companion Panel */}
        <div className="w-96 bg-white rounded-lg shadow-lg p-4 flex flex-col h-[800px]">
          {/* Personality Mode Selector */}
          <div className="mb-4">
            <h2 className="font-bold mb-2">Choose Your Buddy's Style:</h2>
            <div className="flex flex-col space-y-2">
              {personalityModes.map(mode => (
                <button
                  key={mode.id}
                  className={`p-2 rounded-lg flex items-center ${
                    selectedMode === mode.id 
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedMode(mode.id)}
                >
                  <Brain className="w-5 h-5 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">{mode.name}</div>
                    <div className="text-sm text-gray-500">{mode.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 border rounded-lg p-4 bg-gray-50 overflow-y-auto min-h-0">
            {messages.map((message, index) => (
              <div key={index} className={`flex items-start mb-4 ${
                message.type === 'user' ? 'justify-end' : ''
              }`}>
                <div className={`rounded-lg p-3 max-w-[80%] ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-100 text-gray-800'
                }`}>
                  <p>{message.content}</p>
                  <div className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="mt-4 flex items-center">
            <input
              type="text"
              placeholder="Ask your baseball buddy..."
              className="flex-1 p-2 border rounded-lg mr-2"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  handleUserMessage(e.target.value);
                  e.target.value = '';
                }
              }}
            />
            <button 
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              onClick={() => {
                const input = document.querySelector('input');
                if (input.value.trim()) {
                  handleUserMessage(input.value);
                  input.value = '';
                }
              }}
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <LearningMode 
        gameState={gameState}
        isVisible={isLearningModeVisible}
        onClose={() => setIsLearningModeVisible(false)}
      />
      <GameSelector 
        isVisible={isGameSelectorVisible}
        onClose={closeGameSelector}
        onSelectGame={handleGameSelect}
      />
    </div>
  );
};

export default BaseballBuddy;