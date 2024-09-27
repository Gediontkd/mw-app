// src/TeamManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles.css';

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [newTeam, setNewTeam] = useState({ team_name: '', group_name: '' });
  const [editMode, setEditMode] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState(null);

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
    setNewTeam((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        // Update existing team
        await axios.put(`http://localhost:5000/teams/${currentTeamId}`, newTeam);
        setEditMode(false);
        setCurrentTeamId(null);
      } else {
        // Add new team
        await axios.post('http://localhost:5000/teams', newTeam);
      }
      setNewTeam({ team_name: '', group_name: '' }); // Reset form
      fetchTeams(); // Refresh team list
    } catch (error) {
      console.error('Error adding/updating team:', error);
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
      fetchTeams(); // Refresh team list
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  return (
    <div>
      <h2>Teams</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="team_name"
          placeholder="Team Name"
          value={newTeam.team_name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="group_name"
          placeholder="Group Name"
          value={newTeam.group_name}
          onChange={handleChange}
          required
        />
        <button type="submit">{editMode ? 'Update Team' : 'Add Team'}</button>
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
