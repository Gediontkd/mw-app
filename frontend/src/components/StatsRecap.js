// src/components/StatsRecap.js
const StatsRecap = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
  
    useEffect(() => {
      fetchStats();
    }, []);
  
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:5000/tournament/stats');
        setStats(response.data);
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch tournament stats');
        setLoading(false);
      }
    };
  
    if (loading) return <div>Loading stats...</div>;
    if (!stats) return <div>No stats available</div>;
  
    return (
      <div className="stats-container">
        <h2>Tournament Stats Recap</h2>
        {error && <div className="error-message">{error}</div>}
        
        <div className="stats-grid">
          <div className="stats-card">
            <h3>Top 3 Qualifier Kills</h3>
            {stats.qualifierTop3.map((player, index) => (
              <div key={player.id} className="player-stat-row">
                <span className="rank">#{index + 1}</span>
                <span className="player-name">{player.name}</span>
                <span className="kills">{player.qualifier_kills} kills</span>
              </div>
            ))}
          </div>
  
          <div className="stats-card">
            <h3>Top 3 Finals Kills</h3>
            {stats.finalsTop3.map((player, index) => (
              <div key={player.id} className="player-stat-row">
                <span className="rank">#{index + 1}</span>
                <span className="player-name">{player.name}</span>
                <span className="kills">{player.finals_kills} kills</span>
              </div>
            ))}
          </div>
  
          <div className="stats-card winner">
            <h3>Tournament Winner</h3>
            <div className="winner-info">
              <div className="team-name">{stats.winner.team_name}</div>
              <div className="players">
                {stats.winner.players.map(player => (
                  <div key={player.id} className="player">
                    {player.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export { SemifinalMatches, Finals, StatsRecap };