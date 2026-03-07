/**
 * main.js - V10.3 [STABILIZED_RECOVERY + LATENCY_FIX]
 * Feature: Explicit Telemetry Sanitization & Round-Trip Latency Tracking.
 * Fix: Explicit DOM targeting for latency and mirrored RTT calculation.
 */
import init, { encrypt_telemetry } from '../security-kernel/pkg/security_kernel.js';
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
    securityEventLocked: false 
};

// 0. INITIALIZE WASM KERNEL
async function initializeAvionics() {
    try {
        await init(); 
        if (typeof encrypt_telemetry === 'function') {
            state.isKernelReady = true;
            logTerminalMessage(">> SECURITY KERNEL LINK ESTABLISHED", "#00FF41");
            const startBtn = document.getElementById('init-btn');
            if (startBtn) {
                startBtn.classList.add('ready-state');
                startBtn.textContent = "SYSTEM_READY: INITIATE_POST";
            }
        }
    } catch (error) {
        logTerminalMessage(">> CRITICAL ERROR: KERNEL LINK FAILED", "#FF3B3B");
    }
}
initializeAvionics();

// 1. UI SETUP
function lockCanvasResolution() {
    const canvases = document.querySelectorAll('canvas');
    const dpr = window.devicePixelRatio || 1;
    canvases.forEach(canvas => {
        if (canvas.id === 'flight-display' && state.canvasTransferred) return;
        const rect = canvas.parentElement.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            canvas.width = Math.floor(rect.width * dpr);
            canvas.height = Math.floor(rect.height * dpr);
        }
    });
}
window.addEventListener('resize', lockCanvasResolution);

document.addEventListener('DOMContentLoaded', () => {
    lockCanvasResolution();
    try { drawLattice('lattice-canvas'); } catch (e) {}
    
    const startBtn = document.getElementById('init-btn');
    if (startBtn) {
        startBtn.onclick = () => {
            if (!state.isBooted && state.isKernelReady) {
                state.isBooted = true;
                runPOST(); 
            }
        };
    }
});

// 2. POWER-ON SELF-TEST & WORKER START
async function runPOST() {
    const canvas = document.getElementById('flight-display');
    try {
        await initHandshake(); 
        state.physicsWorker = new Worker('./src/physics/physics-worker.js', { type: 'module' });

        if (!state.canvasTransferred) {
            const offscreen = canvas.transferControlToOffscreen();
            state.physicsWorker.postMessage({ 
                type: 'INIT', canvas: offscreen, dpr: window.devicePixelRatio 
            }, [offscreen]);
            state.canvasTransferred = true;
        }

        state.physicsWorker.onmessage = (e) => {
            if (e.data.type === 'BUS_IDLE') handleMissionComplete();
            
            if (e.data.type === 'TELEMETRY') {
                // --- LATENCY CALCULATION ---
                // We take current time and subtract the time this request was originally sent
                if (e.data.sentTime && e.data.sentTime > 0) {
                    const rtt = performance.now() - e.data.sentTime;
                    state.latency = Math.max(0.1, rtt); 
                }
                state.lastWorkerData = e.data; 
            }
        };

        state.isMissionActive = true;
        startRenderLoop();
        
        // Initial Ignition
        state.physicsWorker.postMessage({ 
            type: 'START_FLIGHT',
            sentTime: performance.now()
        });
        
        logTerminalMessage("IGNITION: DATA_BUS_NOMINAL", "#FFF", "0xPOST_OK");
    } catch (err) {
        logTerminalMessage("CRITICAL: BUS_INIT_FAILURE", "#FF3B3B");
    }
}

// 3. MAIN RENDER & TELEMETRY LOOP
function startRenderLoop() {
    if (state.isLoopRunning) return;
    state.isLoopRunning = true;
    
    function loop() {
        if (state.isTerminated) { state.isLoopRunning = false; return; }

        // REQUEST DATA PING: Essential to keep the Latency number moving
        if (state.physicsWorker && state.isMissionActive) {
            state.physicsWorker.postMessage({
                type: 'REQUEST_DATA',
                sentTime: performance.now()
            });
        }

        if (state.lastWorkerData && state.isMissionActive) {
            const d = state.lastWorkerData;
            
            // SANITIZATION
            const safeT = Number(d.elapsed);
            const safeAlt = Number(d.altitude);
            const safeSpd = Number(d.airspeed);

            // Record to FDR Buffer
            const tick = Math.floor(safeT * 10);
            if (!state.fdrBuffer[tick] && !isNaN(safeT)) {
                state.fdrBuffer[tick] = {
                    t: safeT, 
                    alt: safeAlt, 
                    spd: safeSpd,
                    phase: String(d.missionPhase || 'UNKNOWN'), 
                    lat: Number(state.latency)
                };
            }

            // High-Water Marks
            if (safeAlt > state.maxAlt) state.maxAlt = safeAlt;
            if (safeSpd > state.maxSpd) state.maxSpd = safeSpd;

            // UI Updates
            const timerEl = document.getElementById('mission-timer');
            if (timerEl) timerEl.textContent = `T+ ${safeT.toFixed(1)}S`;
            
            // LATENCY UI UPDATE
            const latDisplay = document.getElementById('latency-value');
            if (latDisplay) {
                latDisplay.textContent = state.latency.toFixed(1);
            }

            syncVVI(d.verticalVelocity, d.vviStatus, d.vviDirection); 
            syncPhase(d.missionPhase);
            updateTelemetryStream(safeAlt, safeSpd);
            handleSecurityLogic(d.missionPhase);
            runMissionStory(safeT);
            
            state.lastWorkerData = null; 
        }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

// 4. SECURITY & HUD UTILS
function syncVVI(fpm, status, direction) {
    const vviLabel = document.getElementById('vvi-value');
    const vviArrow = document.getElementById('vvi-arrow');
    if (!vviLabel) return;
    vviLabel.textContent = Math.abs(Math.round(fpm));
    const color = (status === 'DANGER') ? '#FF3B3B' : '#00FF41';
    vviLabel.style.color = color;
    if (vviArrow) vviArrow.textContent = direction === 'UP' ? '▲' : (direction === 'DOWN' ? '▼' : '―');
}

function updateTelemetryStream(alt, vel) {
    const hexDisplay = document.getElementById('fdr-hex-display');
    if (!hexDisplay) return;
    const hexAlt = Math.floor(alt).toString(16).toUpperCase().padStart(4, '0');
    const hexVel = Math.floor(vel).toString(16).toUpperCase().padStart(4, '0');
    hexDisplay.textContent = `RX: 0x${hexAlt}${hexVel} | LAT: ${state.latency.toFixed(1)}ms`;
}

function syncPhase(newPhase) {
    if (newPhase && newPhase !== state.currentPhase) {
        state.currentPhase = newPhase;
        const phaseEl = document.getElementById('current-phase');
        if (phaseEl) phaseEl.textContent = newPhase;
    }
}

function handleSecurityLogic(phase) {
    if (state.securityEventLocked || state.attackLogged) return;
    if (phase === 'ENGAGEMENT_ZONE') {
        state.securityEventLocked = true; 
        state.isMissionActive = false; 
        state.physicsWorker.postMessage({ type: 'PAUSE_FLIGHT' });
        document.getElementById('security-modal').style.display = 'flex';

        document.getElementById('auth-crypto-btn').onclick = () => {
            document.getElementById('security-modal').style.display = 'none';
            state.attackLogged = true;
            state.isMissionActive = true;
            triggerAttack(true); 
            state.physicsWorker.postMessage({ type: 'RESUME_FLIGHT' });
            logTerminalMessage("SECURITY: ML-KEM_SHIELD_ACTIVE", "#00FF41", "0xSAFE");
        };
    }
}

function runMissionStory(elapsed) {
    const time = Number(elapsed);
    const storyMilestones = [
        { t: 4.5, msg: "PHASE: V1_SPEED_REACHED. ROTATING...", color: "#00FF41" },
        { t: 25.0, msg: "AVIONICS: ML-KEM_PROTOCOL_LOCKED", color: "var(--av-amber)" }
    ];
    storyMilestones.forEach(event => {
        if (time >= event.t && !state.triggeredEvents.has(event.t)) {
            logTerminalMessage(event.msg, event.color, "0xLOG");
            state.triggeredEvents.add(event.t);
        }
    });
}

// 5. TERMINATION & DOWNLOAD FIX
function handleMissionComplete() {
    if (state.isTerminated) return;
    state.isTerminated = true;
    state.isMissionActive = false;
    stopLattice();

    const report = document.getElementById('mission-report');
    if (report) report.style.display = 'flex'; 
    
    document.getElementById('report-alt').textContent = Math.round(state.maxAlt);
    document.getElementById('report-spd').textContent = Math.round(state.maxSpd);
    
    const dlBtn = document.getElementById('download-fdr-btn');
    if (dlBtn) {
        dlBtn.onclick = (e) => {
            e.preventDefault();
            exportFDR();
        };
    }
}

function exportFDR() {
    const buffer = state.fdrBuffer.filter(r => r && typeof r.t === 'number');
    
    if (buffer.length === 0) {
        alert("CRITICAL: FDR Buffer Empty. Export Aborted.");
        return;
    }

    let csv = "T_ELAPSED,ALTITUDE_FT,AIRSPEED_KTS,LATENCY_MS,PHASE\n";
    
    try {
        buffer.forEach(r => {
            const timeStr = (r.t && r.t.toFixed) ? r.t.toFixed(2) : String(r.t);
            csv += `${timeStr},${Math.round(r.alt)},${Math.round(r.spd)},${r.lat.toFixed(1)},${r.phase}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `FDR_DATA_RECOVERY_${Date.now()}.csv`;
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);

        logTerminalMessage(">> FDR_EXPORT: SUCCESS", "#00FF41");
    } catch (err) {
        console.error("FDR_EXPORT_FAILED:", err);
        alert("FDR Error: Check console for type-mismatch details.");
    }
}