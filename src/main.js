// main.js - V16.5 

import init, { SecurityEngine, init_panic_hook, init_engine, get_telemetry_buffer_ptr } from '../deterministic-engine/pkg/deterministic_engine.js';
import { initHandshake, logTerminalMessage, drawLattice, triggerAttack, stopLattice } from './security/lattice-engine.js';
import { QKDSatelliteLink } from './security/qkd-satellite-link.js';

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
    isMitMAttackActive: false, 
    qkdLink: new QKDSatelliteLink(),
    lastSecurePacket: null // Hook for Window 2
};

let telemetryBufferPtr = null;
let wasmMemory = null; 
let rustEngine = null; 

let lastLogTime = 0;
const LOG_FREQUENCY = 0.5;

const AVIONICS_LOG_POOL = {
    PRE_FLIGHT: [
        "ARINC_429: INIT BUS_01",
        "SYS_CLK: GPS SYNC OK",
        "SEC_KERN: KEYGEN NIST_L5",
        "BUS_MAIN: COUPLER NOMINAL",
        "PWR_DIST: 28V DC STABLE",
        "IMU: STATIC CALIBRATION",
        "A429: RX_CH1 OPEN_OK",
        "ADC: BARO REF SET_2992",
        "FDR: MEM_STAT CLEAR_OK",
        "SEC_KERN: SEED_ENTROPY"
    ],
    TAXI: [
        "AERO: SURF_COEFF LOADED",
        "IMU: ALIGN PASS_1 OK",
        "PROP_SYS: RPM IDLE TRK",
        "BRAKE_SYS: TEMP NOMINAL",
        "FDR: LOG_STREAM VERIFIED",
        "A429: TX_WORD 032 OK",
        "STEER: NOSE_GEAR ACTIVE",
        "NAV: MAG_VAR COMPUTE",
        "PWR_DIST: APU BUS ACTIVE",
        "SYS_CLK: RTC SYNC PASS"
    ],
    CLIMB_TO_CEILING: [
        "PHYS: THR_ASCENT ACTV",
        "ARINC: PACKING WORD_270",
        "SEC_KERN: LATTICE RE_KEY",
        "SYS_CLK: SYNC DRIFT ADJ",
        "ALT_HOLD: TARGET CAPT",
        "VVI_MON: CLIMB RATE STBL",
        "FDR: BUFFER WRITE OK",
        "AERO: PITCH_TRIM COMP",
        "ADC: TAS VALUE COMPUTE",
        "A429: SIG_SRC_IND VALID"
    ],
    ENGAGEMENT_ZONE: [
        "SEC_KERN: CRYPTO_TH2 ACTV",
        "BER_MON: BER 1.2e-7 NOM",
        "AUDIT: FRAME INTR CHECK",
        "ARINC: BUS_STRS MON ACTV",
        "ML-KEM: ENTROPY PASS",
        "SIG_MON: NOISE LEVEL HIGH",
        "SEC_KERN: INTEGRITY LCKD",
        "A429: LABEL 247 ACTIVE",
        "FDR: HIGH_RATE STREAM",
        "SYS_CLK: PL_WARN IGNORE"
    ],
    FINAL_APPROACH: [
        "PHYS: GLIDESLOPE CAPT",
        "ARINC: SHUTDOWN ARMED",
        "SEC_KERN: ZERO_REG ACTV",
        "AERO: FLAPS CONFIG_FULL",
        "IMU: DESCENT VECTOR OK",
        "SYS_CLK: FINAL SYNC LCKD",
        "ADC: RAD_ALT ACQUISITION",
        "A429: PARITY CHK_PASS",
        "BRAKE_SYS: ARM AUTO_BRK",
        "FDR: FLUSHING CACHE_OK"
    ]
};

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
        const wasmInstance = await init();
        wasmMemory = wasmInstance.memory; 
        
        init_panic_hook();
        
        // Initialize Rust SecurityEngine instance
        rustEngine = new SecurityEngine();
        
        const initialized = init_engine();
        if (initialized) console.log("SEC_KERN: INITIALIZED");
        
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
        console.error(error);
        logTerminalMessage("CRITICAL ERROR: KERNEL LINK FAILED", "#FF3B3B", "0xFAIL");
    }
}
initializeAvionics();

function readWasmTelemetryBuffer() {
    if (!state.isKernelReady || !telemetryBufferPtr || !wasmMemory) return null;
    
    try {
        if (wasmMemory.buffer.byteLength === 0) {
            console.warn(">> HARDWARE RE-SYNC: WASM Linear Shared Backing Array Detached. Recovery armed.");
            return null;
        }
        return new Uint32Array(wasmMemory.buffer, telemetryBufferPtr, 4);
    } catch (memFault) {
        console.error("CRITICAL_MEMORY_EXCEPTION: Boundary verification rejected access", memFault);
        return null;
    }
}

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

async function runPOST() {
    const canvas = document.getElementById('flight-display');
    const dpr = window.devicePixelRatio || 1;

    try {
        await initHandshake(); 
        
        state.physicsWorker = new Worker('./src/physics/physics-worker.js', { type: 'module' });
        state.physicsWorker.onerror = function(error) {
            console.error("!!! CRITICAL WORKER THREAD ERROR !!!", error.message, "at", error.filename, "line", error.lineno);
        };

        state.physicsWorker.onmessageerror = function(error) {
            console.error("!!! WORKER SERIALIZATION ERROR !!!", error);
        };

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
                    sentTime: performance.now(),
                    hasSharedEngine: true
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

const timerEl = document.getElementById('mission-timer');
const latDisplay = document.getElementById('latency-value');
const berDisplay = document.getElementById('ber-value');

const qberDisplay = document.getElementById('qber-value');
const keyRateDisplay = document.getElementById('qkd-keyrate-value');
const satTrackingDisplay = document.getElementById('sat-tracking-value');

let lastPushedTime = -1; 
let lastAmbientLogTime = 0;

function startRenderLoop() {
    state.isLoopRunning = true;
    requestAnimationFrame(loop);
}

function loop() {
    if (state.isTerminated && state.currentPhase !== 'MISSION_COMPLETE') { 
        state.isLoopRunning = false; 
        return; 
    }

    if (state.physicsWorker && state.isMissionActive && !state.securityEventLocked) {
        state.physicsWorker.postMessage({ sentTime: performance.now() });
    }

    if (state.lastWorkerData) {
        const d = state.lastWorkerData;
        const safeT = parseFloat(d.elapsed);
        const safeAlt = Number(d.altitude);
        const safeSpd = Number(d.airspeed);

        // Update Forensic Auditor (Window 2) with Rust Engine
        if (rustEngine) {
            state.lastSecurePacket = rustEngine.secure_telemetry_step(safeAlt);
        }

        if (state.isMissionActive) {
            if (!isNaN(safeT) && safeT > lastPushedTime + (LOG_FREQUENCY - 0.01)) {
                state.fdrBuffer.push({
                    t: safeT.toFixed(2), 
                    alt: Math.round(safeAlt), 
                    spd: Math.round(safeSpd),
                    phase: String(d.missionPhase || 'UNKNOWN'), 
                    lat: Number(state.latency).toFixed(2)
                });
                lastPushedTime = safeT; 
                lastLogTime = safeT; 
            }

            if (safeAlt > state.maxAlt) state.maxAlt = safeAlt;
            if (safeSpd > state.maxSpd) state.maxSpd = safeSpd;

            if (timerEl) timerEl.textContent = `T+ ${safeT.toFixed(1)}S`;
            if (latDisplay) latDisplay.textContent = state.latency.toFixed(2); 

            if (berDisplay && d.simulatedBER !== undefined) {
                berDisplay.textContent = d.simulatedBER.toExponential(3);
                berDisplay.style.color = (d.simulatedBER > 1e-6) ? "var(--av-amber)" : "var(--av-green)";
            } else if (berDisplay) {
                let base = (d.missionPhase === 'ENGAGEMENT_ZONE') ? 4.2e-6 : 1.5e-8;
                const velFactor = (safeSpd / 500) * 1e-8;
                const noise = Math.abs(gaussianRandom() * 0.5e-8);
                const finalBER = base + velFactor + noise;
                berDisplay.textContent = finalBER.toExponential(3);
                berDisplay.style.color = (finalBER > 1e-6) ? "var(--av-amber)" : "var(--av-green)";
            }
    
            state.qkdLink.updateLinkDynamics(safeT, d.missionPhase, state.isMitMAttackActive);
            const qm = state.qkdLink.getMetricsPayload();

            if (qberDisplay) {
                qberDisplay.textContent = (qm.qber * 100).toFixed(2) + "%";
                qberDisplay.style.color = qm.linkCompromised ? "var(--av-red)" : "var(--av-green)";
            }

            if (keyRateDisplay) {
                keyRateDisplay.textContent = qm.secureKeyRateBps.toLocaleString() + " bps";
                keyRateDisplay.style.color = (qm.secureKeyRateBps === 0) ? "var(--av-amber)" : "var(--av-green)";
            }
            if (satTrackingDisplay) {
                satTrackingDisplay.textContent = `LEO-SAT AZ:${qm.satAzimuth}° EL:${qm.satElevation}°`;
            }

            updateTacticalButton(safeAlt, safeSpd, d.missionPhase);
            syncVVI(d.verticalVelocity, d.vviStatus, d.vviDirection); 
            syncPhase(d.missionPhase);
            
            const liveWasmBuffer = readWasmTelemetryBuffer();
            updateTelemetryStream(liveWasmBuffer || d.arincWords);
            
            handleSecurityLogic(d.missionPhase);
            runMissionStory(safeT);
        }

        const activeTime = state.isMissionActive ? safeT : (performance.now() / 1000);
        if (activeTime >= lastAmbientLogTime + 3.0) {
            injectAmbientLog(state.currentPhase);
            lastAmbientLogTime = activeTime;
        }
    }
    requestAnimationFrame(loop);
}

function updateTacticalButton(alt, spd, phase) {
    const btn = document.getElementById('init-btn');
    if (!btn) return;

    if (alt > 100 && spd < 50) {
        btn.innerText = "WARN: LOW_SPEED / STALL";
        btn.classList.add('critical-state');
    } 
    else if (phase !== 'PRE_FLIGHT' && phase !== 'MISSION_COMPLETE') {
        btn.innerText = "MODE: FLT / ACTV";
        btn.classList.remove('critical-state');
        btn.classList.add('active-state');
    }
}

function syncVVI(fpm, status, direction) {
    const vviLabel = document.getElementById('vvi-value');
    if (!vviLabel) return;
    vviLabel.textContent = `${direction === 'UP' ? '▲' : direction === 'DOWN' ? '▼' : '―'} VVI: ${Math.abs(Math.round(fpm))} FT/M`;
    vviLabel.style.color = (status === 'DANGER') ? '#FF3B3B' : '#00FF41';
}

function verifyARINC429Parity(word) {
    let v = word;
    v ^= v >>> 16;
    v ^= v >>> 8;
    v ^= v >>> 4;
    v ^= v >>> 2;
    v ^= v >>> 1;
    return (v & 1) === 1;
}

let lastTelemetryUpdate = 0;
const THROTTLE_INTERVAL_MS = 100; 

function updateTelemetryStream(arincWords) {
    const now = performance.now();
    if (now - lastTelemetryUpdate < THROTTLE_INTERVAL_MS) return;
    lastTelemetryUpdate = now;

    const hexDisplay = document.getElementById('fdr-hex-display');
    if (!hexDisplay) return;

    const groundTruth = state.lastWorkerData;
    if (!groundTruth || !groundTruth.arincWords) return;

    const liveBuffer = groundTruth.arincWords; 
    const timestamp = (now / 1000).toFixed(2);
    let outputHTML = '';

    for (let index = 0; index < liveBuffer.length; index++) {
        let word = liveBuffer[index] >>> 0;
        let hexString = word.toString(16).toUpperCase().padStart(8, '0');
        let label = word & 0xFF;                  
        let sdi = (word >>> 8) & 0x03;                 
        let payloadBits = (word >>> 10) & 0x3FFFF;      
        let ssm = (word >>> 28) & 0x03;                
        
        let isParityValid = verifyARINC429Parity(word);

        let isContentAltered = false;
        let deltaText = '';

        if (label === 0o036 && groundTruth) { 
            const transmittedAlt = payloadBits;
            const precisionDelta = Math.abs(groundTruth.altitude - transmittedAlt);
            
            if (precisionDelta > 50 && (state.isMitMAttackActive || state.attackLogged)) {
                isContentAltered = true;
            } else if (precisionDelta > 0) {
                deltaText = `<span style="color: var(--av-cyan); font-size: 9px;"> [Δ: ${precisionDelta.toFixed(2)} FT]</span>`;
            }
        }

        let statusText = '[AUTH_OK]';
        let statusColor = 'var(--av-green)';

        if (!isParityValid) {
            statusText = '[PARITY_ERR]';
            statusColor = '#FF3B3B';
        } else if (isContentAltered) {
            statusText = '[SPOOF_ALERT]';
            statusColor = '#FF3B3B';
            if (!state.attackLogged) {
                triggerAttack(true); 
                logTerminalMessage("MALICIOUS BUS CORRUPTION: PARITY VALID BUT DATA MUTATED", "#FF3B3B", "0xMITM");
                state.attackLogged = true;
            }
        }

        outputHTML += `<div style="margin-bottom: 2px; font-size: 11px;">
            <span style="color: #666">[${timestamp}]</span> 
            <span style="color: #888">RX_WORD[${label.toString(8).padStart(3, '0')}]:</span> 
            <span style="color: ${isContentAltered ? '#FF3B3B' : 'var(--av-green)'}">0x${hexString}</span> 
            <span style="color: ${statusColor}">${statusText}</span>
            ${deltaText}
        </div>`;
    }

    state.telemetryLines.push(outputHTML);
    if (state.telemetryLines.length > 4) state.telemetryLines.shift(); 
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
    if (phase === 'FINAL_APPROACH' && (state.isMitMAttackActive || state.attackLogged)) {
         state.isMitMAttackActive = false;
         state.attackLogged = false; 
         state.securityEventLocked = false; 
         triggerAttack(false); 
         
         state.qkdLink.isInterceptionDetected = false;
         
         if (state.physicsWorker) {
             state.physicsWorker.postMessage({
                 type: 'INJECT_FAULT',
                 active: false,
                 faultType: 'NONE'
             });
         }

         const panels = document.querySelectorAll('.panel');
         const hexDisplay = document.getElementById('fdr-hex-display');
         const securityTag = document.getElementById('security-tag');
         
         panels.forEach(p => p.classList.remove('compromised-state'));
         if (hexDisplay) hexDisplay.classList.remove('intercepted');
         if (securityTag) {
             securityTag.textContent = "MODE: ML-KEM-1024 [SECURE]";
             securityTag.style.color = "var(--av-green)";
         }
         document.body.classList.remove('under-attack');
         logTerminalMessage("MITM ATTACK PURGED BY KERNEL. APPROACH VECTOR CLEAN.", "#00FF41", "0xCLEAN");
         return;
    }

    if (state.securityEventLocked || state.isMitMAttackActive) {
        return;
    }
    
    if (phase === 'ENGAGEMENT_ZONE') {
        state.securityEventLocked = true; 
        state.physicsWorker.postMessage({ type: 'PAUSE_FLIGHT' });
        document.getElementById('security-modal').style.display = 'flex';

        document.getElementById('auth-crypto-btn').onclick = () => {
            document.getElementById('security-modal').style.display = 'none';
            state.isMitMAttackActive = true;
            state.attackLogged = true; 
            triggerAttack(true);

            const panels = document.querySelectorAll('.panel');
            const hexDisplay = document.getElementById('fdr-hex-display');
            const securityTag = document.getElementById('security-tag');

            if (state.physicsWorker) {
                state.physicsWorker.postMessage({
                    type: 'INJECT_FAULT',
                    active: true,
                    faultType: 'SPOOF_ALTITUDE'
                });
            }
            
            panels.forEach(p => p.classList.add('compromised-state'));
            if (hexDisplay) hexDisplay.classList.add('intercepted');
            if (securityTag) {
                securityTag.textContent = "ALARM: TELEMETRY_MUTATION_DETECTED";
                securityTag.style.color = "var(--av-red)";
            }
            document.body.classList.add('under-attack');

            state.physicsWorker.postMessage({ type: 'RESUME_FLIGHT' });
            logTerminalMessage("SECURITY: FLIGHT RESUMED under ACTIVE BUS AUDIT", "var(--av-amber)", "0xWARN");
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
            if (event.triggerReset) {
                triggerAttack(false);
                state.attackLogged = false; 
            }
            state.triggeredEvents.add(event.t);
        }
    });
}

const trackingDecks = {};

function injectAmbientLog(phase) {
    const activePool = AVIONICS_LOG_POOL[phase] || AVIONICS_LOG_POOL.PRE_FLIGHT;
    if (!activePool || activePool.length === 0) return;

    if (!trackingDecks[phase] || trackingDecks[phase].length === 0) {
        trackingDecks[phase] = [...activePool];
        for (let i = trackingDecks[phase].length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [trackingDecks[phase][i], trackingDecks[phase][j]] = [trackingDecks[phase][j], trackingDecks[phase][i]];
        }
    }

    const logMessage = trackingDecks[phase].pop();

    let logColor = "var(--av-green)";
    let tag = "0xBUS_AMB";
    
    if (phase === 'ENGAGEMENT_ZONE') {
        logColor = "var(--av-amber)";
        tag = "0xSEC_AUDIT";
    }

    logTerminalMessage(logMessage, logColor, tag);
}

function handleMissionComplete() {
    if (state.isTerminated) return;
    state.isTerminated = true;
    state.isMissionActive = false;
    state.currentPhase = 'MISSION_COMPLETE'; 
    triggerAttack(false); 
    stopLattice();
    
    state.qkdLink = new QKDSatelliteLink(); 
    
    state.telemetryLines = []; 
    if (state.lastWorkerData) {
        state.lastWorkerData.arincWords = new Uint32Array(4);
    }
    logTerminalMessage("SECURE_KERNEL: TRANSITIONAL MEMORY VOLATILITY PURGED [0x00]", "#00FF41", "0xSCRUB");
    
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

document.getElementById('download-fdr-btn').addEventListener('click', async () => {
    if (state.fdrBuffer.length === 0) {
        logTerminalMessage("ERROR: NO FDR DATA TO EXTRACT", "#FF3B3B", "0xCSV_FAIL");
        return;
    }

    logTerminalMessage("SYSTEM: COMPUTING SHA-256 INTEGRITY HASH...", "var(--av-amber)", "0xCRYPTO");

    let csvData = "Time(S),Altitude(FT),Airspeed(KTS),Phase,Latency(MS)\n";
    state.fdrBuffer.forEach(row => {
        if (row) {
            csvData += `${row.t},${row.alt},${row.spd},${row.phase},${row.lat}\n`;
        }
    });

    const flightID = `FLT-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const msgBuffer = new TextEncoder().encode(csvData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const integrityHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    csvData += `\n// --- SECURE AVIONICS DATA RECORDER LOG ---\n`;
    csvData += `// SIGNATURE_TYPE: NIST-SHA256\n`;
    csvData += `// SOURCE_ID: ${flightID}\n`;
    csvData += `// INTEGRITY_HASH: ${integrityHash}\n`;
    csvData += `// EXPORT_TIMESTAMP: ${new Date().toISOString()}\n`;
    csvData += `// STATUS: SEALED_BY_KERNEL\n`;
    csvData += `// ----------------------------------------`;

    try {
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `FDR_${flightID}_SECURE.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        logTerminalMessage("FDR EXTRACTION: SHA-256 SEAL VERIFIED", "#00FF41", "0xSIG_OK");
    } catch (err) {
        logTerminalMessage(`EXPORT FAILED: ${err.message}`, "#FF3B3B", "0xFS_ERR");
    }
});