import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PlayerManagement = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [newPlayer, setNewPlayer] = useState({ name: '', kills: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [playersRes, teamsRes] = await Promise.all([
        axios.get('http://localhost:5000/players'),
        axios.get('http://localhost:5000/teams')
      ]);
      setPlayers(playersRes.data);
      setTeams(teamsRes.data);
    } catch (error) {
      setError('Failed to fetch data');
    }
  };

  const getPlayerTeamInfo = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return { teamName: 'Not assigned', groupName: '-' };
    
    return {
      teamName: team.team_name,
      groupName: team.group_name
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewPlayer(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (editMode) {
        await axios.put(`http://localhost:5000/players/${currentPlayerId}`, {
          ...newPlayer,
          team_id: players.find(p => p.id === currentPlayerId)?.team_id || null
        });
        setMessage('Player updated successfully');
        setEditMode(false);
        setCurrentPlayerId(null);
      } else {
        await axios.post('http://localhost:5000/players', newPlayer);
        setMessage('Player added successfully');
      }
      setNewPlayer({ name: '', kills: 0 });
      fetchData();
    } catch (error) {
      setError(editMode ? 'Failed to update player' : 'Failed to add player');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (player) => {
    setNewPlayer({ name: player.name, kills: player.kills });
    setEditMode(true);
    setCurrentPlayerId(player.id);
    setError('');
  };

  const handleDelete = async (playerId) => {
    try {
      await axios.delete(`http://localhost:5000/players/${playerId}`);
      fetchData();
      setMessage('Player deleted successfully');
      
      if (currentPlayerId === playerId) {
        setEditMode(false);
        setCurrentPlayerId(null);
        setNewPlayer({ name: '', kills: 0 });
      }
    } catch (error) {
      setError('Failed to delete player');
    }
  };

  const cancelEdit = () => {
    setEditMode(false);
    setCurrentPlayerId(null);
    setNewPlayer({ name: '', kills: 0 });
    setError('');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Player Management</h2>
      
      {error && <div style={{ color: 'red', margin: '10px 0' }}>{error}</div>}
      {message && <div style={{ color: 'green', margin: '10px 0' }}>{message}</div>}

      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            name="name"
            placeholder="Player Name"
            value={newPlayer.name}
            onChange={handleChange}
            required
            style={{ padding: '8px' }}
          />
          <input
            type="number"
            name="kills"
            placeholder="Kills"
            value={newPlayer.kills}
            onChange={handleChange}
            required
            style={{ padding: '8px', width: '100px' }}
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '8px 16px',
              backgroundColor: editMode ? '#4CAF50' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Processing...' : editMode ? 'Update Player' : 'Add Player'}
          </button>
          {editMode && (
            <button 
              type="button" 
              onClick={cancelEdit}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div>
        <h3>Registered Players</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Name</th>
              <th style={tableHeaderStyle}>Kills</th>
              <th style={tableHeaderStyle}>Team</th>
              <th style={tableHeaderStyle}>Group</th>
              <th style={tableHeaderStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.map(player => {
              const teamInfo = getPlayerTeamInfo(player.team_id);
              return (
                <tr 
                  key={player.id} 
                  style={{
                    backgroundColor: currentPlayerId === player.id ? '#f5f5f5' : 'white'
                  }}
                >
                  <td style={tableCellStyle}>{player.name}</td>
                  <td style={tableCellStyle}>{player.kills}</td>
                  <td style={tableCellStyle}>{teamInfo.teamName}</td>
                  <td style={tableCellStyle}>{teamInfo.groupName}</td>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleEdit(player)}
                        disabled={loading}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(player.id)}
                        disabled={player.team_id || loading}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: player.team_id ? '#cccccc' : '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: player.team_id ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Styles for table
const tableHeaderStyle = {
  backgroundColor: '#f4f4f4',
  padding: '12px',
  textAlign: 'left',
  borderBottom: '2px solid #ddd'
};

const tableCellStyle = {
  padding: '12px',
  borderBottom: '1px solid #ddd'
};

export default PlayerManagement;