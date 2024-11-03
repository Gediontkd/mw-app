import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [newTeam, setNewTeam] = useState({ team_name: '', group_name: 'A' });
  const [editMode, setEditMode] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await axios.get('http://localhost:5000/teams');
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewTeam(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(`http://localhost:5000/teams/${currentTeamId}`, newTeam);
      } else {
        await axios.post('http://localhost:5000/teams', newTeam);
      }
      setNewTeam({ team_name: '', group_name: 'A' });
      setEditMode(false);
      setCurrentTeamId(null);
      fetchTeams();
    } catch (error) {
      console.error('Error saving team:', error);
      setError('Failed to save team');
    }
  };

  const handleEdit = (team) => {
    setNewTeam({ team_name: team.team_name, group_name: team.group_name });
    setEditMode(true);
    setCurrentTeamId(team.id);
  };

  const handleDelete = async (teamId) => {
    try {
      await axios.delete(`http://localhost:5000/teams/${teamId}`);
      fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      setError('Failed to delete team');
    }
  };

  return (
    <div>
      <h2>Teams</h2>
      {error && <div style={{color: 'red'}}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="team_name"
          placeholder="Team Name"
          value={newTeam.team_name}
          onChange={handleChange}
          required
        />
        <select
          name="group_name"
          value={newTeam.group_name}
          onChange={handleChange}
          required
        >
          <option value="A">Group A</option>
          <option value="B">Group B</option>
        </select>
        <button type="submit">
          {editMode ? 'Update Team' : 'Add Team'}
        </button>
      </form>

      <ul>
        {teams.map(team => (
          <li key={team.id}>
            {team.team_name} (Group: {team.group_name})
            <button onClick={() => handleEdit(team)}>Edit</button>
            <button onClick={() => handleDelete(team.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TeamManagement;