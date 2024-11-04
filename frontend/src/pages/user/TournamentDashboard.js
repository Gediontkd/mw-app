import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './tournament.css';

const styles = {
  adSpace: {
    width: '100%',
    height: '120px',
    backgroundColor: '#f0f0f0',
    marginBottom: '30px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '8px',
    border: '2px dashed #ccc',
  }
};

const TournamentDashboard = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Static tournament info
  const tournamentInfo = {
    name: "Most Wanted Tournament",
    date: "2024-03-21",
    organizer: "EGamex",
    totalPlayers: 20,
    playersPerTeam: 2
  };

  useEffect(() => {
    fetchData();
    // Set up periodic refresh
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [playersRes, teamsRes] = await Promise.all([
        axios.get('http://localhost:5000/players'),
        axios.get('http://localhost:5000/teams')
      ]);
      setPlayers(playersRes.data);
      setTeams(teamsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="tournament-container">
      {/* Ad Space */}
      <div style={styles.adSpace}>
        <span>Advertisement Space</span>
      </div>
      {/* Tournament Header */}
      <div className="tournament-header">
        <h1 className="tournament-title">{tournamentInfo.name}</h1>
        <div className="tournament-info-grid">
          <div className="info-card">
            <div className="info-label">Tournament Date</div>
            <div className="info-value">
              {new Date(tournamentInfo.date).toLocaleDateString()}
            </div>
          </div>
          <div className="info-card">
            <div className="info-label">Organizer</div>
            <div className="info-value">{tournamentInfo.organizer}</div>
          </div>
          <div className="info-card">
            <div className="info-label">Total Players</div>
            <div className="info-value">
              {players.length} / {tournamentInfo.totalPlayers}
            </div>
          </div>
          <div className="info-card">
            <div className="info-label">Players per Team</div>
            <div className="info-value">{tournamentInfo.playersPerTeam}</div>
          </div>
        </div>
      </div>

      {/* Enrolled Players Section */}
      <div className="section">
        <h2 className="section-title">Enrolled Players</h2>
        <div className="player-grid">
          {players.map(player => (
            <div key={player.id} className="player-card">
              <div className="player-name">{player.name}</div>
              <div className={`player-status ${player.team_id ? 'assigned' : 'unassigned'}`}>
                {player.team_id ? 'In Team' : 'Not Assigned'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Teams Display */}
      <div className="teams-section">
        <div className="stage stage-1">
          <h3 className="section-title">Group A</h3>
          <div className="team-grid">
            {teams
              .filter(team => team.group_name === 'A')
              .map(team => (
                <div key={team.id} className="team-card">
                  <div className="team-name">{team.team_name}</div>
                  <div className="team-players">
                    <div className="player">
                      {players.find(p => p.id === team.player1_id)?.name}
                    </div>
                    <div className="player">
                      {players.find(p => p.id === team.player2_id)?.name}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="stage stage-2">
          <h3 className="section-title">Group B</h3>
          <div className="team-grid">
            {teams
              .filter(team => team.group_name === 'B')
              .map(team => (
                <div key={team.id} className="team-card">
                  <div className="team-name">{team.team_name}</div>
                  <div className="team-players">
                    <div className="player">
                      {players.find(p => p.id === team.player1_id)?.name}
                    </div>
                    <div className="player">
                      {players.find(p => p.id === team.player2_id)?.name}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentDashboard;