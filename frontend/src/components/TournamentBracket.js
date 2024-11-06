// TournamentBracket.jsx
import React, { useState, useEffect } from 'react';
import './TournamentBracket.css';
import config from '../config';

const TournamentBracket = () => {
  const [brackets, setBrackets] = useState({
    semifinals: [],
    final: null,
    currentPhase: null
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all required data in parallel
      const [phaseRes, semisRes, finalRes, statsRes] = await Promise.all([
        fetch(`${config.API_BASE_URL}/phases/current`),
        fetch(`${config.API_BASE_URL}/matches/semifinals`),
        fetch(`${config.API_BASE_URL}/matches/finals`),
        fetch(`${config.API_BASE_URL}/tournament/final-stats`)
      ]);

      const [phaseData, semisData, finalData, statsData] = await Promise.all([
        phaseRes.json(),
        semisRes.json(),
        finalRes.json(),
        statsRes.json()
      ]);

      setBrackets({
        semifinals: semisData,
        final: finalData,
        currentPhase: phaseData?.phase_name
      });
      setStats(statsData);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch tournament data');
      setLoading(false);
    }
  };

  const renderWinDots = (wins, maxWins) => {
    return (
      <div className="win-dots">
        {Array(maxWins).fill(null).map((_, idx) => (
          <div 
            key={idx} 
            className={`dot ${wins > idx ? 'win' : ''}`} 
          />
        ))}
      </div>
    );
  };

  const MatchBox = ({ match, type = 'semifinal' }) => {
    const maxWins = type === 'semifinal' ? 2 : 3;
    if (!match) return <div className="match-box empty">Waiting for teams...</div>;

    return (
      <div className={`match-box ${type}`}>
        <div className="match-header">
          {type === 'semifinal' ? 'Semifinal' : 'Final'}
        </div>
        
        <div className="team team1">
          <div className="team-info">
            <span className="team-name">{match.team1_name}</span>
            <span className="team-kills">{match.team1_kills || 0} kills</span>
          </div>
          {renderWinDots(match.wins_team1 || 0, maxWins)}
        </div>

        <div className="vs-divider">VS</div>

        <div className="team team2">
          <div className="team-info">
            <span className="team-name">{match.team2_name}</span>
            <span className="team-kills">{match.team2_kills || 0} kills</span>
          </div>
          {renderWinDots(match.wins_team2 || 0, maxWins)}
        </div>
      </div>
    );
  };

  const StatsBox = () => {
    if (!stats) return null;

    return (
      <div className="stats-box">
        <h3>Tournament Stats</h3>
        
        <div className="stats-section">
          <h4>Top 3 Qualifier Kills</h4>
          {stats.qualifierTop3?.map((player, idx) => (
            <div key={`qual-${idx}`} className="stat-row">
              <span>#{idx + 1} {player.name}</span>
              <span>{player.qualifier_kills} kills</span>
            </div>
          ))}
        </div>

        <div className="stats-section">
          <h4>Top 3 Finals Kills</h4>
          {stats.finalsTop3?.map((player, idx) => (
            <div key={`final-${idx}`} className="stat-row">
              <span>#{idx + 1} {player.name}</span>
              <span>{player.finals_kills} kills</span>
            </div>
          ))}
        </div>

        {stats.winner && (
          <div className="winner-section">
            <h4>Tournament Winner</h4>
            <div className="winner-name">{stats.winner.team_name}</div>
            <div className="winner-players">
              {stats.winner.player_names?.split(',').join(' & ')}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="loading">Loading tournament bracket...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="tournament-bracket">
      <h2 className="bracket-title">Tournament Bracket</h2>
      
      <div className="bracket-structure">
        {/* Semifinals */}
        <div className="semifinals-round">
          {brackets.semifinals.map((match, idx) => (
            <MatchBox 
              key={`semi-${idx}`}
              match={match}
              type="semifinal"
            />
          ))}
        </div>

        {/* Connector Lines */}
        <div className="connector-lines">
          <div className="vertical-line"></div>
          <div className="horizontal-line"></div>
          <div className="vertical-line"></div>
        </div>

        {/* Finals */}
        <div className="finals-round">
          <MatchBox 
            match={brackets.final}
            type="final"
          />
        </div>
      </div>

      {/* Stats Section */}
      <StatsBox />
    </div>
  );
};

export default TournamentBracket;