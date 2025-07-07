import { useState, useEffect, useRef, useCallback } from 'react';
import { PHASES } from '../constants';

const workEndSound = new Audio('https://www.soundjay.com/buttons/beep-07.mp3');
const breakEndSound = new Audio('https://www.soundjay.com/buttons/beep-09.mp3');

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
            setIsRunning(false);
            if (onPomodoroComplete) onPomodoroComplete();
        } else {
            nextPhase = PHASES.POMODORO;
            nextTime = settings.workDuration;
            showNotification('Break Over!', 'Time to get back to work!', workEndSound);
            setCurrentPhase(nextPhase);
            setTimeLeft(nextTime);
            setIsRunning(true);
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