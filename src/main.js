// main.js - Industrial Flight Deck Controller
import { initHandshake, logTerminalMessage, drawLattice, triggerAttack } from './security/lattice-engine.js';

const state = {
    isBooted: false,
    attackLogged: false,
    physicsWorker: null,
    fdrView: null,
    writeIndex: 0,
    latency: 4.2
};

document.addEventListener('DOMContentLoaded', () => {
    // STEP 2: CANVAS COUPLING & INITIAL RESOLUTION SNAP
    const latticeCanvas = document.getElementById('lattice-canvas');
    if (latticeCanvas) {
        latticeCanvas.width = latticeCanvas.clientWidth;
        latticeCanvas.height = latticeCanvas.clientHeight;
        try {
            drawLattice('lattice-canvas');
        } catch (e) {
            console.error("SYS_ERR: LATTICE_INIT_FAILED", e);
        }
    }

    const startBtn = document.getElementById('init-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (!state.isBooted) runPOST();
        });
    }
});

// INDUSTRIAL LOGGING: Type-Safe Data Serialization (ARINC 429 Mockup)
function updateTelemetryStream(alt, vel) {
    const log = document.getElementById('terminal-box');
    if (!log) return;

    const hexAlt = Math.abs(Math.floor(alt)).toString(16).toUpperCase().padStart(4, '0');
    const hexVel = Math.abs(Math.floor(vel)).toString(16).toUpperCase().padStart(4, '0');
    const timestamp = new Date().getMilliseconds();

    const p = document.createElement('p');
    p.style.margin = "0";
    p.style.fontSize = "11px";
    p.innerHTML = `<span style="color: #444;">[${timestamp}]</span> BUS_01 >> ALT:0x${hexAlt} | VEL:0x${hexVel} | <span style="color: var(--av-green);">CRC_OK</span>`;
    
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;

    if (log.childNodes.length > 25) log.removeChild(log.firstChild);
}

async function runPOST() {
    const log = document.getElementById('terminal-box');
    const addLog = (msg, col = "var(--av-green)") => {
        if (!log) return;
        const p = document.createElement('p');
        p.style.color = col;
        p.style.margin = "2px 0";
        p.textContent = `> ${msg}`;
        log.appendChild(p);
    };

    addLog("POWER-ON SELF-TEST: INITIALIZING...");
    
    const buffer = new ArrayBuffer(10240);
    state.fdrView = new DataView(buffer);
    addLog("FDR_UNIT_0: BUFFER MAPPED [OK]");

    addLog("PQC_KERNEL: INJECTING LATTICE ENTROPY...");
    await initHandshake(); 

    try {
        state.physicsWorker = new Worker('./src/physics/physics-worker.js');

        state.physicsWorker.onmessage = (e) => {
            const { altitude, velocity, type } = e.data;
            if (type === 'TELEMETRY') {
                handleSecurityLogic(altitude);
                recordToBlackBox(altitude, velocity);
                updateTelemetryStream(altitude, velocity);
            }
        };

        const canvas = document.getElementById('flight-display');
        if (canvas) {
            const offscreen = canvas.transferControlToOffscreen();
            state.physicsWorker.postMessage({ 
                type: 'INIT', 
                canvas: offscreen,
                width: canvas.clientWidth,
                height: canvas.clientHeight 
            }, [offscreen]);
            addLog("AVIONICS_BUS: CANVAS_LINKED [OK]");
        }

        addLog("ALL SYSTEMS OPERATIONAL. FLIGHT DECK ACTIVE.");
        state.isBooted = true;
        
        setTimeout(() => {
            state.physicsWorker.postMessage({ type: 'START_FLIGHT' });
        }, 100);

    } catch (e) {
        addLog("CRITICAL FAILURE: WORKER_INIT_FAULT", "var(--tactical-red)");
    }
}

/**
 * STEP 3: PERFORMANCE PROFILING & LATENCY BENCHMARKING
 * Visualizing the Safety Consequence of PQC overhead.
 */
function handleSecurityLogic(alt) {
    const latencyEl = document.getElementById('handshake-ms');
    
    if (alt > 20000 && alt < 25000) {
        if (!state.attackLogged) {
            triggerAttack(true); 
            logTerminalMessage("!! WARNING: SIGNAL_NOISE_THRESHOLD_EXCEEDED");
            logTerminalMessage("!! ACTION: SHIFTING TO ML-KEM-1024 (HIGH-OVERHEAD)");
            state.attackLogged = true;
        }
        // REAL-TIME JITTER: Mimics live hardware performance profiling
        state.latency = (18.2 + Math.random() * 4.5).toFixed(1); 
    } else {
        if (state.attackLogged) {
            triggerAttack(false); 
            logTerminalMessage(">> ATTACK_SUBSIDED. RE-STABILIZING LATTICE.");
            logTerminalMessage(">> STATUS: INTEGRITY_VERIFIED [CRC_MATCH]");
            state.attackLogged = false;
        }
        // Baseline NIST-Standardized Latency
        state.latency = (4.1 + Math.random() * 0.3).toFixed(2);
    }
    
    if (latencyEl) latencyEl.textContent = state.latency;
}

function recordToBlackBox(alt, vel) {
    if (!state.fdrView) return;
    try {
        let offset = state.writeIndex * 8;
        if (offset + 8 <= state.fdrView.byteLength) {
            state.fdrView.setFloat32(offset, alt, true);
            state.fdrView.setFloat32(offset + 4, vel, true);
            state.writeIndex = (state.writeIndex + 1) % 1250;
        }
    } catch (e) {}
}