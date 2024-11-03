// backend/routes/matches.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Fetch all matches
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.promise().query(`
            SELECT m.*, 
                   t1.team_name as team1_name, 
                   t2.team_name as team2_name,
                   t1.group_name as group_name
            FROM matches m
            LEFT JOIN teams t1 ON m.team1_id = t1.id
            LEFT JOIN teams t2 ON m.team2_id = t2.id
            ORDER BY m.id DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// Add qualifier match result
router.post('/qualifier-result', async (req, res) => {
    const { team1_id, team2_id, team1_kills, team2_kills, game_time } = req.body;
    
    try {
        // Start a transaction
        await db.promise().beginTransaction();

        try {
            // Update first team's stats
            await db.promise().query(`
                UPDATE teams 
                SET total_kills = COALESCE(total_kills, 0) + ?, 
                    matches_played = COALESCE(matches_played, 0) + 1,
                    game_time = CASE 
                        WHEN game_time IS NULL THEN ?
                        ELSE CONCAT(game_time, ', ', ?)
                    END
                WHERE id = ?
            `, [team1_kills, game_time, game_time, team1_id]);

            // Update second team's stats
            await db.promise().query(`
                UPDATE teams 
                SET total_kills = COALESCE(total_kills, 0) + ?, 
                    matches_played = COALESCE(matches_played, 0) + 1,
                    game_time = CASE 
                        WHEN game_time IS NULL THEN ?
                        ELSE CONCAT(game_time, ', ', ?)
                    END
                WHERE id = ?
            `, [team2_kills, game_time, game_time, team2_id]);

            // Add match record
            const [matchResult] = await db.promise().query(`
                INSERT INTO matches 
                (team1_id, team2_id, team1_kills, team2_kills, game_time, match_type)
                VALUES (?, ?, ?, ?, ?, 'qualifier')
            `, [team1_id, team2_id, team1_kills, team2_kills, game_time]);

            // Check and update qualification status
            const [teams] = await db.promise().query(
                'SELECT id, total_kills FROM teams WHERE id IN (?, ?)',
                [team1_id, team2_id]
            );

            // Update qualification status for teams that reach 100+ kills
            for (const team of teams) {
                if (team.total_kills >= 100) {
                    await db.promise().query(
                        'UPDATE teams SET is_qualified = TRUE WHERE id = ?',
                        [team.id]
                    );
                }
            }

            // Commit the transaction
            await db.promise().commit();

            res.json({ 
                message: 'Match results recorded successfully',
                matchId: matchResult.insertId
            });

        } catch (error) {
            // If anything fails, roll back the transaction
            await db.promise().rollback();
            throw error;
        }

    } catch (error) {
        console.error('Error updating qualifier results:', error);
        res.status(500).json({ 
            error: 'Failed to update results', 
            details: error.message 
        });
    }
});

// Get team rankings
router.get('/team-rankings/:group', async (req, res) => {
    const { group } = req.params;
    try {
        const [teams] = await db.promise().query(`
            SELECT t.*, 
                   COUNT(m.id) as matches_played,
                   SUM(CASE 
                       WHEN m.team1_id = t.id THEN m.team1_kills
                       WHEN m.team2_id = t.id THEN m.team2_kills
                       ELSE 0 
                   END) as total_kills
            FROM teams t
            LEFT JOIN matches m ON t.id = m.team1_id OR t.id = m.team2_id
            WHERE t.group_name = ?
            GROUP BY t.id
            ORDER BY total_kills DESC, matches_played ASC
        `, [group]);
        res.json(teams);
    } catch (error) {
        console.error('Error fetching team rankings:', error);
        res.status(500).json({ error: 'Failed to fetch team rankings' });
    }
});

// Get qualified teams
router.get('/qualified-teams', async (req, res) => {
    try {
        const [teams] = await db.promise().query(`
            SELECT * FROM teams 
            WHERE is_qualified = TRUE 
            ORDER BY total_kills DESC, matches_played ASC
        `);
        res.json(teams);
    } catch (error) {
        console.error('Error fetching qualified teams:', error);
        res.status(500).json({ error: 'Failed to fetch qualified teams' });
    }
});

module.exports = router;