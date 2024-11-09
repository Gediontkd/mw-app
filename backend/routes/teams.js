// backend/routes/teams.js
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

// Fetch all teams with players and stats
router.get('/', async (req, res) => {
    try {
        const teams = await executeQuery(`
            SELECT t.*,
                   GROUP_CONCAT(DISTINCT p.name) as player_names,
                   COUNT(DISTINCT p.id) as player_count,
                   SUM(p.kills) as total_player_kills
            FROM teams t
            LEFT JOIN players p ON p.team_id = t.id
            GROUP BY t.id
            ORDER BY t.group_name, t.total_kills DESC
        `);

        // Get detailed player information for each team
        const teamsWithDetails = await Promise.all(teams.map(async (team) => {
            const players = await executeQuery(`
                SELECT id, name, kills, qualifier_kills, finals_kills, matches_played
                FROM players
                WHERE team_id = ?
            `, [team.id]);

            return {
                ...team,
                players
            };
        }));

        res.json(teamsWithDetails);
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ 
            error: 'Failed to fetch teams',
            details: error.message 
        });
    }
});

// Get team by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [team] = await executeQuery(`
            SELECT t.*,
                   GROUP_CONCAT(DISTINCT p.name) as player_names,
                   COUNT(DISTINCT p.id) as player_count,
                   SUM(p.kills) as total_player_kills
            FROM teams t
            LEFT JOIN players p ON p.team_id = t.id
            WHERE t.id = ?
            GROUP BY t.id
        `, [id]);

        if (!team) {
            return res.status(404).json({ 
                error: 'Team not found',
                details: `No team found with ID ${id}`
            });
        }

        // Get detailed player information
        const players = await executeQuery(`
            SELECT id, name, kills, qualifier_kills, finals_kills, matches_played
            FROM players
            WHERE team_id = ?
        `, [id]);

        res.json({
            ...team,
            players
        });
    } catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({ 
            error: 'Failed to fetch team',
            details: error.message 
        });
    }
});

// Add a new team
router.post('/', async (req, res) => {
    const { team_name, group_name } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Validate input
        if (!team_name || team_name.trim().length === 0) {
            throw new Error('Team name is required');
        }
        if (!group_name || !['A', 'B'].includes(group_name)) {
            throw new Error('Valid group name (A or B) is required');
        }

        // Check if team name already exists
        const [existingTeam] = await connection.query(
            'SELECT id FROM teams WHERE team_name = ?',
            [team_name]
        );

        if (existingTeam.length > 0) {
            throw new Error('Team name already exists');
        }

        // Insert team
        const [result] = await connection.query(
            `INSERT INTO teams 
            (team_name, group_name, total_kills, matches_played, is_qualified) 
            VALUES (?, ?, 0, 0, FALSE)`,
            [team_name, group_name]
        );

        await connection.commit();

        const [newTeam] = await connection.query(
            'SELECT * FROM teams WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(newTeam[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error adding team:', error);
        res.status(500).json({ 
            error: 'Failed to add team',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Update a team
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { team_name, group_name } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Validate input
        if (!team_name || team_name.trim().length === 0) {
            throw new Error('Team name is required');
        }
        if (!group_name || !['A', 'B'].includes(group_name)) {
            throw new Error('Valid group name (A or B) is required');
        }

        // Check if team exists
        const [existingTeam] = await connection.query(
            'SELECT id FROM teams WHERE id = ?',
            [id]
        );

        if (!existingTeam.length) {
            throw new Error(`Team with ID ${id} does not exist`);
        }

        // Check if new team name already exists (excluding current team)
        const [duplicateTeam] = await connection.query(
            'SELECT id FROM teams WHERE team_name = ? AND id != ?',
            [team_name, id]
        );

        if (duplicateTeam.length > 0) {
            throw new Error('Team name already exists');
        }

        // Update team
        await connection.query(
            'UPDATE teams SET team_name = ?, group_name = ? WHERE id = ?',
            [team_name, group_name, id]
        );

        await connection.commit();

        // Fetch updated team with players
        const [updatedTeam] = await connection.query(`
            SELECT t.*,
                   GROUP_CONCAT(p.name) as player_names
            FROM teams t
            LEFT JOIN players p ON p.team_id = t.id
            WHERE t.id = ?
            GROUP BY t.id
        `, [id]);

        res.json(updatedTeam[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error updating team:', error);
        res.status(500).json({ 
            error: 'Failed to update team',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Delete a team
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check if team exists
        const [team] = await connection.query(
            'SELECT id FROM teams WHERE id = ?',
            [id]
        );

        if (!team.length) {
            throw new Error(`Team with ID ${id} does not exist`);
        }

        // Update players to remove team association
        await connection.query(
            'UPDATE players SET team_id = NULL WHERE team_id = ?',
            [id]
        );

        // Delete team
        await connection.query('DELETE FROM teams WHERE id = ?', [id]);

        await connection.commit();
        res.json({ 
            message: 'Team deleted successfully',
            deletedId: parseInt(id) 
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting team:', error);
        res.status(500).json({ 
            error: 'Failed to delete team',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Get team statistics
router.get('/:id/stats', async (req, res) => {
    const { id } = req.params;
    try {
        const [team] = await executeQuery(`
            SELECT 
                t.*,
                COUNT(DISTINCT p.id) as player_count,
                SUM(p.qualifier_kills) as total_qualifier_kills,
                SUM(p.finals_kills) as total_finals_kills,
                GROUP_CONCAT(p.name) as player_names
            FROM teams t
            LEFT JOIN players p ON p.team_id = t.id
            WHERE t.id = ?
            GROUP BY t.id
        `, [id]);

        if (!team) {
            return res.status(404).json({ 
                error: 'Team not found',
                details: `No team found with ID ${id}`
            });
        }

        // Get match history
        const matches = await executeQuery(`
            SELECT 
                m.*,
                t1.team_name as opponent_name,
                CASE 
                    WHEN m.team1_id = ? THEN m.team1_kills
                    ELSE m.team2_kills
                END as team_kills,
                CASE 
                    WHEN m.team1_id = ? THEN m.team2_kills
                    ELSE m.team1_kills
                END as opponent_kills
            FROM matches m
            JOIN teams t1 ON (m.team1_id = t1.id OR m.team2_id = t1.id) AND t1.id != ?
            WHERE m.team1_id = ? OR m.team2_id = ?
            ORDER BY m.created_at DESC
        `, [id, id, id, id, id]);

        res.json({
            ...team,
            matches
        });
    } catch (error) {
        console.error('Error fetching team stats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch team statistics',
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