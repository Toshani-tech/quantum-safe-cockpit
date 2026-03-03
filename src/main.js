/**
 * main.js - V8.0 INDUSTRIAL MASTER BUS
 * Architecture: Human-in-the-Loop (HITL) Intervention / NIST ML-KEM
 * Added: Black Box (FDR) Logic - Real-time Data Serialization & CSV Export
 */

import { initHandshake, logTerminalMessage, drawLattice, triggerAttack } from './security/lattice-engine.js';

const state = {
    isBooted: false,
    attackLogged: false,
    physicsWorker: null,
    latency: 4.2,
    canvasTransferred: false,
    currentPhase: 'PRE_FLIGHT',
    isMissionActive: false,
    triggeredEvents: new Set(),
    maxAlt: 0,
    maxSpd: 0,
    // --- BLACK BOX STORAGE ---
    fdrBuffer: [] 
};

/**
 * 1. UI ARCHITECTURE
 */
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
    try { drawLattice('lattice-canvas'); } catch (e) { console.warn("SYSTEM: LATTICE_VIS_DELAY"); }
    
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
 * 2. MISSION STORY SCRIPT
 */
function runMissionStory(elapsed) {
    const time = parseFloat(elapsed);
    const storyMilestones = [
        { t: 2, msg: "FCC_STATUS: MASTER_CAUTION_OFF. THRUST_100%", color: "#FFF" },
        { t: 10, msg: "PHASE: V1_SPEED_REACHED. ROTATING...", color: "var(--av-green)" },
        { t: 18, msg: "GEAR_STATUS: RETRACTED. POSITIVE_RATE_CLIMB", color: "#FFF" },
        { t: 30, msg: "AVIONICS: DH_PROTOCOL_INIT... BUS_ENCRYPTED", color: "var(--av-amber)" },
        { t: 78, msg: "PILOT_INFO: FINAL_APPROACH_VECTOR_LOCKED", color: "#FFF" },
        { t: 85, msg: "AUTO_LAND: FLARE_SEQUENCE_ARMED", color: "var(--av-amber)" }
    ];

    storyMilestones.forEach(event => {
        if (time >= event.t && !state.triggeredEvents.has(event.t)) {
            logTerminalMessage(event.msg, event.color);
            state.triggeredEvents.add(event.t);
        }
    });
}

/**
 * 3. SYSTEM_POST & FCC INITIALIZATION
 */
async function runPOST() {
    const canvas = document.getElementById('flight-display');
    const startBtn = document.getElementById('init-btn');
    const timerEl = document.getElementById('mission-timer');
    const statusLightWorker = document.getElementById('hb-worker');
    const fccLabel = document.getElementById('fcc-label');
    const dpr = window.devicePixelRatio || 1;

    if (!canvas) return;
    logTerminalMessage("SYSTEM_POST: TESTING AVIONICS BUS...");
    
    try {
        state.physicsWorker = new Worker('./src/physics/physics-worker.js', { type: 'module' });

        if (!state.canvasTransferred) {
            const offscreen = canvas.transferControlToOffscreen();
            state.physicsWorker.postMessage({ type: 'INIT', canvas: offscreen, dpr: dpr }, [offscreen]);
            state.canvasTransferred = true;
        }

        await initHandshake(); 
        logTerminalMessage("NIST-ML-KEM-1024: SECURE_LINK_ESTABLISHED", "#00FF41");

        state.physicsWorker.onmessage = (e) => {
            if (e.data.type === 'BUS_IDLE') {
                handleMissionComplete(startBtn, statusLightWorker, fccLabel);
                return;
            }

            if (e.data.type === 'TELEMETRY') {
                const { altitude, airspeed, elapsed, missionPhase, density } = e.data;
                const timeNum = parseFloat(elapsed);

                // --- TRACK RECORDS FOR REPORT ---
                if (altitude > state.maxAlt) state.maxAlt = altitude;
                if (airspeed > state.maxSpd) state.maxSpd = airspeed;

                // --- FDR DATA LOGGING (Every 1 Second) ---
                if (state.isMissionActive && Math.floor(timeNum) > state.fdrBuffer.length) {
                    state.fdrBuffer.push({
                        t: timeNum.toFixed(1),
                        alt: altitude.toFixed(0),
                        spd: airspeed.toFixed(1),
                        phase: missionPhase,
                        lat: state.latency
                    });
                }

                if (state.isMissionActive) {
                    syncPhase(missionPhase);
                    runMissionStory(elapsed);
                    
                    if (timerEl) timerEl.textContent = `T+ ${timeNum.toFixed(1)}S`;
                    if (startBtn) {
                        const progress = Math.min(100, (timeNum / 90) * 100).toFixed(0);
                        startBtn.textContent = `DATA_LINK: ${progress}% [${state.currentPhase}]`;
                    }
                }

                handleSecurityLogic(state.currentPhase);
                updateTelemetryStream(altitude, airspeed, density);
            }
        };

        state.isMissionActive = true;
        if (statusLightWorker) statusLightWorker.style.background = "var(--av-amber)"; 
        if (fccLabel) {
            fccLabel.style.color = "var(--av-green)";
            fccLabel.textContent = "FCC_THREAD: ACTIVE";
        }

        state.physicsWorker.postMessage({ type: 'START_FLIGHT' });
        logTerminalMessage("IGNITION: DATA_BUS_NOMINAL", "#FFF");

    } catch (err) {
        logTerminalMessage("CRITICAL: BUS_INIT_FAILURE", "#FF3B3B");
    }
}

/**
 * 4. TELEMETRY & SECURITY INTERVENTION
 */
function updateTelemetryStream(alt, vel, density) {
    const hexDisplay = document.getElementById('fdr-hex-display');
    if (!hexDisplay || !state.isMissionActive) return;

    const hexAlt = Math.floor(alt).toString(16).toUpperCase().padStart(4, '0');
    const hexVel = Math.floor(vel).toString(16).toUpperCase().padStart(4, '0');
    const hexDens = Math.floor(density * 100).toString(16).toUpperCase().padStart(2, '0');

    hexDisplay.textContent = `RX: 0x${hexAlt}${hexVel}${hexDens} | CH_A: NOMINAL`;

    if (Math.random() > 0.88) {
        logTerminalMessage(`TX_BUF: 0x${hexAlt} 0x${hexVel} 0x${hexDens}`, "#444");
    }
}

function syncPhase(newPhase) {
    if (newPhase && newPhase !== state.currentPhase) {
        state.currentPhase = newPhase;
        logTerminalMessage(`STATE_CHANGE: ${newPhase}`, "var(--av-amber)");
        const phaseLabel = document.getElementById('current-phase');
        if (phaseLabel) phaseLabel.textContent = newPhase;
    }
}

function handleSecurityLogic(phase) {
    const latencyEl = document.getElementById('handshake-ms');
    const modal = document.getElementById('security-modal');
    const authBtn = document.getElementById('auth-crypto-btn');

    if (phase === 'ENGAGEMENT_ZONE') {
        if (!state.attackLogged) {
            state.isMissionActive = false;
            state.physicsWorker.postMessage({ type: 'PAUSE_FLIGHT' });
            
            if (modal) modal.style.display = 'flex';
            logTerminalMessage("!! ALERT: TELEMETRY_INJECTION_DETECTED !!", "#FF3B3B");
            logTerminalMessage("AWAITING_PILOT_ENCRYPTION_AUTH...", "var(--av-amber)");

            authBtn.onclick = () => {
                if (modal) modal.style.display = 'none';
                state.isMissionActive = true;
                state.attackLogged = true;
                
                triggerAttack(true); 
                state.physicsWorker.postMessage({ type: 'RESUME_FLIGHT' });
                
                logTerminalMessage("SECURITY: ML-KEM_LATTICE_SHIELD_ACTIVE", "#00FF41");
                logTerminalMessage("THREAT_STATUS: MITIGATING_INJECTION...", "var(--av-amber)");
            };
        }
        state.latency = (8.4 + Math.random() * 6).toFixed(1); 
    } else {
        if (state.attackLogged && phase === 'FINAL_APPROACH') {
            triggerAttack(false); 
            state.attackLogged = false;
            logTerminalMessage("SECURITY: THREAT_NEUTRALIZED. CHECKSUM_OK", "#00FF41");
        }
        state.latency = (4.1 + Math.random() * 0.2).toFixed(2);
    }
    
    if (latencyEl) latencyEl.textContent = `LATENCY: ${state.latency}ms`;
}

/**
 * 5. POST-FLIGHT EXPORT (BLACK BOX)
 */
function exportFDR() {
    if (state.fdrBuffer.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "T_ELAPSED,ALTITUDE_FT,AIRSPEED_KTS,FLIGHT_PHASE,LATENCY_MS\r\n";
    
    state.fdrBuffer.forEach(row => {
        csvContent += `${row.t},${row.alt},${row.spd},${row.phase},${row.lat}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FDR_LOG_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    logTerminalMessage("SYSTEM: FDR_LOG_EXPORT_SUCCESS", "var(--av-green)");
}

function handleMissionComplete(btn, light, label) {
    state.isMissionActive = false;
    
    const reportOverlay = document.getElementById('mission-report');
    const reportAlt = document.getElementById('report-alt');
    const reportSpd = document.getElementById('report-spd');
    const downloadBtn = document.getElementById('download-fdr-btn');

    if (reportOverlay) {
        if (reportAlt) reportAlt.textContent = Math.round(state.maxAlt);
        if (reportSpd) reportSpd.textContent = Math.round(state.maxSpd);
        reportOverlay.style.display = 'flex';
    }

    // Attach Black Box Download Trigger
    if (downloadBtn) {
        downloadBtn.onclick = exportFDR;
    }

    if (btn) btn.textContent = "MISSION_COMPLETE: BUS_IDLE";
    if (light) light.style.background = "#1a1a1a";
    if (label) {
        label.textContent = "FCC_THREAD: STANDBY";
        label.style.color = "#888";
    }
    logTerminalMessage("SYSTEM: SHUTTING DOWN AVIONICS BUS [0x00]", "var(--av-amber)");
}