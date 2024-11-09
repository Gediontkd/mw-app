// backend/routes/players.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Helper function for database queries
const executeQuery = async (query, params = []) => {
    try {
        const [results] = await pool.query(query, params);
        return results;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

// Fetch all players with team information
router.get('/', async (req, res) => {
    try {
        const players = await executeQuery(`
            SELECT p.*, t.team_name 
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.id
            ORDER BY p.kills DESC
        `);
        res.json(players);
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ 
            error: 'Failed to fetch players',
            details: error.message 
        });
    }
});

// Get player by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [player] = await executeQuery(`
            SELECT p.*, t.team_name 
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE p.id = ?
        `, [id]);

        if (!player) {
            return res.status(404).json({ 
                error: 'Player not found',
                details: `No player found with ID ${id}`
            });
        }

        res.json(player);
    } catch (error) {
        console.error('Error fetching player:', error);
        res.status(500).json({ 
            error: 'Failed to fetch player',
            details: error.message 
        });
    }
});

// Add a new player
router.post('/', async (req, res) => {
    const { name, team_id, kills } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Validate input
        if (!name || name.trim().length === 0) {
            throw new Error('Player name is required');
        }

        // Check if team exists if team_id is provided
        if (team_id) {
            const [team] = await connection.query(
                'SELECT id FROM teams WHERE id = ?',
                [team_id]
            );
            if (!team.length) {
                throw new Error(`Team with ID ${team_id} does not exist`);
            }
        }

        // Insert player
        const [result] = await connection.query(
            `INSERT INTO players (name, team_id, kills, qualifier_kills, finals_kills, matches_played) 
             VALUES (?, ?, ?, 0, 0, 0)`, 
            [name, team_id || null, kills || 0]
        );

        await connection.commit();

        const [newPlayer] = await connection.query(`
            SELECT p.*, t.team_name 
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE p.id = ?
        `, [result.insertId]);

        res.status(201).json(newPlayer[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error adding player:', error);
        res.status(500).json({ 
            error: 'Failed to add player',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Update a player
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, team_id, kills } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Validate input
        if (!name || name.trim().length === 0) {
            throw new Error('Player name is required');
        }

        // Check if player exists
        const [existingPlayer] = await connection.query(
            'SELECT id FROM players WHERE id = ?',
            [id]
        );

        if (!existingPlayer.length) {
            throw new Error(`Player with ID ${id} does not exist`);
        }

        // Check if team exists if team_id is provided
        if (team_id) {
            const [team] = await connection.query(
                'SELECT id FROM teams WHERE id = ?',
                [team_id]
            );
            if (!team.length) {
                throw new Error(`Team with ID ${team_id} does not exist`);
            }
        }

        // Update player
        await connection.query(
            `UPDATE players 
             SET name = ?, 
                 team_id = ?, 
                 kills = ?
             WHERE id = ?`,
            [name, team_id || null, kills || 0, id]
        );

        await connection.commit();

        // Fetch updated player with team information
        const [updatedPlayer] = await connection.query(`
            SELECT p.*, t.team_name 
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE p.id = ?
        `, [id]);

        res.json(updatedPlayer[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error updating player:', error);
        res.status(500).json({ 
            error: 'Failed to update player',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Delete a player
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check if player exists
        const [player] = await connection.query(
            'SELECT id FROM players WHERE id = ?',
            [id]
        );

        if (!player.length) {
            throw new Error(`Player with ID ${id} does not exist`);
        }

        // Delete player
        await connection.query('DELETE FROM players WHERE id = ?', [id]);

        await connection.commit();
        res.json({ 
            message: 'Player deleted successfully',
            deletedId: parseInt(id)
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting player:', error);
        res.status(500).json({ 
            error: 'Failed to delete player',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Get player statistics
router.get('/:id/stats', async (req, res) => {
    const { id } = req.params;
    try {
        const [player] = await executeQuery(`
            SELECT 
                p.*,
                t.team_name,
                COALESCE(p.qualifier_kills, 0) as qualifier_kills,
                COALESCE(p.finals_kills, 0) as finals_kills,
                COALESCE(p.matches_played, 0) as matches_played,
                ROUND(COALESCE(p.kills, 0) / NULLIF(p.matches_played, 0), 2) as avg_kills_per_match
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE p.id = ?
        `, [id]);

        if (!player) {
            return res.status(404).json({ 
                error: 'Player not found',
                details: `No player found with ID ${id}`
            });
        }

        res.json(player);
    } catch (error) {
        console.error('Error fetching player stats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch player statistics',
            details: error.message 
        });
    }
});

// Error handling middleware
router.use((err, req, res, next) => {
    console.error('Route error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: err.message
    });
});

module.exports = router;