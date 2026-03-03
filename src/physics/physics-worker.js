/**
 * physics-worker.js - V6.0 FCC HARDENED ENGINE
 * Architecture: OffscreenCanvas Logic with High-DPI Scaling.
 * Added: State-Pause logic for Pilot-in-the-Loop intervention.
 */

import { calculateFlightDynamics } from './aerodynamics.js';

let canvasCtx;
let lastTime = 0;
let missionStartTime = 0;
let canvasW = 0;
let canvasH = 0;
let dpr = 1; 

let state = {
    altitude: 0,
    airspeed: 0,
    verticalVelocity: 0,
    missionPhase: 'PRE_FLIGHT',
    isRunning: false,
    isPaused: false, // Added for intervention handling
    pausedAt: 0      // Tracks time spent in pause to keep mission timer accurate
};

self.onmessage = function(e) {
    if (e.data.type === 'INIT') {
        const canvas = e.data.canvas;
        dpr = e.data.dpr || 1; 
        
        canvasW = canvas.width;
        canvasH = canvas.height;
        
        canvasCtx = canvas.getContext('2d', { 
            alpha: false, 
            desynchronized: true 
        });
        
        canvasCtx.scale(dpr, dpr);
        console.log(`FCC_THREAD: DPI_SCALED_INIT [${canvasW}x${canvasH} @ ${dpr}x]`);
    }
    
    if (e.data.type === 'START_FLIGHT') {
        if (state.isRunning) return; 
        state.isRunning = true;
        state.isPaused = false;
        const now = performance.now();
        lastTime = now;
        missionStartTime = now;
        requestAnimationFrame(mainLoop);
    }

    // PILOT INTERVENTION: STOP THE ENGINE
    if (e.data.type === 'PAUSE_FLIGHT') {
        state.isPaused = true;
        state.pausedAt = performance.now();
        console.log("FCC_THREAD: SYSTEM_HALT_RECEIVED");
    }

    // PILOT INTERVENTION: RESUME THE ENGINE
    if (e.data.type === 'RESUME_FLIGHT') {
        if (!state.isPaused) return;
        
        // Offset the mission start time by the duration of the pause
        const pauseDuration = performance.now() - state.pausedAt;
        missionStartTime += pauseDuration;
        
        state.isPaused = false;
        lastTime = performance.now(); // Reset lastTime to prevent huge "dt" jump
        requestAnimationFrame(mainLoop);
        console.log("FCC_THREAD: RESUMING_OPERATIONS");
    }
};

function mainLoop(currentTime) {
    // If paused or stopped, kill the loop
    if (!state.isRunning || state.isPaused) return;

    const dt = Math.max(0.001, Math.min((currentTime - lastTime) / 1000, 0.033)); 
    lastTime = currentTime;
    const elapsed = (currentTime - missionStartTime) / 1000;

    const physicsResult = calculateFlightDynamics(state, dt, elapsed);
    
    if (physicsResult) {
        state.altitude = physicsResult.altitude; 
        state.airspeed = physicsResult.airspeed;
        state.verticalVelocity = physicsResult.verticalVelocity; 
        state.missionPhase = physicsResult.actualPhase;
    }

    if (canvasCtx) drawPFD();

    // Broadcast ARINC-429 Telemetry
    const syncElapsed = Math.min(90.0, elapsed).toFixed(2);
    self.postMessage({ 
        type: 'TELEMETRY', 
        altitude: state.altitude,
        airspeed: state.airspeed,
        verticalVelocity: state.verticalVelocity,
        missionPhase: state.missionPhase,
        elapsed: syncElapsed,
        density: physicsResult.density 
    });

    if (elapsed >= 90.0) {
        state.isRunning = false;
        drawPFD(); 
        self.postMessage({ type: 'BUS_IDLE' });
        return;
    }

    requestAnimationFrame(mainLoop);
}

function drawPFD() {
    const ctx = canvasCtx;
    const w = canvasW / dpr; 
    const h = canvasH / dpr; 

    // 1. SYSTEM CLEAR
    ctx.fillStyle = "#020202"; 
    ctx.fillRect(0, 0, w, h);

    const altPPU = h / 500; 
    const spdPPU = h / 80;  

    // 2. HORIZON
    drawStaticHorizon(ctx, w, h);

    // 3. TAPES
    drawVerticalTape(ctx, state.airspeed, 0, 75, "SPD", 20, "#00FF41", spdPPU);
    drawVerticalTape(ctx, state.altitude, w - 75, 75, "ALT", 100, "#00FF41", altPPU);

    // 4. VVI
    drawVVI(ctx, w, h, state.verticalVelocity);
}

function drawVerticalTape(ctx, value, x, width, label, step, themeColor, ppu) {
    const h = canvasH / dpr;
    const centerY = h / 2;
    
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, 0, width, h); 
    ctx.clip(); 

    let grad = ctx.createLinearGradient(x, 0, x + width, 0);
    grad.addColorStop(0, "#050505");
    grad.addColorStop(1, "#0a0a0a");
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, width, h);
    
    ctx.strokeStyle = themeColor;
    ctx.fillStyle = themeColor;
    ctx.lineWidth = 1;
    ctx.font = "11px 'Share Tech Mono'";

    const range = (h / 2) / ppu;
    const firstTick = Math.floor((value - range) / step) * step;
    const lastTick = Math.ceil((value + range) / step) * step;

    for (let i = firstTick; i <= lastTick; i += step) {
        if (i < 0 && label === "ALT") continue;
        const y = centerY - (i - value) * ppu;
        
        ctx.beginPath();
        if (label === "SPD") {
            ctx.moveTo(x + width, y);
            ctx.lineTo(x + width - 10, y);
            if (i % (step) === 0) {
                ctx.textAlign = "right";
                ctx.fillText(i.toString(), x + width - 15, y + 4);
            }
        } else {
            ctx.moveTo(x, y);
            ctx.lineTo(x + 10, y); 
            if (i % step === 0) {
                ctx.textAlign = "left";
                ctx.fillText(i.toString(), x + 15, y + 4);
            }
        }
        ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.fillRect(x - 5, centerY - 15, width + 10, 30);
    ctx.strokeRect(x - 5, centerY - 15, width + 10, 30);
    
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px 'Share Tech Mono'";
    ctx.textAlign = "center";
    ctx.fillText(Math.round(value), x + width / 2, centerY + 6);
}

function drawVVI(ctx, w, h, fpm) {
    const isClimbing = fpm > 0;
    ctx.fillStyle = Math.abs(fpm) > 4000 ? "#FF3B3B" : "#00FF41";
    ctx.font = "12px 'Share Tech Mono'";
    ctx.textAlign = "center";
    
    const indicator = isClimbing ? "▲" : "▼";
    ctx.fillText(`${indicator} ${Math.abs(Math.round(fpm))} FPM`, w / 2, h - 20);
}

function drawStaticHorizon(ctx, w, h) {
    ctx.strokeStyle = "#00FF41";
    ctx.lineWidth = 2;
    const midX = w / 2;
    const midY = h / 2;

    ctx.beginPath();
    ctx.moveTo(midX - 40, midY);
    ctx.lineTo(midX - 15, midY);
    ctx.lineTo(midX - 15, midY + 10);
    ctx.moveTo(midX + 40, midY);
    ctx.lineTo(midX + 15, midY);
    ctx.lineTo(midX + 15, midY + 10);
    ctx.stroke();
}