const express = require('express');
const router = express.Router();
const db = require('../db');

// Get current phase
router.get('/current', async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            'SELECT * FROM tournament_phases ORDER BY started_at DESC LIMIT 1'
        );
        res.json(rows[0] || null);
    } catch (error) {
        console.error('Error fetching current phase:', error);
        res.status(500).json({ error: 'Failed to fetch current phase' });
    }
});

// Create new phase
router.post('/', async (req, res) => {
    const { phase_name, phase_status } = req.body;
    try {
        // Mark previous phase as completed
        await db.promise().query(
            'UPDATE tournament_phases SET phase_status = "completed", ended_at = CURRENT_TIMESTAMP WHERE phase_status = "active"'
        );

        // Create new phase
        const [result] = await db.promise().query(
            'INSERT INTO tournament_phases (phase_name, phase_status) VALUES (?, ?)',
            [phase_name, phase_status]
        );
        res.status(201).json({ id: result.insertId, phase_name, phase_status });
    } catch (error) {
        console.error('Error creating phase:', error);
        res.status(500).json({ error: 'Failed to create phase' });
    }
});

module.exports = router;