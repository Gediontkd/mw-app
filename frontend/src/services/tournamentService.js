import axios from 'axios';
import config from '../config';

export const checkQualification = async (group) => {
  try {
    const response = await axios.post(`${config.API_BASE_URL}/tournament/check-qualification/${group}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to check qualification: ${error.message}`);
  }
};

export const fetchTournamentPhase = async () => {
  try {
    const response = await axios.get(`${config.API_BASE_URL}/tournament/phase/current`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch tournament phase: ${error.message}`);
  }
};