// TournamentDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './tournament.css';

// Import player images
import player1 from '../../assets/players/bblade_card.png';
import player2 from '../../assets/players/biaar_card.png';
import player3 from '../../assets/players/breelloo_card.png';
import player4 from '../../assets/players/cong_card.png';
import player5 from '../../assets/players/diixblo_card.png';
import player6 from '../../assets/players/eliaa_card.png';
import player7 from '../../assets/players/elmarine_card.png';
import player8 from '../../assets/players/fede_card.png';
import player9 from '../../assets/players/freddy_card.png';
import player10 from '../../assets/players/gxbz_card.png';
import player11 from '../../assets/players/infernaal_card.png';
import player12 from '../../assets/players/intercensal_card.png';
import player13 from '../../assets/players/iszen_card.png';
import player14 from '../../assets/players/jezuzjrr_card.png';
import player15 from '../../assets/players/kibeyz_card.png';
import player16 from '../../assets/players/pelle_card.png';
import player17 from '../../assets/players/system_card.png';
import player18 from '../../assets/players/tenaglia_card.png';
import player19 from '../../assets/players/waartex_card.png';
import player20 from '../../assets/players/zanx_card.png';

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
  const [expandView, setExpandView] = useState(false);

  // Tournament info remains static
  const tournamentInfo = {
    name: "Most Wanted Tournament",
    date: "2024-03-21",
    organizer: "EGamex",
    totalPlayers: 20,
    playersPerTeam: 2
  };

  const getPlayerImage = (playerId) => {
    const imageMap = {
      89: player1,  // hhh
      90: player2,  // kebede
      91: player3,  // Gedion
      92: player4,  // buki
      93: player5,  // dani
      94: player6,  // alem
      95: player7,  // test
      96: player8,  // alem
      97: player9,  // tedi
      98: player10, // geme
      99: player11, // sosi
      100: player12, // hana
      101: player13, // jon
      102: player14, // fff
      103: player15, // adsa
      104: player16, // dafasd
      105: player17, // dsads
      106: player18, // dada
      107: player19, // dfgdsf
      108: player20  // adsd
    };
    return imageMap[playerId] || player1;
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
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
        <div className="section-header">
          <h2 className="section-title">Enrolled Players</h2>
          <button 
            className="expand-button"
            onClick={() => setExpandView(!expandView)}
          >
            {expandView ? 'Show Images' : 'Click to expand'}
          </button>
        </div>
        <div className="player-grid">
          {players.map((player) => (
            <div key={player.id} className="player-card">
              {expandView ? (
                <div className="player-info">
                  <div className="player-name">{player.name}</div>
                  <div className={`player-status ${player.team_id ? 'assigned' : 'unassigned'}`}>
                    {player.team_id ? 'In Team' : 'Not Assigned'}
                  </div>
                </div>
              ) : (
                <div className="player-image-wrapper">
                  <img 
                    src={getPlayerImage(player.id)}
                    alt={player.name}
                    className="player-image"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              )}
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