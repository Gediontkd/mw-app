// backend/routes/players.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Ensure this points correctly to your db.js

// Fetch all players
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM players'); // Ensure to use promise() if using a pool
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
        const [result] = await db.promise().query('INSERT INTO players (name, team_id, kills) VALUES (?, ?, ?)', [name, team_id, kills]);
        res.status(201).json({ id: result.insertId, name, team_id, kills });
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
        await db.promise().query('UPDATE players SET name = ?, team_id = ?, kills = ? WHERE id = ?', [name, team_id, kills, id]);
        res.json({ id, name, team_id, kills });
    } catch (error) {
        console.error('Error updating player:', error);
        res.status(500).json({ error: 'Failed to update player' });
    }
});

// Delete a player
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.promise().query('DELETE FROM players WHERE id = ?', [id]);
        res.status(204).end(); // No content response
    } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({ error: 'Failed to delete player' });
    }
});

module.exports = router; // Export the router

