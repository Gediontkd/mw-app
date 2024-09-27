// backend/routes/matches.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Assuming you have a db.js file for database logic

// Fetch all matches
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM matches'); // Use your SQL query here
        res.json(rows);
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// Add a new match
router.post('/', async (req, res) => {
    const { team1_id, team2_id, team1_kills, team2_kills, games_played, winner_team_id, match_status } = req.body;
    
    // Log the request body for debugging
    console.log('Request Body:', req.body);
    
    try {
        const [result] = await db.promise().query('INSERT INTO matches (team1_id, team2_id, team1_kills, team2_kills, games_played, winner_team_id, match_status) VALUES (?, ?, ?, ?, ?, ?, ?)', [team1_id, team2_id, team1_kills, team2_kills, games_played, winner_team_id, match_status]);
        res.status(201).json({ id: result.insertId, team1_id, team2_id, team1_kills, team2_kills, games_played, winner_team_id, match_status });
    } catch (error) {
        console.error('Error adding match:', error);
        res.status(500).json({ error: 'Failed to add match' });
    }
});

// Export the router
module.exports = router;
