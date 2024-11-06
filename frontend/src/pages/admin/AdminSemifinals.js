import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminSemifinals.css';
import config from '../../config';

const AdminSemifinals = () => {
  const [semifinals, setSemifinals] = useState([]);
  const [players, setPlayers] = useState([]);
  const [activeMatch, setActiveMatch] = useState(null);
  const [gameNumber, setGameNumber] = useState(1);
  const [playerKills, setPlayerKills] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [semifinalsRes, playersRes] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/matches/semifinals`),
        axios.get(`${config.API_BASE_URL}/players`)
      ]);

      setSemifinals(semifinalsRes.data);
      setPlayers(playersRes.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch data');
      setLoading(false);
    }
  };

  const getTeamPlayers = (teamId) => {
    return players.filter(player => player.team_id === parseInt(teamId));
  };

  const handleMatchSelect = (match) => {
    setActiveMatch(match);
    setGameNumber(1);
    setPlayerKills({});
    setMessage('');
    setError('');
  };

  const handlePlayerKillChange = (playerId, kills) => {
    setPlayerKills(prev => ({
      ...prev,
      [playerId]: parseInt(kills) || 0
    }));
  };

  const calculateTeamKills = (teamId) => {
    const teamPlayers = getTeamPlayers(teamId);
    return teamPlayers.reduce((total, player) => {
      return total + (parseInt(playerKills[player.id]) || 0);
    }, 0);
  };

  const handleSubmitResult = async () => {
    if (!activeMatch) return;

    try {
      const team1Kills = calculateTeamKills(activeMatch.team1_id);
      const team2Kills = calculateTeamKills(activeMatch.team2_id);

      await axios.post(`${config.API_BASE_URL}/matches/semifinal-result`, {
        match_id: activeMatch.id,
        game_number: gameNumber,
        team1_kills: team1Kills,
        team2_kills: team2Kills,
        player_kills: Object.entries(playerKills).map(([playerId, kills]) => ({
          player_id: parseInt(playerId),
          kills: parseInt(kills)
        }))
      });

      setMessage(`Game ${gameNumber} result recorded successfully`);
      await fetchData();
      setPlayerKills({});
      
      // Auto-increment game number if match isn't complete
      const updatedMatch = (await axios.get(`${config.API_BASE_URL}/matches/semifinals`)).data
        .find(m => m.id === activeMatch.id);
        
      if (updatedMatch.wins_team1 < 2 && updatedMatch.wins_team2 < 2) {
        setGameNumber(prev => prev + 1);
      } else {
        setActiveMatch(null);
      }
    } catch (error) {
      setError('Failed to submit result');
    }
  };

  const canSubmitResult = () => {
    if (!activeMatch) return false;

    const team1Players = getTeamPlayers(activeMatch.team1_id);
    const team2Players = getTeamPlayers(activeMatch.team2_id);
    const allPlayers = [...team1Players, ...team2Players];

    return allPlayers.every(player => 
      playerKills[player.id] !== undefined && 
      playerKills[player.id] >= 0
    );
  };

  if (loading) {
    return <div className="loading">Loading semifinal matches...</div>;
  }

  return (
    <div className="admin-semifinals">
      <h2>Semifinals Match Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <div className="semifinals-section">
        <div className="matches-list">
          <h3>Semifinal Matches</h3>
          {semifinals.map((match) => (
            <div 
              key={match.id} 
              className={`match-item ${activeMatch?.id === match.id ? 'active' : ''} 
                ${match.wins_team1 === 2 || match.wins_team2 === 2 ? 'completed' : ''}`}
              onClick={() => handleMatchSelect(match)}
            >
              <div className="match-header">
                Semifinal {match.match_order || '1'}
                <span className="match-score">
                  ({match.wins_team1 || 0} - {match.wins_team2 || 0})
                </span>
              </div>
              <div className="teams">
                <div className="team">{match.team1_name}</div>
                <div className="vs">VS</div>
                <div className="team">{match.team2_name}</div>
              </div>
              {(match.wins_team1 === 2 || match.wins_team2 === 2) && (
                <div className="winner-badge">
                  Winner: {match.wins_team1 === 2 ? match.team1_name : match.team2_name}
                </div>
              )}
            </div>
          ))}
        </div>

        {activeMatch && (
          <div className="match-entry">
            <h3>Enter Match Results</h3>
            <div className="game-selector">
              <label>Game Number:</label>
              <select 
                value={gameNumber}
                onChange={(e) => setGameNumber(parseInt(e.target.value))}
              >
                <option value={1}>Game 1</option>
                <option value={2}>Game 2</option>
                <option value={3}>Game 3</option>
              </select>
            </div>

            <div className="teams-input">
              <div className="team-section">
                <h4>{activeMatch.team1_name}</h4>
                {getTeamPlayers(activeMatch.team1_id).map(player => (
                  <div key={player.id} className="player-input">
                    <label>{player.name}</label>
                    <input
                      type="number"
                      min="0"
                      value={playerKills[player.id] || ''}
                      onChange={(e) => handlePlayerKillChange(player.id, e.target.value)}
                      placeholder="Kills"
                    />
                  </div>
                ))}
                <div className="team-total">
                  Total Kills: {calculateTeamKills(activeMatch.team1_id)}
                </div>
              </div>

              <div className="team-section">
                <h4>{activeMatch.team2_name}</h4>
                {getTeamPlayers(activeMatch.team2_id).map(player => (
                  <div key={player.id} className="player-input">
                    <label>{player.name}</label>
                    <input
                      type="number"
                      min="0"
                      value={playerKills[player.id] || ''}
                      onChange={(e) => handlePlayerKillChange(player.id, e.target.value)}
                      placeholder="Kills"
                    />
                  </div>
                ))}
                <div className="team-total">
                  Total Kills: {calculateTeamKills(activeMatch.team2_id)}
                </div>
              </div>
            </div>

            <button
              className="submit-button"
              onClick={handleSubmitResult}
              disabled={!canSubmitResult()}
            >
              Submit Game {gameNumber} Result
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSemifinals;