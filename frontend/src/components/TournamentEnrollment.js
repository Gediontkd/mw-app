// import React, { useState, useEffect } from 'react';

// const TournamentEnrollment = () => {
//   const [players, setPlayers] = useState([]);
//   const [teams, setTeams] = useState([]);
//   const [newPlayer, setNewPlayer] = useState({ name: '' });
//   const [error, setError] = useState('');

//   useEffect(() => {
//     fetchPlayers();
//     fetchTeams();
//   }, []);

//   const fetchPlayers = async () => {
//     try {
//       const response = await fetch('http://localhost:5000/players');
//       const data = await response.json();
//       setPlayers(data);
//     } catch (error) {
//       console.error('Error fetching players:', error);
//       setError('Failed to fetch players');
//     }
//   };

//   const fetchTeams = async () => {
//     try {
//       const response = await fetch('http://localhost:5000/teams');
//       const data = await response.json();
//       setTeams(data);
//     } catch (error) {
//       console.error('Error fetching teams:', error);
//       setError('Failed to fetch teams');
//     }
//   };

//   const handlePlayerSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await fetch('http://localhost:5000/players', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ ...newPlayer, kills: 0 })
//       });
      
//       if (!response.ok) throw new Error('Failed to add player');
      
//       setNewPlayer({ name: '' });
//       fetchPlayers();
//     } catch (error) {
//       console.error('Error adding player:', error);
//       setError('Failed to add player');
//     }
//   };

//   const generateRandomTeams = async () => {
//     try {
//       // Get players without teams
//       const availablePlayers = players.filter(player => !player.team_id);
      
//       if (availablePlayers.length < 2) {
//         setError('Not enough players to form teams (minimum 2 players needed)');
//         return;
//       }

//       // Shuffle players array
//       const shuffledPlayers = [...availablePlayers].sort(() => Math.random() - 0.5);
      
//       // Calculate number of complete teams possible
//       const numberOfTeams = Math.floor(shuffledPlayers.length / 2);
      
//       // Create teams
//       for (let i = 0; i < numberOfTeams; i++) {
//         const player1 = shuffledPlayers[i * 2];
//         const player2 = shuffledPlayers[i * 2 + 1];
        
//         // Assign group (alternating A and B)
//         const groupName = i % 2 === 0 ? 'A' : 'B';
        
//         // Create team name
//         const teamName = `Team ${i + 1}`;
        
//         // Create team
//         const teamResponse = await fetch('http://localhost:5000/teams', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             team_name: teamName,
//             group_name: groupName,
//             player1_id: player1.id,
//             player2_id: player2.id
//           })
//         });

//         if (!teamResponse.ok) throw new Error('Failed to create team');
        
//         const teamData = await teamResponse.json();

//         // Update players with team_id
//         await Promise.all([player1.id, player2.id].map(playerId =>
//           fetch(`http://localhost:5000/players/${playerId}`, {
//             method: 'PUT',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//               team_id: teamData.id,
//               name: playerId === player1.id ? player1.name : player2.name,
//               kills: 0
//             })
//           })
//         ));
//       }

//       // Refresh data
//       fetchTeams();
//       fetchPlayers();

//       // Handle remaining player if odd number
//       const remainingPlayers = shuffledPlayers.length % 2;
//       if (remainingPlayers) {
//         setError('Note: One player remains unassigned due to odd number of players');
//       }

//     } catch (error) {
//       console.error('Error generating teams:', error);
//       setError('Failed to generate teams');
//     }
//   };

//   const resetTournament = async () => {
//     try {
//       // First, reset all player team_ids to null
//       await Promise.all(players.map(player =>
//         fetch(`http://localhost:5000/players/${player.id}`, {
//           method: 'PUT',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             team_id: null,
//             name: player.name,
//             kills: 0
//           })
//         })
//       ));

//       // Then delete all teams
//       await Promise.all(teams.map(team =>
//         fetch(`http://localhost:5000/teams/${team.id}`, {
//           method: 'DELETE'
//         })
//       ));

//       // Refresh data
//       await fetchTeams();
//       await fetchPlayers();
//       setError('Tournament has been reset');
//     } catch (error) {
//       console.error('Error resetting tournament:', error);
//       setError('Failed to reset tournament');
//     }
//   };

//   return (
//     <div>
//       <h2>Tournament Enrollment</h2>
//       {error && <div style={{color: 'red', marginBottom: '10px'}}>{error}</div>}

//       <div style={{marginBottom: '20px'}}>
//         <h3>Player Registration</h3>
//         <form onSubmit={handlePlayerSubmit}>
//           <input
//             type="text"
//             placeholder="Player Name"
//             value={newPlayer.name}
//             onChange={(e) => setNewPlayer({ name: e.target.value })}
//             required
//           />
//           <button type="submit">Register Player</button>
//         </form>

//         <h3>Registered Players</h3>
//         <div style={{marginBottom: '20px'}}>
//           {players.map(player => (
//             <div key={player.id}>
//               {player.name} {player.team_id && '(In Team)'}
//             </div>
//           ))}
//         </div>
//       </div>

//       <div>
//         <h3>Team Management</h3>
//         <div style={{
//           display: 'flex',
//           gap: '20px',
//           marginBottom: '20px'
//         }}>
//           <button 
//             onClick={generateRandomTeams}
//             disabled={players.filter(p => !p.team_id).length < 2}
//           >
//             Generate Random Teams
//           </button>
//           <button 
//             onClick={resetTournament}
//             style={{backgroundColor: '#ff4444'}}
//           >
//             Reset Tournament
//           </button>
//         </div>

//         <h3>Created Teams</h3>
//         {teams.map(team => (
//           <div key={team.id}>
//             {team.team_name} - Group {team.group_name}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default TournamentEnrollment;