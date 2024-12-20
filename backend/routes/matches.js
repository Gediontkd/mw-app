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

// Backend route (matches.js)
// In matches.js, update the qualifier-result endpoint:

router.post('/qualifier-result', async (req, res) => {
    const { team_id, kills, game_time, time_played, player_kills } = req.body;
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Get current team stats
        const [currentTeam] = await connection.query(
            'SELECT total_kills FROM teams WHERE id = ?',
            [team_id]
        );

        const newTotalKills = (currentTeam[0]?.total_kills || 0) + kills;

        // Update team stats
        await connection.query(`
            UPDATE teams 
            SET total_kills = ?,
                matches_played = COALESCE(matches_played, 0) + 1,
                game_time = CASE 
                    WHEN game_time IS NULL THEN ?
                    ELSE CONCAT(game_time, ', ', ?)
                END,
                time_played = CASE 
                    WHEN time_played IS NULL THEN ?
                    ELSE CONCAT(time_played, ', ', ?)
                END,
                is_qualified = IF(? >= 100, TRUE, FALSE)
            WHERE id = ?
        `, [newTotalKills, game_time, game_time, time_played, time_played, newTotalKills, team_id]);

        // Update player kills
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
            (team1_id, team2_id, team1_kills, team2_kills, game_time, time_played, match_type)
            VALUES (?, ?, ?, 0, ?, ?, 'qualifier')
        `, [team_id, team_id, kills, game_time, time_played]);

        await connection.commit();

        // Get updated team data
        const [updatedTeam] = await connection.query(`
            SELECT id, team_name, total_kills, matches_played, is_qualified, time_played
            FROM teams WHERE id = ?
        `, [team_id]);

        res.json({ 
            message: 'Game recorded successfully',
            matchId: matchResult.insertId,
            team: updatedTeam[0]
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error recording game result:', error);
        res.status(500).json({ 
            error: 'Failed to record game result',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Update the team rankings endpoint to include time_played
const calculateTotalTime = (timeString) => {
    if (!timeString) return { minutes: 0, seconds: 0 };
    
    try {
        // Split the times and filter out any empty or invalid values
        const times = timeString.split(', ').filter(time => {
            return time && time.includes(':') && time.match(/^\d{2}:\d{2}$/);
        });

        if (times.length === 0) return { minutes: 0, seconds: 0 };

        return times.reduce((total, time) => {
            const [minutes, seconds] = time.split(':').map(num => parseInt(num, 10) || 0);
            return {
                minutes: total.minutes + minutes,
                seconds: total.seconds + seconds
            };
        }, { minutes: 0, seconds: 0 });
    } catch (error) {
        console.error('Error calculating total time:', error);
        return { minutes: 0, seconds: 0 };
    }
};

const formatTime = (totalTime) => {
    try {
        let { minutes, seconds } = totalTime;
        
        // Convert excess seconds to minutes
        minutes += Math.floor(seconds / 60);
        seconds = seconds % 60;
        
        // Ensure we have valid numbers
        minutes = Math.max(0, parseInt(minutes) || 0);
        seconds = Math.max(0, parseInt(seconds) || 0);
        
        // Format with leading zeros
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } catch (error) {
        console.error('Error formatting time:', error);
        return '00:00';
    }
};

router.get('/team-rankings/:group', async (req, res) => {
    const { group } = req.params;
    try {
        const teams = await executeQuery(`
            SELECT t.*, 
                   t.matches_played,
                   t.total_kills,
                   t.is_qualified,
                   t.time_played
            FROM teams t
            WHERE t.group_name = ?
            ORDER BY t.total_kills DESC, t.matches_played ASC
        `, [group]);

        // Process each team's total time
        const processedTeams = teams.map(team => {
            const totalTime = calculateTotalTime(team.time_played);
            return {
                ...team,
                total_time: formatTime(totalTime)
            };
        });

        res.json(processedTeams);
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
            SELECT 
                COUNT(CASE WHEN winner_team_id = ? THEN 1 END) as team1_wins,
                COUNT(CASE WHEN winner_team_id = ? THEN 1 END) as team2_wins
            FROM finals_games
            WHERE finals_id = ?
            GROUP BY finals_id
        `, [finals[0].team1_id, finals[0].team2_id, finals_id]);

        if (games.length > 0 && (games[0].team1_wins === 3 || games[0].team2_wins === 3)) {
            await connection.query(
                'UPDATE finals SET status = "completed" WHERE id = ?',
                [finals_id]
            );
        }

        await connection.commit();
        res.json({ 
            message: 'Finals game result recorded successfully',
            gameNumber: game_number,
            winnerTeamId: winner_team_id
        });
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