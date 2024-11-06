import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminFinals.css';
import config from '../../config';

const AdminFinals = () => {
  const [finals, setFinals] = useState(null);
  const [players, setPlayers] = useState([]);
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
      const [finalsRes, playersRes] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/matches/finals`),
        axios.get(`${config.API_BASE_URL}/players`)
      ]);

      setFinals(finalsRes.data);
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
    try {
      const team1Kills = calculateTeamKills(finals.team1_id);
      const team2Kills = calculateTeamKills(finals.team2_id);

      await axios.post(`${config.API_BASE_URL}/matches/finals-result`, {
        finals_id: finals.id,
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
      if ((finals.team1_wins < 3 && finals.team2_wins < 3) && gameNumber < 5) {
        setGameNumber(prev => prev + 1);
      }
    } catch (error) {
      setError('Failed to submit result');
    }
  };

  const canSubmitResult = () => {
    if (!finals) return false;

    const team1Players = getTeamPlayers(finals.team1_id);
    const team2Players = getTeamPlayers(finals.team2_id);
    const allPlayers = [...team1Players, ...team2Players];

    return allPlayers.every(player => 
      playerKills[player.id] !== undefined && 
      playerKills[player.id] >= 0
    );
  };

  if (loading) {
    return <div className="loading">Loading finals match...</div>;
  }

  if (!finals) {
    return <div className="no-finals">No finals matches have started yet.</div>;
  }

  if (finals.status === 'completed') {
    return (
      <div className="finals-complete">
        <h2>Finals Complete</h2>
        <div className="winner-announcement">
          🏆 Tournament Champion: {finals.team1_wins === 3 ? finals.team1_name : finals.team2_name}
        </div>
        <div className="final-score">
          Final Score: {finals.team1_wins} - {finals.team2_wins}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-finals">
      <h2>Finals Match Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <div className="finals-status">
        <div className="team-scores">
          <div className="team">
            <span className="team-name">{finals.team1_name}</span>
            <span className="team-wins">{finals.team1_wins}</span>
          </div>
          <div className="score-divider">vs</div>
          <div className="team">
            <span className="team-name">{finals.team2_name}</span>
            <span className="team-wins">{finals.team2_wins}</span>
          </div>
        </div>
        <div className="best-of-five">Best of 5</div>
      </div>

      <div className="game-entry">
        <div className="game-selector">
          <label>Game Number:</label>
          <select 
            value={gameNumber}
            onChange={(e) => setGameNumber(parseInt(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map(num => (
              <option key={num} value={num}>Game {num}</option>
            ))}
          </select>
        </div>

        <div className="teams-input">
          <div className="team-section">
            <h4>{finals.team1_name}</h4>
            {getTeamPlayers(finals.team1_id).map(player => (
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
              Total Kills: {calculateTeamKills(finals.team1_id)}
            </div>
          </div>

          <div className="team-section">
            <h4>{finals.team2_name}</h4>
            {getTeamPlayers(finals.team2_id).map(player => (
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
              Total Kills: {calculateTeamKills(finals.team2_id)}
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
    </div>
  );
};

export default AdminFinals;