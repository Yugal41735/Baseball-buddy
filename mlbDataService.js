// mlbDataService.js

class MLBDataService {
  constructor() {
    this.BASE_URL = 'https://statsapi.mlb.com/api/v1';
    this.LIVE_GAME_URL = 'https://statsapi.mlb.com/api/v1.1/game';
  }

  async getTodaysGames() {
    try {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const url = `${this.BASE_URL}/schedule?sportId=1&date=${today}&hydrate=team`;
      const response = await fetch(url);
      const data = await response.json();
      
      return this.formatGameSchedule(data);
    } catch (error) {
      console.error('Error fetching games:', error);
      return [];
    }
  }

  async getLiveGameData(gamePk) {
    try {
      const url = `${this.LIVE_GAME_URL}/${gamePk}/feed/live`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.gameData && data.liveData) {
        return {
          status: data.gameData.status.abstractGameState,
          gameState: this.formatLiveGameState(data)
        };
      } else {
        return {
          status: 'error',
          message: 'Invalid game data format'
        };
      }
    } catch (error) {
      console.error('Error fetching live game data:', error);
      return {
        status: 'error',
        message: error.message
      }
    }
  }

  async getGamesByDate(date, year, gameType = 'R') {
      try {
        // Format date as YYYYMMDD
        const dateObj = new Date(date);
        const formattedDate = `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
      //   const formattedDate = date.replace(/-/g, '');
        const url = `${this.BASE_URL}/schedule?sportId=1&date=${formattedDate}&season=${year}&gameType=${gameType}&hydrate=team`;
        console.log('Fetching URL:', url);
        const response = await fetch(url);
        const data = await response.json();
        return this.formatGameSchedule(data);
      } catch (error) {
        console.error('Error fetching games:', error);
        return [];
      }
  }

  async getMonthSchedule(year, month, gameType = 'R') {
      try {
        const url = `${this.BASE_URL}/schedule?sportId=1&season=${year}&gameType=${gameType}&startDate=${year}-${month}-01&endDate=${year}-${month}-31&hydrate=team,venue`;
        const response = await fetch(url);
        const data = await response.json();
        return this.formatSchedule(data);
      } catch (error) {
        console.error('Error fetching schedule:', error);
        return [];
      }
    }

  async getCompletedGameData(gamePk) {
    try {
      const url = `${this.LIVE_GAME_URL}/${gamePk}/feed/live`;
      const response = await fetch(url);
      const data = await response.json();
      
      return {
        inning: 'Final',
        score: {
          away: data.liveData.linescore.teams.away.runs,
          home: data.liveData.linescore.teams.home.runs
        },
        homeTeam: data.gameData.teams.home.name,
        awayTeam: data.gameData.teams.away.name,
        status: 'Final',
        // Add other relevant final game stats
        totalPitches: data.liveData.plays.allPlays.length,
        finalPlays: data.liveData.plays.allPlays.slice(-5) // Get last 5 plays
      };
    } catch (error) {
      console.error('Error fetching completed game data:', error);
      return null;
    }
  }

  async loadHistoricalGame(gamePk) {
    try {
      const url = `${this.LIVE_GAME_URL}/${gamePk}/feed/live`;
      const response = await fetch(url);
      const data = await response.json();
      console.log("Historical game data loaded:", data.liveData.plays.allPlays.length);
      // Store all plays for simulation
      if (data.liveData && data.liveData.plays) {
        this.historicalPlays = data.liveData.plays.allPlays;
        this.currentPlayIndex = 0;
        console.log("First play:", this.historicalPlays[0]);
        return {
          status: 'loaded',
          totalPlays: this.historicalPlays.length,
          gameInfo: {
              homeTeam: data.gameData.teams.home.name,
              awayTeam: data.gameData.teams.away.name,
              venue: data.gameData.venue.name
          }
        };
      }
      return { status: 'error', message: 'Invalid game data' };
    } catch (error) {
        console.error('Error loading historical game:', error);
        return { status: 'error', message: error.message };
    }
  }

  simulateNextPlay() {
    if (!this.historicalPlays || this.currentPlayIndex >= this.historicalPlays.length) {
        return null;
    }

    const play = this.historicalPlays[this.currentPlayIndex++];
    console.log("Raw play data before formatting:", play);
    const formattedPlay = this.formatPlayForSimulation(play);
    console.log("Formatted play data:", formattedPlay);
    return formattedPlay;
  }

  formatPlayForSimulation(play) {
    console.log("Raw play data:", play); // Debug log to see raw data structure
    
    return {
        inning: play.about.inning,
        inningHalf: play.about.halfInning,
        balls: play.count.balls,
        strikes: play.count.strikes,
        outs: play.count.outs,
        baseRunners: this.formatRunnersForPlay(play),
        score: {
          away: play.result.awayScore,
          home: play.result.homeScore
        },
        batter: {
          name: play.matchup?.batter?.fullName || "Unknown Batter",
          average: play.matchup?.batter?.seasonStats?.batting?.avg || '.000'
        },
        pitcher: {
            name: play.matchup?.pitcher?.fullName || "Unknown Pitcher",
            pitchCount: play.count?.pitches || 0,
            strikeouts: play.matchup?.pitcher?.seasonStats?.pitching?.strikeOuts || 0
        },
        lastPitch: play.playEvents && play.playEvents.length > 0 ? {
            type: play.playEvents[play.playEvents.length - 1]?.details?.type?.description || 'Unknown',
            speed: play.playEvents[play.playEvents.length - 1]?.pitchData?.startSpeed || 0,
            result: this.getPitchResult(play.playEvents[play.playEvents.length - 1])
        } : null,
        currentPlay: play
    };
  }

  formatGameSchedule(scheduleData) {
    if (!scheduleData.dates || scheduleData.dates.length === 0) {
      return [];
    }

    return scheduleData.dates[0].games.map(game => ({
      id: game.gamePk,
      status: game.status.abstractGameState,
      detailedState: game.status.detailedState,
      homeTeam: {
        name: game.teams.home.team.name,
        score: game.teams.home.score || 0,
        record: game.teams.home.leagueRecord ?
            `${game.teams.home.leagueRecord.wins}-${game.teams.home.leagueRecord.losses}` : null
      },
      awayTeam: {
        name: game.teams.away.team.name,
        score: game.teams.away.score || 0,
        record: game.teams.away.leagueRecord ?
            `${game.teams.away.leagueRecord.wins}-${game.teams.away.leagueRecord.losses}` : null
      },
      startTime: game.gameDate,
      venue: game.venue.name,
      gameType: game.gameType,
      description: game.description || '',
      isFeatured: game.isFeaturedGame || false
    }));
  }

  formatSchedule(scheduleData) {
      if (!scheduleData.dates) return [];
  
      return scheduleData.dates.flatMap(date =>
        date.games.map(game => ({
          id: game.gamePk,
          status: game.status.detailedState,
          homeTeam: {
            name: game.teams.home.team.name,
            score: game.teams.home.score
          },
          awayTeam: {
            name: game.teams.away.team.name,
            score: game.teams.away.score
          },
          startTime: game.gameDate,
          venue: game.venue.name,
          gameType: game.gameType
        }))
      );
  }

  formatLiveGameState(gameData) {
    const plays = gameData.liveData.plays;
    const linescore = gameData.liveData.linescore;

    if (!plays || !linescore) {
      throw new Error('Missing required game data');
    }
    
    return {
        inning: linescore.currentInning || 0,
        inningHalf: linescore.inningHalf || 'top',
        balls: plays.currentPlay ? plays.currentPlay.count.balls : 0,
        strikes: plays.currentPlay ? plays.currentPlay.count.strikes : 0,
        outs: linescore.outs || 0,
        baseRunners: this.getBaseRunners(linescore),
        score: {
            away: linescore.teams.away.runs || 0,
            home: linescore.teams.home.runs || 0
        },
        pitcher: this.getCurrentPitcher(gameData),
        batter: this.getCurrentBatter(gameData),
        lastPlay: plays.currentPlay ? this.formatPlay(plays.currentPlay) : null
    };
  }

  // Add these methods to mlbDataService.js
  getBaseRunners(linescore) {
    const runners = [];
    if (linescore.offense) {
      if (linescore.offense.first) runners.push('1B');
      if (linescore.offense.second) runners.push('2B');
      if (linescore.offense.third) runners.push('3B');
    }
    return runners;
  }

  getCurrentPitcher(gameData) {
    try {
      const currentPlay = gameData.liveData.plays.currentPlay;
      if (!currentPlay || !currentPlay.matchup || !currentPlay.matchup.pitcher) return null;
  
      const pitcher = gameData.gameData.players[`ID${currentPlay.matchup.pitcher.id}`];
      if (!pitcher) return null;
  
      return {
        name: pitcher.fullName || "Unknown Pitcher",
        pitchCount: (currentPlay.count && currentPlay.count.pitches) || 0,
        strikeouts: pitcher.stats && pitcher.stats.pitching ? 
          pitcher.stats.pitching.strikeOuts || 0 : 0
      };
    } catch (error) {
      console.log('Error getting pitcher data:', error);
      return {
        name: "Unknown Pitcher",
        pitchCount: 0,
        strikeouts: 0
      };
    }
  }

  getCurrentBatter(gameData) {
    try {
      const currentPlay = gameData.liveData.plays.currentPlay;
      if (!currentPlay || !currentPlay.matchup || !currentPlay.matchup.batter) return null;
  
      const batter = gameData.gameData.players[`ID${currentPlay.matchup.batter.id}`];
      if (!batter) return null;
  
      return {
        name: batter.fullName || "Unknown Batter",
        average: batter.stats && batter.stats.batting ? 
          `.${Math.round(batter.stats.batting.avg * 1000)}` : '.000'
      };
    } catch (error) {
      console.log('Error getting batter data:', error);
      return {
        name: "Unknown Batter",
        average: '.000'
      };
    }
  }

  formatPlay(play) {
    if (!play.pitchData || !play.details) return null;
    
    return {
      type: play.details.type.description || 'Unknown Pitch',
      speed: Math.round(play.pitchData.startSpeed),
      description: play.details.description || '',
      result: this.getPitchResult(play)
    };
  }

  getPitchResult(play) {
    if (!play.details) return null;
    if (play.details.isInPlay) return 'in_play';
    if (play.details.isBall) return 'ball';
    if (play.details.isStrike) return play.details.isFoul ? 'foul' : 'strike';
    return null;
  }

  formatRunnersForPlay(play) {
    const runners = [];
    if (play.runners) {
        if (play.runners.some(r => r.movement?.end === '1B')) runners.push('1B');
        if (play.runners.some(r => r.movement?.end === '2B')) runners.push('2B');
        if (play.runners.some(r => r.movement?.end === '3B')) runners.push('3B');
    }
    return runners;
  }
  
}

export default MLBDataService;