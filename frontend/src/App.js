// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import config from './config';
import LogoImage from './assets/images/no_background_logo_titled2.png'
import Footer from './components/Footer';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './components/Login';

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
  const { isAuthenticated, logout } = useAuth();
  const isAdmin = location.pathname.includes('/admin');
  const { currentPhase, qualifiedTeams } = tournamentState;

  return (
    <nav className="main-nav">
      <div className="nav-content">
        <div className="nav-group">
          {isAdmin ? (
            <Link to="/admin" className="nav-brand">Admin Dashboard</Link>
          ) : (
            <Link to="/" className="nav-brand">
              <img src={LogoImage} alt="Tournament Dashboard" className="nav-logo" />
            </Link>
          )}
        </div>

        <div className="nav-group">
          {/* {!isAdmin && (
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              Tournaments
            </Link>
          )} */}
        </div>

        <div className="nav-group">
          {isAuthenticated && isAdmin ? (
            // Only show these buttons on admin pages when authenticated
            <>
              <button onClick={logout} className="nav-link logout-btn">Logout</button>
              <Link to="/" className="nav-link user-view-btn">User View</Link>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

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
      <AuthProvider>
        <div className="app">
          <Navigation tournamentState={tournamentState} />
          
          <div className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<TournamentDashboard />} />
              <Route path="/rankings" element={<LiveRankings />} />
              <Route path="/bracket" element={
                <BracketGeneration 
                  currentPhase={tournamentState.currentPhase}
                  onPhaseChange={fetchTournamentState}
                />
              } />
              
              {/* Admin Login Route */}
              <Route path="/admin/login" element={<Login />} />

              {/* Protected Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/teams" element={
                <ProtectedRoute>
                  <TeamManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/players" element={
                <ProtectedRoute>
                  <PlayerManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/matches" element={
                <ProtectedRoute>
                  <MatchManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/generate-teams" element={
                <ProtectedRoute>
                  <TeamGenerator />
                </ProtectedRoute>
              } />
              <Route path="/admin/tournament-phases" element={
                <ProtectedRoute>
                  <TournamentPhases />
                </ProtectedRoute>
              } />
              <Route path="/admin/semifinals" element={
                <ProtectedRoute>
                  <AdminSemifinals />
                </ProtectedRoute>
              } />
              <Route path="/admin/finals" element={
                <ProtectedRoute>
                  <AdminFinals />
                </ProtectedRoute>
              } />
            </Routes>
            <Footer />
          </div>
        </div>
      </AuthProvider>
  );
}

export default App;