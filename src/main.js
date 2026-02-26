// main.js - Flight Deck Controller
// import { updateDisplay } from './physics/aerodynamics.js'; // REMOVED to prevent "Missing Element" errors
import { initHandshake, logTerminalMessage, drawLattice, triggerAttack } from './security/lattice-engine.js';

const state = {
    isBooted: false,
    attackLogged: false,
    physicsWorker: null,
    fdrView: null,
    writeIndex: 0
};

document.addEventListener('DOMContentLoaded', () => {
    console.log("Cockpit DOM Ready");
    
    try {
        drawLattice('lattice-canvas');
    } catch (e) {
        console.error("Lattice Error:", e);
    }

    const startBtn = document.getElementById('init-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (!state.isBooted) {
                console.log("Master Start Triggered");
                runPOST();
            }
        });
    }
});

async function runPOST() {
    const log = document.getElementById('terminal-box'); // Simplified target
    const addLog = (msg, col = "cyan") => {
        if (!log) return;
        const p = document.createElement('p');
        p.style.color = col;
        p.style.margin = "2px 0";
        p.style.fontFamily = "'Share Tech Mono', monospace";
        p.textContent = `[${new Date().toISOString().split('T')[1].slice(0,-1)}] ${msg}`;
        log.appendChild(p);
        log.scrollTop = log.scrollHeight;
    };

    addLog("POWER-ON SELF-TEST INITIALIZED...");
    
    const buffer = new ArrayBuffer(10240);
    state.fdrView = new DataView(buffer);
    addLog("FDR_UNIT_0: BUFFER MAPPED [OK]");

    addLog("PQC_KERNEL: INJECTING LATTICE ENTROPY...");
    await initHandshake(); 

    try {
        // Path alignment check
        state.physicsWorker = new Worker('./src/physics/physics-worker.js');

        state.physicsWorker.onmessage = (e) => {
            const { altitude, velocity, type } = e.data;
            if (type === 'TELEMETRY') {
                // We no longer call updateDisplay() because we killed the HTML "ghost" text.
                // The Worker handles all drawing now!
                handleSecurityLogic(altitude);
                recordToBlackBox(altitude, velocity);
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

        addLog("ALL SYSTEMS GREEN. STARTING ENGINE.");
        state.isBooted = true;
        
        // Final Handover
        setTimeout(() => {
            state.physicsWorker.postMessage({ type: 'START_FLIGHT' });
        }, 100);

    } catch (e) {
        addLog("CRITICAL SYSTEM FAILURE: WORKER_INIT", "red");
        console.error("Worker Path Error:", e);
    }
}

function handleSecurityLogic(alt) {
    if (alt > 20000 && alt < 25000) {
        if (!state.attackLogged) {
            triggerAttack(true); 
            logTerminalMessage("CRITICAL: PQC_LATTICE_BREACH_DETECTED");
            state.attackLogged = true;
        }
    } else {
        if (state.attackLogged) {
            triggerAttack(false); 
            logTerminalMessage("SYSTEM_RECOVERY: LATTICE_RE_STABILIZED");
            state.attackLogged = false;
        }
    }
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