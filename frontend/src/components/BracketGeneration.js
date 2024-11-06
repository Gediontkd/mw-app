import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './BracketGeneration.css';
import config from '../config';

const BracketGeneration = () => {
  const [qualifiedTeams, setQualifiedTeams] = useState({ A: [], B: [] });
  const [semifinals, setSemifinals] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [finals, setFinals] = useState(null);
  const [showGenerateFinals, setShowGenerateFinals] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teamsRes, semifinalsRes, finalsRes, statsRes] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/matches/qualified-teams`),
        axios.get(`${config.API_BASE_URL}/matches/semifinals`),
        axios.get(`${config.API_BASE_URL}/matches/finals`),
        axios.get(`${config.API_BASE_URL}/matches/tournament-stats`)
      ]);

      const groupA = teamsRes.data.filter(team => team.group_name === 'A');
      const groupB = teamsRes.data.filter(team => team.group_name === 'B');

      setQualifiedTeams({
        A: sortTeams(groupA).slice(0, 2),
        B: sortTeams(groupB).slice(0, 2)
      });

      const uniqueSemifinals = semifinalsRes.data.reduce((acc, match) => {
        if (!acc.some(m => m.match_order === match.match_order)) {
          acc.push({
            id: match.id,
            matchName: `Semifinal ${match.match_order || 1}`,
            match_order: match.match_order || 1,
            team1: {
              id: match.team1_id,
              team_name: match.team1_name,
              group_name: match.team1_group
            },
            team2: {
              id: match.team2_id,
              team_name: match.team2_name,
              group_name: match.team2_group
            },
            wins_team1: match.wins_team1 || 0,
            wins_team2: match.wins_team2 || 0,
            games: match.games || []
          });
        }
        return acc;
      }, []).sort((a, b) => a.match_order - b.match_order);

      setSemifinals(uniqueSemifinals);
      setFinals(finalsRes.data);

      const completedSemis = semifinalsRes.data.filter(
        match => match.wins_team1 === 2 || match.wins_team2 === 2
      );

      if (finalsRes.data?.status === 'completed') {
        const statsRes = await axios.get(`${config.API_BASE_URL}/matches/tournament-stats`);
        setStats(statsRes.data);
      }

      setShowGenerateFinals(completedSemis.length === 2 && !finalsRes.data);
      setFinals(finalsRes.data);
      setFinals(finalsRes.data);
      setStats(statsRes.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch data');
      setLoading(false);
    }
  };

  const sortTeams = (teams) => {
    return teams.sort((a, b) => {
      if (a.total_kills === b.total_kills) {
        return a.matches_played - b.matches_played;
      }
      return b.total_kills - a.total_kills;
    });
  };

  const generateFinals = async () => {
    try {
      const completedSemis = semifinals.filter(
        match => match.wins_team1 === 2 || match.wins_team2 === 2
      );

      if (completedSemis.length !== 2) {
        setError('Both semifinals must be completed first');
        return;
      }

      const team1 = completedSemis[0].wins_team1 === 2 
        ? completedSemis[0].team1
        : completedSemis[0].team2;

      const team2 = completedSemis[1].wins_team1 === 2
        ? completedSemis[1].team1
        : completedSemis[1].team2;

      await axios.post(`${config.API_BASE_URL}/matches/generate-finals`, {
        team1_id: team1.id,
        team2_id: team2.id
      });

      await fetchData();
    } catch (error) {
      setError('Failed to generate finals');
    }
  };

  if (loading) {
    return <div className="loading">Loading tournament data...</div>;
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-dark)', minHeight: '100vh', padding: '20px' }}>
    <div className="bracket-container">
      <h2 className="bracket-title">Tournament Semifinals</h2>
      
      {error && <div className="error-message">{error}</div>}

      {/* Qualified Teams Section */}
      <div className="qualified-teams">
        <div className="group">
          <h3>Group A Qualified Teams ({qualifiedTeams.A.length}/2)</h3>
          {qualifiedTeams.A.map((team) => (
            <div key={team.id} className="team-card">
              <span className="team-name">{team.team_name}</span>
              <span className="team-stats">
                Kills: {team.total_kills} | Matches: {team.matches_played}
              </span>
            </div>
          ))}
        </div>

        <div className="group">
          <h3>Group B Qualified Teams ({qualifiedTeams.B.length}/2)</h3>
          {qualifiedTeams.B.map((team) => (
            <div key={team.id} className="team-card">
              <span className="team-name">{team.team_name}</span>
              <span className="team-stats">
                Kills: {team.total_kills} | Matches: {team.matches_played}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Semifinals Bracket */}
      {semifinals.length === 0 ? (
  <div className="generate-section">
    <p className="info-text">No semifinal matches have started yet.</p>
  </div>
      ) : (
        <div className="semifinals-bracket">
          <h3>Semifinal Matches</h3>
          {semifinals.map((match) => (
            <div key={match.id} className="match-card">
              <div className="match-header">
                <span>{match.matchName}</span>
                <div className="match-status">
                  Best of 3 ({match.wins_team1} - {match.wins_team2})
                </div>
              </div>
              <div className="team-matchup">
                <div className="team">
                  <span className="team-name">{match.team1.team_name}</span>
                </div>
                <div className="vs">VS</div>
                <div className="team">
                  <span className="team-name">{match.team2.team_name}</span>
                </div>
              </div>
              {match.games?.length > 0 && (
                <div className="game-results">
                  {match.games.map((game, idx) => (
                    <div key={idx} className="game-result">
                      Game {game.game_number}: {game.team1_kills} - {game.team2_kills}
                    </div>
                  ))}
                </div>
              )}
              {(match.wins_team1 === 2 || match.wins_team2 === 2) && (
                <div className="winner-badge">
                  Winner: {match.wins_team1 === 2 ? match.team1.team_name : match.team2.team_name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Finals Section */}
<div className="finals-section">
  <h3>Finals - Best of 5</h3>
  {showGenerateFinals ? (
    <div className="generate-finals">
      <p>Both semifinals are complete. Generate the finals match?</p>
      <button 
        className="generate-button"
        onClick={generateFinals}
      >
        Generate Finals Match
      </button>
    </div>
  ) : finals ? (
    <div className="finals-bracket">
      <div className="finals-card">
        <div className="finals-header">
          <span className="finals-title">Grand Finals</span>
          <div className="finals-status">
            Best of 5 ({finals.team1_wins} - {finals.team2_wins})
          </div>
        </div>
        <div className="team-matchup">
          <div className="team">
            <span className="team-name">{finals.team1_name}</span>
          </div>
          <div className="vs">VS</div>
          <div className="team">
            <span className="team-name">{finals.team2_name}</span>
          </div>
        </div>
        {finals.games?.length > 0 && (
          <div className="game-results">
            {finals.games.map((game, idx) => (
              <div key={idx} className="game-result">
                Game {game.game_number}: {game.team1_kills} - {game.team2_kills}
              </div>
            ))}
          </div>
        )}
        {(finals.team1_wins === 3 || finals.team2_wins === 3) && (
          <>
            <div className="winner-badge">
              🏆 Tournament Champion: {finals.team1_wins === 3 ? finals.team1_name : finals.team2_name}
            </div>
            
            {stats && (
              <div className="tournament-stats">
                <h4 className="stats-title">Tournament Statistics</h4>
                
                <div className="stats-grid">
                  {/* Qualifier Phase Stats */}
                  <div className="phase-stats">
                    <h5>Top Qualifier Phase Killers</h5>
                    {stats.qualifierTop3.map((player, index) => (
                      <div key={index} className="stat-row">
                        <div className="rank">#{index + 1}</div>
                        <div className="player-info">
                          <div className="name">{player.name}</div>
                          <div className="team">{player.team_name}</div>
                        </div>
                        <div className="kills">
                          <span className="count">{player.qualifier_kills}</span>
                          <span className="label">kills</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Elimination Phase Stats */}
                  <div className="phase-stats">
                    <h5>Top Elimination Phase Killers</h5>
                    {stats.eliminationTop3.map((player, index) => (
                      <div key={index} className="stat-row">
                        <div className="rank">#{index + 1}</div>
                        <div className="player-info">
                          <div className="name">{player.name}</div>
                          <div className="team">{player.team_name}</div>
                        </div>
                        <div className="kills">
                          <span className="count">{player.elimination_kills}</span>
                          <span className="label">kills</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  ) : (
    <p className="info-text">Waiting for semifinals to complete before starting finals.</p>
  )}
</div>
    </div>
    </div>
  );
};

export default BracketGeneration;