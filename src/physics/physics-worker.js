/*
 * physics-worker.js - V14.0
 */

import { calculateFlightDynamics } from './aerodynamics.js';
import { QuantumAtmosphereLink } from './quantum-atmosphere.js'; 
import init from '../../security-kernel/pkg/security_kernel.js';

const qkdLink = new QuantumAtmosphereLink();

let canvasCtx;
let missionStartTime = 0;
let lastFrameTime = 0;
let canvasW = 0;
let canvasH = 0;
let dpr = 1; 
let latestSentTime = 0; 
let physicsLoopActive = false;
let wasmExports = null;

const FRACTIONAL_BITS = 16;
const FIXED_SCALE = 65536; 

let isMitMAttackActive = false;

let state = {
    altitude: 0,
    airspeed: 0,
    verticalVelocity: 0,
    missionPhase: 'PRE_FLIGHT',
    isRunning: false,
    isPaused: false,
    isTerminated: false,
    pausedAt: 0,
    vviStatus: 'NORMAL',
    vviDirection: 'LEVEL'
};

function toFixed32(floatValue) {
    return Math.round(floatValue * FIXED_SCALE) | 0;
}

function toFloat32(fixed32Value) {
    return fixed32Value / FIXED_SCALE;
}

function getPhaseCode(phaseString) {
    switch (phaseString) {
        case 'STARTUP_TAXI': return 1;
        case 'STEADY_CLIMB': return 2;
        case 'ENGAGEMENT_ZONE': return 3;
        case 'FINAL_APPROACH': return 4;
        case 'MISSION_COMPLETE': return 5;
        default: return 0;
    }
}

function calculateGaussianRandom() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); 
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}


function packARINC429(label, sdi, value, ssm) {
    let word = 0;
    word |= (label & 0xFF);
    word |= ((sdi & 0x03) << 8);
    const maskedPayload = Math.floor(value) & 0x3FFFF;
    word |= (maskedPayload << 10);
    word |= ((ssm & 0x03) << 28);



function applyBERCorruption(arrayBuffer, phaseString, speedValue) {
    let baseRate = (phaseString === 'ENGAGEMENT_ZONE') ? 4.2e-6 : 1.5e-8;
    let velocityImpact = (speedValue / 500) * 1e-8;
    let atmosphericNoise = Math.abs(calculateGaussianRandom() * 0.5e-8);
    let derivedBER = baseRate + velocityImpact + atmosphericNoise;

    for (let index = 0; index < arrayBuffer.length; index++) {
        let bitfield = arrayBuffer[index];
        for (let bitPosition = 0; bitPosition < 32; bitPosition++) {
            if (Math.random() < derivedBER) {
                bitfield ^= (1 << bitPosition);
            }
        }
        arrayBuffer[index] = bitfield;
    }
    return derivedBER;
}

const wasmPromise = init().then(instance => {
    wasmExports = instance;
    
    try {
        if (wasmExports && typeof wasmExports.set_initial_state === 'function') {
            wasmExports.set_initial_state(0, 0);
        } else if (instance && typeof instance.set_initial_state === 'function') {
            wasmExports = instance;
            instance.set_initial_state(0, 0);
        }
    } catch (e) {
        console.warn(">> WASM Export Warning (set_initial_state skipped):", e);
    }
    
    console.log("AVIONICS_KERNEL: NIST-PQC ML-KEM & FIXED-POINT COMPLIANCE ACTIVE");
}).catch(err => {
    console.error("SYSTEM_FAULT: WASM Kernel Failure on Worker Startup", err);
});

self.onmessage = async function(e) {
    if (e.data.sentTime) latestSentTime = e.data.sentTime;

    if (e.data.type === 'INIT') {
        const canvas = e.data.canvas;
        dpr = e.data.dpr || 1; 
        canvasW = canvas.width;
        canvasH = canvas.height;
        
        canvasCtx = canvas.getContext('2d', { 
            alpha: false, 
            desynchronized: true 
        });
        
        canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
        canvasCtx.scale(dpr, dpr);

        await wasmPromise;
        
        self.postMessage({ type: 'KERNEL_READY' });
        return;
    }
    
    if (e.data.type === 'START_FLIGHT') {
        if (state.isRunning || state.isTerminated) return; 
        state.isRunning = true;
        state.isPaused = false;
        missionStartTime = performance.now();
        lastFrameTime = performance.now();
        physicsLoopActive = true;
        runMasterLoop(); 
        return;
    }

    if (e.data.type === 'PAUSE_FLIGHT') {
        state.isPaused = true;
        state.pausedAt = performance.now();
        physicsLoopActive = false;
        return;
    }

    if (e.data.type === 'RESUME_FLIGHT') {
        if (!state.isPaused || state.isTerminated) return;
        missionStartTime += (performance.now() - state.pausedAt);
        lastFrameTime = performance.now();
        state.isPaused = false;
        physicsLoopActive = true;
        runMasterLoop();
        return;
    }

    if (e.data.type === 'INJECT_FAULT') {
        if (e.data.active === false) {
            isMitMAttackActive = false;
        } else if (e.data.faultType === 'SPOOF_ALTITUDE') {
            isMitMAttackActive = true;
        }
        return;
    }
};

function runMasterLoop() {
    if (!physicsLoopActive || state.isTerminated) return;

    const now = performance.now();
    let dt = (now - lastFrameTime) / 1000;
    lastFrameTime = now;

    const elapsed = (now - missionStartTime) / 1000;

    const stepSize = 0.01; 
    let accumulatedTime = dt;
    
    while (accumulatedTime > 0) {
        let step = Math.min(accumulatedTime, stepSize);
        updatePhysics(step, elapsed - accumulatedTime + step);
        accumulatedTime -= step;
    }

    if (canvasCtx) drawPFD();

    broadcastTelemetry(elapsed);

    if (elapsed >= 90.0) {
        terminateMission();
    } else {
        requestAnimationFrame(runMasterLoop);
    }
}

function updatePhysics(dt, elapsed) {
    try {
        if (wasmExports && wasmExports.step_physics_fp) {
            const dtFixed = toFixed32(dt);
            const rawAltitude = wasmExports.step_physics_fp(dtFixed);
            
            state.altitude = toFloat32(rawAltitude);
            
            const dynamics = calculateFlightDynamics(state, dt, elapsed);
            if (dynamics) {
                state.airspeed = dynamics.airspeed;
                state.missionPhase = dynamics.missionPhase;
                state.vviStatus = dynamics.vviStatus;
                state.vviDirection = dynamics.vviDirection;
                state.verticalVelocity = (state.verticalVelocity * 0.90) + (dynamics.verticalVelocity * 0.10);
            }
        } else {
            const result = calculateFlightDynamics(state, dt, elapsed);
            if (result) {
                state.altitude = result.altitude; 
                state.airspeed = result.airspeed;
                state.missionPhase = result.missionPhase;
                state.vviStatus = result.vviStatus;
                state.vviDirection = result.vviDirection;
                state.verticalVelocity = (state.verticalVelocity * 0.90) + (result.verticalVelocity * 0.10); 
            }
        }
    } catch (err) {
        console.error("PHYSICS_CORE_EXCEPTION", err);
    }
}

function broadcastTelemetry(elapsed) {
    let serializedBuffer = new Uint32Array(3);
    
    let wireAltitude = state.altitude;
    if (isMitMAttackActive) {
        wireAltitude = 420.0; 
    }

    serializedBuffer[0] = packARINC429(0o036, 0, Math.floor(wireAltitude), 0);
    serializedBuffer[1] = packARINC429(0o037, 0, Math.floor(state.airspeed), 0);
    serializedBuffer[2] = packARINC429(0o027, 0, getPhaseCode(state.missionPhase), 0);

    let activeBER = applyBERCorruption(serializedBuffer, state.missionPhase, state.airspeed);


    const qkdMetrics = qkdLink.computeQuantumMetrics(state.altitude, state.airspeed, isMitMAttackActive);
    
    let transmissionBuffer = new Uint32Array(serializedBuffer);

    self.postMessage({ 
        type: 'TELEMETRY', 
        altitude: state.altitude, 
        airspeed: state.airspeed,
        verticalVelocity: state.verticalVelocity,
        missionPhase: state.missionPhase,
        vviStatus: state.vviStatus,
        vviDirection: state.vviDirection,
        elapsed: elapsed.toFixed(2),
        sentTime: latestSentTime,
        arincWords: transmissionBuffer,
        simulatedBER: activeBER,
        
        quantumMetrics: qkdMetrics
    }, [transmissionBuffer.buffer]);
}

function terminateMission() {
    state.altitude = 0;
    state.verticalVelocity = 0;
    state.airspeed = 0;
    physicsLoopActive = false;
    state.isRunning = false;
    state.isTerminated = true; 
    state.missionPhase = 'MISSION_COMPLETE';
    if (canvasCtx) drawPFD(); 
    self.postMessage({ type: 'BUS_IDLE' });
}

function drawPFD() {
    const ctx = canvasCtx;
    const w = canvasW / dpr; 
    const h = canvasH / dpr; 
    
    ctx.fillStyle = "#050505"; 
    ctx.fillRect(0, 0, w, h);

    const altPPU = h / 850; 
    const spdPPU = h / 280;  

    drawStaticHorizon(ctx, w, h);
    
    drawVerticalTape(ctx, state.airspeed, 10, 70, "SPD", 20, "#00FF41", spdPPU);
    drawVerticalTape(ctx, state.altitude, w - 80, 70, "ALT", 100, "#00FF41", altPPU);
    
    ctx.save();
    ctx.fillStyle = "rgba(0, 255, 65, 0.9)"; 
    ctx.font = "bold 10px 'Share Tech Mono'";
    ctx.textAlign = "center";
    ctx.fillText("IFF_MODE_5:CRYPTO_ID_0x8842", w / 2, 35);
    ctx.restore();

    drawVVI(ctx, w, h, state.verticalVelocity, state.vviStatus, state.vviDirection);
}

function drawVerticalTape(ctx, value, x, width, label, step, themeColor, ppu) {
    const h = canvasH / dpr;
    const centerY = h / 2;
    
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, 15, width, h - 30);
    ctx.clip(); 
    
    ctx.strokeStyle = themeColor;
    ctx.fillStyle = themeColor;
    ctx.font = "10px 'Share Tech Mono'";

    const range = (h / 2) / ppu;
    const firstTick = Math.floor((value - range) / step) * step;
    const lastTick = Math.ceil((value + range) / step) * step;

    for (let i = firstTick; i <= lastTick; i += step) {
        const y = centerY - (i - value) * ppu;
        ctx.globalAlpha = Math.max(0, 1 - (Math.abs(y - centerY) / (h / 2.5))); 
        
        ctx.beginPath();
        if (label === "SPD") {
            ctx.moveTo(x + width, y); ctx.lineTo(x + width - 10, y);
            if (i % (step * 2) === 0 && i >= 0) ctx.fillText(i.toString(), x + width - 15, y + 4);
        } else {
            ctx.moveTo(x, y); ctx.lineTo(x + 10, y); 
            if (i % (step * 2) === 0 && i >= 0) ctx.fillText(i.toString(), x + 15, y + 4);
        }
        ctx.stroke();
    }
    ctx.restore();

    ctx.globalAlpha = 1;
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.fillRect(x - 5, centerY - 12, width + 10, 24);
    ctx.strokeRect(x - 5, centerY - 12, width + 10, 24);
    
    ctx.fillStyle = "#fff";
    ctx.font = "14px 'Share Tech Mono'";
    ctx.textAlign = "center";
    ctx.fillText(Math.round(value), x + width / 2, centerY + 5);
}

function drawVVI(ctx, w, h, vvi, status, direction) {
    const color = (status === 'CRITICAL') ? "#FF3030" : (status === 'CAUTION') ? "#FFD700" : "#00FF41";
    
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.fillRect(w/2 - 65, h - 50, 130, 35);
    ctx.strokeRect(w/2 - 65, h - 50, 130, 35);
    
    ctx.fillStyle = color;
    ctx.font = "11px 'Share Tech Mono'";
    ctx.textAlign = "center";
    let glyph = direction === 'UP' ? "▲" : direction === 'DOWN' ? "▼" : "•";
    ctx.fillText(`${glyph} VVI: ${Math.abs(Math.round(vvi))} FPM`, w / 2, h - 28);
}

function drawStaticHorizon(ctx, w, h) {
    const midX = w / 2;
    const midY = h / 2;
    ctx.strokeStyle = "rgba(0, 255, 65, 0.2)";
    ctx.strokeRect(85, 15, w - 170, h - 30);
    
    ctx.strokeStyle = "#00FF41"; 
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(midX - 30, midY); ctx.lineTo(midX - 10, midY); ctx.lineTo(midX - 10, midY + 5);
    ctx.moveTo(midX + 30, midY); ctx.lineTo(midX + 10, midY); ctx.lineTo(midX + 10, midY + 5);
    ctx.stroke();
}