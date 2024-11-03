// backend/index.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const playersRouter = require('./routes/players');
const teamsRouter = require('./routes/teams');
const matchesRouter = require('./routes/matches');
const tournamentPhasesRouter = require('./routes/tournamentPhases');
const tournamentRouter = require('./routes/tournament');

const app = express();
const port = 5000;

// Middleware to parse JSON bodies and enable CORS
app.use(express.json());
app.use(cors());

// MySQL connection setup
const db = mysql.createConnection({
  host: 'localhost',
  user: 'admin',
  password: 'admin',
  database: 'tournament_db',
  port: 3306
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL database as id', db.threadId);
});

// // Log the imported routers to verify they are correct
// console.log('Players Router:', playersRouter);
// console.log('Teams Router:', teamsRouter);
// console.log('Matches Router:', matchesRouter);
// console.log('Tournament Phases Router:', tournamentPhasesRouter);

// Use routes for different entities
app.use('/players', playersRouter);
app.use('/teams', teamsRouter);
app.use('/matches', matchesRouter);
app.use('/phases', tournamentPhasesRouter);
app.use('/tournament', tournamentRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
