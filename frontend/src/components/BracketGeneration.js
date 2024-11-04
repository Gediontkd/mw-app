// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './BracketGeneration.css';

// const styles = {
//     adSpace: {
//       width: '100%',
//       height: '120px',
//       backgroundColor: '#f0f0f0',
//       marginBottom: '30px',
//       display: 'flex',
//       justifyContent: 'center',
//       alignItems: 'center',
//       borderRadius: '8px',
//       border: '2px dashed #ccc',
//     }
//   };

// const BracketGeneration = () => {
//   const [qualifiedTeams, setQualifiedTeams] = useState({ A: [], B: [] });
//   const [semifinals, setSemifinals] = useState([]);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchQualifiedTeams();
//   }, []);

//   const fetchQualifiedTeams = async () => {
//     try {
//       const response = await axios.get('http://localhost:5000/matches/qualified-teams');
      
//       const groupA = response.data.filter(team => team.group_name === 'A');
//       const groupB = response.data.filter(team => team.group_name === 'B');

//       if (groupA.length < 2 || groupB.length < 2) {
//         setError(`Need 2 qualified teams from each group`);
//         setLoading(false);
//         return;
//       }

//       const sortTeams = (teams) => {
//         return teams.sort((a, b) => {
//           if (a.total_kills === b.total_kills) {
//             return a.matches_played - b.matches_played;
//           }
//           return b.total_kills - a.total_kills;
//         });
//       };

//       setQualifiedTeams({
//         A: sortTeams(groupA).slice(0, 2),
//         B: sortTeams(groupB).slice(0, 2)
//       });
//       setLoading(false);
//     } catch (error) {
//       setError('Failed to fetch qualified teams');
//       setLoading(false);
//     }
//   };

//   const generateBracket = async () => {
//     try {
//       if (qualifiedTeams.A.length !== 2 || qualifiedTeams.B.length !== 2) {
//         setError('Need exactly 2 qualified teams from each group');
//         return;
//       }

//       const semifinalMatches = [
//         {
//           team1: qualifiedTeams.A[0],
//           team2: qualifiedTeams.B[1],
//           matchName: 'Semifinal 1'
//         },
//         {
//           team1: qualifiedTeams.B[0],
//           team2: qualifiedTeams.A[1],
//           matchName: 'Semifinal 2'
//         }
//       ];

//       await axios.post('http://localhost:5000/matches/generate-semifinals', {
//         matches: semifinalMatches.map(match => ({
//           team1_id: match.team1.id,
//           team2_id: match.team2.id
//         }))
//       });

//       setSemifinals(semifinalMatches);
//       setError('');
//     } catch (error) {
//       setError('Failed to generate bracket');
//     }
//   };

//   if (loading) {
//     return <div className="loading">Loading qualified teams...</div>;
//   }

//   return (
//     <div className="bracket-container">
//         {/* Ad Space */}
//       <div style={styles.adSpace}>
//         <span>Advertisement Space</span>
//       </div>
//       <h2 className="bracket-title">Semifinals Bracket Generation</h2>
      
//       {error && <div className="error-message">{error}</div>}

//       <div className="qualified-teams">
//         <div className="group">
//           <h3>Group A Qualified Teams ({qualifiedTeams.A.length}/2)</h3>
//           {qualifiedTeams.A.map((team) => (
//             <div key={team.id} className="team-card">
//               <span className="team-name">{team.team_name}</span>
//               <span className="team-stats">
//                 Kills: {team.total_kills} | Matches: {team.matches_played}
//               </span>
//             </div>
//           ))}
//         </div>

//         <div className="group">
//           <h3>Group B Qualified Teams ({qualifiedTeams.B.length}/2)</h3>
//           {qualifiedTeams.B.map((team) => (
//             <div key={team.id} className="team-card">
//               <span className="team-name">{team.team_name}</span>
//               <span className="team-stats">
//                 Kills: {team.total_kills} | Matches: {team.matches_played}
//               </span>
//             </div>
//           ))}
//         </div>
//       </div>

//       <button 
//         onClick={generateBracket}
//         className="generate-button"
//         disabled={qualifiedTeams.A.length !== 2 || qualifiedTeams.B.length !== 2}
//       >
//         Generate Semifinals Bracket
//       </button>

//       {semifinals.length > 0 && (
//         <div className="semifinals-bracket">
//           <h3>Generated Semifinals</h3>
//           {semifinals.map((match, index) => (
//             <div key={index} className="match-card">
//               <div className="match-header">{match.matchName}</div>
//               <div className="team-matchup">
//                 <div className="team">
//                   {match.team1.team_name} (Group {match.team1.group_name})
//                 </div>
//                 <div className="vs">VS</div>
//                 <div className="team">
//                   {match.team2.team_name} (Group {match.team2.group_name})
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default BracketGeneration;