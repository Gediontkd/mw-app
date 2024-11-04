// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// const TournamentSetup = () => {
//   const [tournament, setTournament] = useState({
//     name: '',
//     date: '',
//     organizer: '',
//     total_players: 20, // Fixed to 20 players
//     players_per_team: 2, // Fixed to 2 players per team
//     total_teams: 10, // Calculated based on above (20/2)
//     status: 'setup', // setup, active, completed
//   });

//   const [existingTournament, setExistingTournament] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [message, setMessage] = useState('');

//   useEffect(() => {
//     checkExistingTournament();
//   }, []);

//   const checkExistingTournament = async () => {
//     try {
//       const response = await axios.get('http://localhost:5000/tournament/current');
//       if (response.data) {
//         setExistingTournament(response.data);
//       }
//     } catch (error) {
//       console.error('Error checking tournament:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setTournament(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setMessage('');

//     try {
//       if (existingTournament) {
//         await axios.put(`http://localhost:5000/tournament/${existingTournament.id}`, tournament);
//         setMessage('Tournament updated successfully');
//       } else {
//         await axios.post('http://localhost:5000/tournament', tournament);
//         setMessage('Tournament created successfully');
//       }
//       checkExistingTournament();
//     } catch (error) {
//       setError('Failed to save tournament settings');
//     }
//   };

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
//       <h2>Tournament Setup</h2>
      
//       {error && <div style={{ color: 'red', margin: '10px 0', padding: '10px', backgroundColor: '#ffebee' }}>{error}</div>}
//       {message && <div style={{ color: 'green', margin: '10px 0', padding: '10px', backgroundColor: '#e8f5e9' }}>{message}</div>}

//       <div style={{ 
//         backgroundColor: '#f5f5f5', 
//         padding: '15px', 
//         borderRadius: '4px',
//         marginBottom: '20px'
//       }}>
//         <h3>Tournament Parameters</h3>
//         <ul style={{ listStyle: 'none', padding: 0 }}>
//           <li>• Total Players: 20 (fixed)</li>
//           <li>• Players per Team: 2 (fixed)</li>
//           <li>• Total Teams: 10 (fixed)</li>
//           <li>• Groups: 2 (A & B, 5 teams each)</li>
//         </ul>
//       </div>

//       <form onSubmit={handleSubmit}>
//         <div style={{ marginBottom: '15px' }}>
//           <label style={{ display: 'block', marginBottom: '5px' }}>
//             Tournament Name:
//           </label>
//           <input
//             type="text"
//             name="name"
//             value={tournament.name}
//             onChange={handleChange}
//             required
//             style={{ 
//               width: '100%',
//               padding: '8px',
//               borderRadius: '4px',
//               border: '1px solid #ddd'
//             }}
//           />
//         </div>

//         <div style={{ marginBottom: '15px' }}>
//           <label style={{ display: 'block', marginBottom: '5px' }}>
//             Tournament Date:
//           </label>
//           <input
//             type="date"
//             name="date"
//             value={tournament.date}
//             onChange={handleChange}
//             required
//             style={{ 
//               width: '100%',
//               padding: '8px',
//               borderRadius: '4px',
//               border: '1px solid #ddd'
//             }}
//           />
//         </div>

//         <div style={{ marginBottom: '15px' }}>
//           <label style={{ display: 'block', marginBottom: '5px' }}>
//             Organizer:
//           </label>
//           <input
//             type="text"
//             name="organizer"
//             value={tournament.organizer}
//             onChange={handleChange}
//             required
//             style={{ 
//               width: '100%',
//               padding: '8px',
//               borderRadius: '4px',
//               border: '1px solid #ddd'
//             }}
//           />
//         </div>

//         <div style={{ marginBottom: '15px' }}>
//           <label style={{ display: 'block', marginBottom: '5px' }}>
//             Status:
//           </label>
//           <select
//             name="status"
//             value={tournament.status}
//             onChange={handleChange}
//             required
//             style={{ 
//               width: '100%',
//               padding: '8px',
//               borderRadius: '4px',
//               border: '1px solid #ddd'
//             }}
//           >
//             <option value="setup">Setup</option>
//             <option value="active">Active</option>
//             <option value="completed">Completed</option>
//           </select>
//         </div>

//         <button
//           type="submit"
//           style={{
//             backgroundColor: '#4CAF50',
//             color: 'white',
//             padding: '10px 20px',
//             border: 'none',
//             borderRadius: '4px',
//             cursor: 'pointer',
//             width: '100%'
//           }}
//         >
//           {existingTournament ? 'Update Tournament' : 'Create Tournament'}
//         </button>
//       </form>

//       {existingTournament && (
//         <div style={{ 
//           marginTop: '20px', 
//           padding: '15px', 
//           backgroundColor: '#e3f2fd', 
//           borderRadius: '4px' 
//         }}>
//           <h3>Current Tournament Details</h3>
//           <p><strong>Name:</strong> {existingTournament.name}</p>
//           <p><strong>Date:</strong> {new Date(existingTournament.date).toLocaleDateString()}</p>
//           <p><strong>Organizer:</strong> {existingTournament.organizer}</p>
//           <p><strong>Status:</strong> {existingTournament.status}</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TournamentSetup;