/* main.js - V13.2 */

import init, { init_panic_hook, get_telemetry_buffer_ptr, memory } from '../security-kernel/pkg/security_kernel.js';
import { initHandshake, logTerminalMessage, drawLattice, triggerAttack, stopLattice } from './security/lattice-engine.js';

const state = {
    isBooted: false,
    attackLogged: false,
    physicsWorker: null,
    latency: 0.0, 
    canvasTransferred: false,
    currentPhase: 'PRE_FLIGHT',
    isMissionActive: false,
    isLoopRunning: false, 
    triggeredEvents: new Set(),
    maxAlt: 0,
    maxSpd: 0,
    fdrBuffer: [], 
    isKernelReady: false,
    lastWorkerData: null,
    isBusBusy: false,
    isTerminated: false,
    securityEventLocked: false,
    telemetryLines: [],
    isMitMAttackActive: false
};

let telemetryBufferPtr = null;

let lastLogTime = 0;
const LOG_FREQUENCY = 0.5;

const gaussianRandom = () => {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); 
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

function updateHeaderStatus(status) {
    const busLight = document.getElementById('hb-ui');
    const busText = document.getElementById('bus-status-text');
    const fccLight = document.getElementById('fcc-status-light');
    const fccText = document.getElementById('fcc-status-text');
    const modeTag = document.getElementById('security-tag');

    if (status === 'ACTIVE') {
        const activeGreen = "var(--av-green)";
        const activeGlow = "0 0 10px var(--av-green)";

        [busLight, fccLight].forEach(el => {
            if (el) {
                el.style.background = activeGreen;
                el.style.boxShadow = activeGlow;
            }
        });

        [busText, fccText, modeTag].forEach(el => {
            if (el) {
                el.style.color = activeGreen;
                if (el === modeTag) el.textContent = "MODE: ML-KEM-1024 [SECURE]";
                else el.textContent = el.textContent.replace("STANDBY", "ACTIVE").replace("IDLE", "ACTIVE");
            }
        });
    } else {
        const standbyAmber = "var(--av-amber)";
        const standbyGlow = "0 0 4px var(--av-amber)";

        if (busLight) {
            busLight.style.background = standbyAmber;
            busLight.style.boxShadow = standbyGlow;
        }
        if (fccLight) {
            fccLight.style.background = standbyAmber;
            fccLight.style.boxShadow = standbyGlow;
        }

        if (busText) {
            busText.textContent = "BUS_MAIN: STANDBY";
            busText.style.color = standbyAmber;
        }
        if (fccText) {
            fccText.textContent = "FCC_PROC: STANDBY";
            fccText.style.color = standbyAmber;
        }
        if (modeTag) {
            modeTag.textContent = "MODE: ML-KEM [WAITING]";
            modeTag.style.color = standbyAmber;
        }
    }
}

async function initializeAvionics() {
    try {
        await init();
        init_panic_hook();
        telemetryBufferPtr = get_telemetry_buffer_ptr();
        
        state.isKernelReady = true;
        logTerminalMessage("SECURITY KERNEL LINK ESTABLISHED [NIST_L5]", "#00FF41", "0xBOOT");
        
        const startBtn = document.getElementById('init-btn');
        if (startBtn) {
            startBtn.classList.add('ready-state');
            startBtn.textContent = "SYSTEM_READY: ENGAGE MISSION BUS";
        }
        updateHeaderStatus('STANDBY');
    } catch (error) {
        logTerminalMessage("CRITICAL ERROR: KERNEL LINK FAILED", "#FF3B3B", "0xFAIL");
    }
}
initializeAvionics();