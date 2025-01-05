// commentaryGenerator.js
// require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

class CommentaryGenerator {
  constructor() {
    // console.log("Gemini key:",process.env.REACT_APP_GEMINI_API_KEY);
    this.genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
    // this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    this.personalityTemplates = {
      casual: {
        tone: 'friendly',
        complexity: 'low',
        focusAreas: ['basic-explanations', 'fun-facts', 'engagement']
      },
      stats: {
        tone: 'analytical',
        complexity: 'high',
        focusAreas: ['statistics', 'probabilities', 'trends']
      },
      history: {
        tone: 'storytelling',
        complexity: 'medium',
        focusAreas: ['historical-context', 'player-histories', 'records']
      }
    };

    this.pitchExplanations = {
      Fastball: "A fastball is the most basic pitch in baseball - it's all about pure speed! Think of it like throwing a paper airplane as hard and straight as you can.",
      Curveball: "A curveball is like throwing a frisbee that drops down - it starts high and then dives toward the ground, making it tricky to hit!",
      Slider: "Think of a slider like a fastball that takes a sharp turn at the last second. It's like a car drifting sideways!",
      Changeup: "A changeup is baseball's version of a magic trick - it looks like a fastball but comes in much slower, fooling the batter's timing."
    };

    this.countExplanations = {
      "0-0": "Fresh count! Both pitcher and batter have a clean slate.",
      "1-0": "Batter's ahead - they might be looking for their perfect pitch!",
      "0-1": "Pitcher's ahead - they might try something tricky now!",
      "3-0": "Great spot for the batter! They might get the green light to swing big!",
      "0-2": "Tough spot for the batter - they need to protect the plate!"
    };
  }

  extractCasualFanPlayInfo(play) {
    return {
      what_happened: play.result.description,
      players_involved: {
        batter: play.matchup.batter.fullName,
        pitcher: play.matchup.pitcher.fullName
      },
      game_context: {
        inning: play.about.inning,
        inningHalf: play.about.halfInning,
        score: {
          away: play.result.awayScore,
          home: play.result.homeScore
        }
      },
      isImportantPlay: play.about.isScoringPlay || play.result.isStrikeout
    };
  }

  createCasualFanPrompt(playInfo) {
    console.log(playInfo);
    return `
    Situation:
    - ${playInfo.what_happened}
    - ${playInfo.game_context.inningHalf} of inning ${playInfo.game_context.inning}
    - Score: Away ${playInfo.game_context.score.away}, Home ${playInfo.game_context.score.home}
    
    Generate a brief, exciting call of this play (1-2 sentences).
    `;
  }

  generateCommentary(gameState, personalityMode) {
    if (!gameState) return "Waiting for the game to start...";

    // if (gameState.status === 'Final') {
    //   return this.generateFinalGameCommentary(gameState, personalityMode);
    // }

    const template = this.personalityTemplates[personalityMode];
    const lastPitch = gameState.lastPitch;
    const count = `${gameState.balls}-${gameState.strikes}`;

    console.log("Game State in Commentary", gameState.status);
    // console.log(template.focusAreas);

    // Generate appropriate commentary based on the last play and personality
    let commentary = "";

    switch (personalityMode) {
      case 'casual':
        console.log("Playing casual");
        this.systemPrompt = "You are a dynamic baseball commentator with these traits:\n- Enthusiastic and friendly without being repetitive\n- Varied vocabulary and expressions\n- Avoids phrases like \"alright folks\" or \"ladies and gentlemen\"\n- Uses natural, conversational tone\n- Occasionally adds relevant baseball insights\n - Focus Areas: "+ template.focusAreas;
        commentary = this.generateCasualCommentary(gameState, lastPitch, count);
        break;
      case 'stats':
        this.systemPrompt = "You are a data-driven baseball analyst specializing in Sabermetrics. Your commentary integrates advanced stats (WAR, FIP, BABIP, etc.), probabilities, and historical data comparisons. Provide factual, number-based insights while remaining engaging. Focus on statistical significance, trends, and analytical depth.";
        commentary = this.generateStatsCommentary(gameState, lastPitch);
        break;
      case 'history':
        this.systemPrompt = "You are a passionate baseball historian with encyclopedic knowledge of the game's past. Connect each play to similar historical moments, player achievements, or team traditions. Reference specific years, players, and memorable games. Make the current moment feel like part of baseball's grand narrative.";
        commentary = this.generateHistoricalCommentary(gameState, lastPitch);
        break;
      default:
        commentary = this.generateCasualCommentary(gameState, lastPitch, count);
    }

    return commentary;
  }

  async generateCasualCommentary(gameState, lastPitch, count) {
    console.log("Current play in casual: ",gameState);
    console.log("Last Pitch: ", lastPitch);
    console.log("Count: ",count);
    if (gameState.currentPlay) {
        // console.log("Entered function");
        const playInfo = this.extractCasualFanPlayInfo(gameState.currentPlay);
        const prompt = this.createCasualFanPrompt(playInfo);
        
        try {
          console.log("Sending to Gemini:", prompt);
          this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            systemInstruction: this.systemPrompt
          });
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          // console.log("Gemini response:", response.text());
          return response.text();
        } catch (error) {
          console.error('Gemini API error:', error);
          return this.createEngagingCommentary(playInfo); // Fallback to our basic commentary
        }
    }

    // Keep existing logic for live game states
    if (gameState.lastPlay === 'strikeout') {
        return "Strike three! That's a strikeout! In baseball, three strikes and you're out - just like in life, you usually get a few chances before striking out! 🎯";
    }

    if (gameState.lastPlay === 'walk') {
        return "That's a walk! After four balls, the batter gets to go to first base for free. It's like getting a 'skip the line' pass at an amusement park! 🎫";
    }

    if (lastPitch) {
        const pitchExplanation = this.pitchExplanations[lastPitch.type];
        const countExplanation = this.countExplanations[count];
        return `${lastPitch.type} at ${lastPitch.speed} MPH! ${pitchExplanation}\n\nThe count is ${count}: ${countExplanation} ⚾`;
    }

    return "Ready for the next pitch! Keep your eye on the ball! 👀";
  }

  createEngagingCommentary(playInfo) {
    const excitingPlays = {
        homeRun: "🎉 BOOM! That ball is outta here! A home run that got the crowd on their feet!",
        strikeout: "👊 What a pitch! The batter couldn't touch that one - strike three!",
        hit: "⚾ Crack of the bat! A solid hit into the field!",
        walk: "🎯 Great eye by the batter! Four balls means a free trip to first base!"
    };

    // Create engaging commentary based on what happened
    const description = playInfo.what_happened.toLowerCase();
    if (description.includes('home run')) {
        return excitingPlays.homeRun;
    } else if (description.includes('strikeout')) {
        return excitingPlays.strikeout;
    } else if (description.includes('singles') || description.includes('doubles')) {
        return excitingPlays.hit;
    } else if (description.includes('walks')) {
        return excitingPlays.walk;
    }

    // For other plays, create a default excited commentary
    return `⚾ ${playInfo.what_happened} - The game is ${playInfo.game_context.score.away}-${playInfo.game_context.score.home}!`;
  }

  extractStatsPlayInfo(play) {
    return {
      what_happened: play.result.description,
      batter_stats: {
        name: play.matchup.batter.fullName,
        avg: play.matchup?.batter?.seasonStats?.batting?.avg || '.000',
        atBats: play.matchup?.batter?.seasonStats?.batting?.atBats || 0,
        hits: play.matchup?.batter?.seasonStats?.batting?.hits || 0,
        homeRuns: play.matchup?.batter?.seasonStats?.batting?.homeRuns || 0
      },
      pitcher_stats: {
        name: play.matchup.pitcher.fullName,
        era: play.matchup?.pitcher?.seasonStats?.pitching?.era || '0.00',
        strikeouts: play.matchup?.pitcher?.seasonStats?.pitching?.strikeOuts || 0,
        innings: play.matchup?.pitcher?.seasonStats?.pitching?.inningsPitched || 0,
        whip: play.matchup?.pitcher?.seasonStats?.pitching?.whip || '0.00'
      },
      game_context: {
        inning: play.about.inning,
        inningHalf: play.about.halfInning,
        score: {
          away: play.about.awayScore,
          home: play.about.homeScore
        },
        count: `${play.count.balls}-${play.count.strikes}`
      }
    };
  }

  createStatsPrompt(playInfo) {
    return `
    Quick Stats Analysis:
    ${playInfo.what_happened}
    
    Batter: ${playInfo.batter_stats.name} (AVG: ${playInfo.batter_stats.avg})
    Pitcher: ${playInfo.pitcher_stats.name} (ERA: ${playInfo.pitcher_stats.era}, K: ${playInfo.pitcher_stats.strikeouts})
    Count: ${playInfo.game_context.count}

    Give a brief, energetic stats-focused commentary of this play in 1-2 sentences max.
    `;
  }

  async generateStatsCommentary(gameState, lastPitch) {
    console.log("Game state in history: ", gameState);
    if (gameState.currentPlay) {
      console.log("Generating stats commentary");
      const playInfo = this.extractStatsPlayInfo(gameState.currentPlay);
      const prompt = this.createStatsPrompt(playInfo);
      
      try {
        this.model = this.genAI.getGenerativeModel({
          model: "gemini-2.0-flash-exp",
          systemInstruction: this.systemPrompt
        });
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error) {
        console.error('Stats commentary generation error:', error);
        return this.createStatsFallback(playInfo);
      }
    }

    // Fallback for live games
    if (!lastPitch) return "Analyzing current metrics...";

    return `Pitch Analysis: ${lastPitch.type} at ${lastPitch.speed} MPH
            Pitcher Stats:
            - K/9: ${((gameState.pitcher.strikeouts * 9) / gameState.pitcher.pitchCount).toFixed(2)}
            - Strike %: ${((gameState.strikes / gameState.pitcher.pitchCount) * 100).toFixed(1)}%`;
  }

  createStatsFallback(playInfo) {
    const stats = {
      batter: `${playInfo.batter_stats.name} (${playInfo.batter_stats.avg} AVG)`,
      pitcher: `${playInfo.pitcher_stats.name} (${playInfo.pitcher_stats.era} ERA)`
    };
    return `${playInfo.what_happened} | ${stats.batter} vs ${stats.pitcher}`;
  }

  // extractHistoricalPlayInfo(play) {

  //   console.log("hello", play);
  //   return {
  //     what_happened: play.result.description,
  //     teams: {
  //       away: play.matchup.pitchHand.team.name,
  //       home: play.matchup.batSide.team.name
  //     },
  //     players: {
  //       batter: play.matchup.batter.fullName,
  //       pitcher: play.matchup.pitcher.fullName
  //     },
  //     game_context: {
  //       inning: play.about.inning,
  //       inningHalf: play.about.halfInning,
  //       score: {
  //         away: play.about.awayScore,
  //         home: play.about.homeScore
  //       },
  //       venue: play.about.venue?.name || "the ballpark"
  //     }
  //   };
  // }

  extractHistoricalPlayInfo(play) {
    console.log("Raw play data for historical:", play);
    
    return {
      what_happened: play.result?.description || "Play in progress",
      players: {
        batter: play.matchup?.batter?.fullName || "Batter",
        pitcher: play.matchup?.pitcher?.fullName || "Pitcher"
      },
      game_context: {
        inning: play.about?.inning || 1,
        inningHalf: play.about?.halfInning || "top",
        score: {
          away: play.about?.awayScore || 0,
          home: play.about?.homeScore || 0
        }
      }
    };
  }

  createHistoricalPrompt(playInfo) {
    // return `
    // Current Play: ${playInfo.what_happened}

    // Teams: ${playInfo.teams.away} vs ${playInfo.teams.home}
    // Location: ${playInfo.game_context.venue}
    // Matchup: ${playInfo.players.batter} facing ${playInfo.players.pitcher}
    
    // Situation: ${playInfo.game_context.inningHalf} of inning ${playInfo.game_context.inning}
    // Score: ${playInfo.game_context.score.away}-${playInfo.game_context.score.home}

    // Connect this moment to baseball history with specific references to similar historical plays, players, or moments.
    // `;
    return `
    Quick Historical Connection:
    ${playInfo.what_happened}
    ${playInfo.players.batter} vs ${playInfo.players.pitcher}
    ${playInfo.game_context.inningHalf} of inning ${playInfo.game_context.inning}, Score: ${playInfo.game_context.score.away}-${playInfo.game_context.score.home}

    Give a quick, exciting historical connection to this play in 1-2 sentences max. Reference a specific player or moment from baseball history.
    `;
  }

  async generateHistoricalCommentary(gameState, lastPitch) {
    console.log("Game State: in Hsitory: ", gameState);
    if (gameState.currentPlay) {
      console.log("Generating historical commentary");
      const playInfo = this.extractHistoricalPlayInfo(gameState.currentPlay);
      const prompt = this.createHistoricalPrompt(playInfo);
      
      try {
        this.model = this.genAI.getGenerativeModel({
          model: "gemini-2.0-flash-exp",
          systemInstruction: this.systemPrompt
        });
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error) {
        console.error('Historical commentary generation error:', error);
        return this.createHistoricalFallback(playInfo);
      }
    }

    // Fallback for live games
    if (!lastPitch) return "Awaiting the next chapter in baseball history...";

    return `${lastPitch.type} pitch at ${lastPitch.speed} MPH reminds us of the great pitchers of the past.`;
  }

  createHistoricalFallback(playInfo) {
    const description = playInfo.what_happened.toLowerCase();
    if (description.includes('home run')) {
      return `Another memorable home run at ${playInfo.game_context.venue}, joining countless classics in baseball lore.`;
    }
    return `${playInfo.what_happened} - another moment in the long history of America's pastime.`;
  }

  generateFinalGameCommentary(gameState, personalityMode) {
    switch (personalityMode) {
      case 'casual':
        return `Final Score: ${gameState.awayTeam} ${gameState.score.away}, ${gameState.homeTeam} ${gameState.score.home}! What a game! Would you like to know about any specific moments from the game?`;
      case 'stats':
        return `Game Complete: ${gameState.awayTeam} ${gameState.score.away}, ${gameState.homeTeam} ${gameState.score.home}. Total pitches: ${gameState.totalPitches}. Let me know if you'd like to analyze any statistics from this game.`;
      case 'history':
        return `Final: ${gameState.awayTeam} ${gameState.score.away}, ${gameState.homeTeam} ${gameState.score.home}. Another chapter in baseball history! Want to know how this game compares to historical matchups between these teams?`;
      default:
        return `Final Score: ${gameState.awayTeam} ${gameState.score.away}, ${gameState.homeTeam} ${gameState.score.home}`;
    }
  }
}

export default CommentaryGenerator;