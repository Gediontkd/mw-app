// LiveRankings.js
import React, { useState, useEffect } from 'react';
import { fetchTeamRankings } from '../services/matchService';
import { fetchTournamentPhase, checkQualification } from '../services/tournamentService';
import './rankings.css';
import Image1 from '../assets/images/no_background_logo_titled.png';
import config from '../config';

const LiveRankings = () => {
  const [rankings, setRankings] = useState({
    groupA: [],
    groupB: []
  });
  const [playerRankings, setPlayerRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('qualifiers');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch current tournament phase and rankings
      const [phaseData, groupAData, groupBData, playersData] = await Promise.all([
        fetchTournamentPhase(),
        fetchTeamRankings('A'),
        fetchTeamRankings('B'),
        fetch(`${config.API_BASE_URL}/players`).then(res => res.json())
      ]);

      setCurrentPhase(phaseData.phase_name);

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
      setError('Failed to fetch rankings data');
      console.error('Error fetching rankings:', err);
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
          Group {groupName} Rankings
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
              {/* <th>Total Time</th> */}
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
                {/* <td>{team.gameTime}</td> */}
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
    return <div className="loading-container">Loading rankings...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="rankings-container">
      <div className="banner-image">
    <img 
      src={Image1} // Replace with your image path
      alt="Event Banner"
    />
  </div>

      <div className="rankings-header">
        <h1 className="rankings-title">Live Tournament Rankings</h1>
        <div className="rankings-actions">
          <button 
            onClick={fetchData} 
            className="refresh-button"
            disabled={loading}
          >
            Refresh Rankings
          </button>
        </div>
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
  );
};

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

export default LiveRankings;