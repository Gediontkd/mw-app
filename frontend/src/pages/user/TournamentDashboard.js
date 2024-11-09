import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './tournament.css';
import Image2 from '../../assets/images/no_background_logo_titled.png';
import config from '../../config';
import { fetchTeamRankings } from '../../services/matchService';
import { fetchTournamentPhase, checkQualification } from '../../services/tournamentService';
import { Link } from 'react-router-dom';

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

const PlayerModal = ({ isOpen, onClose, players }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Players List</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="players-grid">
            {players.map((player) => (
              <div key={player.id} className="modal-player-card">
                <div className="modal-player-info">
                  <div className="modal-player-name">{player.name}</div>
                  <div className={`modal-player-status ${player.team_id ? 'assigned' : 'unassigned'}`}>
                    {player.team_id ? 'In Team' : 'Not Assigned'}
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

const PlayerCarousel = ({ players, expandView, FIXED_PLAYER_SLOTS }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slidesPerView = 4;
  const totalSlides = Math.ceil(FIXED_PLAYER_SLOTS.length / slidesPerView);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (slideIndex) => {
    setCurrentSlide(slideIndex);
  };

  return (
    <div className="player-carousel">
      <div className="carousel-container">
        <button 
          className="carousel-arrow carousel-arrow-left" 
          onClick={prevSlide}
          aria-label="Previous slide"
        >
          ‹
        </button>

        <div className="carousel-track" 
          style={{ 
            transform: `translateX(-${currentSlide * 100}%)`,
          }}
        >
          {expandView ? (
            <div className="player-grid">
              {players.map((player) => (
                <div key={player.id} className="player-card">
                  <div className="player-info">
                    <div className="player-name">{player.name}</div>
                    <div className={`player-status ${player.team_id ? 'assigned' : 'unassigned'}`}>
                      {player.team_id ? 'In Team' : 'Not Assigned'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            [...Array(totalSlides)].map((_, slideIndex) => (
              <div key={slideIndex} className="carousel-slide">
                {FIXED_PLAYER_SLOTS
                  .slice(slideIndex * slidesPerView, (slideIndex + 1) * slidesPerView)
                  .map((slot) => (
                    <div key={slot.id} className="carousel-card">
                      <div className="card-content">
                        <div className="card-image-container">
                          <img 
                            src={slot.image}
                            alt={slot.position}
                            className="card-image"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ))
          )}
        </div>

        <button 
          className="carousel-arrow carousel-arrow-right" 
          onClick={nextSlide}
          aria-label="Next slide"
        >
          ›
        </button>
      </div>

      {/* Navigation dots */}
      <div className="carousel-dots">
        {[...Array(totalSlides)].map((_, index) => (
          <button
            key={index}
            className={`carousel-dot ${currentSlide === index ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

const TournamentDashboard = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [rankings, setRankings] = useState({
    groupA: [],
    groupB: []
  });
  const [playerRankings, setPlayerRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandView, setExpandView] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('qualifiers');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      // Fetch current tournament phase and rankings
      const [phaseData, groupAData, groupBData, playersData, teamsRes] = await Promise.all([
        fetchTournamentPhase(),
        fetchTeamRankings('A'),
        fetchTeamRankings('B'),
        fetch(`${config.API_BASE_URL}/players`).then(res => res.json()),
        axios.get(`${config.API_BASE_URL}/teams`)
      ]);

      setCurrentPhase(phaseData.phase_name);
      setTeams(teamsRes.data);
      setPlayers(playersData);

      // Process and update rankings
      const processedGroupA = processTeamRankings(groupAData);
      const processedGroupB = processTeamRankings(groupBData);

      setRankings({
        groupA: processedGroupA,
        groupB: processedGroupB
      });

      setPlayerRankings(processPlayerRankings(playersData));
      setLastUpdate(new Date());
      setLoading(false);

      // Check qualification for both groups if in qualifier phase
      if (phaseData.phase_name === 'qualifiers') {
        await Promise.all([
          checkQualification('A'),
          checkQualification('B')
        ]);
      }
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  const processTeamRankings = (teams) => {
    return teams
      .map(team => ({
        ...team,
        isQualified: team.is_qualified || team.total_kills >= 100,
        progress: Math.min((team.total_kills / 100) * 100, 100),
        gameTime: team.game_time || '-'
      }))
      .sort((a, b) => {
        // First priority: Qualification status
        if (a.isQualified !== b.isQualified) {
          return b.isQualified - a.isQualified;
        }

        // For qualified teams: Sort by matches played
        if (a.isQualified && b.isQualified) {
          if (a.matches_played !== b.matches_played) {
            return a.matches_played - b.matches_played;
          }
          // If matches are equal, sort by total kills
          return b.total_kills - a.total_kills;
        }

        // For non-qualified teams: Sort by total kills
        return b.total_kills - a.total_kills;
      });
  };

  const processPlayerRankings = (players) => {
    return players
      .filter(player => player.kills > 0) // Only show players with kills
      .map(player => ({
        ...player,
        // Use appropriate kills based on phase
        totalKills: currentPhase === 'qualifiers' ? 
          player.qualifier_kills || 0 : 
          player.finals_kills || 0,
        killsPerMatch: player.matches_played ? 
          ((player.qualifier_kills + player.finals_kills) / player.matches_played).toFixed(1) : '0'
      }))
      .sort((a, b) => b.totalKills - a.totalKills);
  };

  const TeamRankingsTable = ({ rankings, groupName }) => {
    const qualifiedTeams = rankings.filter(team => team.isQualified).length;

    return (
      <div className="ranking-card">
        <div className="ranking-title">
          GIRONE {groupName}
          <span className={`qualification-mark ${qualifiedTeams >= 2 ? 'complete' : ''}`}>
            {qualifiedTeams}/2 Qualified
          </span>
        </div>
        <table className="rankings-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>Kills</th>
              <th>Matches</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((team, index) => (
              <tr 
                key={team.id} 
                className={team.isQualified ? 'qualified-row' : ''}
              >
                <td>{index + 1}</td>
                <td>{team.team_name}</td>
                <td>{team.total_kills}</td>
                <td>{team.matches_played}</td>
                <td>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{
                        width: `${team.progress}%`,
                        backgroundColor: team.isQualified ? '#4CAF50' : '#2196F3'
                      }}
                      title={`${team.progress}% to qualification`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="tournament-container">
      {/* Banner Image */}
      <div className="banner-container">
        <img 
          src={Image2}
          alt="Tournament Banner"
          className="banner-image"
        />
      </div>
      {/* Tournament Header */}
      {/* <div className="tournament-header">
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
      </div> */}

      {/* Player Section */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Players</h2>
          <button 
            className="expand-button"
            onClick={() => setIsModalOpen(true)}
          >
            Teams
          </button>
        </div>
        <PlayerCarousel 
          players={players}
          expandView={false}
          FIXED_PLAYER_SLOTS={FIXED_PLAYER_SLOTS}
        />
      </div>

      {/* Player Modal */}
      <PlayerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        players={players}
      />

      {/* Rankings Section */}
      <div className="rankings-section">
        <div className="rankings-header">
          <h2 className="section-title">Phase 1</h2>
          <h2 className="section-title"><Link to="/bracket" className="phase-button">
      Phase 2
    </Link></h2>
          {/* <button 
            onClick={fetchData} 
            className="refresh-button"
            disabled={loading}
          >
            Refresh Rankings
          </button> */}
        </div>
        
        <div className="rankings-grid">
          <TeamRankingsTable rankings={rankings.groupA} groupName="A" />
          <TeamRankingsTable rankings={rankings.groupB} groupName="B" />
        </div>

        {lastUpdate && (
          <div className="last-update">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>
    <br/><br/><br/><br/>
      {/* Banner Image */}
      <div className="banner-container">
        <h1 className='sponsor-banner'>CHI SIAMO + SPONSOR</h1>
      </div>
    </div>
  );
};

export default TournamentDashboard;