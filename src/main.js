// src/main.js
import { calculateAirspeed, updateDisplay } from './physics/aerodynamics.js';
import { initHandshake, logTerminalMessage } from './security/lattice-engine.js';

let altitude = 0;
let isBooted = false;
let flightTimer;

// Hook up the button directly in JS (The Professional Way)
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.querySelector('button'); // Finds your "Initialize" button
    startBtn.addEventListener('click', bootSystem);
});

function bootSystem() {
    if (isBooted) return;
    isBooted = true;

    document.getElementById('security-tag').innerText = "SYSTEM: PQC-ACTIVE";
    
    // Call the handshake from the security module
    initHandshake(() => {
        flightTimer = setInterval(updateFlightData, 100);
    });
}

function updateFlightData() {
    if (altitude < 35000) {
        altitude += 450; 
        if (altitude > 35000) altitude = 35000;

        // Use the physics module for the calculation
        let airspeed = calculateAirspeed(altitude);
        
        // Use the physics module to update the screen
        updateDisplay(altitude, airspeed);
        
        document.getElementById('ai-msg').innerText = "AI: Ascent in progress. Monitoring encryption stability...";
    } else {
        clearInterval(flightTimer); 
        logTerminalMessage("CRUISE ALTITUDE REACHED. System Stabilized.");
        document.getElementById('ai-msg').innerText = "AI: Flight Stabilized. PQC Monitoring Active.";
    }
}