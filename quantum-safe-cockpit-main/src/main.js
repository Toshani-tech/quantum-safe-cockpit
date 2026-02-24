
import { calculateAirspeed, updateDisplay } from './physics/aerodynamics.js';
// ADDED triggerAttack to the import list
import { initHandshake, logTerminalMessage, drawLattice, triggerAttack } from './security/lattice-engine.js';

let altitude = 0;
let isBooted = false;
let flightTimer;
let attackLogged = false; // New flag to prevent terminal spamming

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.querySelector('button'); 
    startBtn.addEventListener('click', bootSystem);
});

function bootSystem() {
    if (isBooted) return;
    isBooted = true;

    document.getElementById('security-tag').innerText = "SYSTEM: PQC-ACTIVE";
    
    drawLattice('lattice-canvas'); 

    initHandshake(() => {
        flightTimer = setInterval(updateFlightData, 100);
    });
}

function updateFlightData() {
    if (altitude < 35000) {
        altitude += 450; 
        if (altitude > 35000) altitude = 35000;

        let airspeed = calculateAirspeed(altitude);
        updateDisplay(altitude, airspeed);
        
        // --- PHASE 4: STRESS TEST LOGIC ---
        // Trigger attack between 20,000 and 25,000 feet
        if (altitude > 20000 && altitude < 25000) {
            triggerAttack(true); // Turns lattice RED
            document.getElementById('security-tag').innerText = "ALERT: QUANTUM INTERFERENCE";
            document.getElementById('security-tag').style.color = "red";
            
            if (!attackLogged) {
                logTerminalMessage("CRITICAL: Quantum Decoherence Detected!");
                logTerminalMessage("AI: Initiating Lattice Re-alignment...");
                attackLogged = true;
            }
        } else {
            triggerAttack(false); // Keeps/Turns lattice BLUE
            document.getElementById('security-tag').innerText = "SYSTEM: PQC-ACTIVE";
            document.getElementById('security-tag').style.color = "cyan";
        }
        // ----------------------------------

        document.getElementById('ai-msg').innerText = "AI: Ascent in progress. Monitoring encryption stability...";
    } else {
        clearInterval(flightTimer); 
        logTerminalMessage("CRUISE ALTITUDE REACHED. System Stabilized.");
        document.getElementById('ai-msg').innerText = "AI: Flight Stabilized. PQC Monitoring Active.";
    }
}