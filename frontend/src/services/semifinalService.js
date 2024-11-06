import axios from 'axios';
import config from '../config';

export const submitSemifinalResult = async (matchId, gameNumber, team1PlayerKills, team2PlayerKills) => {
  try {
    const response = await axios.post(`${config.API_BASE_URL}/matches/semifinal-result`, {
      match_id: matchId,
      game_number: gameNumber,
      team1_player_kills: team1PlayerKills,
      team2_player_kills: team2PlayerKills
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to submit semifinal result: ${error.message}`);
  }
};

export const fetchSemifinalMatches = async () => {
  try {
    const response = await axios.get(`${config.API_BASE_URL}/matches/semifinals`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch semifinal matches: ${error.message}`);
  }
};