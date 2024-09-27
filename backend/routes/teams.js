// backend/routes/teams.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Assuming you have a db.js file for database logic

// Fetch all teams
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM teams'); // Use your SQL query here
        res.json(rows);
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// Add a new team
router.post('/', async (req, res) => {
    const { team_name, player1_id, player2_id, group_name } = req.body;
    try {
        const [result] = await db.promise().query('INSERT INTO teams (team_name, player1_id, player2_id, group_name) VALUES (?, ?, ?, ?)', [team_name, player1_id, player2_id, group_name]);
        res.status(201).json({ id: result.insertId, team_name, player1_id, player2_id, group_name });
    } catch (error) {
        console.error('Error adding team:', error);
        res.status(500).json({ error: 'Failed to add team' });
    }
});

// Export the router
module.exports = router;
