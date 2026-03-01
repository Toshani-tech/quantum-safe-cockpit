/**
 * main.js - INDUSTRIAL FLIGHT DECK CONTROLLER (V5.2)
 * Architecture: Decoupled Main-Thread Execution / NIST ML-KEM Shield
 * PATH CONFIG: Assumes main.js is in /src/
 */

import { initHandshake, logTerminalMessage, drawLattice, triggerAttack } from './security/lattice-engine.js';

const state = {
    isBooted: false,
    attackLogged: false,
    physicsWorker: null,
    latency: 4.2,
    canvasTransferred: false,
    currentPhase: 'PRE_FLIGHT',
    isMissionActive: false 
};

/**
 * 1. UI ARCHITECTURE - Dynamic Scaling & High-DPI Support
 */
function lockCanvasResolution() {
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
        // Skip PFD if ownership is already transferred to the Physics Worker
        if (canvas.id === 'flight-display' && state.canvasTransferred) return;
        
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        if (rect.width > 0 && rect.height > 0) {
            canvas.width = Math.floor(rect.width * dpr);
            canvas.height = Math.floor(rect.height * dpr);
        }
    });
}

window.addEventListener('resize', lockCanvasResolution);

document.addEventListener('DOMContentLoaded', () => {
    lockCanvasResolution();
    
    // Initialize Lattice Visualizer (Security Thread Simulation)
    try {
        drawLattice('lattice-canvas');
    } catch (e) {
        console.warn("LATTICE_VIS_DELAY: Engine warming up...");
    }
    
    const startBtn = document.getElementById('init-btn');
    if (startBtn) {
        startBtn.onclick = () => {
            if (!state.isBooted) {
                state.isBooted = true;
                runPOST(); // Power-On Self-Test
            }
        };
    }
});

/**
 * 2. SYSTEM_POST & WORKER INITIALIZATION
 */
async function runPOST() {
    const canvas = document.getElementById('flight-display');
    const startBtn = document.getElementById('init-btn');
    const timerEl = document.getElementById('mission-timer');
    const statusLightWorker = document.getElementById('hb-worker');
    const fccLabel = document.getElementById('fcc-label');
    
    if (!canvas) {
        console.error("CRITICAL: PFD_CANVAS_NOT_FOUND");
        return;
    }

    logTerminalMessage("SYSTEM_POST: INITIALIZING AVIONICS BUS...");
    
    try {
        // PATH RESOLUTION: Worker is in /src/physics/ relative to /src/main.js
        state.physicsWorker = new Worker('./physics/physics-worker.js', { type: 'module' });

        if (!state.canvasTransferred) {
            const offscreen = canvas.transferControlToOffscreen();
            // Hardware Acceleration: Moving PFD rendering to the FCC Thread
            state.physicsWorker.postMessage({ type: 'INIT', canvas: offscreen }, [offscreen]);
            state.canvasTransferred = true;
        }

        // Perform NIST ML-KEM Handshake (Simulated Lattice Exchange)
        await initHandshake(); 
        logTerminalMessage("NIST-ML-KEM-1024: SECURE LINK ESTABLISHED", "#00FF41");

        // TELEMETRY BRIDGE - High Frequency Data Stream
        state.physicsWorker.onmessage = (e) => {
            if (e.data.type === 'BUS_IDLE') {
                handleMissionComplete(startBtn, statusLightWorker, fccLabel);
                return;
            }

            if (e.data.type === 'TELEMETRY') {
                const { altitude, airspeed, elapsed, missionPhase } = e.data;
                const timeNum = parseFloat(elapsed);

                if (state.isMissionActive) {
                    syncPhase(missionPhase);
                    
                    if (timerEl) timerEl.textContent = `T+ ${timeNum.toFixed(1)}S`;
                    
                    if (startBtn) {
                        const progress = Math.min(100, (timeNum / 90) * 100).toFixed(0);
                        startBtn.textContent = `DATA_LINK: ${progress}% [${state.currentPhase}]`;
                    }
                }

                handleSecurityLogic(state.currentPhase);
                updateTelemetryStream(altitude, airspeed);
            }
        };

        // IGNITION SEQUENCE
        state.isMissionActive = true;
        if (statusLightWorker) statusLightWorker.style.background = "#FFBF00"; 
        if (fccLabel) {
            fccLabel.style.color = "#00FF41";
            fccLabel.textContent = "FCC_THREAD: ACTIVE";
        }

        state.physicsWorker.postMessage({ type: 'START_FLIGHT' });
        logTerminalMessage("MISSION_START: DETACHING UMBILICAL", "#FFF");

    } catch (err) {
        console.error("AVIONICS_BUS_ERROR:", err);
        logTerminalMessage("CRITICAL FAILURE: BUS_INIT_ERROR", "#FF3B3B");
    }
}

/**
 * 3. TELEMETRY & SECURITY SYNC
 */
function syncPhase(newPhase) {
    if (newPhase && newPhase !== state.currentPhase) {
        state.currentPhase = newPhase;
        logTerminalMessage(`PHASE_TRANSITION: ${newPhase}`, "#FFB000");
        
        const phaseLabel = document.getElementById('current-phase');
        if (phaseLabel) phaseLabel.textContent = newPhase;
    }
}

function updateTelemetryStream(alt, vel) {
    const hexDisplay = document.getElementById('fdr-hex-display');
    const log = document.getElementById('terminal-box');
    if (!hexDisplay || !log) return;

    // ARINC-429 Bit-Level Simulation
    const hexAlt = Math.max(0, Math.floor(alt)).toString(16).toUpperCase().padStart(4, '0');
    const hexVel = Math.max(0, Math.floor(vel)).toString(16).toUpperCase().padStart(4, '0');

    hexDisplay.textContent = `BUS_DATA: 0x${hexAlt} 0x${hexVel} | CH_A: NOMINAL`;

    const line = document.createElement('div');
    line.style.fontSize = "9px";
    line.style.fontFamily = "'Share Tech Mono', monospace";
    line.innerHTML = `<span style="color: #444;">></span> RX_BLOCK: <span style="color: #FFBF00;">0x${hexAlt}${hexVel}</span>`;
    log.appendChild(line);
    
    if (log.childNodes.length > 15) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
}

function handleSecurityLogic(phase) {
    const latencyEl = document.getElementById('handshake-ms');
    const securityTag = document.getElementById('security-tag');
    
    if (phase === 'ENGAGEMENT_ZONE') {
        if (!state.attackLogged) {
            triggerAttack(true); 
            logTerminalMessage("!! ALERT: MALICIOUS_TELEMETRY_INJECTION", "#FF3B3B");
            state.attackLogged = true;
            if (securityTag) securityTag.textContent = "STATE: LATTICE_SHIELD_ACTIVE";
        }
        state.latency = (7.2 + Math.random() * 5).toFixed(1); 
    } else {
        if (state.attackLogged && (phase === 'FINAL_APPROACH' || phase === 'MISSION_COMPLETE')) {
            triggerAttack(false); 
            logTerminalMessage("SECURITY: ATTACK_NEUTRALIZED", "#00FF41");
            state.attackLogged = false;
            if (securityTag) securityTag.textContent = "STATE: NIST-ML-KEM-1024";
        }
        state.latency = (4.1 + Math.random() * 0.2).toFixed(2);
    }
    
    if (latencyEl) latencyEl.textContent = `LATENCY: ${state.latency}ms`;
}

function handleMissionComplete(btn, light, label) {
    state.isMissionActive = false;
    if (btn) {
        btn.textContent = "MISSION_COMPLETE: BUS_IDLE";
        btn.style.color = "#00FF41";
        btn.style.borderColor = "#00FF41";
    }
    if (light) light.style.background = "#1a1a1a";
    if (label) {
        label.textContent = "FCC_THREAD: STANDBY";
        label.style.color = "#888";
    }
    logTerminalMessage("SYSTEM: SHUTTING DOWN AVIONICS BUS [0x00]", "#FFB000");
}