import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const TeamGenerator = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [playersRes, teamsRes] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/players`),
        axios.get(`${config.API_BASE_URL}/teams`)
      ]);
      setPlayers(playersRes.data);
      setTeams(teamsRes.data);
    } catch (error) {
      setError('Failed to fetch data');
    }
  };

  const generateTeams = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Get players without teams
      const availablePlayers = players.filter(player => !player.team_id);
      
      // Check if we have enough players for 10 teams (20 players)
      if (availablePlayers.length < 20) {
        setError(`Need 20 players to form 10 teams. Currently have ${availablePlayers.length} available players.`);
        setLoading(false);
        return;
      }

      // Shuffle players randomly
      const shuffledPlayers = [...availablePlayers].sort(() => Math.random() - 0.5);
      
      // Create exactly 10 teams
      for (let i = 0; i < 10; i++) {
        const player1 = shuffledPlayers[i * 2];
        const player2 = shuffledPlayers[i * 2 + 1];
        
        // First 5 teams go to Group A, next 5 to Group B
        const groupName = i < 5 ? 'A' : 'B';
        const teamName = `Team ${i + 1}`;
        
        // Create team
        const teamResponse = await axios.post(`${config.API_BASE_URL}/teams`, {
          team_name: teamName,
          group_name: groupName,
          player1_id: player1.id,
          player2_id: player2.id
        });

        // Update players with team_id
        await Promise.all([
          axios.put(`${config.API_BASE_URL}/players/${player1.id}`, {
            ...player1,
            team_id: teamResponse.data.id
          }),
          axios.put(`${config.API_BASE_URL}/players/${player2.id}`, {
            ...player2,
            team_id: teamResponse.data.id
          })
        ]);
      }

      await fetchData();
      setMessage('Successfully created 10 teams with balanced groups');

    } catch (error) {
      setError('Failed to generate teams');
    } finally {
      setLoading(false);
    }
  };

  const resetTeams = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // First update all players to remove team associations
      await Promise.all(
        players
          .filter(player => player.team_id)
          .map(player =>
            axios.put(`${config.API_BASE_URL}/players/${player.id}`, {
              ...player,
              team_id: null
            })
          )
      );

      // Then delete all teams
      await Promise.all(
        teams.map(team =>
          axios.delete(`${config.API_BASE_URL}/teams/${team.id}`)
        )
      );

      await fetchData();
      setMessage('All teams have been reset');
    } catch (error) {
      setError('Failed to reset teams');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Team Generation and Group Assignment</h2>
      
      {error && <div style={{ color: 'red', margin: '10px 0', padding: '10px', backgroundColor: '#ffebee' }}>{error}</div>}
      {message && <div style={{ color: 'green', margin: '10px 0', padding: '10px', backgroundColor: '#e8f5e9' }}>{message}</div>}

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={generateTeams}
          disabled={loading}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Generating...' : 'Generate 10 Teams'}
        </button>

        <button
          onClick={resetTeams}
          disabled={loading}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Resetting...' : 'Reset All Teams'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <h3>Group A Teams ({teams.filter(t => t.group_name === 'A').length}/5)</h3>
          {teams
            .filter(team => team.group_name === 'A')
            .map(team => (
              <div key={team.id} style={{ 
                padding: '10px',
                border: '1px solid #ddd',
                marginBottom: '5px',
                borderRadius: '4px',
                backgroundColor: 'white'
              }}>
                <div style={{ fontWeight: 'bold' }}>{team.team_name}</div>
                <div style={{ fontSize: '0.9em', color: '#666' }}>
                  {players.find(p => p.id === team.player1_id)?.name} & {players.find(p => p.id === team.player2_id)?.name}
                </div>
              </div>
            ))}
        </div>

        <div style={{ flex: 1 }}>
          <h3>Group B Teams ({teams.filter(t => t.group_name === 'B').length}/5)</h3>
          {teams
            .filter(team => team.group_name === 'B')
            .map(team => (
              <div key={team.id} style={{ 
                padding: '10px',
                border: '1px solid #ddd',
                marginBottom: '5px',
                borderRadius: '4px',
                backgroundColor: 'white'
              }}>
                <div style={{ fontWeight: 'bold' }}>{team.team_name}</div>
                <div style={{ fontSize: '0.9em', color: '#666' }}>
                  {players.find(p => p.id === team.player1_id)?.name} & {players.find(p => p.id === team.player2_id)?.name}
                </div>
              </div>
            ))}
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Available Players ({players.filter(p => !p.team_id).length})</h3>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '10px'
        }}>
          {players
            .filter(player => !player.team_id)
            .map(player => (
              <div key={player.id} style={{ 
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white'
              }}>
                {player.name}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default TeamGenerator;