// backend/routes/matches.js
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

// Fetch all matches
router.get('/', async (req, res) => {
    try {
        const matches = await executeQuery(`
            SELECT m.*, 
                   t1.team_name as team1_name, 
                   t2.team_name as team2_name,
                   t1.group_name as group_name
            FROM matches m
            LEFT JOIN teams t1 ON m.team1_id = t1.id
            LEFT JOIN teams t2 ON m.team2_id = t2.id
            ORDER BY m.id DESC
        `);
        res.json(matches);
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ 
            error: 'Failed to fetch matches',
            details: error.message 
        });
    }
});

// Add qualifier match result
router.post('/qualifier-result', async (req, res) => {
    const { team1_id, team2_id, team1_kills, team2_kills, game_time, player_kills } = req.body;
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Update first team's stats
        await connection.query(`
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
        await connection.query(`
            UPDATE teams 
            SET total_kills = COALESCE(total_kills, 0) + ?, 
                matches_played = COALESCE(matches_played, 0) + 1,
                game_time = CASE 
                    WHEN game_time IS NULL THEN ?
                    ELSE CONCAT(game_time, ', ', ?)
                END
            WHERE id = ?
        `, [team2_kills, game_time, game_time, team2_id]);

        // Update player kills and matches played
        for (const playerKill of player_kills) {
            await connection.query(`
                UPDATE players 
                SET kills = COALESCE(kills, 0) + ?,
                    qualifier_kills = COALESCE(qualifier_kills, 0) + ?,
                    matches_played = COALESCE(matches_played, 0) + 1
                WHERE id = ?
            `, [playerKill.kills, playerKill.kills, playerKill.player_id]);
        }

        // Add match record
        const [matchResult] = await connection.query(`
            INSERT INTO matches 
            (team1_id, team2_id, team1_kills, team2_kills, game_time, match_type)
            VALUES (?, ?, ?, ?, ?, 'qualifier')
        `, [team1_id, team2_id, team1_kills, team2_kills, game_time]);

        // Check and update qualification status
        const [teams] = await connection.query(
            'SELECT id, total_kills FROM teams WHERE id IN (?, ?)',
            [team1_id, team2_id]
        );

        // Update qualification status for teams that reach 100+ kills
        for (const team of teams) {
            if (team.total_kills >= 100) {
                await connection.query(
                    'UPDATE teams SET is_qualified = TRUE WHERE id = ?',
                    [team.id]
                );
            }
        }

        await connection.commit();
        res.json({ 
            message: 'Match results recorded successfully',
            matchId: matchResult.insertId
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error recording match result:', error);
        res.status(500).json({ 
            error: 'Failed to record match result',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Get team rankings
router.get('/team-rankings/:group', async (req, res) => {
    const { group } = req.params;
    try {
        const teams = await executeQuery(`
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
        res.status(500).json({ 
            error: 'Failed to fetch team rankings',
            details: error.message 
        });
    }
});

// Get qualified teams
router.get('/qualified-teams', async (req, res) => {
    try {
        const teams = await executeQuery(`
            SELECT * FROM teams 
            WHERE is_qualified = TRUE 
            ORDER BY total_kills DESC, matches_played ASC
        `);
        res.json(teams);
    } catch (error) {
        console.error('Error fetching qualified teams:', error);
        res.status(500).json({ 
            error: 'Failed to fetch qualified teams',
            details: error.message 
        });
    }
});

// Get semifinals matches
router.get('/semifinals', async (req, res) => {
    try {
        const matches = await executeQuery(`
            SELECT m.*,
                   t1.team_name as team1_name,
                   t1.group_name as team1_group,
                   t2.team_name as team2_name,
                   t2.group_name as team2_group,
                   COUNT(CASE WHEN sr.winner_team_id = m.team1_id THEN 1 END) as wins_team1,
                   COUNT(CASE WHEN sr.winner_team_id = m.team2_id THEN 1 END) as wins_team2,
                   GROUP_CONCAT(sr.game_number) as games_played
            FROM matches m
            LEFT JOIN teams t1 ON m.team1_id = t1.id
            LEFT JOIN teams t2 ON m.team2_id = t2.id
            LEFT JOIN semifinal_results sr ON m.id = sr.match_id
            WHERE m.match_type = 'semifinal'
            GROUP BY m.id
        `);

        // Process each match to include detailed game information
        const processedMatches = await Promise.all(matches.map(async (match) => {
            const gameResults = await executeQuery(`
                SELECT game_number, team1_kills, team2_kills, winner_team_id,
                       TRUE as game_completed
                FROM semifinal_results
                WHERE match_id = ?
                ORDER BY game_number
            `, [match.id]);

            gameResults.forEach(game => {
                match[`game${game.game_number}_completed`] = true;
                match[`game${game.game_number}_team1_kills`] = game.team1_kills;
                match[`game${game.game_number}_team2_kills`] = game.team2_kills;
            });

            return match;
        }));

        res.json(processedMatches);
    } catch (error) {
        console.error('Error fetching semifinals:', error);
        res.status(500).json({ 
            error: 'Failed to fetch semifinals',
            details: error.message 
        });
    }
});

// Generate semifinals
router.post('/generate-semifinals', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Clean up existing semifinals
        await connection.query('DELETE FROM matches WHERE match_type = "semifinal"');

        // Get qualified teams
        const [qualifiedTeams] = await connection.query(`
            SELECT *, 
                   total_kills / matches_played as kill_ratio
            FROM teams 
            WHERE is_qualified = TRUE 
            ORDER BY group_name, total_kills DESC, matches_played ASC
        `);

        const groupA = qualifiedTeams.filter(team => team.group_name === 'A');
        const groupB = qualifiedTeams.filter(team => team.group_name === 'B');

        if (groupA.length < 2 || groupB.length < 2) {
            throw new Error('Not enough qualified teams for semifinals');
        }

        // Insert semifinal matches
        await connection.query(`
            INSERT INTO matches 
            (team1_id, team2_id, match_type, match_order)
            VALUES 
            (?, ?, 'semifinal', 1),
            (?, ?, 'semifinal', 2)
        `, [
            groupA[0].id, groupB[1].id,
            groupB[0].id, groupA[1].id
        ]);

        await connection.commit();
        res.json({ message: 'Semifinals Match Started successfully' });

    } catch (error) {
        await connection.rollback();
        console.error('Error Starting semifinals:', error);
        res.status(500).json({ 
            error: 'Failed to Start semifinals Match',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Update semifinal result
router.post('/semifinal-result', async (req, res) => {
    const { match_id, game_number, team1_kills, team2_kills, player_kills } = req.body;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Get match details
        const [match] = await connection.query(
            'SELECT team1_id, team2_id FROM matches WHERE id = ?',
            [match_id]
        );

        const winner_team_id = team1_kills > team2_kills ? match[0].team1_id : match[0].team2_id;

        // Record game result
        await connection.query(`
            INSERT INTO semifinal_results 
            (match_id, game_number, team1_kills, team2_kills, winner_team_id)
            VALUES (?, ?, ?, ?, ?)
        `, [match_id, game_number, team1_kills, team2_kills, winner_team_id]);

        // Update player kills
        for (const kill of player_kills) {
            await connection.query(`
                UPDATE players 
                SET finals_kills = COALESCE(finals_kills, 0) + ?,
                    matches_played = COALESCE(matches_played, 0) + 1
                WHERE id = ?
            `, [kill.kills, kill.player_id]);
        }

        await connection.commit();
        res.json({ message: 'Semifinal game result recorded successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error recording semifinal result:', error);
        res.status(500).json({ 
            error: 'Failed to record semifinal result',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Get finals match
router.get('/finals', async (req, res) => {
    try {
        const [finals] = await executeQuery(`
            SELECT f.*,
                   t1.team_name as team1_name,
                   t2.team_name as team2_name,
                   COUNT(CASE WHEN fg.winner_team_id = f.team1_id THEN 1 END) as team1_wins,
                   COUNT(CASE WHEN fg.winner_team_id = f.team2_id THEN 1 END) as team2_wins
            FROM finals f
            JOIN teams t1 ON f.team1_id = t1.id
            JOIN teams t2 ON f.team2_id = t2.id
            LEFT JOIN finals_games fg ON f.id = fg.finals_id
            GROUP BY f.id
        `);

        if (!finals) {
            return res.json(null);
        }

        // Get games for the finals match
        const games = await executeQuery(`
            SELECT *
            FROM finals_games
            WHERE finals_id = ?
            ORDER BY game_number ASC
        `, [finals.id]);

        res.json({
            ...finals,
            games
        });
    } catch (error) {
        console.error('Error fetching finals:', error);
        res.status(500).json({ 
            error: 'Failed to fetch finals',
            details: error.message 
        });
    }
});

// Generate finals match
router.post('/generate-finals', async (req, res) => {
    const { team1_id, team2_id } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.query(`
            INSERT INTO finals (team1_id, team2_id)
            VALUES (?, ?)
        `, [team1_id, team2_id]);

        await connection.commit();
        res.json({ 
            message: 'Finals match generated successfully',
            finals_id: result.insertId
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error generating finals:', error);
        res.status(500).json({ 
            error: 'Failed to generate finals',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Submit finals game result
router.post('/finals-result', async (req, res) => {
    const { finals_id, game_number, team1_kills, team2_kills, player_kills } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Get finals match details
        const [finals] = await connection.query(
            'SELECT team1_id, team2_id FROM finals WHERE id = ?',
            [finals_id]
        );

        if (!finals.length) {
            throw new Error('Finals match not found');
        }

        const winner_team_id = team1_kills > team2_kills ? 
            finals[0].team1_id : finals[0].team2_id;

        // Record game result
        await connection.query(`
            INSERT INTO finals_games 
            (finals_id, game_number, team1_kills, team2_kills, winner_team_id)
            VALUES (?, ?, ?, ?, ?)
        `, [finals_id, game_number, team1_kills, team2_kills, winner_team_id]);

        // Update player kills
        for (const kill of player_kills) {
            await connection.query(`
                UPDATE players 
                SET finals_kills = COALESCE(finals_kills, 0) + ?,
                    matches_played = COALESCE(matches_played, 0) + 1
                WHERE id = ?
            `, [kill.kills, kill.player_id]);
        }

        // Check if match is complete (best of 5)
        const [games] = await connection.query(`
            SELECT winner_team_id,
                   COUNT(CASE WHEN winner_team_id = ? THEN 1 END) as team1_wins,
                   COUNT(CASE WHEN winner_team_id = ? THEN 1 END) as team2_wins
            FROM finals_games
            WHERE finals_id = ?
            GROUP BY finals_id
        `, [finals[0].team1_id, finals[0].team2_id, finals_id]);

        if (games[0].team1_wins === 3 || games[0].team2_wins === 3) {
            await connection.query(
                'UPDATE finals SET status = "completed" WHERE id = ?',
                [finals_id]
            );
        }

        await connection.commit();
        res.json({ message: 'Finals game result recorded successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error recording finals result:', error);
        res.status(500).json({ 
            error: 'Failed to record finals result',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Get tournament statistics
router.get('/tournament-stats', async (req, res) => {
    try {
        // Get top 3 qualifier kills
        const qualifierTop3 = await executeQuery(`
            SELECT 
                p.name,
                p.qualifier_kills,
                t.team_name
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE p.qualifier_kills > 0
            ORDER BY p.qualifier_kills DESC
            LIMIT 3
        `);

        // Get top 3 finals/semifinals kills combined
        const eliminationTop3 = await executeQuery(`
            SELECT 
                p.name,
                (COALESCE(p.finals_kills, 0)) as elimination_kills,
                t.team_name
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE (p.finals_kills > 0)
            ORDER BY elimination_kills DESC
            LIMIT 3
        `);

        // Get tournament winner
        const [winner] = await executeQuery(`
            SELECT 
                t.team_name,
                t.total_kills,
                GROUP_CONCAT(p.name) as player_names
            FROM finals f
            JOIN teams t ON (
                CASE 
                    WHEN (
                        SELECT COUNT(*) 
                        FROM finals_games fg 
                        WHERE fg.finals_id = f.id AND fg.winner_team_id = f.team1_id
                    ) >= 3 
                    THEN f.team1_id 
                    ELSE f.team2_id 
                END
            ) = t.id
            JOIN players p ON p.team_id = t.id
            WHERE f.status = 'completed'
            GROUP BY t.id
        `);

        res.json({
            qualifierTop3,
            eliminationTop3,
            winner: winner || null
        });
    } catch (error) {
        console.error('Error fetching tournament stats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch tournament stats',
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