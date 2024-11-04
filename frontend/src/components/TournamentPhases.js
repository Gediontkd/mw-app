// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './tournament.css';

// const TournamentPhases = () => {
//   const [tournament, setTournament] = useState(null);
//   const [currentPhase, setCurrentPhase] = useState(null);
//   const [players, setPlayers] = useState([]);
//   const [teams, setTeams] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [message, setMessage] = useState('');

//   useEffect(() => {
//     fetchData();
//     // Poll for updates every 30 seconds
//     const interval = setInterval(fetchData, 30000);
//     return () => clearInterval(interval);
//   }, []);

//   const fetchData = async () => {
//     try {
//       const [tournamentRes, playersRes, teamsRes, phaseRes] = await Promise.all([
//         axios.get('http://localhost:5000/tournament/current'),
//         axios.get('http://localhost:5000/players'),
//         axios.get('http://localhost:5000/teams'),
//         axios.get('http://localhost:5000/phases/current')
//       ]);

//       setTournament(tournamentRes.data);
//       setPlayers(playersRes.data);
//       setTeams(teamsRes.data);
//       setCurrentPhase(phaseRes.data);
//     } catch (error) {
//       setError('Failed to fetch tournament data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const generateTeams = async () => {
//     try {
//       if (currentPhase?.phase_name !== 'enrollment') {
//         setError('Must be in enrollment phase to generate teams');
//         return;
//       }

//       const availablePlayers = players.filter(player => !player.team_id);
      
//       if (availablePlayers.length !== 20) {
//         setError(`Need exactly 20 players to generate teams. Currently have ${availablePlayers.length} players.`);
//         return;
//       }

//       // Shuffle players randomly
//       const shuffledPlayers = [...availablePlayers].sort(() => Math.random() - 0.5);
      
//       // Create teams for Group A (first 10 players)
//       for (let i = 0; i < 5; i++) {
//         const player1 = shuffledPlayers[i * 2];
//         const player2 = shuffledPlayers[i * 2 + 1];
//         const teamName = `${player1.name} x ${player2.name}`;

//         const teamResponse = await axios.post('http://localhost:5000/teams', {
//           team_name: teamName,
//           group_name: 'A',
//           player1_id: player1.id,
//           player2_id: player2.id
//         });

//         await Promise.all([
//           axios.put(`http://localhost:5000/players/${player1.id}`, {
//             ...player1,
//             team_id: teamResponse.data.id
//           }),
//           axios.put(`http://localhost:5000/players/${player2.id}`, {
//             ...player2,
//             team_id: teamResponse.data.id
//           })
//         ]);
//       }

//       // Create teams for Group B (remaining 10 players)
//       for (let i = 5; i < 10; i++) {
//         const player1 = shuffledPlayers[i * 2];
//         const player2 = shuffledPlayers[i * 2 + 1];
//         const teamName = `${player1.name} x ${player2.name}`;

//         const teamResponse = await axios.post('http://localhost:5000/teams', {
//           team_name: teamName,
//           group_name: 'B',
//           player1_id: player1.id,
//           player2_id: player2.id
//         });

//         await Promise.all([
//           axios.put(`http://localhost:5000/players/${player1.id}`, {
//             ...player1,
//             team_id: teamResponse.data.id
//           }),
//           axios.put(`http://localhost:5000/players/${player2.id}`, {
//             ...player2,
//             team_id: teamResponse.data.id
//           })
//         ]);
//       }

//       // Update phase to team generation
//       await axios.post('http://localhost:5000/phases', {
//         phase_name: 'team_generation',
//         phase_status: 'completed'
//       });

//       await fetchData();
//       setMessage('Teams generated successfully');
//     } catch (error) {
//       setError('Failed to generate teams');
//     }
//   };

//   if (loading) {
//     return <div className="loading">Loading...</div>;
//   }

//   if (!tournament) {
//     return (
//       <div className="no-tournament">
//         <h2>No Tournament Found</h2>
//         <p>No active tournament found.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="tournament-phases">
//       {/* Error/Success Messages */}
//       {error && <div className="message error">{error}</div>}
//       {message && <div className="message success">{message}</div>}

//       {/* Phase Display */}
//       <div className="phase-info">
//         <h3>Current Phase: {currentPhase?.phase_name || 'Not Started'}</h3>
//         <div className="phase-details">
//           <div className="stat">
//             <label>Players:</label>
//             <span>{players.length}/20</span>
//           </div>
//           <div className="stat">
//             <label>Teams:</label>
//             <span>{teams.length}/10</span>
//           </div>
//         </div>
//       </div>

//       {/* Team Generation Controls */}
//       <div className="team-controls">
//         <button
//           className={`button ${players.length === 20 ? 'primary' : 'disabled'}`}
//           onClick={generateTeams}
//           disabled={players.length !== 20 || currentPhase?.phase_name !== 'enrollment'}
//         >
//           Generate Teams
//         </button>
//       </div>

//       {/* Team Display */}
//       {teams.length > 0 && (
//         <div className="teams-display">
//           {/* Group A */}
//           <div className="team-group">
//             <h4>Group A Teams</h4>
//             <div className="team-list">
//               {teams
//                 .filter(team => team.group_name === 'A')
//                 .map(team => (
//                   <div key={team.id} className="team-card">
//                     <div className="team-name">{team.team_name}</div>
//                     <div className="team-players">
//                       <div>{players.find(p => p.id === team.player1_id)?.name}</div>
//                       <div>{players.find(p => p.id === team.player2_id)?.name}</div>
//                     </div>
//                   </div>
//                 ))}
//             </div>
//           </div>

//           {/* Group B */}
//           <div className="team-group">
//             <h4>Group B Teams</h4>
//             <div className="team-list">
//               {teams
//                 .filter(team => team.group_name === 'B')
//                 .map(team => (
//                   <div key={team.id} className="team-card">
//                     <div className="team-name">{team.team_name}</div>
//                     <div className="team-players">
//                       <div>{players.find(p => p.id === team.player1_id)?.name}</div>
//                       <div>{players.find(p => p.id === team.player2_id)?.name}</div>
//                     </div>
//                   </div>
//                 ))}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TournamentPhases;