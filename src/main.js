import { calculateAirspeed, updateDisplay } from './physics/aerodynamics.js';
import { initHandshake, logTerminalMessage, drawLattice, triggerAttack } from './security/lattice-engine.js';

let altitude = 0;
let isBooted = false;
let flightTimer;
let attackLogged = false; 

window.onload = () => {
    console.log(" cockpit: Online");

    // Initialize the lattice - this version handles its own sizing
    drawLattice('lattice-canvas');

    const startBtn = document.getElementById('init-btn');
    if (startBtn) {
        startBtn.onclick = () => {
            console.log("Button Clicked - Starting Boot...");
            bootSystem();
        };
    } else {
        console.error("Button 'init-btn' not found in HTML!");
    }
};

function bootSystem() {
    if (isBooted) return;
    isBooted = true;

    const securityTag = document.getElementById('security-tag');
    if (securityTag) {
        securityTag.innerText = "SYSTEM: PQC-ACTIVE";
        securityTag.style.color = "#00FFFF"; 
    }
    
    initHandshake(() => {
        flightTimer = setInterval(updateFlightData, 100);
    });
}

function updateFlightData() {
    if (altitude < 35000) {
        altitude += 250; 
        const securityTag = document.getElementById('security-tag');

        if (altitude >= 20000 && altitude <= 25000) {
            triggerAttack(true); 
            if (!attackLogged) {
                logTerminalMessage("CRITICAL: Quantum Decoy Detected!");
                if (securityTag) {
                    securityTag.innerText = "SYSTEM: BREACH ATTEMPT";
                    securityTag.style.color = "red";
                }
                attackLogged = true;
            }
        } else {
            triggerAttack(false);
            if (altitude > 25000 && securityTag) {
                securityTag.innerText = "SYSTEM: PQC-SECURE";
                securityTag.style.color = "#00FFFF";
            }
        }
        updateDisplay(altitude, calculateAirspeed(altitude));
    } else {
        clearInterval(flightTimer); 
        logTerminalMessage("CRUISE ALTITUDE REACHED.");
    }
}