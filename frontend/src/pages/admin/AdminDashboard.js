import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './admin.css';

const AdminDashboard = () => {
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
        axios.get('http://localhost:5000/players'),
        axios.get('http://localhost:5000/teams')
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
      const availablePlayers = players.filter(player => !player.team_id);
      
      if (availablePlayers.length !== 20) {
        setError(`Need 20 players to form teams. Currently have ${availablePlayers.length} players.`);
        return;
      }

      // Shuffle players randomly
      const shuffledPlayers = [...availablePlayers].sort(() => Math.random() - 0.5);
      
      // Create teams for Groups A and B
      for (let i = 0; i < 10; i++) {
        const player1 = shuffledPlayers[i * 2];
        const player2 = shuffledPlayers[i * 2 + 1];
        const groupName = i < 5 ? 'A' : 'B';
        const teamName = `${player1.name} x ${player2.name}`;

        const teamResponse = await axios.post('http://localhost:5000/teams', {
          team_name: teamName,
          group_name: groupName,
          player1_id: player1.id,
          player2_id: player2.id
        });

        await Promise.all([
          axios.put(`http://localhost:5000/players/${player1.id}`, {
            ...player1,
            team_id: teamResponse.data.id
          }),
          axios.put(`http://localhost:5000/players/${player2.id}`, {
            ...player2,
            team_id: teamResponse.data.id
          })
        ]);
      }

      await fetchData();
      setMessage('Teams generated successfully');
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
      await Promise.all([
        ...players
          .filter(player => player.team_id)
          .map(player =>
            axios.put(`http://localhost:5000/players/${player.id}`, {
              ...player,
              team_id: null
            })
          ),
        ...teams.map(team =>
          axios.delete(`http://localhost:5000/teams/${team.id}`)
        )
      ]);

      await fetchData();
      setMessage('Teams reset successfully');
    } catch (error) {
      setError('Failed to reset teams');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <h1 className="dashboard-title">Admin Dashboard</h1>

      {/* Management Links */}
      <div className="management-links">
        {/* <Link to="/admin/tournament-phases" className="nav-link blue">
          Tournament Phases
        </Link> */}
        <Link to="/admin/players" className="nav-link blue">
          Manage Players
        </Link>
        <Link to="/admin/teams" className="nav-link green">
          Manage Teams
        </Link>
        <Link to="/admin/matches" className="nav-link red">
          Manage Matches
        </Link>
      </div>

      {/* Status Messages */}
      {error && <div className="message error">{error}</div>}
      {message && <div className="message success">{message}</div>}

      {/* Team Generation Controls */}
      <div className="team-generation">
        <h2>Team Generation</h2>
        <div className="status-info">
          <p>Available Players: {players.filter(p => !p.team_id).length}/20</p>
          <p>Teams Created: {teams.length}/10</p>
        </div>
        <div className="button-group">
          <button
            className={`generate-button ${players.filter(p => !p.team_id).length === 20 ? 'active' : 'disabled'}`}
            onClick={generateTeams}
            disabled={loading || players.filter(p => !p.team_id).length !== 20}
          >
            {loading ? 'Generating...' : 'Generate Teams'}
          </button>
          {teams.length > 0 && (
            <button
              className="reset-button"
              onClick={resetTeams}
              disabled={loading}
            >
              Reset Teams
            </button>
          )}
        </div>
      </div>

      {/* Team Display */}
      {teams.length > 0 && (
        <div className="teams-display">
          <div className="team-group">
            <h3>Group A Teams</h3>
            {teams
              .filter(team => team.group_name === 'A')
              .map(team => (
                <div key={team.id} className="team-card">
                  <div className="team-name">{team.team_name}</div>
                  <div className="team-players">
                    {players.find(p => p.id === team.player1_id)?.name} & 
                    {players.find(p => p.id === team.player2_id)?.name}
                  </div>
                </div>
              ))}
          </div>

          <div className="team-group">
            <h3>Group B Teams</h3>
            {teams
              .filter(team => team.group_name === 'B')
              .map(team => (
                <div key={team.id} className="team-card">
                  <div className="team-name">{team.team_name}</div>
                  <div className="team-players">
                    {players.find(p => p.id === team.player1_id)?.name} & 
                    {players.find(p => p.id === team.player2_id)?.name}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;