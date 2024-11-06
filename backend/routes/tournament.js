// backend/routes/tournament.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Get current tournament
router.get('/current', async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            'SELECT * FROM tournament ORDER BY created_at DESC LIMIT 1'
        );
        res.json(rows[0] || null);
    } catch (error) {
        console.error('Error fetching tournament:', error);
        res.status(500).json({ error: 'Failed to fetch tournament' });
    }
});

// Create new tournament
router.post('/', async (req, res) => {
    const { name, date, organizer, total_players, players_per_team, total_teams, status } = req.body;
    try {
        const [result] = await db.promise().query(
            'INSERT INTO tournament (name, date, organizer, total_players, players_per_team, total_teams, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, date, organizer, total_players, players_per_team, total_teams, status]
        );
        res.status(201).json({ 
            id: result.insertId, 
            name, 
            date, 
            organizer, 
            total_players, 
            players_per_team, 
            total_teams, 
            status 
        });
    } catch (error) {
        console.error('Error creating tournament:', error);
        res.status(500).json({ error: 'Failed to create tournament' });
    }
});

// Update tournament
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, date, organizer, status } = req.body;
    try {
        await db.promise().query(
            'UPDATE tournament SET name = ?, date = ?, organizer = ?, status = ? WHERE id = ?',
            [name, date, organizer, status, id]
        );
        res.json({ id, name, date, organizer, status });
    } catch (error) {
        console.error('Error updating tournament:', error);
        res.status(500).json({ error: 'Failed to update tournament' });
    }
});

// Get qualifier rankings
router.get('/qualifier-rankings', async (req, res) => {
    try {
        const [teams] = await db.promise().query(`
            SELECT t.*, 
                   GROUP_CONCAT(p.name) as player_names,
                   GROUP_CONCAT(p.qualifier_kills) as player_kills
            FROM teams t
            LEFT JOIN players p ON p.team_id = t.id
            GROUP BY t.id
            ORDER BY t.total_kills DESC, t.matches_played ASC
        `);
        res.json(teams);
    } catch (error) {
        console.error('Error fetching rankings:', error);
        res.status(500).json({ error: 'Failed to fetch rankings' });
    }
});

// Get final stats
router.get('/final-stats', async (req, res) => {
    try {
        const [qualifierTop3] = await db.promise().query(`
            SELECT name, qualifier_kills 
            FROM players 
            ORDER BY qualifier_kills DESC 
            LIMIT 3
        `);
        
        const [finalsTop3] = await db.promise().query(`
            SELECT name, finals_kills 
            FROM players 
            ORDER BY finals_kills DESC 
            LIMIT 3
        `);

        const [winner] = await db.promise().query(`
            SELECT t.*, GROUP_CONCAT(p.name) as player_names
            FROM teams t
            LEFT JOIN players p ON p.team_id = t.id
            WHERE t.id = (
                SELECT winner_team_id 
                FROM matches 
                WHERE match_status = 'completed' 
                AND phase = 'finals'
                LIMIT 1
            )
            GROUP BY t.id
        `);

        res.json({
            qualifierTop3,
            finalsTop3,
            winner: winner[0]
        });
    } catch (error) {
        console.error('Error fetching final stats:', error);
        res.status(500).json({ error: 'Failed to fetch final stats' });
    }
});

router.post('/check-qualification/:group', async (req, res) => {
    const { group } = req.params;
    try {
      await checkAndUpdateQualification(db, group);
      res.json({ message: 'Qualification check complete' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  router.get('/phase/current', async (req, res) => {
    try {
      const [phases] = await db.promise().query(`
        SELECT * FROM tournament_phases 
        WHERE phase_status = 'active' 
        ORDER BY started_at DESC 
        LIMIT 1
      `);
      res.json(phases[0] || { phase_name: 'enrollment' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/reset', async (req, res) => {
    try {
        await db.promise().beginTransaction();

        try {
            // Reset player stats
            await db.promise().query(`
                UPDATE players 
                SET team_id = NULL,
                    kills = 0,
                    qualifier_kills = 0,
                    finals_kills = 0,
                    matches_played = 0
            `);

            // Delete all matches and results
            await db.promise().query('DELETE FROM matches');
            await db.promise().query('DELETE FROM semifinal_results');
            await db.promise().query('DELETE FROM final_results');

            // Delete all teams
            await db.promise().query('DELETE FROM teams');

            // Reset tournament phases
            await db.promise().query(`
                DELETE FROM tournament_phases WHERE phase_status = 'active'
            `);

            await db.promise().commit();
            res.json({ message: 'Tournament reset successfully' });
        } catch (error) {
            await db.promise().rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error resetting tournament:', error);
        res.status(500).json({ error: 'Failed to reset tournament' });
    }
});

module.exports = router;