import { updateDisplay } from './physics/aerodynamics.js';
import { initHandshake, logTerminalMessage, drawLattice } from './security/lattice-engine.js';

// System State
const state = {
    isBooted: false,
    attackLogged: false,
    physicsWorker: null,
    fdrView: null
};

window.onload = () => {
    // Initial UI Setup (Still "Bakwaas" but getting better)
    drawLattice('lattice-canvas');
    
    const startBtn = document.getElementById('init-btn');
    startBtn.onclick = () => runPOST();
};

async function runPOST() {
    if (state.isBooted) return;
    
    // 1. Initial Visuals
    const log = document.getElementById('boot-terminal');
    const addLog = (msg, col = "var(--avionics-green)") => {
        const p = document.createElement('p');
        p.style.color = col;
        p.textContent = `[${new Date().toISOString().split('T')[1].slice(0,-1)}] ${msg}`;
        log.appendChild(p);
        log.scrollTop = log.scrollHeight;
    };

    addLog("POWER-ON SELF-TEST INITIALIZED...");
    
    // 2. Memory Allocation (Black Box)
    const buffer = new ArrayBuffer(10240); // 10KB
    state.fdrView = new DataView(buffer);
    addLog("FDR_UNIT_0: 10KB BUFFER MAPPED [OK]");

    // 3. Thread Spawning (Web Worker)
    state.physicsWorker = new Worker('physics-worker.js');
    
    // Transfer Canvas Control (The Flex)
    const canvas = document.getElementById('flight-display');
    const offscreen = canvas.transferControlToOffscreen();
    state.physicsWorker.postMessage({ type: 'INIT', canvas: offscreen }, [offscreen]);

    // 4. Handle incoming telemetry from Worker
    state.physicsWorker.onmessage = (e) => {
        const { altitude, velocity, type } = e.data;
        
        if (type === 'TELEMETRY') {
            updateDisplay(altitude, velocity);
            handleSecurityLogic(altitude);
            recordToBlackBox(altitude, velocity);
        }
    };

    addLog("PQC_KERNEL: INJECTING LATTICE ENTROPY...");
    addLog("ALL SYSTEMS GREEN. COMMENCING FLIGHT OPS.");
    
    state.isBooted = true;
    state.physicsWorker.postMessage({ type: 'START_FLIGHT' });
}

function handleSecurityLogic(alt) {
    const securityTag = document.getElementById('security-tag');
    // Move your Quantum Breach logic here
    if (alt >= 20000 && alt <= 25000) {
        if (!state.attackLogged) {
            securityTag.innerText = "SYSTEM: BREACH ATTEMPT";
            securityTag.style.color = "red";
            logTerminalMessage("CRITICAL: Quantum Decoy Detected!");
            state.attackLogged = true;
        }
    } else if (alt > 25000) {
        securityTag.innerText = "SYSTEM: PQC-SECURE";
        securityTag.style.color = "#00FFFF";
    }
}

// Clean recording logic
let writeIndex = 0;
function recordToBlackBox(alt, vel) {
    let offset = writeIndex * 8;
    state.fdrView.setFloat32(offset, alt, true);
    state.fdrView.setFloat32(offset + 4, vel, true);
    writeIndex = (writeIndex + 1) % 1250;
}