// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import config from './config';
import LogoImage from './assets/images/no_background_logo_titled2.png'
import Footer from './components/Footer';

// Import components
import AdminDashboard from './pages/admin/AdminDashboard';
import TournamentDashboard from './pages/user/TournamentDashboard';
import LiveRankings from './components/LiveRankings';
import BracketGeneration from './components/BracketGeneration';
import TeamManagement from './components/TeamManagement';
import PlayerManagement from './components/PlayerManagement';
import MatchManagement from './components/MatchManagement';
import TeamGenerator from './components/TeamGenerator';
import TournamentPhases from './components/TournamentPhases';
import AdminSemifinals from './pages/admin/AdminSemifinals';
import AdminFinals from './pages/admin/AdminFinal';
import './App.css';

// Navigation Component
const Navigation = ({ tournamentState }) => {
  const location = useLocation();
  const isAdmin = location.pathname.includes('/admin');
  const { currentPhase, qualifiedTeams } = tournamentState;

  const showBracket = currentPhase === 'semifinals' || currentPhase === 'finals' || 
    (qualifiedTeams.A >= 2 && qualifiedTeams.B >= 2);

  return (
    <nav className="main-nav">
      <div className="nav-content">
        <div className="nav-group">
          {isAdmin ? (
            <Link to="/admin" className="nav-brand">Admin Dashboard</Link>
          ) : (
            <Link to="/" className="nav-brand">
              <img 
                src={LogoImage}
                alt="Tournament Dashboard"
                className="nav-logo"
              />
            </Link>
          )}
        </div>

        <div className="nav-group">
          {!isAdmin && (
            <>
              <Link 
                to="/" 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                Tournaments
              </Link>
              {/* <Link 
                to="/rankings" 
                className={`nav-link ${location.pathname === '/rankings' ? 'active' : ''}`}
              >
                Live Rankings
              </Link> */}
              {/* <Link 
                to="/bracket" 
                className={`nav-link ${location.pathname === '/bracket' ? 'active' : ''}`}
              >
                Phase 2
              </Link> */}
              {/* {showBracket && (
                <Link 
                  to="/bracket" 
                  className={`nav-link ${location.pathname === '/bracket' ? 'active' : ''}`}
                >
                  {currentPhase === 'finals' ? 'Finals' : 'Semifinals'} 
                  {currentPhase === 'qualifiers' && ` (${qualifiedTeams.A}/2 - ${qualifiedTeams.B}/2)`}
                </Link>
              )} */}
            </>
          )}
        </div>

        <div className="nav-group">
          {isAdmin ? (
            <Link to="/" className="nav-link switch-view">Switch to User View</Link>
          ) : (
            <Link to="/admin" className="nav-link switch-view">Admin</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

// Admin Routes Component
const AdminRoutes = () => (
  <Routes>
    <Route path="/" element={<AdminDashboard />} />
    <Route path="/teams" element={<TeamManagement />} />
    <Route path="/players" element={<PlayerManagement />} />
    <Route path="/matches" element={<MatchManagement />} />
    <Route path="/generate-teams" element={<TeamGenerator />} />
    <Route path="/tournament-phases" element={<TournamentPhases />} />
    
  </Routes>
);

// Main App Component
function App() {
  const [tournamentState, setTournamentState] = useState({
    currentPhase: null,
    qualifiedTeams: { A: 0, B: 0 },
    loading: true
  });

  useEffect(() => {
    fetchTournamentState();
    const interval = setInterval(fetchTournamentState, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTournamentState = async () => {
    try {
      const [phaseRes, teamsRes] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/tournament/phase/current`),
        axios.get(`${config.API_BASE_URL}/matches/qualified-teams`)
      ]);

      const teams = teamsRes.data;
      setTournamentState({
        currentPhase: phaseRes.data.phase_name || 'qualifiers',
        qualifiedTeams: {
          A: teams.filter(t => t.group_name === 'A' && t.is_qualified).length,
          B: teams.filter(t => t.group_name === 'B' && t.is_qualified).length
        },
        loading: false
      });
    } catch (error) {
      console.error('Failed to fetch tournament state:', error);
      setTournamentState(prev => ({
        ...prev,
        loading: false
      }));
    }
  };

  if (tournamentState.loading) {
    return <div className="loading-screen">Loading tournament...</div>;
  }

  return (
    <Router>
      <div className="app">
        <Navigation tournamentState={tournamentState} />
        
        <div className="main-content">
          <Routes>
            {/* User Routes */}
            <Route path="/" element={<TournamentDashboard />} />
            <Route path="/rankings" element={<LiveRankings />} />
            <Route 
              path="/bracket" 
              element={
                <BracketGeneration 
                  currentPhase={tournamentState.currentPhase}
                  onPhaseChange={fetchTournamentState}
                />
              } 
            />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/teams" element={<TeamManagement />} />
            <Route path="/admin/players" element={<PlayerManagement />} />
            <Route path="/admin/matches" element={<MatchManagement />} />
            <Route path="/admin/generate-teams" element={<TeamGenerator />} />
            <Route path="/admin/tournament-phases" element={<TournamentPhases />} />
            <Route path="/admin/semifinals" element={<AdminSemifinals />} />
            <Route path="/admin/finals" element={<AdminFinals />} />
          </Routes>
          <Footer />
        </div>
      </div>
    </Router>
  );
}

export default App;