// src/components/SemifinalMatches.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TournamentPhases.css';

const SemifinalMatches = ({ onSemifinalsComplete }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSemifinals();
  }, []);

  const fetchSemifinals = async () => {
    try {
      const response = await axios.get('http://localhost:5000/matches/semifinals');
      setMatches(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch semifinal matches');
      setLoading(false);
    }
  };

  const handleMatchResult = async (matchId, gameNumber, result) => {
    try {
      await axios.post(`http://localhost:5000/matches/semifinal-result`, {
        match_id: matchId,
        game_number: gameNumber,
        ...result
      });
      fetchSemifinals();

      // Check if semifinals are complete
      const updatedResponse = await axios.get('http://localhost:5000/matches/semifinals');
      const allComplete = updatedResponse.data.every(match => 
        match.wins_team1 === 2 || match.wins_team2 === 2
      );
      
      if (allComplete && onSemifinalsComplete) {
        onSemifinalsComplete();
      }
    } catch (error) {
      setError('Failed to update match result');
    }
  };

  if (loading) return <div>Loading semifinals...</div>;

  return (
    <div className="semifinals-container">
      <h2>Semifinals - Best of 3</h2>
      {error && <div className="error-message">{error}</div>}
      
      <div className="matches-grid">
        {matches.map(match => (
          <div key={match.id} className="match-card">
            <div className="match-header">Semifinal Match</div>
            <div className="teams-container">
              <div className="team-row">
                <span>{match.team1_name}</span>
                <span className="wins">{match.wins_team1} wins</span>
              </div>
              <div className="vs-label">VS</div>
              <div className="team-row">
                <span>{match.team2_name}</span>
                <span className="wins">{match.wins_team2} wins</span>
              </div>
            </div>
            
            {/* Game Results Input */}
            {[1, 2, 3].map(gameNumber => {
              const isGameEnabled = gameNumber === 1 || 
                (gameNumber === 2 && match.game1_completed) ||
                (gameNumber === 3 && match.game2_completed && match.wins_team1 === 1 && match.wins_team2 === 1);

              return (
                <div key={gameNumber} className="game-input">
                  <h4>Game {gameNumber}</h4>
                  {isGameEnabled && !match[`game${gameNumber}_completed`] && (
                    <div className="score-input">
                      <input
                        type="number"
                        placeholder="Team 1 Kills"
                        min="0"
                        onChange={(e) => setMatches(prev => ({
                          ...prev,
                          [`game${gameNumber}_team1_kills`]: e.target.value
                        }))}
                      />
                      <input
                        type="number"
                        placeholder="Team 2 Kills"
                        min="0"
                        onChange={(e) => setMatches(prev => ({
                          ...prev,
                          [`game${gameNumber}_team2_kills`]: e.target.value
                        }))}
                      />
                      <button
                        onClick={() => handleMatchResult(match.id, gameNumber, {
                          team1_kills: match[`game${gameNumber}_team1_kills`],
                          team2_kills: match[`game${gameNumber}_team2_kills`]
                        })}
                      >
                        Submit Result
                      </button>
                    </div>
                  )}
                  {match[`game${gameNumber}_completed`] && (
                    <div className="game-result">
                      {match[`game${gameNumber}_team1_kills`]} - {match[`game${gameNumber}_team2_kills`]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};