// services/matchService.js
import axios from 'axios';
import config from '../config';

export const submitQualifierResult = async (matchData) => {
  try {
    const response = await axios.post(`${config.API_BASE_URL}/matches/qualifier-result`, matchData);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to submit qualifier result: ${error.message}`);
  }
};

export const fetchTeamRankings = async (group) => {
  try {
    const response = await axios.get(`${config.API_BASE_URL}/matches/team-rankings/${group}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch team rankings: ${error.message}`);
  }
};