import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TournamentPhases.css';
import config from '../config';

const TournamentPhases = ({ currentPhase }) => {
  const [qualifiedTeams, setQualifiedTeams] = useState({ A: [], B: [] });
  const [semifinals, setSemifinals] = useState([]);
  const [finals, setFinals] = useState(null);
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

      setSemifinals(processSemifinals(semifinalsRes.data));
      setFinals(finalsRes.data);
      setStats(statsRes.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch tournament data');
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

  const processSemifinals = (semis) => {
    return semis.reduce((acc, match) => {
      if (!acc.some(m => m.match_order === match.match_order)) {
        acc.push({
          id: match.id,
          matchName: `Semifinal ${match.match_order || 1}`,
          match_order: match.match_order || 1,
          team1: { id: match.team1_id, name: match.team1_name },
          team2: { id: match.team2_id, name: match.team2_name },
          wins_team1: match.wins_team1 || 0,
          wins_team2: match.wins_team2 || 0,
          games: match.games || []
        });
      }
      return acc;
    }, []).sort((a, b) => a.match_order - b.match_order);
  };

  if (loading) return <div className="loading-spinner">Loading tournament data...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="tournament-phases">
      {/* Qualified Teams Section */}
      <div className="section-header">
        <h2 className="section-title">Phase 2 - Qualified Teams</h2>
      </div>
      <div className="teams-grid">
        <div className="team-list">
          <h3>Group A Qualified Teams ({qualifiedTeams.A.length}/2)</h3>
          {qualifiedTeams.A.map((team) => (
            <div key={team.id} className="team-card">
              <div className="team-name">{team.team_name}</div>
              <div className="team-stats">
                Kills: {team.total_kills} | Matches: {team.matches_played}
              </div>
            </div>
          ))}
        </div>

        <div className="team-list">
          <h3>Group B Qualified Teams ({qualifiedTeams.B.length}/2)</h3>
          {qualifiedTeams.B.map((team) => (
            <div key={team.id} className="team-card">
              <div className="team-name">{team.team_name}</div>
              <div className="team-stats">
                Kills: {team.total_kills} | Matches: {team.matches_played}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Semifinals Section */}
      <div className="section-header">
        <h2 className="section-title">Tournament Semifinals</h2>
      </div>
      <div className="semifinals-grid">
        {semifinals.map((match) => (
          <div key={match.id} className="match-card">
            <h3>{match.matchName}</h3>
            <div className="match-status">Best of 3 ({match.wins_team1} - {match.wins_team2})</div>
            <div className="team-matchup">
              <div className="team">
                <div className="team-name">{match.team1.name}</div>
              </div>
              <div className="vs">VS</div>
              <div className="team">
                <div className="team-name">{match.team2.name}</div>
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
                Winner: {match.wins_team1 === 2 ? match.team1.name : match.team2.name}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Finals Section */}
      {finals && (
        <>
          <div className="section-header">
            <h2 className="section-title">Finals - Best of 5</h2>
          </div>
          <div className="finals-card">
            <h3>Grand Finals</h3>
            <div className="finals-status">
              Best of 5 ({finals.team1_wins} - {finals.team2_wins})
            </div>
            <div className="team-matchup">
              <div className="team">
                <div className="team-name">{finals.team1_name}</div>
              </div>
              <div className="vs">VS</div>
              <div className="team">
                <div className="team-name">{finals.team2_name}</div>
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
              <div className="winner-badge">
                🏆 Tournament Champion: {finals.team1_wins === 3 ? finals.team1_name : finals.team2_name}
              </div>
            )}
          </div>
        </>
      )}

      {/* Tournament Statistics */}
      {stats && (finals?.team1_wins === 3 || finals?.team2_wins === 3) && (
        <>
          <div className="section-header">
            <h2 className="section-title">Tournament Statistics</h2>
          </div>
          <div className="stats-grid">
            <div className="stats-card">
              <h3>Top Qualifier Phase Killers</h3>
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

            <div className="stats-card">
              <h3>Top Elimination Phase Killers</h3>
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
        </>
      )}
    </div>
  );
};

export default TournamentPhases;