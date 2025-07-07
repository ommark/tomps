import React from 'react';
import TimerDisplay from './TimerDisplay.jsx';
import TimerControls from './TimerControls.jsx';
import ActivityLogger from './ActivityLogger.jsx';

export default function TimerView() {
    return (
        <>
            <TimerDisplay />
            <TimerControls />
            <ActivityLogger />
        </>
    );
}