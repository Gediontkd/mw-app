// src/App.js
import React from 'react';
import PlayerManagement from './PlayerManagement';
import TeamManagement from './TeamManagement';
import MatchManagement from './MatchManagement';
import TournamentPhases from './TournamentPhases';

const App = () => {
  return (
    <div>
      <h1>Tournament Management System</h1>
      <PlayerManagement />
      <TeamManagement />
      <MatchManagement />
      <TournamentPhases />
    </div>
  );
};

export default App;
