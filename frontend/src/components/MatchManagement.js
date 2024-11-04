// MatchManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MatchManagement.css';

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
    team1_player1_kills: 0,
    team1_player2_kills: 0,
    team2_player1_kills: 0,
    team2_player2_kills: 0,
    game_time: '',
    match_type: 'qualifier'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matchesRes, teamsRes, playersRes] = await Promise.all([
        axios.get('http://localhost:5000/matches'),
        axios.get('http://localhost:5000/teams'),
        axios.get('http://localhost:5000/players')
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
    
    return null;
  };

  const getTeamPlayers = (teamId) => {
    return players.filter(player => player.team_id === parseInt(teamId));
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
      // Get players for both teams
      const team1Players = getTeamPlayers(newMatch.team1_id);
      const team2Players = getTeamPlayers(newMatch.team2_id);

      // Calculate total kills for each team
      const team1_kills = parseInt(newMatch.team1_player1_kills) + parseInt(newMatch.team1_player2_kills);
      const team2_kills = parseInt(newMatch.team2_player1_kills) + parseInt(newMatch.team2_player2_kills);

      // Prepare player kills data
      const player_kills = [
        {
          player_id: team1Players[0]?.id,
          kills: parseInt(newMatch.team1_player1_kills)
        },
        {
          player_id: team1Players[1]?.id,
          kills: parseInt(newMatch.team1_player2_kills)
        },
        {
          player_id: team2Players[0]?.id,
          kills: parseInt(newMatch.team2_player1_kills)
        },
        {
          player_id: team2Players[1]?.id,
          kills: parseInt(newMatch.team2_player2_kills)
        }
      ].filter(p => p.player_id && p.kills >= 0);

      // Send match result
      await axios.post('http://localhost:5000/matches/qualifier-result', {
        team1_id: parseInt(newMatch.team1_id),
        team2_id: parseInt(newMatch.team2_id),
        team1_kills,
        team2_kills,
        player_kills,
        game_time: newMatch.game_time || new Date().toLocaleTimeString()
      });

      setSuccess('Match added successfully');
      setNewMatch({
        team1_id: '',
        team2_id: '',
        team1_player1_kills: 0,
        team1_player2_kills: 0,
        team2_player1_kills: 0,
        team2_player2_kills: 0,
        game_time: '',
        match_type: 'qualifier'
      });
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add match');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewMatch(prev => ({
      ...prev,
      [name]: value
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
                team2_id: ''
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
            name="team1_id"
            value={newMatch.team1_id}
            onChange={handleChange}
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
              {getTeamPlayers(newMatch.team1_id).map((player, idx) => (
                <div key={player.id} className="player-input">
                  <label>{player.name} Kills:</label>
                  <input
                    type="number"
                    name={`team1_player${idx + 1}_kills`}
                    value={newMatch[`team1_player${idx + 1}_kills`]}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team 2 Section */}
        <div className="team-section">
          <label>Team 2</label>
          <select
            name="team2_id"
            value={newMatch.team2_id}
            onChange={handleChange}
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
              {getTeamPlayers(newMatch.team2_id).map((player, idx) => (
                <div key={player.id} className="player-input">
                  <label>{player.name} Kills:</label>
                  <input
                    type="number"
                    name={`team2_player${idx + 1}_kills`}
                    value={newMatch[`team2_player${idx + 1}_kills`]}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </div>
              ))}
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