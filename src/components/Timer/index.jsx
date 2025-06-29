import React from 'react';
import TimerDisplay from './TimerDisplay.jsx';
import TimerControls from './TimerControls.jsx';

export default function TimerView() {
    return (
        <>
            <TimerDisplay />
            <TimerControls />
            {/* The Activity Logger could go here if you want it on this tab */}
        </>
    );
}