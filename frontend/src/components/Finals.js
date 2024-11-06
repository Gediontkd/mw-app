// Finals.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Playoffs.css';
import config from '../config';

const Finals = () => {
  const [match, setMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentGame, setCurrentGame] = useState({
    gameNumber: null,
    playerKills: {}
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [matchRes, playersRes] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/matches/finals`),
        axios.get(`${config.API_BASE_URL}/players`)
      ]);
      setMatch(matchRes.data);
      setPlayers(playersRes.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch finals data');
      setLoading(false);
    }
  };

  const getTeamPlayers = (teamId) => {
    return players.filter(player => player.team_id === parseInt(teamId));
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

  const calculateTeamKills = (teamId) => {
    const teamPlayers = getTeamPlayers(teamId);
    return teamPlayers.reduce((total, player) => {
      return total + (parseInt(currentGame.playerKills[player.id]) || 0);
    }, 0);
  };

  const submitGameResult = async (gameNumber) => {
    if (!match) return;

    try {
      const team1_kills = calculateTeamKills(match.team1_id);
      const team2_kills = calculateTeamKills(match.team2_id);

      const player_kills = Object.entries(currentGame.playerKills).map(([playerId, kills]) => ({
        player_id: parseInt(playerId),
        kills: parseInt(kills)
      }));

      await axios.post(`${config.API_BASE_URL}/matches/final-result`, {
        match_id: match.id,
        game_number: gameNumber,
        team1_kills,
        team2_kills,
        player_kills
      });

      setCurrentGame({
        gameNumber: null,
        playerKills: {}
      });

      fetchData();
    } catch (error) {
      setError('Failed to submit game result');
    }
  };

  if (loading) return <div className="loading">Loading finals...</div>;
  if (!match) return <div className="error">Finals not yet started</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="playoffs-container">
      <h1 className="playoffs-title">Finals - Best of 5</h1>

      <div className="match-card">
        <div className="match-header">
          <div className="match-status">
            {match.team1_name} {match.wins_team1} - {match.wins_team2} {match.team2_name}
          </div>
        </div>

        <div className="games-container">
          {[1, 2, 3, 4, 5].map(gameNumber => {
            const isGameCompleted = match[`game${gameNumber}_completed`];
            const isGameActive = !isGameCompleted && 
              (gameNumber === 1 || 
               (gameNumber > 1 && match[`game${gameNumber-1}_completed`] && 
                match.wins_team1 < 3 && match.wins_team2 < 3));

            return (
              <div key={gameNumber} className="game-section">
                <h3>Game {gameNumber}</h3>

                {isGameCompleted ? (
                  <div className="game-result">
                    <div className="score">
                      {match[`game${gameNumber}_team1_kills`]} - {match[`game${gameNumber}_team2_kills`]}
                    </div>
                    <div className="winner">
                      Winner: {match[`game${gameNumber}_winner_id`] === match.team1_id ? 
                        match.team1_name : match.team2_name}
                    </div>
                  </div>
                ) : isGameActive ? (
                  <div className="game-input">
                    {[match.team1_id, match.team2_id].map(teamId => (
                      <div key={teamId} className="team-kills">
                        <h4>{teamId === match.team1_id ? match.team1_name : match.team2_name}</h4>
                        {getTeamPlayers(teamId).map(player => (
                          <div key={player.id} className="player-input">
                            <label>{player.name}:</label>
                            <input
                              type="number"
                              min="0"
                              value={currentGame.playerKills[player.id] || 0}
                              onChange={(e) => handlePlayerKillChange(player.id, e.target.value)}
                            />
                          </div>
                        ))}
                        <div className="team-total">
                          Total: {calculateTeamKills(teamId)}
                        </div>
                      </div>
                    ))}
                    <button
                      className="submit-button"
                      onClick={() => submitGameResult(gameNumber)}
                    >
                      Submit Game {gameNumber}
                    </button>
                  </div>
                ) : (
                  <div className="game-pending">
                    {gameNumber === 1 ? 'Game ready to start' : 'Waiting for previous game...'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {(match.wins_team1 === 3 || match.wins_team2 === 3) && (
          <div className="tournament-winner">
            🏆 Tournament Champion: {match.wins_team1 === 3 ? match.team1_name : match.team2_name}
          </div>
        )}
      </div>
    </div>
  );
};

export default Finals;