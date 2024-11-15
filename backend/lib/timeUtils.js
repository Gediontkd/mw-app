// timeUtils.js

// Convert time string (MM:SS) to total seconds
const timeToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    const [minutes, seconds] = timeStr.split(':').map(Number);
    return minutes * 60 + seconds;
  };
  
  // Convert total seconds to time string (MM:SS)
  const secondsToTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };
  
  // Calculate total time from comma-separated time strings
  const calculateTotalTime = (timeString) => {
    if (!timeString) return '00:00';
    
    const times = timeString.split(',').map(t => t.trim());
    const totalSeconds = times.reduce((total, time) => {
      return total + timeToSeconds(time);
    }, 0);
    
    return secondsToTime(totalSeconds);
  };
  
  module.exports = {
    timeToSeconds,
    secondsToTime,
    calculateTotalTime
  };