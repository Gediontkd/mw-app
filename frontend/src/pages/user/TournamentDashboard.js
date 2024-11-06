import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './tournament.css';
import Image2 from '../../assets/images/no_background_logo_titled.png';
import config from '../../config';

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

// Define fixed player slots
const FIXED_PLAYER_SLOTS = [
  { id: 1, image: player1, position: "Player Slot 1" },
  { id: 2, image: player2, position: "Player Slot 2" },
  { id: 3, image: player3, position: "Player Slot 3" },
  { id: 4, image: player4, position: "Player Slot 4" },
  { id: 5, image: player5, position: "Player Slot 5" },
  { id: 6, image: player6, position: "Player Slot 6" },
  { id: 7, image: player7, position: "Player Slot 7" },
  { id: 8, image: player8, position: "Player Slot 8" },
  { id: 9, image: player9, position: "Player Slot 9" },
  { id: 10, image: player10, position: "Player Slot 10" },
  { id: 11, image: player11, position: "Player Slot 11" },
  { id: 12, image: player12, position: "Player Slot 12" },
  { id: 13, image: player13, position: "Player Slot 13" },
  { id: 14, image: player14, position: "Player Slot 14" },
  { id: 15, image: player15, position: "Player Slot 15" },
  { id: 16, image: player16, position: "Player Slot 16" },
  { id: 17, image: player17, position: "Player Slot 17" },
  { id: 18, image: player18, position: "Player Slot 18" },
  { id: 19, image: player19, position: "Player Slot 19" },
  { id: 20, image: player20, position: "Player Slot 20" }
];

const TournamentDashboard = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandView, setExpandView] = useState(false);

  const tournamentInfo = {
    name: "Most Wanted Tournament",
    date: "2024-03-21",
    organizer: "EGamex",
    totalPlayers: 20,
    playersPerTeam: 2
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [playersRes, teamsRes] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/players`),
        axios.get(`${config.API_BASE_URL}/teams`)
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
      <div className="banner-image">
        <img src={Image2} alt="Event Banner" />
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

      {/* Player Section */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Players</h2>
          <button 
            className="expand-button"
            onClick={() => setExpandView(!expandView)}
          >
            {expandView ? 'Show Images' : 'Players Name'}
          </button>
        </div>
        <div className="player-grid">
          {expandView ? (
            // Show enrolled players' names when in expand view
            players.map((player) => (
              <div key={player.id} className="player-card">
                <div className="player-info">
                  <div className="player-name">{player.name}</div>
                  <div className={`player-status ${player.team_id ? 'assigned' : 'unassigned'}`}>
                    {player.team_id ? 'In Team' : 'Not Assigned'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Show all fixed image slots regardless of enrolled players
            FIXED_PLAYER_SLOTS.map((slot) => (
              <div key={slot.id} className="player-card">
                <div className="player-image-wrapper">
                  <img 
                    src={slot.image}
                    alt={slot.position}
                    className="player-image"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              </div>
            ))
          )}
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