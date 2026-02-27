// main.js - Industrial Flight Deck Controller
import { initHandshake, logTerminalMessage, drawLattice, triggerAttack } from './security/lattice-engine.js';

const state = {
    isBooted: false,
    attackLogged: false,
    missionComplete: false,
    physicsWorker: null,
    fdrView: null,
    writeIndex: 0,
    latency: 4.2,
    latencyHistory: new Array(60).fill(4.2), 
    missionPhase: 'PRE_FLIGHT'
};

document.addEventListener('DOMContentLoaded', () => {
    const latticeCanvas = document.getElementById('lattice-canvas');
    if (latticeCanvas) {
        latticeCanvas.width = latticeCanvas.clientWidth;
        latticeCanvas.height = latticeCanvas.clientHeight;
        drawLattice('lattice-canvas');
    }

    const startBtn = document.getElementById('init-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (!state.isBooted) runPOST();
        });
    }

    setInterval(() => {
        const hbUi = document.getElementById('hb-ui');
        if(hbUi) {
            hbUi.style.opacity = "1";
            setTimeout(() => hbUi.style.opacity = "0.2", 50);
        }
    }, 1000); 
});

/**
 * INDUSTRIAL LOGGING: CRC-8 Integrity Serialization
 */
function updateTelemetryStream(alt, vel) {
    const log = document.getElementById('terminal-box');
    if (!log) return;

    // Simulate CRC-8 Checksum (Industrial Standard)
    const crc8 = (Math.floor(alt) + Math.floor(vel)) % 256;
    const hexCrc = crc8.toString(16).toUpperCase().padStart(2, '0');
    
    // Inject Faults during Attack Phase to show "Safety Consequence"
    const isCorrupted = (state.missionPhase === 'ENGAGEMENT' && Math.random() > 0.85);
    const statusColor = isCorrupted ? "#FF3B3B" : "var(--av-green)";
    const statusText = isCorrupted ? "CRC_ERR" : "CRC_OK";

    const hexAlt = Math.abs(Math.floor(alt)).toString(16).toUpperCase().padStart(4, '0');
    const hexVel = Math.abs(Math.floor(vel)).toString(16).toUpperCase().padStart(4, '0');
    const timestamp = new Date().getMilliseconds();

    const p = document.createElement('p');
    p.style.margin = "0";
    p.style.fontSize = "11px";
    p.innerHTML = `<span style="color: #444;">[${timestamp}]</span> 0x${hexAlt}|0x${hexVel} <span style="color: ${statusColor};">${statusText}[${hexCrc}]</span>`;
    
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
    if (log.childNodes.length > 20) log.removeChild(log.firstChild);
}

async function runPOST() {
    const log = document.getElementById('terminal-box');
    const addLog = (msg, col = "var(--av-green)") => {
        const p = document.createElement('p');
        p.style.color = col; p.style.margin = "2px 0";
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
            const { altitude, velocity, type, phase } = e.data;
            
            const hbWorker = document.getElementById('hb-worker');
            if(hbWorker) {
                hbWorker.style.opacity = "1";
                setTimeout(() => hbWorker.style.opacity = "0.2", 40);
            }

            if (type === 'TELEMETRY') {
                state.missionPhase = phase;
                document.getElementById('current-phase').textContent = phase;
                
                handleSecurityLogic(altitude, velocity);
                recordToBlackBox(altitude, velocity);
                updateTelemetryStream(altitude, velocity);
                drawOscilloscope();

                if (phase === 'COMPLETE' && !state.missionComplete) {
                    runMissionAudit();
                    state.missionComplete = true;
                }
            }
        };

        const canvas = document.getElementById('flight-display');
        const offscreen = canvas.transferControlToOffscreen();
        state.physicsWorker.postMessage({ type: 'INIT', canvas: offscreen }, [offscreen]);

        addLog("AVIONICS_BUS: READY.");
        state.isBooted = true;
        setTimeout(() => state.physicsWorker.postMessage({ type: 'START_FLIGHT' }), 500);

    } catch (e) {
        addLog("CRITICAL FAILURE", "#FF3B3B");
    }
}

function handleSecurityLogic(alt, vel) {
    const latencyEl = document.getElementById('handshake-ms');
    const safetyEl = document.getElementById('safety-calc');
    
    if (state.missionPhase === 'ENGAGEMENT') {
        if (!state.attackLogged) {
            triggerAttack(true); 
            logTerminalMessage("!! WARNING: SIGNAL_NOISE_THRESHOLD_EXCEEDED");
            state.attackLogged = true;
        }
        state.latency = 18.2 + Math.random() * 8.5; 
    } else {
        if (state.attackLogged) {
            triggerAttack(false); 
            logTerminalMessage(">> ATTACK_SUBSIDED. RE-STABILIZING.");
            state.attackLogged = false;
        }
        state.latency = 4.1 + Math.random() * 0.4;
    }
    
    state.latencyHistory.push(state.latency);
    state.latencyHistory.shift();
    if (latencyEl) latencyEl.textContent = state.latency.toFixed(1);

    const speedMS = vel * 0.5144;
    const altLoss = speedMS * (state.latency / 1000);
    if (safetyEl) safetyEl.textContent = `EST. ALT_LOSS: ${altLoss.toFixed(4)}m`;
}

function recordToBlackBox(alt, vel) {
    if (!state.fdrView) return;
    let offset = state.writeIndex * 8;
    if (offset + 8 <= state.fdrView.byteLength) {
        state.fdrView.setFloat32(offset, alt, true);
        state.fdrView.setFloat32(offset + 4, vel, true);
        state.writeIndex = (state.writeIndex + 1) % 1250;
    }

    // FDR Hex Visualization
    if (state.writeIndex % 5 === 0) {
        let hex = "";
        for(let i=0; i<12; i++) hex += state.fdrView.getUint8(i).toString(16).padStart(2, '0') + " ";
        document.getElementById('fdr-hex-display').textContent = hex.toUpperCase() + "...";
    }
}

function runMissionAudit() {
    logTerminalMessage("--- MISSION_AUDIT_REPORT ---");
    logTerminalMessage(`PEAK_OVERHEAD: ${Math.max(...state.latencyHistory).toFixed(2)}ms`);
    logTerminalMessage("INTEGRITY: 100% SECURED [ML-KEM]");
}

function drawOscilloscope() {
    const canvas = document.getElementById('osc-canvas');
    if (!canvas) return;
    const octx = canvas.getContext('2d');
    octx.clearRect(0, 0, canvas.width, canvas.height);
    octx.strokeStyle = (state.latency > 15) ? "#FF3B3B" : "#00FF41";
    octx.beginPath();
    for(let i = 0; i < state.latencyHistory.length; i++) {
        const x = (i / state.latencyHistory.length) * canvas.width;
        const y = canvas.height - (state.latencyHistory[i] / 30) * canvas.height;
        if(i === 0) octx.moveTo(x, y); else octx.lineTo(x, y);
    }
    octx.stroke();
}