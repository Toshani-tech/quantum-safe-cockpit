import { calculateAirspeed, updateDisplay } from './physics/aerodynamics.js';
import { initHandshake, logTerminalMessage, drawLattice, triggerAttack } from './security/lattice-engine.js';

let altitude = 0;
let isBooted = false;
let flightTimer;
let attackLogged = false; 

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('init-btn');
    if (startBtn) {
        startBtn.addEventListener('click', bootSystem);
    }
    // Start drawing the dots immediately so the screen isn't empty
    drawLattice('lattice-canvas');
});

function bootSystem() {
    if (isBooted) return;
    isBooted = true;

    const tag = document.getElementById('security-tag');
    tag.innerText = "SYSTEM: PQC-ACTIVE";
    tag.style.color = "#00FFFF"; 
    
    initHandshake(() => {
        flightTimer = setInterval(updateFlightData, 100);
    });
}

function updateFlightData() {
    if (altitude < 35000) {
        altitude += 250; // Ascent increment
        if (altitude > 35000) altitude = 35000;

        // --- PHASE 4 RED ALERT TRIGGER (20k - 25k) ---
        if (altitude >= 20000 && altitude <= 25000) {
            triggerAttack(true); 
            if (!attackLogged) {
                logTerminalMessage("CRITICAL: Quantum Decoy Detected in 20K-25K Range!");
                document.getElementById('security-tag').innerText = "SYSTEM: BREACH ATTEMPT";
                document.getElementById('security-tag').style.color = "red";
                attackLogged = true;
            }
        } else {
            triggerAttack(false);
            if (altitude > 25000) {
                document.getElementById('security-tag').innerText = "SYSTEM: PQC-SECURE";
                document.getElementById('security-tag').style.color = "#00FFFF";
            }
        }

        let airspeed = calculateAirspeed(altitude);
        updateDisplay(altitude, airspeed);
        
        document.getElementById('ai-msg').innerText = "AI: Monitoring encryption stability...";
    } else {
        clearInterval(flightTimer); 
        logTerminalMessage("CRUISE ALTITUDE REACHED. System Stabilized.");
        document.getElementById('ai-msg').innerText = "AI: Flight Stabilized. PQC Monitoring Active.";
    }
}