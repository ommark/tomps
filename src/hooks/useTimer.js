import { useState, useEffect, useRef, useCallback } from 'react';
import { PHASES } from '../constants';

const workEndSound = new Audio('https://www.soundjay.com/buttons/beep-07.mp3');
const breakEndSound = new Audio('https://www.soundjay.com/buttons/beep-09.mp3');

// CHANGED: The hook now accepts a callback function as its second argument
export function useTimer(settings, onPomodoroComplete) {
    const [currentPhase, setCurrentPhase] = useState(PHASES.POMODORO);
    const [timeLeft, setTimeLeft] = useState(settings.workDuration);
    const [isRunning, setIsRunning] = useState(false);
    const [pomodoroCount, setPomodoroCount] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!isRunning) {
            setTimeLeft(settings.workDuration);
            setCurrentPhase(PHASES.POMODORO);
            setPomodoroCount(0);
        }
    }, [settings.workDuration]);

    const showNotification = useCallback((title, body, sound) => {
        if (settings.soundEnabled) {
            sound.play().catch(e => console.warn("Failed to play sound:", e));
        }
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        new Notification(title, { body });
    }, [settings.soundEnabled]);

    const handlePhaseEnd = useCallback(() => {
        let nextPhase, nextTime, newPomodoroCount = pomodoroCount;

        if (currentPhase === PHASES.POMODORO) {
            // ---- THIS IS THE MAIN LOGIC CHANGE ----
            // Instead of starting the next phase automatically, we now do two things:
            // 1. Call the onPomodoroComplete callback to trigger the modal.
            // 2. Set up the timer for the next phase, but crucially, keep it PAUSED.

            newPomodoroCount++;
            setPomodoroCount(newPomodoroCount);

            if (newPomodoroCount > 0 && newPomodoroCount % settings.pomodorosBeforeLongBreak === 0) {
                nextPhase = PHASES.LONG_BREAK;
                nextTime = settings.longBreakDuration;
            } else {
                nextPhase = PHASES.SHORT_BREAK;
                nextTime = settings.shortBreakDuration;
            }

            setCurrentPhase(nextPhase);
            setTimeLeft(nextTime);
            setIsRunning(false); // Keep the timer paused
            onPomodoroComplete(); // Trigger the modal via the callback!

        } else { // It was a break, so we go back to work automatically
            nextPhase = PHASES.POMODORO;
            nextTime = settings.workDuration;
            showNotification('Break Over!', 'Time to get back to work!', workEndSound);
            setCurrentPhase(nextPhase);
            setTimeLeft(nextTime);
            setIsRunning(true); // Auto-start the next work session
        }

    }, [currentPhase, pomodoroCount, settings, showNotification, onPomodoroComplete]);

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && isRunning) {
            handlePhaseEnd();
        }
        return () => clearInterval(timerRef.current);
    }, [isRunning, timeLeft, handlePhaseEnd]);

    const start = useCallback(() => setIsRunning(true), []);
    const pause = useCallback(() => setIsRunning(false), []);
    const reset = useCallback(() => {
        setIsRunning(false);
        setCurrentPhase(PHASES.POMODORO);
        setTimeLeft(settings.workDuration);
        setPomodoroCount(0);
    }, [settings.workDuration]);

    const skip = useCallback(() => {
        setIsRunning(false);
        handlePhaseEnd();
    }, [handlePhaseEnd]);

    const totalDuration = settings[{
        [PHASES.POMODORO]: 'workDuration',
        [PHASES.SHORT_BREAK]: 'shortBreakDuration',
        [PHASES.LONG_BREAK]: 'longBreakDuration',
    }[currentPhase]] || settings.workDuration;

    return { timeLeft, phase: currentPhase, isRunning, pomodoroCount, totalDuration, start, pause, reset, skip };
}