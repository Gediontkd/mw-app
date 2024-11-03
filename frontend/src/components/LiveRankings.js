import React, { useState, useEffect } from 'react';
import './rankings.css';

const LiveRankings = () => {
  const [groupARankings, setGroupARankings] = useState([]);
  const [groupBRankings, setGroupBRankings] = useState([]);
  const [playerRankings, setPlayerRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchRankings();
    const interval = setInterval(fetchRankings, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchRankings = async () => {
    try {
      // Simulate API calls - replace with your actual endpoints
      const [groupARes, groupBRes, playersRes] = await Promise.all([
        fetch('http://localhost:5000/matches/team-rankings/A'),
        fetch('http://localhost:5000/matches/team-rankings/B'),
        fetch('http://localhost:5000/players')
      ]);

      const groupAData = await groupARes.json();
      const groupBData = await groupBRes.json();
      const playersData = await playersRes.json();

      setGroupARankings(groupAData);
      setGroupBRankings(groupBData);
      setPlayerRankings(playersData);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
    }
  };

  const TeamRankingsTable = ({ rankings, groupName }) => (
    <div className="ranking-card">
      <div className="ranking-title">
        Group {groupName} Rankings
        <span className="qualification-mark">
          {rankings.filter(team => team.total_kills >= 100).length}/2 Qualified
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
          {rankings.map((team, index) => {
            const isQualified = team.total_kills >= 100;
            const progress = Math.min((team.total_kills / 100) * 100, 100);
            
            return (
              <tr key={team.id} className={isQualified ? 'qualified-row' : ''}>
                <td>{index + 1}</td>
                <td>{team.team_name}</td>
                <td>{team.total_kills}</td>
                <td>{team.matches_played}</td>
                <td>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: isQualified ? '#4CAF50' : '#2196F3'
                      }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const PlayerRankings = () => (
    <div className="ranking-card player-rankings">
      <div className="ranking-title">Player Rankings</div>
      <table className="rankings-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            {/* <th>Team</th> */}
            <th>Kills</th>
            <th>Matches</th>
          </tr>
        </thead>
        <tbody>
          {playerRankings
            .sort((a, b) => b.kills - a.kills)
            .map((player, index) => (
              <tr key={player.id}>
                <td>{index + 1}</td>
                <td>{player.name}</td>
                {/* <td>{player.team_id ? `Team ${player.team_id}` : '-'}</td> */}
                <td>{player.kills}</td>
                <td>{player.matches_played || 0}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return <div className="loading">Loading rankings...</div>;
  }

  return (
    <div className="rankings-container">
      <div className="rankings-header">
        <h1 className="rankings-title">Live Tournament Rankings</h1>
        <div className="rankings-actions">
          <button onClick={fetchRankings} className="refresh-button">
            Refresh Rankings
          </button>
        </div>
      </div>
      
      <div className="rankings-grid">
        <TeamRankingsTable rankings={groupARankings} groupName="A" />
        <TeamRankingsTable rankings={groupBRankings} groupName="B" />
      </div>

      <PlayerRankings />

      {lastUpdate && (
        <div className="last-update">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};



export default LiveRankings;