// SemifinalMatches.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Playoffs.css';
import config from '../config';

const SemifinalMatches = () => {
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentGame, setCurrentGame] = useState({
    matchId: null,
    gameNumber: null,
    playerKills: {}
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto refresh
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [matchesRes, playersRes] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/matches/semifinals`),
        axios.get(`${config.API_BASE_URL}/players`)
      ]);
      setMatches(matchesRes.data);
      setPlayers(playersRes.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch semifinal data');
      setLoading(false);
    }
  };

  const handlePlayerKillChange = (playerId, kills) => {
    setCurrentGame(prev => ({
      ...prev,
      playerKills: {
        ...prev.playerKills,
        [playerId]: parseInt(kills) || 0
      }
    }));
  };

  const getMatchPlayers = (teamId) => {
    return players.filter(p => p.team_id === teamId);
  };

  const calculateTeamKills = (teamId) => {
    const teamPlayers = getMatchPlayers(teamId);
    return teamPlayers.reduce((total, player) => {
      return total + (parseInt(currentGame.playerKills[player.id]) || 0);
    }, 0);
  };

  const submitGameResult = async (matchId, gameNumber) => {
    try {
      const team1_kills = calculateTeamKills(matches.find(m => m.id === matchId).team1_id);
      const team2_kills = calculateTeamKills(matches.find(m => m.id === matchId).team2_id);

      // Format player kills for API
      const player_kills = Object.entries(currentGame.playerKills).map(([playerId, kills]) => ({
        player_id: parseInt(playerId),
        kills: parseInt(kills)
      }));

      await axios.post(`${config.API_BASE_URL}/matches/semifinal-result`, {
        match_id: matchId,
        game_number: gameNumber,
        team1_kills,
        team2_kills,
        player_kills
      });

      // Reset current game state
      setCurrentGame({
        matchId: null,
        gameNumber: null,
        playerKills: {}
      });

      fetchData();
    } catch (err) {
      setError('Failed to submit game result');
    }
  };

  if (loading) return <div className="loading">Loading semifinals...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="playoffs-container">
      <h1 className="playoffs-title">Semifinals - Best of 3</h1>

      <div className="semifinals-grid">
        {matches.map(match => (
          <div key={match.id} className="match-card">
            <div className="match-header">
              <h2>Semifinal Match</h2>
              <div className="match-status">
                Wins: {match.wins_team1} - {match.wins_team2}
              </div>
            </div>

            <div className="teams-container">
              <div className="team-info">
                <h3>{match.team1_name}</h3>
                <div className="team-players">
                  {getMatchPlayers(match.team1_id).map(player => (
                    <div key={player.id} className="player-name">{player.name}</div>
                  ))}
                </div>
              </div>

              <div className="vs-badge">VS</div>

              <div className="team-info">
                <h3>{match.team2_name}</h3>
                <div className="team-players">
                  {getMatchPlayers(match.team2_id).map(player => (
                    <div key={player.id} className="player-name">{player.name}</div>
                  ))}
                </div>
              </div>
            </div>

            {[1, 2, 3].map(gameNumber => {
              const isGameCompleted = match[`game${gameNumber}_completed`];
              const isGameActive = !isGameCompleted && 
                (gameNumber === 1 || 
                 (gameNumber === 2 && match.game1_completed) ||
                 (gameNumber === 3 && match.game1_completed && match.game2_completed && match.wins_team1 === match.wins_team2));

              return (
                <div key={gameNumber} className="game-section">
                  <h4>Game {gameNumber}</h4>
                  
                  {isGameCompleted ? (
                    <div className="game-result">
                      <div className="game-score">
                        {match[`game${gameNumber}_team1_kills`]} - {match[`game${gameNumber}_team2_kills`]}
                      </div>
                      <div className="game-winner">
                        Winner: {match[`game${gameNumber}_winner`] === match.team1_id ? match.team1_name : match.team2_name}
                      </div>
                    </div>
                  ) : isGameActive ? (
                    <div className="game-input">
                      <div className="team-kills">
                        {getMatchPlayers(match.team1_id).map(player => (
                          <div key={player.id} className="player-kills">
                            <label>{player.name} Kills:</label>
                            <input
                              type="number"
                              min="0"
                              value={currentGame.playerKills[player.id] || 0}
                              onChange={(e) => handlePlayerKillChange(player.id, e.target.value)}
                            />
                          </div>
                        ))}
                        {getMatchPlayers(match.team2_id).map(player => (
                          <div key={player.id} className="player-kills">
                            <label>{player.name} Kills:</label>
                            <input
                              type="number"
                              min="0"
                              value={currentGame.playerKills[player.id] || 0}
                              onChange={(e) => handlePlayerKillChange(player.id, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                      <button 
                        className="submit-result"
                        onClick={() => submitGameResult(match.id, gameNumber)}
                      >
                        Submit Result
                      </button>
                    </div>
                  ) : (
                    <div className="game-pending">
                      Waiting for previous game to complete...
                    </div>
                  )}
                </div>
              );
            })}

            {(match.wins_team1 === 2 || match.wins_team2 === 2) && (
              <div className="match-winner">
                Winner: {match.wins_team1 === 2 ? match.team1_name : match.team2_name}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default { SemifinalMatches}