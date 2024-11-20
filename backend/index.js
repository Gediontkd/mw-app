// backend/index.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
require('dotenv').config()
const playersRouter = require('./routes/players');
const teamsRouter = require('./routes/teams');
const matchesRouter = require('./routes/matches');
const tournamentPhasesRouter = require('./routes/tournamentPhases');
const tournamentRouter = require('./routes/tournament');

const app = express();
const port = process.env.PORT || 5000;
const httpsPort = process.env.HTTPS_PORT || 443;

// SSL certificate configuration
const sslOptions = {
    key: fs.readFileSync('/etc/letsencrypt/live/egxtestingbackend.it/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/egxtestingbackend.it/fullchain.pem')
  };

// Middleware to parse JSON bodies and enable CORS
app.use(express.json());
app.use(cors({
  origin: ['https://www.egxtesting.it', 'https://www.egamex.eu'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
  }));

// Use routes for different entities
app.use('/players', playersRouter);
app.use('/teams', teamsRouter);
app.use('/matches', matchesRouter);
app.use('/phases', tournamentPhasesRouter);
app.use('/tournament', tournamentRouter);

// Create HTTPS server
const httpsServer = https.createServer(sslOptions, app);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  
});

httpsServer.listen(httpsPort, () => {
    console.log(`HTTPS Server is running on port ${httpsPort}`);
});