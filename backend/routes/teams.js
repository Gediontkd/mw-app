// backend/routes/teams.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Fetch all teams
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM teams');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// Add a new team
router.post('/', async (req, res) => {
    const { team_name, group_name } = req.body;
    try {
        const [result] = await db.promise().query(
            'INSERT INTO teams (team_name, group_name, player1_id, player2_id) VALUES (?, ?, NULL, NULL)',
            [team_name, group_name]
        );
        res.status(201).json({ 
            id: result.insertId, 
            team_name, 
            group_name,
            player1_id: null,
            player2_id: null
        });
    } catch (error) {
        console.error('Error adding team:', error);
        res.status(500).json({ error: 'Failed to add team' });
    }
});

// Update a team
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { team_name, group_name } = req.body;
    try {
        const [result] = await db.promise().query(
            'UPDATE teams SET team_name = ?, group_name = ? WHERE id = ?',
            [team_name, group_name, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }
        
        res.json({ 
            id: parseInt(id), 
            team_name, 
            group_name
        });
    } catch (error) {
        console.error('Error updating team:', error);
        res.status(500).json({ error: 'Failed to update team' });
    }
});

// Delete a team
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.promise().query('UPDATE players SET team_id = NULL WHERE team_id = ?', [id]);
        const [result] = await db.promise().query('DELETE FROM teams WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            console.log('Delete failed: Team not found');
            return res.status(404).json({ error: 'Team not found' });
        }

        res.json({ message: 'Team deleted successfully' });
    } catch (error) {
        console.error('Error deleting team:', error.message);
        res.status(500).json({ error: 'Failed to delete team' });
    }
});


module.exports = router;