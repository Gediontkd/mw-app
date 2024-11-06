// MatchManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MatchManagement.css';
import config from '../config';

const MatchManagement = () => {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [newMatch, setNewMatch] = useState({
    team1_id: '',
    team2_id: '',
    players: {}, // Store all player kills in a single object
    game_time: new Date().toLocaleTimeString()
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matchesRes, teamsRes, playersRes] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/matches`),
        axios.get(`${config.API_BASE_URL}/teams`),
        axios.get(`${config.API_BASE_URL}/players`)
      ]);
      setMatches(matchesRes.data);
      setTeams(teamsRes.data);
      setPlayers(playersRes.data);
    } catch (error) {
      setError('Failed to fetch data');
    }
  };

  const validateMatch = () => {
    if (!newMatch.team1_id || !newMatch.team2_id) {
      return 'Please select both teams';
    }
    if (newMatch.team1_id === newMatch.team2_id) {
      return 'Cannot select the same team twice';
    }
    
    const team1 = teams.find(t => t.id === parseInt(newMatch.team1_id));
    const team2 = teams.find(t => t.id === parseInt(newMatch.team2_id));
    
    if (team1?.group_name !== team2?.group_name) {
      return 'Teams must be from the same group for qualifier matches';
    }

    // Validate that all players have kills entered
    const team1Players = getTeamPlayers(newMatch.team1_id);
    const team2Players = getTeamPlayers(newMatch.team2_id);
    const allPlayers = [...team1Players, ...team2Players];
    
    const missingKills = allPlayers.some(player => 
      !newMatch.players[player.id] && newMatch.players[player.id] !== 0
    );
    
    if (missingKills) {
      return 'Please enter kills for all players';
    }
    
    return null;
  };

  const getTeamPlayers = (teamId) => {
    return players.filter(player => player.team_id === parseInt(teamId));
  };

  const calculateTeamKills = (teamId) => {
    const teamPlayers = getTeamPlayers(teamId);
    return teamPlayers.reduce((total, player) => {
      return total + (parseInt(newMatch.players[player.id]) || 0);
    }, 0);
  };

  const handlePlayerKillChange = (playerId, kills) => {
    setNewMatch(prev => ({
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

    const validationError = validateMatch();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      // Calculate team kills
      const team1_kills = calculateTeamKills(newMatch.team1_id);
      const team2_kills = calculateTeamKills(newMatch.team2_id);

      // Format player kills for API
      const player_kills = Object.entries(newMatch.players).map(([playerId, kills]) => ({
        player_id: parseInt(playerId),
        kills: parseInt(kills)
      }));

      // Submit match result
      await axios.post(`${config.API_BASE_URL}/matches/qualifier-result`, {
        team1_id: parseInt(newMatch.team1_id),
        team2_id: parseInt(newMatch.team2_id),
        team1_kills,
        team2_kills,
        player_kills,
        game_time: newMatch.game_time
      });

      setSuccess('Match added successfully');
      // Reset form
      setNewMatch({
        team1_id: '',
        team2_id: '',
        players: {},
        game_time: new Date().toLocaleTimeString()
      });
      setSelectedGroup('');
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add match');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSelect = (teamNumber, teamId) => {
    setNewMatch(prev => ({
      ...prev,
      [`team${teamNumber}_id`]: teamId,
      // Clear existing player kills for this team
      players: {
        ...prev.players,
        ...getTeamPlayers(teamId).reduce((acc, player) => {
          acc[player.id] = 0;
          return acc;
        }, {})
      }
    }));
  };

  return (
    <div className="match-container">
      <h2>Qualifier Match Management</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="match-form">
        <div className="input-group">
          <label>Select Group</label>
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setNewMatch(prev => ({
                ...prev,
                team1_id: '',
                team2_id: '',
                players: {}
              }));
            }}
          >
            <option value="">Select Group</option>
            <option value="A">Group A</option>
            <option value="B">Group B</option>
          </select>
        </div>

        {/* Team 1 Section */}
        <div className="team-section">
          <label>Team 1</label>
          <select
            value={newMatch.team1_id}
            onChange={(e) => handleTeamSelect(1, e.target.value)}
            required
          >
            <option value="">Select Team 1</option>
            {teams
              .filter(team => team.group_name === selectedGroup)
              .map(team => (
                <option key={team.id} value={team.id}>
                  {team.team_name}
                </option>
              ))
            }
          </select>

          {newMatch.team1_id && (
            <div className="player-kills">
              {getTeamPlayers(newMatch.team1_id).map(player => (
                <div key={player.id} className="player-input">
                  <label>{player.name} Kills:</label>
                  <input
                    type="number"
                    value={newMatch.players[player.id] || 0}
                    onChange={(e) => handlePlayerKillChange(player.id, e.target.value)}
                    min="0"
                    required
                  />
                </div>
              ))}
              <div className="team-total">
                Total Team 1 Kills: {calculateTeamKills(newMatch.team1_id)}
              </div>
            </div>
          )}
        </div>

        {/* Team 2 Section */}
        <div className="team-section">
          <label>Team 2</label>
          <select
            value={newMatch.team2_id}
            onChange={(e) => handleTeamSelect(2, e.target.value)}
            required
          >
            <option value="">Select Team 2</option>
            {teams
              .filter(team => team.group_name === selectedGroup)
              .map(team => (
                <option key={team.id} value={team.id}>
                  {team.team_name}
                </option>
              ))
            }
          </select>

          {newMatch.team2_id && (
            <div className="player-kills">
              {getTeamPlayers(newMatch.team2_id).map(player => (
                <div key={player.id} className="player-input">
                  <label>{player.name} Kills:</label>
                  <input
                    type="number"
                    value={newMatch.players[player.id] || 0}
                    onChange={(e) => handlePlayerKillChange(player.id, e.target.value)}
                    min="0"
                    required
                  />
                </div>
              ))}
              <div className="team-total">
                Total Team 2 Kills: {calculateTeamKills(newMatch.team2_id)}
              </div>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className={`submit-button ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          {loading ? 'Adding Match...' : 'Add Match'}
        </button>
      </form>

      <div className="match-list">
        <h3>Recent Matches</h3>
        {matches.map(match => (
          <div key={match.id} className="match-card">
            <div className="match-teams">
              <strong>
                {teams.find(t => t.id === match.team1_id)?.team_name} vs{' '}
                {teams.find(t => t.id === match.team2_id)?.team_name}
              </strong>
            </div>
            <div className="match-score">
              Score: {match.team1_kills} - {match.team2_kills}
            </div>
            {match.game_time && <div className="match-time">Time: {match.game_time}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchManagement;