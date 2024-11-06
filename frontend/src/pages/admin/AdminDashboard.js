import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './admin.css';
import config from '../../config';

const AdminDashboard = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [semifinals, setSemifinals] = useState([]);
  const [finals, setFinals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [qualifiedTeams, setQualifiedTeams] = useState({ A: [], B: [] });
  

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [playersRes, teamsRes, semifinalsRes, finalsRes, qualifiedTeamsRes] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/players`),
        axios.get(`${config.API_BASE_URL}/teams`),
        axios.get(`${config.API_BASE_URL}/matches/semifinals`),
        axios.get(`${config.API_BASE_URL}/matches/finals`),
        axios.get(`${config.API_BASE_URL}/matches/qualified-teams`)
      ]);

      const groupA = qualifiedTeamsRes.data.filter(team => team.group_name === 'A');
    const groupB = qualifiedTeamsRes.data.filter(team => team.group_name === 'B');

    setQualifiedTeams({
      A: sortTeams(groupA).slice(0, 2),
      B: sortTeams(groupB).slice(0, 2)
    });


      setPlayers(playersRes.data);
      setTeams(teamsRes.data);
      setSemifinals(semifinalsRes.data);
      setFinals(finalsRes.data);
    } catch (error) {
      setError('Failed to fetch data');
    }
  };

  // Add the sortTeams function
const sortTeams = (teams) => {
  return teams.sort((a, b) => {
    if (a.total_kills === b.total_kills) {
      return a.matches_played - b.matches_played;
    }
    return b.total_kills - a.total_kills;
  });
};

// Add the generateBracket function
const generateBracket = async () => {
  try {
    if (qualifiedTeams.A.length !== 2 || qualifiedTeams.B.length !== 2) {
      setError('Need exactly 2 qualified teams from each group');
      return;
    }

    await axios.post(`${config.API_BASE_URL}/matches/generate-semifinals`, {
      matches: [
        {
          team1_id: qualifiedTeams.A[0].id,
          team2_id: qualifiedTeams.B[1].id,
          match_order: 1
        },
        {
          team1_id: qualifiedTeams.B[0].id,
          team2_id: qualifiedTeams.A[1].id,
          match_order: 2
        }
      ]
    });

    await fetchData();
    setMessage('Semifinals bracket generated successfully');
  } catch (error) {
    setError('Failed to generate bracket');
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

        const teamResponse = await axios.post(`${config.API_BASE_URL}/teams`, {
          team_name: teamName,
          group_name: groupName,
          player1_id: player1.id,
          player2_id: player2.id
        });

        await Promise.all([
          axios.put(`${config.API_BASE_URL}/players/${player1.id}`, {
            ...player1,
            team_id: teamResponse.data.id
          }),
          axios.put(`${config.API_BASE_URL}/players/${player2.id}`, {
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

  const resetTournament = async () => {
    setLoading(true);
    setError('');
    setMessage('');
  
    try {
      await axios.post(`${config.API_BASE_URL}/tournament/reset`);
      
      // Clear states
      setTeams([]);
      setSemifinals([]);
      setFinals(null);
      
      // Reset player team_ids in the players state
      setPlayers(prevPlayers => 
        prevPlayers.map(player => ({
          ...player,
          team_id: null,
          kills: 0,
          qualifier_kills: 0,
          finals_kills: 0,
          matches_played: 0
        }))
      );
      
      setMessage('Tournament reset successfully');
      
      // Fetch fresh data
      await fetchData();
    } catch (error) {
      console.error('Reset error:', error);
      setError(error.response?.data?.error || 'Failed to reset tournament');
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
            axios.put(`${config.API_BASE_URL}/players/${player.id}`, {
              ...player,
              team_id: null
            })
          ),
        ...teams.map(team =>
          axios.delete(`${config.API_BASE_URL}/teams/${team.id}`)
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
  <Link to="/admin/players" className="nav-link blue">
    Manage Players
  </Link>
  <Link to="/admin/teams" className="nav-link green">
    Manage Teams
  </Link>
  <Link to="/admin/matches" className="nav-link red">
    Manage Qualifier Matches
  </Link>
  <Link to="/admin/semifinals" className="nav-link purple">
      Manage Semifinal Matches
    </Link>
  {/* {semifinals.length > 0 && (
    <Link to="/admin/semifinals" className="nav-link purple">
      Manage Semifinal Matches
    </Link>
  )} */}
  {/* {finals && ( 
    <Link to="/admin/finals" className="nav-link gold">
      Manage Final Match
    </Link>
  )} */}
  <Link to="/admin/finals" className="nav-link gold">
      Manage Final Match
    </Link>
    {!semifinals.length && (
  <div className="generate-section">
    <p className="info-text">No semifinal matches have started yet.</p>
    <button 
      onClick={generateBracket}
      className="generate-button"
      disabled={qualifiedTeams.A.length !== 2 || qualifiedTeams.B.length !== 2}
    >
      Start Semifinals
    </button>
  </div>
)}
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
          <button
    className="reset-tournament-button"
    onClick={() => {
      if (window.confirm('Are you sure you want to reset the tournament? This will remove all teams and matches but keep players.')) {
        resetTournament();
      }
    }}
  >
    Restart Tournament
  </button>
        </div>
      </div>
      {/* Semifinals Display (if exists) */}
      {semifinals.length > 0 && (
        <div className="semifinals-display">
          <h2>Semifinal Matches</h2>
          <div className="semifinals-grid">
            {semifinals.map((match, index) => (
              <div key={match.id} className="semifinal-card">
                <div className="semifinal-header">
                  Semifinal {match.match_order || index + 1}
                  <span className="match-status">
                    Best of 3 ({match.wins_team1 || 0} - {match.wins_team2 || 0})
                  </span>
                </div>
                <div className="matchup">
                  <div className="team-info">
                    <span className="team-name">{match.team1_name}</span>
                    <span className="group-tag">Group {match.team1_group}</span>
                  </div>
                  <span className="vs">VS</span>
                  <div className="team-info">
                    <span className="team-name">{match.team2_name}</span>
                    <span className="group-tag">Group {match.team2_group}</span>
                  </div>
                </div>
                {match.games && match.games.length > 0 && (
                  <div className="game-results">
                    {match.games.map((game, gameIndex) => (
                      <div key={gameIndex} className="game-result">
                        <span className="game-number">Game {game.game_number}</span>
                        <span className="score">
                          {game.team1_kills} - {game.team2_kills}
                        </span>
                        <span className="winner">
                          Winner: {game.winner_team_id === match.team1_id ? match.team1_name : match.team2_name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Display */}
      {teams.length > 0 && (
        <div className="teams-display">
          <h2>Team Groups</h2>
          <div className="teams-grid">
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
        </div>
      )}

      
    </div>
  );
};

export default AdminDashboard;