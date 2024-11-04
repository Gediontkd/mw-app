import React, { useState, useEffect } from 'react';
import './rankings.css';

const styles = {
    adSpace: {
      width: '100%',
      height: '120px',
      backgroundColor: '#f0f0f0',
      marginBottom: '30px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '8px',
      border: '2px dashed #ccc',
    }
  };

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
        // Fetch all rankings data in parallel
        const [groupARes, groupBRes, playersRes] = await Promise.all([
          fetch('http://localhost:5000/matches/team-rankings/A'),
          fetch('http://localhost:5000/matches/team-rankings/B'),
          fetch('http://localhost:5000/players')
        ]);
  
        const groupAData = await groupARes.json();
        const groupBData = await groupBRes.json();
        const playersData = await playersRes.json();
  
        // Process and sort group rankings
        setGroupARankings(processTeamRankings(groupAData));
        setGroupBRankings(processTeamRankings(groupBData));
        setPlayerRankings(processPlayerRankings(playersData));
        setLastUpdate(new Date());
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch rankings:', error);
      }
    };
  
    // Updated team ranking logic based on your requirements
    const processTeamRankings = (teams) => {
      return teams
        .map(team => ({
          ...team,
          // Calculate total kills from matches
          total_kills: team.total_kills || 0,
          matches_played: team.matches_played || 0,
          // Track qualification status
          isQualified: team.total_kills >= 100,
          // Calculate progress percentage
          progress: Math.min((team.total_kills / 100) * 100, 100),
          // Calculate average kills per match
          avgKills: team.matches_played ? (team.total_kills / team.matches_played).toFixed(1) : '0'
        }))
        .sort((a, b) => {
          // First sort by qualification status
          if (a.isQualified !== b.isQualified) {
            return b.isQualified - a.isQualified;
          }
          // If both teams are qualified, sort by matches played (fewer is better)
          if (a.isQualified && b.isQualified) {
            if (a.matches_played !== b.matches_played) {
              return a.matches_played - b.matches_played;
            }
            // If matches played are equal, sort by total kills
            return b.total_kills - a.total_kills;
          }
          // If neither team is qualified, sort by total kills
          if (!a.isQualified && !b.isQualified) {
            return b.total_kills - a.total_kills;
          }
          return 0;
        });
    };
  
    // Updated player ranking logic
    const processPlayerRankings = (players) => {
      return players
        .map(player => {
          // Get total kills (combination of qualifier and finals kills)
          const totalKills = (player.qualifier_kills || 0) + (player.finals_kills || 0);
          return {
            ...player,
            total_kills: totalKills,
            matches_played: player.matches_played || 0,
            // Calculate kills per match
            killsPerMatch: player.matches_played ? 
              (totalKills / player.matches_played).toFixed(1) : '0'
          };
        })
        .sort((a, b) => b.total_kills - a.total_kills);
    };
  
    const TeamRankingsTable = ({ rankings, groupName }) => {
      // Count qualified teams
      const qualifiedTeams = rankings.filter(team => team.isQualified).length;
  
      return (
        <div className="ranking-card">
          <div className="ranking-title">
            Group {groupName} Rankings
            <span className="qualification-mark">
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
                <tr key={team.id} className={team.isQualified ? 'qualified-row' : ''}>
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

  return (
    <div className="rankings-container">
        {/* Ad Space */}
      <div style={styles.adSpace}>
        <span>Advertisement Space</span>
      </div>
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

      {/* <PlayerRankings /> */}

      {lastUpdate && (
        <div className="last-update">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};



export default LiveRankings;