/**
 * main.js - INDUSTRIAL FLIGHT DECK CONTROLLER
 * Architecture: Decoupled Main-Thread Execution
 * Strategy: Mission-Phase Sequencing & ARINC-429 Telemetry Simulation.
 */

import { initHandshake, logTerminalMessage, drawLattice, triggerAttack } from './security/lattice-engine.js';

const state = {
    isBooted: false,
    attackLogged: false,
    physicsWorker: null,
    latency: 4.2,
    canvasTransferred: false,
    startTime: 0,
    currentPhase: 'PRE_FLIGHT'
};

/**
 * 1. INITIALIZATION & DYNAMIC RESOLUTION LOCK
 * Ensures the canvas always matches the CSS 300px / 1fr / 320px grid perfectly.
 */
function lockCanvasResolution() {
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Prevents resolution mismatch during "stretch" events
        if (rect.width > 0 && rect.height > 0) {
            canvas.width = Math.floor(rect.width * dpr);
            canvas.height = Math.floor(rect.height * dpr);
        }
    });
}

// Watch for window resizes and re-lock
window.addEventListener('resize', () => {
    lockCanvasResolution();
    if (!state.isBooted) drawLattice('lattice-canvas');
});

document.addEventListener('DOMContentLoaded', () => {
    lockCanvasResolution();
    
    // Immediate Lattice Standby
    try {
        drawLattice('lattice-canvas');
        logTerminalMessage("LATTICE_VISUALIZER: STANDBY", "#00FF41");
    } catch (e) {
        console.error("SYS_ERR: LATTICE_INIT_FAILED", e);
    }

    const startBtn = document.getElementById('init-btn');
    if (startBtn) {
        startBtn.onclick = () => {
            if (!state.isBooted) {
                state.isBooted = true;
                runPOST();
            }
        };
    }
});

/**
 * 2. TELEMETRY STREAM & MEMORY MANAGEMENT (The "Stretch" Fix)
 */
function updateTelemetryStream(alt, vel) {
    const hexDisplay = document.getElementById('fdr-hex-display');
    const log = document.getElementById('terminal-box');
    if (!log) return;

    // Convert to Hex (Aviation Standard)
    const hexAlt = Math.abs(Math.floor(alt)).toString(16).toUpperCase().padStart(4, '0');
    const hexVel = Math.abs(Math.floor(vel)).toString(16).toUpperCase().padStart(4, '0');
    const timestamp = Date.now().toString().slice(-4);

    if (hexDisplay) hexDisplay.textContent = `0x${hexAlt} ${hexVel} ${timestamp}`;

    const p = document.createElement('p');
    p.style.margin = "0 0 2px 0";
    p.style.lineHeight = "1.2";
    p.innerHTML = `<span style="color: #444;">[${timestamp}]</span> BUS_01 >> <span style="color: #FFB000;">ALT:0x${hexAlt}</span> | VEL:0x${hexVel}`;
    
    log.appendChild(p);

    // FIX: Auto-scroll to bottom so footer isn't pushed
    log.scrollTop = log.scrollHeight;

    // FIX: Garbage Collection (Keep only last 20 entries to prevent DOM bloating/stretching)
    if (log.childNodes.length > 20) {
        log.removeChild(log.firstChild);
    }
}

/**
 * 3. POWER-ON SELF-TEST (POST)
 */
async function runPOST() {
    const log = document.getElementById('terminal-box');
    const canvas = document.getElementById('flight-display');
    const startBtn = document.getElementById('init-btn');
    
    if (!canvas || !log) return;

    logTerminalMessage("SYSTEM_POST: STARTING AVIONICS BUS...");
    
    try {
        // Init Physics Worker (Offloading heavy math)
        state.physicsWorker = new Worker('./src/physics/physics-worker.js', { type: 'module' });

        if (!state.canvasTransferred) {
            const offscreen = canvas.transferControlToOffscreen();
            state.physicsWorker.postMessage({ 
                type: 'INIT', 
                canvas: offscreen 
            }, [offscreen]);
            state.canvasTransferred = true;
        }

        // Lock UI button state (Persistent Status Display)
        if (startBtn) {
            startBtn.classList.add('sys-active');
            startBtn.textContent = "BUS_STATUS: INITIALIZING...";
        }

        await initHandshake(); 
        logTerminalMessage("NIST-ML-KEM-1024 HANDSHAKE: VERIFIED");

        state.physicsWorker.onmessage = (e) => {
            if (e.data.type === 'TELEMETRY') {
                const { altitude, airspeed } = e.data;
                const elapsed = (Date.now() - state.startTime) / 1000;
                
                updateMissionPhase(elapsed);
                handleSecurityLogic(altitude, state.currentPhase);
                updateTelemetryStream(altitude, airspeed);
                
                const timerEl = document.getElementById('mission-timer');
                if (timerEl) timerEl.textContent = `T+ ${elapsed.toFixed(1)}S`;

                // Update Progress on the persistent footer button
                if (startBtn && elapsed <= 90) {
                    const progress = ((elapsed / 90) * 100).toFixed(0);
                    startBtn.textContent = `MISSION_CHRONO: ${progress}% [BUS_ACTIVE]`;
                } else if (startBtn) {
                    startBtn.textContent = "MISSION_COMPLETE: SYSTEM_READY";
                    startBtn.style.color = "#00FF41";
                }
            }
        };

        state.startTime = Date.now();
        state.physicsWorker.postMessage({ type: 'START_FLIGHT' });
        logTerminalMessage("MISSION_START: THROTTLE_UP", "#FFF");

    } catch (e) {
        logTerminalMessage("CRITICAL FAILURE: BUS_INIT_FAULT", "#FF3B3B");
        if (startBtn) startBtn.textContent = "SYSTEM_FAULT: CHECK_LOGS";
        console.error(e);
    }
}

/**
 * 4. MISSION CHRONOMETER (Phase-Logic Implementation)
 */
function updateMissionPhase(elapsed) {
    let nextPhase = 'STARTUP_TAXI';

    if (elapsed > 90) nextPhase = 'MISSION_COMPLETE';
    else if (elapsed > 75) nextPhase = 'FINAL_APPROACH';
    else if (elapsed > 45) nextPhase = 'ENGAGEMENT_ZONE'; 
    else if (elapsed > 10) nextPhase = 'STEADY_CLIMB';

    if (nextPhase !== state.currentPhase) {
        state.currentPhase = nextPhase;
        state.physicsWorker.postMessage({ type: 'SET_PHASE', phase: nextPhase });
        logTerminalMessage(`PHASE_TRANSITION: ${nextPhase}`, "#00FF41");
        
        const phaseEl = document.getElementById('current-phase');
        if (phaseEl) phaseEl.textContent = nextPhase;
    }
}

/**
 * 5. SECURITY & LATENCY MONITORING
 */
function handleSecurityLogic(alt, phase) {
    const latencyEl = document.getElementById('handshake-ms');
    const pfdPanel = document.getElementById('air-data-panel'); 
    
    if (phase === 'ENGAGEMENT_ZONE') {
        if (!state.attackLogged) {
            triggerAttack(true); 
            logTerminalMessage("!! WARNING: CRYPTO_CHALLENGE_DETECTED", "#FF3B3B");
            if (pfdPanel) pfdPanel.classList.add('engagement-active');
            state.attackLogged = true;
        }
        state.latency = (8.4 + Math.random() * 2.2).toFixed(1); 
    } else {
        if (state.attackLogged) {
            triggerAttack(false); 
            logTerminalMessage("THREAT_NEUTRALIZED: RESUMING STANDBY", "#00FF41");
            if (pfdPanel) pfdPanel.classList.remove('engagement-active');
            state.attackLogged = false;
        }
        state.latency = (4.1 + Math.random() * 0.15).toFixed(2);
    }
    
    if (latencyEl) latencyEl.textContent = `LATENCY: ${state.latency}ms`;
}