// src/MatchManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import './styles.css';

const MatchManagement = () => {
  const [matches, setMatches] = useState([]);
  const [newMatch, setNewMatch] = useState({ team1_id: '', team2_id: '', score1: 0, score2: 0 });
  const [editMode, setEditMode] = useState(false);
  const [currentMatchId, setCurrentMatchId] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await axios.get('http://localhost:5000/matches'); // Adjust this endpoint as necessary
      setMatches(response.data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewMatch((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        // Update existing match
        await axios.put(`http://localhost:5000/matches/${currentMatchId}`, newMatch);
        setEditMode(false);
        setCurrentMatchId(null);
      } else {
        // Add new match
        await axios.post('http://localhost:5000/matches', newMatch);
      }
      setNewMatch({ team1_id: '', team2_id: '', score1: 0, score2: 0 }); // Reset form
      fetchMatches(); // Refresh match list
    } catch (error) {
      console.error('Error adding/updating match:', error);
    }
  };

  const handleEdit = (match) => {
    setNewMatch({ team1_id: match.team1_id, team2_id: match.team2_id, score1: match.score1, score2: match.score2 });
    setEditMode(true);
    setCurrentMatchId(match.id);
  };

  const handleDelete = async (matchId) => {
    try {
      await axios.delete(`http://localhost:5000/matches/${matchId}`);
      fetchMatches(); // Refresh match list
    } catch (error) {
      console.error('Error deleting match:', error);
    }
  };

  return (
    <div>
      <h2>Matches</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          name="team1_id"
          placeholder="Team 1 ID"
          value={newMatch.team1_id}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="team2_id"
          placeholder="Team 2 ID"
          value={newMatch.team2_id}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="score1"
          placeholder="Team 1 Score"
          value={newMatch.score1}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="score2"
          placeholder="Team 2 Score"
          value={newMatch.score2}
          onChange={handleChange}
          required
        />
        <button type="submit">{editMode ? 'Update Match' : 'Add Match'}</button>
      </form>

      <ul>
        {matches.map(match => (
          <li key={match.id}>
            Match between Team {match.team1_id} and Team {match.team2_id} (Score: {match.score1} - {match.score2})
            <button onClick={() => handleEdit(match)}>Edit</button>
            <button onClick={() => handleDelete(match.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MatchManagement;
