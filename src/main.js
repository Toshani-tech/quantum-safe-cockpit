/**
 * main.js - Master Avionics Controller
 * Role: Decoupled Main-Thread Execution & State Management.
 * Safety Consequence: Orchestrates PQC Handshakes and Telemetry Integrity.
 */

import { initHandshake, logTerminalMessage, drawLattice, triggerAttack } from './security/lattice-engine.js';

const state = {
    isBooted: false,
    attackLogged: false,
    missionComplete: false,
    physicsWorker: null,
    latency: 4.2,
    latencyHistory: new Array(60).fill(4.2), 
    missionPhase: 'PRE_FLIGHT'
};

window.onload = () => {
    // 1. HARDENED RESOLUTION LOCK
    const latticeCanvas = document.getElementById('lattice-canvas');
    if (latticeCanvas) {
        // Force dimensions to match the CSS container exactly
        const container = latticeCanvas.parentElement;
        latticeCanvas.width = container.clientWidth;
        latticeCanvas.height = container.clientHeight;
        drawLattice('lattice-canvas');
    }

    const startBtn = document.getElementById('init-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (!state.isBooted) runPOST();
        });
    }

    // Industrial Heartbeat - Visualizing Main Thread Activity
    setInterval(() => {
        const hbUi = document.getElementById('hb-ui');
        if(hbUi) {
            hbUi.style.opacity = "1";
            setTimeout(() => hbUi.style.opacity = "0.2", 50);
        }
    }, 1000); 
};

async function runPOST() {
    const log = document.getElementById('terminal-box');
    if (log) log.innerHTML = ""; 

    logTerminalMessage("SYSTEM_BOOT: INITIALIZING AVIONICS STACK...");
    logTerminalMessage("NIST_ML_KEM: GENERATING POST-QUANTUM ENTROPY...");
    
    await initHandshake(); 

    try {
        state.physicsWorker = new Worker('./src/physics/physics-worker.js', { type: 'module' });

        state.physicsWorker.onmessage = (e) => {
            const { altitude, verticalVelocity, type, phase, airspeed } = e.data;
            
            // Worker Heartbeat - Proves Multi-threaded Concurrency
            const hbWorker = document.getElementById('hb-worker');
            if(hbWorker) {
                hbWorker.style.opacity = "1";
                setTimeout(() => hbWorker.style.opacity = "0.2", 40);
            }

            if (type === 'TELEMETRY') {
                state.missionPhase = phase;
                const phaseEl = document.getElementById('current-phase');
                if (phaseEl) phaseEl.textContent = phase.replace(/_/g, ' ');

                // MASTER CORE UPDATES
                handleSecurityLogic(altitude, verticalVelocity);
                updateTelemetryStream(altitude, airspeed);
                drawOscilloscope();
                updateUIPanelTheme(phase);

                if (phase === 'MISSION_COMPLETE' && !state.missionComplete) {
                    state.missionComplete = true;
                    logTerminalMessage("MISSION_AUDIT: DATA ARCHIVED SUCCESSFULLY.", "#FFBF00");
                }
            }
        };

        // 2. PREVENT SQUASHED UI: Lock dimensions before transfer
        const canvas = document.getElementById('flight-display');
        if (canvas) {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            const offscreen = canvas.transferControlToOffscreen();
            
            state.physicsWorker.postMessage({ 
                type: 'INIT', 
                canvas: offscreen,
                width: width,
                height: height 
            }, [offscreen]);
        }

        logTerminalMessage("AVIONICS_BUS: ARINC-429 LINK ACTIVE.");
        state.isBooted = true;
        setTimeout(() => state.physicsWorker.postMessage({ type: 'START_FLIGHT' }), 800);

    } catch (e) {
        logTerminalMessage("CRITICAL FAILURE: WORKER_BUS_FAULT", "#FF3B3B");
    }
}

/**
 * handleSecurityLogic - Simulates Real-Time Computational Overhead
 */
function handleSecurityLogic(alt, vel) {
    const latencyEl = document.getElementById('handshake-ms');
    const safetyEl = document.getElementById('safety-calc');
    
    if (state.missionPhase === 'ENGAGEMENT_ZONE') {
        if (!state.attackLogged) {
            triggerAttack(true); 
            logTerminalMessage("!! WARNING: SIGNAL JAMMING DETECTED", "#FF3B3B");
            logTerminalMessage("!! ML-KEM: ROTATING LATTICE VECTORS", "#FF3B3B");
            state.attackLogged = true;
        }
        // Attack adds jitter/latency to simulate processing overhead
        state.latency = 18.2 + Math.random() * 8.5; 
    } else {
        if (state.attackLogged) {
            triggerAttack(false);
            logTerminalMessage("SIGNAL CLEAR: SECURE LINK RESTORED.");
            state.attackLogged = false;
        }
        state.latency = 4.1 + Math.random() * 0.4;
    }
    
    state.latencyHistory.push(state.latency);
    state.latencyHistory.shift();
    
    if (latencyEl) latencyEl.textContent = state.latency.toFixed(1);
    if (safetyEl) {
        // High-level Drift Calculation: (Speed * Time = Error Distance)
        const drift = (vel * (state.latency / 1000)).toFixed(4);
        safetyEl.textContent = `EST. CMD_DRIFT: ${drift}FT`;
    }
}

/**
 * drawOscilloscope - Real-time Latency Benchmarking
 */
function drawOscilloscope() {
    const canvas = document.getElementById('osc-canvas');
    if (!canvas) return;
    const octx = canvas.getContext('2d');
    
    // Auto-sync resolution to container
    if (canvas.width !== canvas.clientWidth) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    octx.clearRect(0, 0, canvas.width, canvas.height);
    octx.strokeStyle = (state.latency > 15) ? "#FF3B3B" : "#FFBF00";
    octx.lineWidth = 2;
    
    octx.beginPath();
    for(let i = 0; i < state.latencyHistory.length; i++) {
        const x = (i / (state.latencyHistory.length - 1)) * canvas.width;
        // Scale: Max 40ms height
        const y = canvas.height - (state.latencyHistory[i] / 40) * canvas.height;
        if(i === 0) octx.moveTo(x, y); else octx.lineTo(x, y);
    }
    octx.stroke();
}

function updateTelemetryStream(alt, spd) {
    const log = document.getElementById('terminal-box');
    const fdrHex = document.getElementById('fdr-hex-display');
    if (!log) return;

    const hexAlt = Math.abs(Math.floor(alt)).toString(16).toUpperCase().padStart(4, '0');
    const hexSpd = Math.abs(Math.floor(spd)).toString(16).toUpperCase().padStart(4, '0');
    
    const p = document.createElement('p');
    p.style.margin = "0"; 
    p.style.fontSize = "9px";
    p.innerHTML = `<span style="color: #444;">TX></span> 0x${hexAlt}|0x${hexSpd} <span style="color: #00FF41; opacity: 0.4;">[CRC_OK]</span>`;
    
    log.appendChild(p);
    
    if (fdrHex) {
        const rawHex = Array.from({length: 8}, () => Math.floor(Math.random()*255).toString(16).toUpperCase().padStart(2, '0')).join(' ');
        fdrHex.textContent = rawHex;
    }

    if (log.childNodes.length > 25) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
}

function updateUIPanelTheme(phase) {
    const panels = document.querySelectorAll('.panel');
    const isAttack = (phase === 'ENGAGEMENT_ZONE');
    panels.forEach(p => {
        if (isAttack) p.classList.add('engagement-active');
        else p.classList.remove('engagement-active');
    });
}