import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';

const MatchResults = () => {
  const [phase, setPhase] = useState('qualifiers');
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [playerKills, setPlayerKills] = useState({});
  const [gameTime, setGameTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teamsRes, playersRes] = await Promise.all([
        axios.get('http://localhost:5000/teams'),
        axios.get('http://localhost:5000/players')
      ]);
      setTeams(teamsRes.data);
      setPlayers(playersRes.data);
    } catch (error) {
      setError('Failed to fetch data');
    }
  };

  const getTeamPlayers = (teamId) => {
    return players.filter(player => player.team_id === parseInt(teamId));
  };

  const handlePlayerKillsChange = (playerId, kills) => {
    setPlayerKills(prev => ({
      ...prev,
      [playerId]: parseInt(kills) || 0
    }));
  };

  const handleSubmitQualifierResult = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const teamPlayers = getTeamPlayers(selectedTeam);
      const playerKillsArray = teamPlayers.map(player => ({
        player_id: player.id,
        kills: playerKills[player.id] || 0
      }));

      await axios.post('http://localhost:5000/matches/qualifier-result', {
        team_id: parseInt(selectedTeam),
        player_kills: playerKillsArray,
        game_time: gameTime
      });

      setMessage('Results recorded successfully');
      // Reset form
      setSelectedTeam('');
      setPlayerKills({});
      setGameTime('');
      fetchData(); // Refresh data
    } catch (error) {
      setError('Failed to record results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Match Results Entry</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 text-green-500 p-3 rounded mb-4">
              {message}
            </div>
          )}

          <div className="space-y-4">
            {/* Phase Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Tournament Phase
              </label>
              <Select 
                value={phase}
                onValueChange={setPhase}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualifiers">Qualifiers</SelectItem>
                  <SelectItem value="semifinals">Semifinals</SelectItem>
                  <SelectItem value="finals">Finals</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Team Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Select Team
              </label>
              <Select 
                value={selectedTeam}
                onValueChange={setSelectedTeam}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.team_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Player Kills */}
            {selectedTeam && (
              <div className="space-y-3">
                <h3 className="font-medium">Player Kills</h3>
                {getTeamPlayers(selectedTeam).map(player => (
                  <div key={player.id} className="flex items-center gap-3">
                    <span className="flex-1">{player.name}</span>
                    <Input
                      type="number"
                      min="0"
                      value={playerKills[player.id] || ''}
                      onChange={(e) => handlePlayerKillsChange(player.id, e.target.value)}
                      className="w-24"
                      placeholder="Kills"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Game Time */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Game Time
              </label>
              <Input
                type="text"
                value={gameTime}
                onChange={(e) => setGameTime(e.target.value)}
                placeholder="e.g., 15:30"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitQualifierResult}
              disabled={loading || !selectedTeam}
              className="w-full"
            >
              {loading ? 'Recording...' : 'Record Results'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchResults;