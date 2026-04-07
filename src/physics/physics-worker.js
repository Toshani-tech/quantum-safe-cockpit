/* physics-worker.js - V12.1 */

import { calculateFlightDynamics } from './aerodynamics.js';
import init from '../../security-kernel/pkg/security_kernel.js'; 

let canvasCtx;
let missionStartTime = 0;
let lastFrameTime = 0;
let canvasW = 0;
let canvasH = 0;
let dpr = 1; 
let latestSentTime = 0; 
let physicsLoopActive = false;

// PFD 
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

        try {
            await init();
            console.log("AVIONICS_KERNEL: NIST-PQC ML-KEM ACTIVE");
            self.postMessage({ type: 'KERNEL_READY' });
        } catch (err) {
            console.error("SYSTEM_FAULT: WASM Kernel Failure", err);
        }
    }
    
    if (e.data.type === 'START_FLIGHT') {
        if (state.isRunning || state.isTerminated) return; 
        state.isRunning = true;
        state.isPaused = false;
        missionStartTime = performance.now();
        lastFrameTime = performance.now();
        physicsLoopActive = true;
        runMasterLoop(); 
    }

    if (e.data.type === 'PAUSE_FLIGHT') {
        state.isPaused = true;
        state.pausedAt = performance.now();
        physicsLoopActive = false;
    }

    if (e.data.type === 'RESUME_FLIGHT') {
        if (!state.isPaused || state.isTerminated) return;
        missionStartTime += (performance.now() - state.pausedAt);
        lastFrameTime = performance.now();
        state.isPaused = false;
        physicsLoopActive = true;
        runMasterLoop();
    }
};

/* MASTER AVIONICS LOOP  */
function runMasterLoop() {
    if (!physicsLoopActive || state.isTerminated) return;

    const now = performance.now();
    // Delta Time calculation 
    const dt = (now - lastFrameTime) / 1000;
    lastFrameTime = now;

    const elapsed = (now - missionStartTime) / 1000;

    // 1. Physics Step (Calculus Governor)
    
    const cappedDt = Math.min(dt, 0.033); 
    updatePhysics(cappedDt, elapsed);

    // 2. Render Step 
    if (canvasCtx) drawPFD();

    // 3. Telemetry Broadcast 
    broadcastTelemetry(elapsed);

    // 4. Mission Termination Control
    if (elapsed >= 90.0 || state.missionPhase === 'MISSION_COMPLETE') {
        terminateMission();
    } else {
        requestAnimationFrame(runMasterLoop);
    }
}

function updatePhysics(dt, elapsed) {
    try {
        const result = calculateFlightDynamics(state, dt, elapsed);
        
        if (result) {
            state.altitude = result.altitude; 
            state.airspeed = result.airspeed;
            state.missionPhase = result.missionPhase;
            state.vviStatus = result.vviStatus;
            state.vviDirection = result.vviDirection;
            
            // Industrial Damping
            state.verticalVelocity = (state.verticalVelocity * 0.9) + (result.verticalVelocity * 0.1); 
        }
    } catch (err) {
        console.error("PHYSICS_CORE_EXCEPTION", err);
    }
}

function broadcastTelemetry(elapsed) {
    self.postMessage({ 
        type: 'TELEMETRY', 
        ...state,
        elapsed: elapsed.toFixed(2),
        sentTime: latestSentTime 
    });
}

function terminateMission() {
    physicsLoopActive = false;
    state.isRunning = false;
    state.isTerminated = true; 
    state.missionPhase = 'MISSION_COMPLETE';
    if (canvasCtx) drawPFD(); 
    self.postMessage({ type: 'BUS_IDLE' });
}

/** GLASS COCKPIT - RENDERING ENGINE **/ 
function drawPFD() {
    const ctx = canvasCtx;
    const w = canvasW / dpr; 
    const h = canvasH / dpr; 
    
    ctx.fillStyle = "#050505"; 
    ctx.fillRect(0, 0, w, h);

    // Pixels scaling 
    const altPPU = h / 800; 
    const spdPPU = h / 250;  

    drawStaticHorizon(ctx, w, h);
    
    // Primary Flight Tapes
    drawVerticalTape(ctx, state.airspeed, 10, 70, "SPD", 20, "#00FF41", spdPPU);
    drawVerticalTape(ctx, state.altitude, w - 80, 70, "ALT", 100, "#00FF41", altPPU);
    
    // Status Overlays
ctx.save();
ctx.fillStyle = "rgba(255, 180, 0, 0.95)"; 
ctx.font = "bold 10px 'Share Tech Mono'";
ctx.textAlign = "center";
ctx.fillText("IFF_MODE_5: CRYPTO_ID_0x8842", w/2, 35); 
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
        // Fade ticks 
        ctx.globalAlpha = Math.max(0, 1 - (Math.abs(y - centerY) / (h / 2.5))); 
        
        ctx.beginPath();
        if (label === "SPD") {
            ctx.moveTo(x + width, y); ctx.lineTo(x + width - 10, y);
            if (i % (step * 2) === 0) ctx.fillText(i.toString(), x + width - 15, y + 4);
        } else {
            ctx.moveTo(x, y); ctx.lineTo(x + 10, y); 
            if (i % (step * 2) === 0) ctx.fillText(i.toString(), x + 15, y + 4);
        }
        ctx.stroke();
    }
    ctx.restore();

    // Central Digital Readout
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
    
    // Bore sight 
    ctx.strokeStyle = "#00FF41"; 
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(midX - 30, midY); ctx.lineTo(midX - 10, midY); ctx.lineTo(midX - 10, midY + 5);
    ctx.moveTo(midX + 30, midY); ctx.lineTo(midX + 10, midY); ctx.lineTo(midX + 10, midY + 5);
    ctx.stroke();
}