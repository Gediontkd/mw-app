import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MatchManagement.css';
import config from '../config';

const MatchManagement = () => {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeGroup, setActiveGroup] = useState('A');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [newGame, setNewGame] = useState({
    players: {},
    game_time: new Date().toLocaleTimeString()
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teamsRes, playersRes] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/teams`),
        axios.get(`${config.API_BASE_URL}/players`)
      ]);
      setTeams(teamsRes.data);
      setPlayers(playersRes.data);
    } catch (error) {
      setError('Failed to fetch data');
    }
  };

  const getTeamPlayers = (teamId) => {
    return players.filter(player => player.team_id === parseInt(teamId));
  };

  const calculateTeamKills = () => {
    if (!selectedTeam) return 0;
    return Object.values(newGame.players).reduce((total, kills) => 
      total + (parseInt(kills) || 0), 0);
  };

  const handlePlayerKillChange = (playerId, kills) => {
    setNewGame(prev => ({
      ...prev,
      players: {
        ...prev.players,
        [playerId]: parseInt(kills) || 0
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const validationError = validateGame();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const totalKills = calculateTeamKills();
      const player_kills = Object.entries(newGame.players).map(([playerId, kills]) => ({
        player_id: parseInt(playerId),
        kills: parseInt(kills)
      }));

      await axios.post(`${config.API_BASE_URL}/matches/qualifier-result`, {
        team_id: selectedTeam,
        kills: totalKills,
        game_time: newGame.game_time,
        player_kills
      });

      setSuccess('Game added successfully');
      setNewGame({
        players: {},
        game_time: new Date().toLocaleTimeString()
      });
      setSelectedTeam(null);
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add game');
    } finally {
      setLoading(false);
    }
  };

  const validateGame = () => {
    if (!selectedTeam) return 'Please select a team';

    const teamPlayers = getTeamPlayers(selectedTeam);
    if (teamPlayers.length === 0) return 'No players found for this team';

    const missingKills = teamPlayers.some(player => 
      !newGame.players[player.id] && newGame.players[player.id] !== 0
    );
    
    if (missingKills) return 'Please enter kills for all players';

    const team = teams.find(t => t.id === selectedTeam);
    if (team?.is_qualified) return 'This team has already qualified';
    
    return null;
  };

  return (
    <div className="match-container">
      <h2>Qualifier Match Management</h2>
      
      <div className="group-tabs">
        <button 
          className={`tab-button ${activeGroup === 'A' ? 'active' : ''}`}
          onClick={() => setActiveGroup('A')}
        >
          Group A
        </button>
        <button 
          className={`tab-button ${activeGroup === 'B' ? 'active' : ''}`}
          onClick={() => setActiveGroup('B')}
        >
          Group B
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="teams-grid">
        {teams
          .filter(team => team.group_name === activeGroup)
          .map(team => (
            <div 
              key={team.id} 
              className={`team-card ${selectedTeam === team.id ? 'selected' : ''}`}
              onClick={() => {
                if (!team.is_qualified) {
                  setSelectedTeam(team.id);
                  setNewGame(prev => ({
                    ...prev,
                    players: getTeamPlayers(team.id).reduce((acc, player) => {
                      acc[player.id] = 0;
                      return acc;
                    }, {})
                  }));
                }
              }}
            >
              <h3>{team.team_name}</h3>
              <div className="team-stats">
                <span>Total Kills: {team.total_kills || 0}</span>
                <span>Matches: {team.matches_played || 0}</span>
                {team.is_qualified && (
                  <span className="qualified-badge">Qualified!</span>
                )}
              </div>
            </div>
          ))}
      </div>

      {selectedTeam && (
        <form onSubmit={handleSubmit} className="game-form">
          <h3>Add New Game for {teams.find(t => t.id === selectedTeam)?.team_name}</h3>
          
          <div className="players-grid">
            {getTeamPlayers(selectedTeam).map(player => (
              <div key={player.id} className="player-input">
                <label>{player.name}</label>
                <input
                  type="number"
                  value={newGame.players[player.id] || 0}
                  onChange={(e) => handlePlayerKillChange(player.id, e.target.value)}
                  min="0"
                  required
                />
              </div>
            ))}
          </div>

          <div className="team-total">
            Total Team Kills: {calculateTeamKills()}
          </div>

          <button 
            type="submit" 
            className={`submit-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Adding Game...' : 'Add New Game'}
          </button>
        </form>
      )}
    </div>
  );
};

export default MatchManagement;