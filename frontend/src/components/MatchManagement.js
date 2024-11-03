import React, { useState, useEffect } from 'react';
import axios from 'axios';

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  form: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px'
  },
  inputGroup: {
    marginBottom: '15px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold'
  },
  select: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    marginBottom: '10px'
  },
  input: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    marginBottom: '10px'
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  matchList: {
    marginTop: '20px'
  },
  matchCard: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '10px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  errorMessage: {
    color: '#dc3545',
    padding: '10px',
    backgroundColor: '#ffe6e6',
    borderRadius: '4px',
    marginBottom: '10px'
  },
  successMessage: {
    color: '#28a745',
    padding: '10px',
    backgroundColor: '#e8f5e9',
    borderRadius: '4px',
    marginBottom: '10px'
  }
};

const MatchManagement = () => {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [newMatch, setNewMatch] = useState({
    team1_id: '',
    team2_id: '',
    team1_kills: 0,
    team2_kills: 0,
    game_time: '',
    match_type: 'qualifier'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matchesRes, teamsRes] = await Promise.all([
        axios.get('http://localhost:5000/matches'),
        axios.get('http://localhost:5000/teams')
      ]);
      setMatches(matchesRes.data);
      setTeams(teamsRes.data);
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
    if (newMatch.team1_kills < 0 || newMatch.team2_kills < 0) {
      return 'Kill counts cannot be negative';
    }
    
    const team1 = teams.find(t => t.id === parseInt(newMatch.team1_id));
    const team2 = teams.find(t => t.id === parseInt(newMatch.team2_id));
    
    if (team1?.group_name !== team2?.group_name) {
      return 'Teams must be from the same group for qualifier matches';
    }
    
    return null;
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
      if (newMatch.match_type === 'qualifier') {
        await axios.post('http://localhost:5000/matches/qualifier-result', {
          team1_id: parseInt(newMatch.team1_id),
          team2_id: parseInt(newMatch.team2_id),
          team1_kills: parseInt(newMatch.team1_kills),
          team2_kills: parseInt(newMatch.team2_kills),
          game_time: newMatch.game_time || new Date().toLocaleTimeString()
        });
      }

      // Reset form and refresh data
      setNewMatch({
        team1_id: '',
        team2_id: '',
        team1_kills: 0,
        team2_kills: 0,
        game_time: '',
        match_type: 'qualifier'
      });
      setSuccess('Match added successfully');
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add match');
      console.error('Error:', error);
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

  const getTeamsByGroup = (groupName) => {
    return teams.filter(team => team.group_name === groupName);
  };

  return (
    <div style={styles.container}>
      <h2>Qualifier Match Management</h2>
      {error && <div style={styles.errorMessage}>{error}</div>}
      {success && <div style={styles.successMessage}>{success}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Select Group</label>
          <select
            style={styles.select}
            onChange={(e) => {
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

        <div style={styles.inputGroup}>
          <label style={styles.label}>Team 1</label>
          <select
            name="team1_id"
            value={newMatch.team1_id}
            onChange={handleChange}
            style={styles.select}
            required
          >
            <option value="">Select Team 1</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.team_name} (Kills: {team.total_kills || 0})
              </option>
            ))}
          </select>

          <label style={styles.label}>Team 1 Kills</label>
          <input
            type="number"
            name="team1_kills"
            value={newMatch.team1_kills}
            onChange={handleChange}
            min="0"
            style={styles.input}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Team 2</label>
          <select
            name="team2_id"
            value={newMatch.team2_id}
            onChange={handleChange}
            style={styles.select}
            required
          >
            <option value="">Select Team 2</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.team_name} (Kills: {team.total_kills || 0})
              </option>
            ))}
          </select>

          <label style={styles.label}>Team 2 Kills</label>
          <input
            type="number"
            name="team2_kills"
            value={newMatch.team2_kills}
            onChange={handleChange}
            min="0"
            style={styles.input}
            required
          />
        </div>

        <button 
          type="submit" 
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
          disabled={loading}
        >
          {loading ? 'Adding Match...' : 'Add Match'}
        </button>
      </form>

      <div style={styles.matchList}>
        <h3>Recent Matches</h3>
        {matches.map(match => (
          <div key={match.id} style={styles.matchCard}>
            <div>
              <strong>
                {teams.find(t => t.id === match.team1_id)?.team_name} vs{' '}
                {teams.find(t => t.id === match.team2_id)?.team_name}
              </strong>
            </div>
            <div>
              Score: {match.team1_kills} - {match.team2_kills}
            </div>
            {match.game_time && <div>Time: {match.game_time}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchManagement;