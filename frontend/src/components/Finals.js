// // src/components/Finals.js
// const Finals = ({ onFinalsComplete }) => {
//     const [match, setMatch] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
  
//     useEffect(() => {
//       fetchFinals();
//     }, []);
  
//     const fetchFinals = async () => {
//       try {
//         const response = await axios.get('http://localhost:5000/matches/finals');
//         setMatch(response.data);
//         setLoading(false);
//       } catch (error) {
//         setError('Failed to fetch finals match');
//         setLoading(false);
//       }
//     };
  
//     const handleMatchResult = async (gameNumber, result) => {
//       try {
//         await axios.post(`http://localhost:5000/matches/final-result`, {
//           match_id: match.id,
//           game_number: gameNumber,
//           ...result
//         });
//         fetchFinals();
  
//         // Check if finals are complete
//         const updatedResponse = await axios.get('http://localhost:5000/matches/finals');
//         const finalMatch = updatedResponse.data;
//         if ((finalMatch.wins_team1 === 3 || finalMatch.wins_team2 === 3) && onFinalsComplete) {
//           onFinalsComplete();
//         }
//       } catch (error) {
//         setError('Failed to update match result');
//       }
//     };
  
//     if (loading) return <div>Loading finals...</div>;
//     if (!match) return <div>Finals not yet started</div>;
  
//     return (
//       <div className="finals-container">
//         <h2>Finals - Best of 5</h2>
//         {error && <div className="error-message">{error}</div>}
        
//         <div className="match-card finals">
//           <div className="match-header">Final Match</div>
//           <div className="teams-container">
//             <div className="team-row">
//               <span>{match.team1_name}</span>
//               <span className="wins">{match.wins_team1} wins</span>
//             </div>
//             <div className="vs-label">VS</div>
//             <div className="team-row">
//               <span>{match.team2_name}</span>
//               <span className="wins">{match.wins_team2} wins</span>
//             </div>
//           </div>
          
//           {/* Game Results Input */}
//           {[1, 2, 3, 4, 5].map(gameNumber => {
//             const isGameEnabled = gameNumber === 1 || 
//               (gameNumber > 1 && match[`game${gameNumber-1}_completed`] && 
//                match.wins_team1 < 3 && match.wins_team2 < 3);
  
//             return (
//               <div key={gameNumber} className="game-input">
//                 <h4>Game {gameNumber}</h4>
//                 {isGameEnabled && !match[`game${gameNumber}_completed`] && (
//                   <div className="score-input">
//                     <input
//                       type="number"
//                       placeholder="Team 1 Kills"
//                       min="0"
//                       onChange={(e) => setMatch(prev => ({
//                         ...prev,
//                         [`game${gameNumber}_team1_kills`]: e.target.value
//                       }))}
//                     />
//                     <input
//                       type="number"
//                       placeholder="Team 2 Kills"
//                       min="0"
//                       onChange={(e) => setMatch(prev => ({
//                         ...prev,
//                         [`game${gameNumber}_team2_kills`]: e.target.value
//                       }))}
//                     />
//                     <button
//                       onClick={() => handleMatchResult(gameNumber, {
//                         team1_kills: match[`game${gameNumber}_team1_kills`],
//                         team2_kills: match[`game${gameNumber}_team2_kills`]
//                       })}
//                     >
//                       Submit Result
//                     </button>
//                   </div>
//                 )}
//                 {match[`game${gameNumber}_completed`] && (
//                   <div className="game-result">
//                     {match[`game${gameNumber}_team1_kills`]} - {match[`game${gameNumber}_team2_kills`]}
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     );
//   };