import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TournamentRecap.css';
import config from '../config';

const TournamentRecap = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/matches/tournament-stats`);
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch tournament statistics');
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading tournament statistics...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!stats?.winner) return null; // Don't show recap until tournament is complete

  return (
    <div className="tournament-recap">
      <h2 className="recap-title">Tournament Final Statistics</h2>
      
      <div className="winner-section">
        <div className="trophy-icon">🏆</div>
        <h3>Tournament Champions</h3>
        <div className="winner-team">
          <div className="team-name">{stats.winner.team_name}</div>
          <div className="player-names">{stats.winner.player_names.replace(',', ' & ')}</div>
          <div className="total-kills">Total Tournament Kills: {stats.winner.total_kills}</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stats-section">
          <h3>Top Qualifier Phase Killers</h3>
          <div className="top-players">
            {stats.qualifierTop3.map((player, index) => (
              <div key={index} className="player-stat">
                <div className="rank">#{index + 1}</div>
                <div className="player-info">
                  <div className="player-name">{player.name}</div>
                  <div className="team-name">{player.team_name}</div>
                </div>
                <div className="kills">
                  <span className="kill-count">{player.qualifier_kills}</span>
                  <span className="kill-label">kills</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-section">
          <h3>Top Elimination Phase Killers</h3>
          <div className="top-players">
            {stats.eliminationTop3.map((player, index) => (
              <div key={index} className="player-stat">
                <div className="rank">#{index + 1}</div>
                <div className="player-info">
                  <div className="player-name">{player.name}</div>
                  <div className="team-name">{player.team_name}</div>
                </div>
                <div className="kills">
                  <span className="kill-count">{player.elimination_kills}</span>
                  <span className="kill-label">kills</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentRecap;