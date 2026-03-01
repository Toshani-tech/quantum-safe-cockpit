/**
 * physics-worker.js - PRO-SIM ENGINE (V5.1 - PRECISION MASKING)
 * Architecture: Decoupled Main-Thread Execution.
 * Calibration: desynchronized: true for sub-5ms input-to-render latency.
 */

import { calculateFlightDynamics } from './aerodynamics.js';

let canvasCtx;
let lastTime = 0;
let missionStartTime = 0;
let canvasW = 0;
let canvasH = 0;

let state = {
    altitude: 0,
    airspeed: 0,
    verticalVelocity: 0,
    missionPhase: 'PRE_FLIGHT',
    isRunning: false
};

// --- SYSTEM HEARTBEAT ---
console.log("FCC_THREAD: INITIALIZED_AND_AWAITING_BUS");

self.onmessage = function(e) {
    if (e.data.type === 'INIT') {
        const canvas = e.data.canvas;
        canvasW = canvas.width;
        canvasH = canvas.height;
        
        // desynchronized: true bypasses the browser's compositor for lower latency
        canvasCtx = canvas.getContext('2d', { 
            alpha: false, 
            desynchronized: true 
        });
        console.log("FCC_THREAD: CANVAS_HANDSHAKE_COMPLETE", canvasW, "x", canvasH);
    }
    
    if (e.data.type === 'START_FLIGHT') {
        if (state.isRunning) return; 
        console.log("FCC_THREAD: IGNITION_SEQUENCE_START");
        state.isRunning = true;
        const now = performance.now();
        lastTime = now;
        missionStartTime = now;
        requestAnimationFrame(mainLoop);
    }
};

function mainLoop(currentTime) {
    if (!state.isRunning) return;

    // Delta Time calculation with industrial safety clamps
    const dt = Math.max(0.001, Math.min((currentTime - lastTime) / 1000, 0.033)); 
    lastTime = currentTime;
    const elapsed = (currentTime - missionStartTime) / 1000;

    // Execute Aerodynamic Kernel (External Module)
    const physicsResult = calculateFlightDynamics(state, dt, elapsed);
    
    if (physicsResult) {
        state.altitude = physicsResult.altitude; 
        state.airspeed = physicsResult.airspeed;
        state.verticalVelocity = physicsResult.verticalVelocity; 
        state.missionPhase = physicsResult.actualPhase;
    }

    // Render PFD to OffscreenCanvas
    if (canvasCtx) drawPFD();

    // Broadcast Telemetry to Main Bus (ARINC-429 Logic)
    const syncElapsed = Math.min(90.0, elapsed).toFixed(2);
    self.postMessage({ 
        type: 'TELEMETRY', 
        altitude: state.altitude,
        airspeed: state.airspeed,
        missionPhase: state.missionPhase,
        elapsed: syncElapsed
    });

    // Auto-Termination at Mission End (T+90s)
    if (elapsed >= 90.0) {
        console.log("FCC_THREAD: MISSION_COMPLETE_BUS_IDLE");
        state.isRunning = false;
        drawPFD(); 
        self.postMessage({ type: 'BUS_IDLE' });
        return;
    }

    requestAnimationFrame(mainLoop);
}

function drawPFD() {
    const ctx = canvasCtx;
    const w = canvasW;
    const h = canvasH;

    // 1. FRAME CLEAR (Deep Black Avionics Grade)
    ctx.fillStyle = "#020202"; 
    ctx.fillRect(0, 0, w, h);

    // Scaling: 450 pixels per 1000ft / 60 pixels per 10 knots
    const altPPU = h / 450; 
    const spdPPU = h / 60;  

    // 2. RENDER HORIZON REFERENCE
    drawStaticHorizon(ctx, w, h);

    // 3. RENDER TAPES (With Precision Clipping)
    drawVerticalTape(ctx, state.airspeed, 5, 85, "SPD", 20, "#00FF41", spdPPU);
    drawVerticalTape(ctx, state.altitude, w - 90, 85, "ALT", 100, "#00FF41", altPPU);

    // 4. RENDER VVI (Vertical Velocity Indicator)
    const fpm = state.verticalVelocity;
    ctx.fillStyle = Math.abs(fpm) > 3500 ? "#FF3B3B" : "#00FF41";
    ctx.font = "14px 'Share Tech Mono'";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.round(fpm)} FPM`, w / 2, h - 30);
}

function drawVerticalTape(ctx, value, x, width, label, step, themeColor, ppu) {
    const h = canvasH;
    const centerY = h / 2;
    
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, 0, width, h); 
    ctx.clip(); 

    ctx.fillStyle = "#080808";
    ctx.fillRect(x, 0, width, h);
    
    ctx.strokeStyle = themeColor;
    ctx.fillStyle = themeColor;
    ctx.lineWidth = 1;
    ctx.font = "12px 'Share Tech Mono'";

    const range = (h / 2) / ppu;
    const firstTick = Math.floor((value - range) / step) * step;
    const lastTick = Math.ceil((value + range) / step) * step;

    for (let i = firstTick; i <= lastTick; i += step) {
        if (i < 0 && label === "ALT") continue;
        const y = centerY - (i - value) * ppu;
        
        ctx.beginPath();
        ctx.textAlign = "left";
        if (label === "SPD") {
            ctx.moveTo(x + width, y);
            ctx.lineTo(x + width - 15, y);
            if (i % (step) === 0) ctx.fillText(i.toString(), x + 10, y + 4);
        } else {
            ctx.moveTo(x, y);
            ctx.lineTo(x + 15, y); 
            if (i % step === 0) ctx.fillText(i.toString(), x + 25, y + 4);
        }
        ctx.stroke();
    }
    ctx.restore();

    // DIGITAL READOUT CHEVRON
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 2;
    ctx.fillRect(x - 5, centerY - 18, width + 10, 36);
    ctx.strokeRect(x - 5, centerY - 18, width + 10, 36);
    
    ctx.fillStyle = "#FFF";
    ctx.font = "bold 18px 'Share Tech Mono'";
    ctx.textAlign = "center";
    ctx.fillText(Math.round(value), x + width / 2, centerY + 7);
}

function drawStaticHorizon(ctx, w, h) {
    ctx.strokeStyle = "#00FF41";
    ctx.lineWidth = 2;
    
    // Left Reference
    ctx.beginPath();
    ctx.moveTo(w/2 - 45, h/2);
    ctx.lineTo(w/2 - 15, h/2);
    ctx.lineTo(w/2 - 15, h/2 + 8);
    ctx.stroke();

    // Right Reference
    ctx.beginPath();
    ctx.moveTo(w/2 + 45, h/2);
    ctx.lineTo(w/2 + 15, h/2);
    ctx.lineTo(w/2 + 15, h/2 + 8);
    ctx.stroke();

    // Horizon Line
    ctx.strokeStyle = "#1d1d1d";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w/2 - 80, h/2);
    ctx.lineTo(w/2 + 80, h/2);
    ctx.stroke();
}