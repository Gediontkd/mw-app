// backend/routes/tournament.js
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

// Get current tournament
router.get('/current', async (req, res) => {
    try {
        const [tournament] = await executeQuery(`
            SELECT t.*,
                   (SELECT COUNT(*) FROM teams) as registered_teams,
                   (SELECT COUNT(*) FROM players) as registered_players,
                   (SELECT phase_name FROM tournament_phases WHERE phase_status = 'active' ORDER BY started_at DESC LIMIT 1) as current_phase
            FROM tournament t
            ORDER BY t.created_at DESC 
            LIMIT 1
        `);
        res.json(tournament || null);
    } catch (error) {
        console.error('Error fetching tournament:', error);
        res.status(500).json({ 
            error: 'Failed to fetch tournament',
            details: error.message 
        });
    }
});

// Create new tournament
router.post('/', async (req, res) => {
    const { 
        name, 
        date, 
        organizer, 
        total_players, 
        players_per_team, 
        total_teams, 
        status 
    } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Validate input
        if (!name || !date || !organizer) {
            throw new Error('Name, date, and organizer are required');
        }

        // Check if there's an active tournament
        const [activeTournament] = await connection.query(
            'SELECT id FROM tournament WHERE status = "active"'
        );

        if (activeTournament.length > 0) {
            throw new Error('There is already an active tournament');
        }

        // Create tournament
        const [result] = await connection.query(`
            INSERT INTO tournament 
            (name, date, organizer, total_players, players_per_team, total_teams, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [name, date, organizer, total_players, players_per_team, total_teams, status]);

        // Initialize tournament phase
        await connection.query(`
            INSERT INTO tournament_phases 
            (tournament_id, phase_name, phase_status, started_at) 
            VALUES (?, 'enrollment', 'active', NOW())
        `, [result.insertId]);

        await connection.commit();

        const [newTournament] = await connection.query(
            'SELECT * FROM tournament WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(newTournament[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error creating tournament:', error);
        res.status(500).json({ 
            error: 'Failed to create tournament',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Update tournament
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, date, organizer, status } = req.body;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Validate input
        if (!name || !date || !organizer) {
            throw new Error('Name, date, and organizer are required');
        }

        // Check if tournament exists
        const [tournament] = await connection.query(
            'SELECT id FROM tournament WHERE id = ?',
            [id]
        );

        if (!tournament.length) {
            throw new Error(`Tournament with ID ${id} does not exist`);
        }

        // Update tournament
        await connection.query(`
            UPDATE tournament 
            SET name = ?, date = ?, organizer = ?, status = ?, 
                updated_at = NOW()
            WHERE id = ?
        `, [name, date, organizer, status, id]);

        await connection.commit();

        const [updatedTournament] = await connection.query(
            'SELECT * FROM tournament WHERE id = ?',
            [id]
        );

        res.json(updatedTournament[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error updating tournament:', error);
        res.status(500).json({ 
            error: 'Failed to update tournament',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Get qualifier rankings
router.get('/qualifier-rankings', async (req, res) => {
    try {
        const teams = await executeQuery(`
            SELECT 
                t.*,
                GROUP_CONCAT(p.name) as player_names,
                GROUP_CONCAT(p.qualifier_kills) as player_kills,
                COUNT(DISTINCT m.id) as matches_played,
                AVG(
                    CASE 
                        WHEN m.team1_id = t.id THEN m.team1_kills
                        WHEN m.team2_id = t.id THEN m.team2_kills
                    END
                ) as avg_kills_per_match
            FROM teams t
            LEFT JOIN players p ON p.team_id = t.id
            LEFT JOIN matches m ON (m.team1_id = t.id OR m.team2_id = t.id)
                               AND m.match_type = 'qualifier'
            GROUP BY t.id
            ORDER BY t.total_kills DESC, t.matches_played ASC
        `);
        res.json(teams);
    } catch (error) {
        console.error('Error fetching rankings:', error);
        res.status(500).json({ 
            error: 'Failed to fetch rankings',
            details: error.message 
        });
    }
});

// Get final stats
router.get('/final-stats', async (req, res) => {
    try {
        const qualifierTop3 = await executeQuery(`
            SELECT p.name, p.qualifier_kills, t.team_name 
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE p.qualifier_kills > 0
            ORDER BY p.qualifier_kills DESC 
            LIMIT 3
        `);
        
        const finalsTop3 = await executeQuery(`
            SELECT p.name, p.finals_kills, t.team_name
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE p.finals_kills > 0
            ORDER BY p.finals_kills DESC 
            LIMIT 3
        `);

        const [winner] = await executeQuery(`
            SELECT 
                t.*,
                GROUP_CONCAT(p.name) as player_names,
                SUM(p.qualifier_kills) as total_qualifier_kills,
                SUM(p.finals_kills) as total_finals_kills
            FROM teams t
            LEFT JOIN players p ON p.team_id = t.id
            WHERE t.id = (
                SELECT winner_team_id 
                FROM finals_games 
                GROUP BY finals_id 
                HAVING COUNT(*) >= 3 
                ORDER BY finals_id DESC 
                LIMIT 1
            )
            GROUP BY t.id
        `);

        res.json({
            qualifierTop3,
            finalsTop3,
            winner: winner || null,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error fetching final stats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch final stats',
            details: error.message 
        });
    }
});

// Check qualification status
router.post('/check-qualification/:group', async (req, res) => {
    const { group } = req.params;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Update qualification status
        await connection.query(`
            UPDATE teams 
            SET is_qualified = true 
            WHERE group_name = ? 
            AND total_kills >= 100
        `, [group]);

        await connection.commit();
        res.json({ message: 'Qualification check complete' });
    } catch (error) {
        await connection.rollback();
        console.error('Error checking qualification:', error);
        res.status(500).json({ 
            error: 'Failed to check qualification',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Get current tournament phase
router.get('/phase/current', async (req, res) => {
    try {
        const [phase] = await executeQuery(`
            SELECT phase_name, started_at, 
                   (SELECT COUNT(*) FROM teams WHERE is_qualified = true) as qualified_teams
            FROM tournament_phases 
            WHERE phase_status = 'active' 
            ORDER BY started_at DESC 
            LIMIT 1
        `);
        res.json(phase || { phase_name: 'enrollment' });
    } catch (error) {
        console.error('Error fetching tournament phase:', error);
        res.status(500).json({ 
            error: 'Failed to fetch tournament phase',
            details: error.message 
        });
    }
});

// Reset tournament
router.post('/reset', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Delete in correct order respecting foreign key constraints
        // First, delete finals_games
        await connection.query('DELETE FROM finals_games');
        
        // Delete finals
        await connection.query('DELETE FROM finals');
        
        // Delete semifinal_results
        await connection.query('DELETE FROM semifinal_results');
        
        // Delete matches
        await connection.query('DELETE FROM matches');

        // Reset player stats but keep the players
        await connection.query(`
            UPDATE players 
            SET team_id = NULL, 
                kills = 0, 
                qualifier_kills = 0, 
                finals_kills = 0, 
                matches_played = 0
        `);

        // Delete teams
        await connection.query('DELETE FROM teams');

        // Reset tournament phases
        await connection.query('DELETE FROM tournament_phases WHERE phase_status = "active"');
        
        // Create new enrollment phase
        await connection.query(`
            INSERT INTO tournament_phases 
            (phase_name, phase_status, started_at) 
            VALUES ('enrollment', 'active', NOW())
        `);

        await connection.commit();
        
        res.json({ 
            message: 'Tournament reset successfully',
            timestamp: new Date()
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error resetting tournament:', error);
        res.status(500).json({ 
            error: 'Failed to reset tournament',
            details: error.message 
        });
    } finally {
        connection.release();
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