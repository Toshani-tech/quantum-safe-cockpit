/**
 * main.js - V11.5 
 */
import init, { execute_pqc_handshake } from '../security-kernel/pkg/security_kernel.js';
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
    telemetryLines: [] // Buffer for rolling hex stream
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

// Kernel Handshake
async function initializeAvionics() {
    try {
        await init(); 
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

//  UI Scaling Logic
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
    try { drawLattice('lattice-canvas'); } catch (e) { console.log("Lattice sync pending..."); }
    
    const startBtn = document.getElementById('init-btn');
    if (startBtn) {
        startBtn.onclick = () => {
            if (!state.isBooted && state.isKernelReady) {
                state.isBooted = true;
                
                startBtn.textContent = "BUS_INIT >> [ACTIVE]";
                startBtn.classList.remove('ready-state');
                startBtn.classList.add('active-state');
                
                updateHeaderStatus('ACTIVE');
                runPOST(); 
            }
        };
    }
});

// 2. Worker Lifecycle Management 
async function runPOST() {
    const canvas = document.getElementById('flight-display');
    const dpr = window.devicePixelRatio || 1;

    try {
        await initHandshake(); 
        state.physicsWorker = new Worker('./src/physics/physics-worker.js', { type: 'module' });

        if (!state.canvasTransferred) {
            const rect = canvas.parentElement.getBoundingClientRect();
            if (rect.width === 0) throw new Error("CANVAS_WIDTH_ZERO");

            canvas.width = Math.floor(rect.width * dpr);
            canvas.height = Math.floor(rect.height * dpr);

            const offscreen = canvas.transferControlToOffscreen();
            state.physicsWorker.postMessage({ 
                type: 'INIT', 
                canvas: offscreen, 
                dpr: dpr 
            }, [offscreen]);
            state.canvasTransferred = true;
        }

        state.physicsWorker.onmessage = (e) => {
            if (e.data.type === 'KERNEL_READY') {
                logTerminalMessage("WORKER_BUS: NIST_L5_MODULE_LOADED", "#00FF41", "0xBUS");
                state.physicsWorker.postMessage({ 
                    type: 'START_FLIGHT',
                    sentTime: performance.now()
                });
                state.isMissionActive = true;
                startRenderLoop();
            }

            if (e.data.type === 'BUS_IDLE') handleMissionComplete();
            
            if (e.data.type === 'TELEMETRY') {
                if (e.data.sentTime && e.data.sentTime > 0) {
                    const rtt = performance.now() - e.data.sentTime;
                    state.latency = Math.max(0.1, rtt); 
                }
                state.lastWorkerData = e.data; 
            }
        };

        logTerminalMessage("IGNITION: DATA_BUS_NOMINAL", "#FFF", "0xPOST_OK");
    } catch (err) {
        logTerminalMessage(`CRITICAL: ${err.message}`, "#FF3B3B", "0xERR");
    }
}

function startRenderLoop() {
    if (state.isLoopRunning) return;
    state.isLoopRunning = true;
    
    function loop() {
        if (state.isTerminated) { state.isLoopRunning = false; return; }

        if (state.physicsWorker && state.isMissionActive && !state.securityEventLocked) {
            // handshake
            state.physicsWorker.postMessage({ sentTime: performance.now() });
        }

        if (state.lastWorkerData && state.isMissionActive) {
            const d = state.lastWorkerData;
            const safeT = Number(d.elapsed);
            const safeAlt = Number(d.altitude);
            const safeSpd = Number(d.airspeed);

            updateTacticalButton(safeAlt, safeSpd, d.missionPhase);

            const tick = Math.floor(safeT * 10);
            if (!state.fdrBuffer[tick] && !isNaN(safeT)) {
                state.fdrBuffer[tick] = {
                    t: safeT, alt: safeAlt, spd: safeSpd,
                    phase: String(d.missionPhase || 'UNKNOWN'), 
                    lat: Number(state.latency)
                };
            }

            if (safeAlt > state.maxAlt) state.maxAlt = safeAlt;
            if (safeSpd > state.maxSpd) state.maxSpd = safeSpd;

            const timerEl = document.getElementById('mission-timer');
            if (timerEl) timerEl.textContent = `T+ ${safeT.toFixed(1)}S`;
            
            const latDisplay = document.getElementById('latency-value');
            if (latDisplay) latDisplay.textContent = state.latency.toFixed(2); // Increased precision for MIT look

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

function updateTacticalButton(alt, spd, phase) {
    const btn = document.getElementById('init-btn');
    if (!btn) return;

    if (alt > 100 && spd < 50) {
        btn.innerText = "WARN: LOW_SPEED / STALL";
        btn.className = "critical-state";
    } 
    else if (phase !== 'PRE_FLIGHT' && phase !== 'MISSION_COMPLETE') {
        btn.innerText = "MODE: FLT / ACTV";
        btn.classList.remove('ready-state');
        btn.classList.add('active-state');
    }
}

function syncVVI(fpm, status, direction) {
    const vviLabel = document.getElementById('vvi-value');
    if (!vviLabel) return;
    vviLabel.textContent = `${direction === 'UP' ? '▲' : direction === 'DOWN' ? '▼' : '―'} VVI: ${Math.abs(Math.round(fpm))} FT/M`;
    vviLabel.style.color = (status === 'DANGER') ? '#FF3B3B' : '#00FF41';
}

// Rolling buffer to visualize the ARINC-style bitstream.
 
function updateTelemetryStream(alt, vel) {
    const hexDisplay = document.getElementById('fdr-hex-display');
    if (!hexDisplay) return;

    
    const hexAlt = Math.floor(alt).toString(16).toUpperCase().padStart(4, '0');
    const hexVel = Math.floor(vel).toString(16).toUpperCase().padStart(4, '0');
    const timestamp = (performance.now() / 1000).toFixed(2);
    
    const newLine = `<div style="margin-bottom: 2px;">
        <span style="color: #666">[${timestamp}]</span> 
        <span style="color: #888">RX_PACKET:</span> 
        <span style="color: var(--av-green)">0x${hexAlt}${hexVel}</span> 
        <span style="color: var(--av-amber)">[AUTH_OK]</span>
    </div>`;

    state.telemetryLines.push(newLine);
    if (state.telemetryLines.length > 8) state.telemetryLines.shift(); 

    hexDisplay.innerHTML = state.telemetryLines.join('');
}

function syncPhase(newPhase) {
    if (newPhase && newPhase !== state.currentPhase) {
        state.currentPhase = newPhase;
        const phaseEl = document.getElementById('current-phase');
        if (phaseEl) phaseEl.textContent = newPhase.replace(/_/g, ' ');
    }
}

function handleSecurityLogic(phase) {
    if (state.securityEventLocked || state.attackLogged) {
        // Reset attack state if we move into final approach
        if (phase === 'FINAL_APPROACH' && state.attackLogged) {
             triggerAttack(false);
             state.attackLogged = false; 
        }
        return;
    }
    
    if (phase === 'ENGAGEMENT_ZONE') {
        state.securityEventLocked = true; 
        state.physicsWorker.postMessage({ type: 'PAUSE_FLIGHT' });
        document.getElementById('security-modal').style.display = 'flex';

        document.getElementById('auth-crypto-btn').onclick = () => {
            document.getElementById('security-modal').style.display = 'none';
            state.attackLogged = true;
            state.securityEventLocked = false; 
            triggerAttack(true); 
            state.physicsWorker.postMessage({ type: 'RESUME_FLIGHT' });
            logTerminalMessage("SECURITY: ML-KEM_SHIELD_L5_ACTIVE", "#00FF41", "0xSAFE");
        };
    }
}

function runMissionStory(elapsed) {
    const time = Number(elapsed);
    const storyMilestones = [
        { t: 4.5, msg: "PHASE: V1_SPEED_REACHED. ROTATING...", color: "#00FF41" },
        { t: 25.0, msg: "AVIONICS: ML-KEM_L5_PROTOCOL_LOCKED", color: "var(--av-amber)" },
        { t: 72.0, msg: "GUIDANCE: GLIDESLOPE_ESTABLISHED", color: "#00FF41", triggerReset: true }
    ];
    storyMilestones.forEach(event => {
        if (time >= event.t && !state.triggeredEvents.has(event.t)) {
            logTerminalMessage(event.msg, event.color, "0xLOG");
            if (event.triggerReset) triggerAttack(false); // Force green on final approach
            state.triggeredEvents.add(event.t);
        }
    });
}

function handleMissionComplete() {
    if (state.isTerminated) return;
    state.isTerminated = true;
    state.isMissionActive = false;
    triggerAttack(false); 
    stopLattice();
    
    updateHeaderStatus('IDLE');

    const btn = document.getElementById('init-btn');
    if (btn) {
        btn.innerText = "XFER DATA [READY]";
        btn.className = ""; 
        btn.style.borderColor = "var(--av-cyan)";
        btn.style.color = "var(--av-cyan)";
    }

    const report = document.getElementById('mission-report');
    if (report) report.style.display = 'flex'; 
    
    document.getElementById('report-alt').textContent = Math.round(state.maxAlt);
    document.getElementById('report-spd').textContent = Math.round(state.maxSpd);
}

// 3. FDR DATA EXPORT (CSV)
document.getElementById('download-fdr-btn').addEventListener('click', () => {
    if (state.fdrBuffer.length === 0) {
        logTerminalMessage("ERROR: NO FDR DATA TO EXTRACT", "#FF3B3B", "0xCSV_FAIL");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Time(S),Altitude(FT),Airspeed(KTS),Phase,Latency(MS)\n";

    state.fdrBuffer.forEach(row => {
        if (row) {
            const line = `${row.t},${row.alt},${row.spd},${row.phase},${row.lat}`;
            csvContent += line + "\n";
        }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FDR_LOG_${new Date().getTime()}.csv`);
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
    
    logTerminalMessage("FDR EXTRACTION SUCCESSFUL", "#00FF41", "0xCSV_OK");
});