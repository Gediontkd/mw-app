import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import AdminDashboard from './pages/admin/AdminDashboard';
import TournamentDashboard from './pages/user/TournamentDashboard';
import LiveRankings from './components/LiveRankings';
import BracketGeneration from './components/BracketGeneration';

// Import your existing components
import TeamManagement from './components/TeamManagement';
import PlayerManagement from './components/PlayerManagement';
import MatchManagement from './components/MatchManagement';
import TeamGenerator from './components/TeamGenerator';
import TournamentPhases from './components/TournamentPhases';
import './App.css';

const Navigation = () => {
  const location = useLocation();
  const isAdmin = location.pathname.includes('/admin');

  return (
    <nav className="main-nav">
      <div className="nav-content">
        <div className="nav-group">
          {isAdmin ? (
            <Link to="/admin" className="nav-brand">Admin Dashboard</Link>
          ) : (
            <Link to="/" className="nav-brand">Tournament Dashboard</Link>
          )}
        </div>

        <div className="nav-group">
          {!isAdmin && (
            <>
              <Link 
                to="/" 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                Overview
              </Link>
              <Link 
                to="/rankings" 
                className={`nav-link ${location.pathname === '/rankings' ? 'active' : ''}`}
              >
                Live Rankings
              </Link>
              <Link
                to="/bracket-generation"
                className={`nav-link ${location.pathname === '/bracket-generation' ? 'active' : ''}`}
              >
                Finals
              </Link>
            </>
          )}
        </div>

        <div className="nav-group">
          {isAdmin ? (
            <Link to="/" className="nav-link switch-view">Switch to User View</Link>
          ) : (
            <Link to="/admin" className="nav-link switch-view">Admin View</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        
        <div className="main-content">
          <Routes>
            {/* User Routes */}
            <Route path="/" element={<TournamentDashboard />} />
            <Route path="/rankings" element={<LiveRankings />} />
            <Route path="/bracket-generation" element={<BracketGeneration />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/teams" element={<TeamManagement />} />
            <Route path="/admin/players" element={<PlayerManagement />} />
            <Route path="/admin/matches" element={<MatchManagement />} />
            <Route path="/admin/generate-teams" element={<TeamGenerator />} />
            <Route path="/admin/tournament-phases" element={<TournamentPhases />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;