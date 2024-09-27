// src/TournamentPhases.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TournamentPhases = () => {
  const [phases, setPhases] = useState([]);
  const [newPhase, setNewPhase] = useState({ phase_name: '', phase_status: '' });
  const [editMode, setEditMode] = useState(false);
  const [currentPhaseId, setCurrentPhaseId] = useState(null);

  useEffect(() => {
    fetchPhases();
  }, []);

  const fetchPhases = async () => {
    try {
      const response = await axios.get('http://localhost:5000/phases'); // Adjust this endpoint as necessary
      setPhases(response.data);
    } catch (error) {
      console.error('Error fetching phases:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewPhase((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        // Update existing phase
        await axios.put(`http://localhost:5000/phases/${currentPhaseId}`, newPhase);
        setEditMode(false);
        setCurrentPhaseId(null);
      } else {
        // Add new phase
        await axios.post('http://localhost:5000/phases', newPhase);
      }
      setNewPhase({ phase_name: '', phase_status: '' }); // Reset form
      fetchPhases(); // Refresh phase list
    } catch (error) {
      console.error('Error adding/updating phase:', error);
    }
  };

  const handleEdit = (phase) => {
    setNewPhase({ phase_name: phase.phase_name, phase_status: phase.phase_status });
    setEditMode(true);
    setCurrentPhaseId(phase.id);
  };

  const handleDelete = async (phaseId) => {
    try {
      await axios.delete(`http://localhost:5000/phases/${phaseId}`);
      fetchPhases(); // Refresh phase list
    } catch (error) {
      console.error('Error deleting phase:', error);
    }
  };

  return (
    <div>
      <h2>Tournament Phases</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="phase_name"
          placeholder="Phase Name"
          value={newPhase.phase_name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="phase_status"
          placeholder="Phase Status"
          value={newPhase.phase_status}
          onChange={handleChange}
          required
        />
        <button type="submit">{editMode ? 'Update Phase' : 'Add Phase'}</button>
      </form>

      <ul>
        {phases.map(phase => (
          <li key={phase.id}>
            Phase: {phase.phase_name} (Status: {phase.phase_status})
            <button onClick={() => handleEdit(phase)}>Edit</button>
            <button onClick={() => handleDelete(phase.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TournamentPhases;
