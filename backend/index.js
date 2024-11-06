// backend/index.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config()
const playersRouter = require('./routes/players');
const teamsRouter = require('./routes/teams');
const matchesRouter = require('./routes/matches');
const tournamentPhasesRouter = require('./routes/tournamentPhases');
const tournamentRouter = require('./routes/tournament');

const app = express();
const port = process.env.PORT || 5000;

// Middleware to parse JSON bodies and enable CORS
app.use(express.json());
app.use(cors());

// Use routes for different entities
app.use('/players', playersRouter);
app.use('/teams', teamsRouter);
app.use('/matches', matchesRouter);
app.use('/phases', tournamentPhasesRouter);
app.use('/tournament', tournamentRouter);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  
});