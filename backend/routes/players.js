// backend/routes/players.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Fetch all players
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM players');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ error: 'Failed to fetch players' });
    }
});

// Add a new player
router.post('/', async (req, res) => {
    const { name, team_id, kills } = req.body;
    try {
        const [result] = await db.promise().query(
            'INSERT INTO players (name, team_id, kills) VALUES (?, ?, ?)', 
            [name, team_id || null, kills]
        );
        res.status(201).json({ 
            id: result.insertId, 
            name, 
            team_id: team_id || null, 
            kills 
        });
    } catch (error) {
        console.error('Error adding player:', error);
        res.status(500).json({ error: 'Failed to add player' });
    }
});

// Update a player
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, team_id, kills } = req.body;
    try {
        const [result] = await db.promise().query(
            'UPDATE players SET name = ?, team_id = ?, kills = ? WHERE id = ?',
            [name, team_id || null, kills, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }

        res.json({ 
            id: parseInt(id), 
            name, 
            team_id: team_id || null, 
            kills 
        });
    } catch (error) {
        console.error('Error updating player:', error);
        res.status(500).json({ error: 'Failed to update player' });
    }
});

// Delete a player
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.promise().query(
            'DELETE FROM players WHERE id = ?', 
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }

        res.status(200).json({ message: 'Player deleted successfully' });
    } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({ error: 'Failed to delete player' });
    }
});

module.exports = router;