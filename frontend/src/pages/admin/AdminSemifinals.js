// AdminSemifinals.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './admin.css';

const AdminSemifinals = () => {
  const [qualifiedTeams, setQualifiedTeams] = useState({ A: [], B: [] });
  const [semifinalMatches, setSemifinalMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch qualified teams
      const teamsRes = await axios.get('http://localhost:5000/matches/qualified-teams');
      const teams = teamsRes.data;

      // Separate and sort teams by group
      const groupA = teams
        .filter(team => team.group_name === 'A')
        .sort((a, b) => b.total_kills - a.total_kills);
      const groupB = teams
        .filter(team => team.group_name === 'B')
        .sort((a, b) => b.total_kills - a.total_kills);

      setQualifiedTeams({
        A: groupA.slice(0, 2), // Top 2 from A
        B: groupB.slice(0, 2)  // Top 2 from B
      });

      // Fetch existing semifinal matches if any
      const semisRes = await axios.get('http://localhost:5000/matches/semifinals');
      setSemifinalMatches(semisRes.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch data');
      setLoading(false);
    }
  };

  const createSemifinalMatches = async () => {
    try {
      if (semifinalMatches.length > 0) {
        setError('Semifinal matches already exist');
        return;
      }

      if (qualifiedTeams.A.length !== 2 || qualifiedTeams.B.length !== 2) {
        setError('Need exactly 2 qualified teams from each group');
        return;
      }

      // Create semifinal matches following the format:
      // A1 vs B2 and B1 vs A2
      const matchups = [
        {
          team1_id: qualifiedTeams.A[0].id, // A1
          team2_id: qualifiedTeams.B[1].id, // B2
          match_type: 'semifinal',
          match_order: 1
        },
        {
          team1_id: qualifiedTeams.B[0].id, // B1
          team2_id: qualifiedTeams.A[1].id, // A2
          match_type: 'semifinal',
          match_order: 2
        }
      ];

      await axios.post('http://localhost:5000/matches/generate-semifinals', {
        matches: matchups
      });

      // Update phase
      await axios.post('http://localhost:5000/phases', {
        phase_name: 'semifinals',
        phase_status: 'active'
      });

      await fetchData();
      setMessage('Semifinal matches created successfully');
    } catch (error) {
      setError('Failed to create semifinal matches');
    }
  };

  const updateMatchResult = async (matchId, gameNumber, team1Kills, team2Kills) => {
    try {
      await axios.post(`http://localhost:5000/matches/semifinal-result`, {
        match_id: matchId,
        game_number: gameNumber,
        team1_kills: parseInt(team1Kills),
        team2_kills: parseInt(team2Kills)
      });

      await fetchData();
      setMessage('Match result updated successfully');
    } catch (error) {
      setError('Failed to update match result');
    }
  };

  const MatchResult = ({ match }) => {
    const [gameNumber, setGameNumber] = useState(1);
    const [team1Kills, setTeam1Kills] = useState('');
    const [team2Kills, setTeam2Kills] = useState('');

    const canAddResult = match.wins_team1 < 2 && match.wins_team2 < 2;

    return (
      <div className="semifinal-match">
        <h3>Semifinal Match {match.match_order}</h3>
        <div className="match-teams">
          <div className="team">
            {match.team1_name} (Wins: {match.wins_team1 || 0})
          </div>
          <div className="vs">VS</div>
          <div className="team">
            {match.team2_name} (Wins: {match.wins_team2 || 0})
          </div>
        </div>

        {canAddResult && (
          <div className="result-input">
            <select value={gameNumber} onChange={(e) => setGameNumber(e.target.value)}>
              <option value={1}>Game 1</option>
              <option value={2}>Game 2</option>
              <option value={3}>Game 3</option>
            </select>
            <input
              type="number"
              placeholder={`${match.team1_name} Kills`}
              value={team1Kills}
              onChange={(e) => setTeam1Kills(e.target.value)}
            />
            <input
              type="number"
              placeholder={`${match.team2_name} Kills`}
              value={team2Kills}
              onChange={(e) => setTeam2Kills(e.target.value)}
            />
            <button
              onClick={() => {
                updateMatchResult(match.id, gameNumber, team1Kills, team2Kills);
                setTeam1Kills('');
                setTeam2Kills('');
              }}
              disabled={!team1Kills || !team2Kills}
            >
              Submit Result
            </button>
          </div>
        )}

        {/* Display previous game results */}
        <div className="game-results">
          {match.games?.map((game, idx) => (
            <div key={idx} className="game-result">
              Game {idx + 1}: {game.team1_kills} - {game.team2_kills}
              {game.winner_team_id && ` (Winner: ${
                game.winner_team_id === match.team1_id ? match.team1_name : match.team2_name
              })`}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-semifinals">
      <h2>Semifinals Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <div className="qualified-teams">
        <div className="group">
          <h3>Group A Qualified</h3>
          {qualifiedTeams.A.map((team, index) => (
            <div key={team.id} className="team-card">
              <div className="position">#{index + 1}</div>
              <div className="team-name">{team.team_name}</div>
              <div className="kills">{team.total_kills} kills</div>
            </div>
          ))}
        </div>

        <div className="group">
          <h3>Group B Qualified</h3>
          {qualifiedTeams.B.map((team, index) => (
            <div key={team.id} className="team-card">
              <div className="position">#{index + 1}</div>
              <div className="team-name">{team.team_name}</div>
              <div className="kills">{team.total_kills} kills</div>
            </div>
          ))}
        </div>
      </div>

      {semifinalMatches.length === 0 && (
        <button
          className="create-semifinals"
          onClick={createSemifinalMatches}
          disabled={qualifiedTeams.A.length !== 2 || qualifiedTeams.B.length !== 2}
        >
          Create Semifinal Matches
        </button>
      )}

      <div className="semifinal-matches">
        {semifinalMatches.map(match => (
          <MatchResult key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
};

export default AdminSemifinals;