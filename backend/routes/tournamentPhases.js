// backend/routes/tournamentPhases.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Assuming you have a db.js file for database logic

// Fetch all tournament phases
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM tournament_phases'); // Use your SQL query here
        res.json(rows);
    } catch (error) {
        console.error('Error fetching tournament phases:', error);
        res.status(500).json({ error: 'Failed to fetch tournament phases' });
    }
});

// Add a new tournament phase
router.post('/', async (req, res) => {
    const { phase_name, phase_status } = req.body;
    try {
        const [result] = await db.promise().query('INSERT INTO tournament_phases (phase_name, phase_status) VALUES (?, ?)', [phase_name, phase_status]);
        res.status(201).json({ id: result.insertId, phase_name, phase_status });
    } catch (error) {
        console.error('Error adding tournament phase:', error);
        res.status(500).json({ error: 'Failed to add tournament phase' });
    }
});

// Export the router
module.exports = router;
