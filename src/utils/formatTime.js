import { SECONDS_IN_MINUTE } from '../constants';

export const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / SECONDS_IN_MINUTE);
    const remainingSeconds = seconds % SECONDS_IN_MINUTE;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};