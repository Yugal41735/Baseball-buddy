import React, { useState } from 'react';
import { Book, HelpCircle, X } from 'lucide-react';

const LearningMode = ({ gameState, isVisible, onClose }) => {
  const [selectedTopic, setSelectedTopic] = useState(null);

  const baseballConcepts = {
    basics: {
      title: "Baseball Basics",
      concepts: [
        {
          term: "Strike",
          definition: "A pitch that is either swung at and missed, or passes through the strike zone.",
          when: "Current count shows strikes"
        },
        {
          term: "Ball",
          definition: "A pitch that misses the strike zone and isn't swung at.",
          when: "Current count shows balls"
        },
        {
          term: "Out",
          definition: "Ways a batter can be retired, including strikeouts, caught balls, or thrown out at base.",
          when: "When outs are recorded"
        }
      ]
    },
    pitching: {
      title: "Pitching Types",
      concepts: [
        {
          term: "Fastball",
          definition: "A straight, high-speed pitch.",
          when: "When pitcher throws a fastball"
        },
        {
          term: "Curveball",
          definition: "A breaking pitch that curves downward.",
          when: "When pitcher throws a curve"
        },
        {
          term: "Changeup",
          definition: "A slower pitch that looks like a fastball.",
          when: "When pitcher throws a changeup"
        }
      ]
    },
    scoring: {
      title: "Scoring & Rules",
      concepts: [
        {
          term: "Run",
          definition: "A point scored when a player advances around all bases and reaches home plate.",
          when: "When runs are scored"
        },
        {
          term: "Inning",
          definition: "A division of the game consisting of a top and bottom half.",
          when: "Between innings"
        },
        {
          term: "Walk",
          definition: "When a batter receives four balls and advances to first base.",
          when: "On ball four"
        }
      ]
    }
  };

  // Get relevant concepts based on game state
  const getRelevantConcepts = () => {
    if (!gameState) return [];
    
    const concepts = [];
    if (gameState.lastPlay === 'strikeout') {
      concepts.push({
        term: "Strikeout",
        definition: "When a batter receives three strikes and is out.",
        highlight: true
      });
    }
    if (gameState.lastPlay === 'walk') {
      concepts.push({
        term: "Walk",
        definition: "When a batter receives four balls and advances to first base.",
        highlight: true
      });
    }
    return concepts;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-blue-50">
          <div className="flex items-center gap-2">
            <Book className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold">Baseball Learning Mode</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-blue-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Topics Sidebar */}
          <div className="w-48 border-r p-4 space-y-2 overflow-y-auto">
            {Object.entries(baseballConcepts).map(([key, { title }]) => (
              <button
                key={key}
                className={`w-full text-left px-3 py-2 rounded ${
                  selectedTopic === key 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => setSelectedTopic(key)}
              >
                {title}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedTopic ? (
              <div>
                <h3 className="text-lg font-bold mb-4">
                  {baseballConcepts[selectedTopic].title}
                </h3>
                <div className="space-y-4">
                  {baseballConcepts[selectedTopic].concepts.map((concept, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded">
                      <h4 className="font-medium">{concept.term}</h4>
                      <p className="text-gray-600 text-sm mt-1">{concept.definition}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        <span className="font-medium">When you'll see this: </span>
                        {concept.when}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <HelpCircle className="w-12 h-12 mb-2" />
                <p>Select a topic to learn more</p>
              </div>
            )}

            {/* Relevant Concepts */}
            {getRelevantConcepts().length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-bold mb-4">Happening Now</h3>
                <div className="space-y-4">
                  {getRelevantConcepts().map((concept, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded ${
                        concept.highlight 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'bg-gray-50'
                      }`}
                    >
                      <h4 className="font-medium">{concept.term}</h4>
                      <p className="text-gray-600 text-sm mt-1">{concept.definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningMode;