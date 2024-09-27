// src/PlayerManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles.css';

const PlayerManagement = () => {
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState({ name: '', team_id: '', kills: 0 });
  const [editMode, setEditMode] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/players');
      setPlayers(response.data);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewPlayer((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        // Update player
        await axios.put(`http://localhost:5000/players/${currentPlayerId}`, newPlayer);
        setEditMode(false);
        setCurrentPlayerId(null);
      } else {
        // Add new player
        await axios.post('http://localhost:5000/players', newPlayer);
      }
      setNewPlayer({ name: '', team_id: '', kills: 0 }); // Reset form
      fetchPlayers(); // Refresh the player list
    } catch (error) {
      console.error('Error adding/updating player:', error);
    }
  };

  const handleEdit = (player) => {
    setNewPlayer({ name: player.name, team_id: player.team_id, kills: player.kills });
    setEditMode(true);
    setCurrentPlayerId(player.id);
  };

  const handleDelete = async (playerId) => {
    try {
      await axios.delete(`http://localhost:5000/players/${playerId}`);
      fetchPlayers(); // Refresh the player list
    } catch (error) {
      console.error('Error deleting player:', error);
    }
  };

  return (
    <div>
      <h2>Players</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Player Name"
          value={newPlayer.name}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="team_id"
          placeholder="Team ID"
          value={newPlayer.team_id}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="kills"
          placeholder="Kills"
          value={newPlayer.kills}
          onChange={handleChange}
          required
        />
        <button type="submit">{editMode ? 'Update Player' : 'Add Player'}</button>
      </form>

      <ul>
        {players.map(player => (
          <li key={player.id}>
            {player.name} (Team ID: {player.team_id}, Kills: {player.kills})
            <button onClick={() => handleEdit(player)}>Edit</button>
            <button onClick={() => handleDelete(player.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerManagement;
