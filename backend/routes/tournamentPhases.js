// backend/routes/phases.js
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

// Get current phase with additional details
router.get('/current', async (req, res) => {
    try {
        const [phase] = await executeQuery(`
            SELECT 
                tp.*,
                COUNT(DISTINCT t.id) as total_teams,
                COUNT(DISTINCT CASE WHEN t.is_qualified = true THEN t.id END) as qualified_teams,
                COUNT(DISTINCT m.id) as matches_played
            FROM tournament_phases tp
            LEFT JOIN teams t ON tp.phase_status = 'active'
            LEFT JOIN matches m ON m.created_at >= tp.started_at 
                               AND (m.created_at <= tp.ended_at OR tp.ended_at IS NULL)
            WHERE tp.phase_status = 'active'
            GROUP BY tp.id
            ORDER BY tp.started_at DESC 
            LIMIT 1
        `);

        if (phase) {
            // Get phase-specific stats
            const phaseStats = await getPhaseStats(phase.phase_name);
            res.json({
                ...phase,
                stats: phaseStats
            });
        } else {
            res.json(null);
        }
    } catch (error) {
        console.error('Error fetching current phase:', error);
        res.status(500).json({ 
            error: 'Failed to fetch current phase',
            details: error.message 
        });
    }
});

// Get all phases with stats
router.get('/', async (req, res) => {
    try {
        const phases = await executeQuery(`
            SELECT 
                tp.*,
                COUNT(DISTINCT m.id) as matches_played,
                MIN(m.created_at) as first_match,
                MAX(m.created_at) as last_match
            FROM tournament_phases tp
            LEFT JOIN matches m ON m.created_at >= tp.started_at 
                               AND (m.created_at <= tp.ended_at OR tp.ended_at IS NULL)
            GROUP BY tp.id
            ORDER BY tp.started_at DESC
        `);

        const phasesWithStats = await Promise.all(phases.map(async (phase) => {
            const stats = await getPhaseStats(phase.phase_name);
            return {
                ...phase,
                stats
            };
        }));

        res.json(phasesWithStats);
    } catch (error) {
        console.error('Error fetching phases:', error);
        res.status(500).json({ 
            error: 'Failed to fetch phases',
            details: error.message 
        });
    }
});

// Create new phase
router.post('/', async (req, res) => {
    const { phase_name, phase_status } = req.body;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Validate input
        if (!phase_name || !phase_status) {
            throw new Error('Phase name and status are required');
        }

        // Validate phase name
        const validPhases = ['enrollment', 'qualifier', 'semifinals', 'finals'];
        if (!validPhases.includes(phase_name)) {
            throw new Error('Invalid phase name');
        }

        // Check if there's an active phase
        const [activePhase] = await connection.query(
            'SELECT id, phase_name FROM tournament_phases WHERE phase_status = "active"'
        );

        if (activePhase.length > 0) {
            // Mark previous phase as completed
            await connection.query(`
                UPDATE tournament_phases 
                SET phase_status = "completed", 
                    ended_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `, [activePhase[0].id]);
        }

        // Create new phase
        const [result] = await connection.query(`
            INSERT INTO tournament_phases 
            (phase_name, phase_status, started_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP)
        `, [phase_name, phase_status]);

        // Perform phase-specific initializations
        await initializePhase(connection, phase_name);

        await connection.commit();

        const [newPhase] = await connection.query(
            'SELECT * FROM tournament_phases WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(newPhase[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error creating phase:', error);
        res.status(500).json({ 
            error: 'Failed to create phase',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Update phase status
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { phase_status } = req.body;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Validate status
        if (!['active', 'completed', 'cancelled'].includes(phase_status)) {
            throw new Error('Invalid phase status');
        }

        // Update phase
        await connection.query(`
            UPDATE tournament_phases 
            SET phase_status = ?,
                ended_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE ended_at END
            WHERE id = ?
        `, [phase_status, phase_status, id]);

        await connection.commit();

        const [updatedPhase] = await connection.query(
            'SELECT * FROM tournament_phases WHERE id = ?',
            [id]
        );

        res.json(updatedPhase[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error updating phase:', error);
        res.status(500).json({ 
            error: 'Failed to update phase',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Helper function to get phase-specific stats
async function getPhaseStats(phaseName) {
    try {
        switch (phaseName) {
            case 'qualifier':
                const qualifierStats = await executeQuery(`
                    SELECT 
                        COUNT(DISTINCT t.id) as participating_teams,
                        COUNT(DISTINCT CASE WHEN t.is_qualified THEN t.id END) as qualified_teams,
                        COUNT(DISTINCT m.id) as matches_played,
                        MAX(t.total_kills) as highest_kills
                    FROM teams t
                    LEFT JOIN matches m ON (m.team1_id = t.id OR m.team2_id = t.id)
                                     AND m.match_type = 'qualifier'
                `);
                return qualifierStats[0];

            case 'semifinals':
                const semifinalStats = await executeQuery(`
                    SELECT 
                        COUNT(DISTINCT m.id) as matches_played,
                        COUNT(DISTINCT CASE WHEN sr.winner_team_id IS NOT NULL THEN m.id END) as completed_matches
                    FROM matches m
                    LEFT JOIN semifinal_results sr ON m.id = sr.match_id
                    WHERE m.match_type = 'semifinal'
                `);
                return semifinalStats[0];

            case 'finals':
                const finalStats = await executeQuery(`
                    SELECT 
                        COUNT(DISTINCT f.id) as finals_matches,
                        COUNT(DISTINCT fg.id) as games_played,
                        MAX(t.total_kills) as winner_kills
                    FROM finals f
                    LEFT JOIN finals_games fg ON f.id = fg.finals_id
                    LEFT JOIN teams t ON f.team1_id = t.id OR f.team2_id = t.id
                `);
                return finalStats[0];

            default:
                return null;
        }
    } catch (error) {
        console.error('Error getting phase stats:', error);
        throw error;
    }
}

// Helper function to initialize phase-specific requirements
async function initializePhase(connection, phaseName) {
    switch (phaseName) {
        case 'qualifier':
            // Reset qualification flags
            await connection.query('UPDATE teams SET is_qualified = FALSE');
            break;

        case 'semifinals':
            // Clean up any existing semifinals
            await connection.query('DELETE FROM matches WHERE match_type = "semifinal"');
            break;

        case 'finals':
            // Clean up any existing finals
            await connection.query('DELETE FROM finals');
            await connection.query('DELETE FROM finals_games');
            break;
    }
}

// Error handling middleware
router.use((err, req, res, next) => {
    console.error('Route error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: err.message
    });
});

module.exports = router;