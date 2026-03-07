/**
 * physics-worker.js - V10.3 [FLIGHT_PRECISION_STABLE]
 * Fix: Synchronized Aerodynamics V8.1 with PFD rendering.
 * Feature: Unit-locked VVI and high-DPR scaling.
 */

import { calculateFlightDynamics } from './aerodynamics.js';

let canvasCtx;
let lastTime = 0;
let missionStartTime = 0;
let canvasW = 0;
let canvasH = 0;
let dpr = 1; 
let latestSentTime = 0; 

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

self.onmessage = function(e) {
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
    }
    
    if (e.data.type === 'START_FLIGHT') {
        if (state.isRunning || state.isTerminated) return; 
        state.isRunning = true;
        state.isPaused = false;
        
        const now = performance.now();
        lastTime = now;
        missionStartTime = now;
        
        requestAnimationFrame(mainLoop);
    }

    if (e.data.type === 'PAUSE_FLIGHT') {
        state.isPaused = true;
        state.pausedAt = performance.now();
    }

    if (e.data.type === 'RESUME_FLIGHT') {
        if (!state.isPaused || state.isTerminated) return;
        const pauseDuration = performance.now() - state.pausedAt;
        missionStartTime += pauseDuration;
        state.isPaused = false;
        lastTime = performance.now(); 
        requestAnimationFrame(mainLoop);
    }
};

function mainLoop(currentTime) {
    if (state.isTerminated) return;

    if (state.isPaused) {
        if (canvasCtx) drawPFD();
        return; 
    }

    // Standardized time step for physics stability
    const dt = Math.max(0.001, Math.min((currentTime - lastTime) / 1000, 0.033)); 
    lastTime = currentTime;
    const elapsed = (currentTime - missionStartTime) / 1000;

    const result = calculateFlightDynamics(state, dt, elapsed);
    
    if (result) {
        state.altitude = result.altitude; 
        state.airspeed = result.airspeed;
        state.missionPhase = result.missionPhase;
        state.vviStatus = result.vviStatus;
        state.vviDirection = result.vviDirection;
        
        /**
         * VVI UNIT SYNC:
         * We use the V8.1 stabilized FPM for display and telemetry.
         * The 0.8 interpolation remains to prevent "shimmer" on the PFD tape.
         */
        state.verticalVelocity = (state.verticalVelocity * 0.8) + (result.verticalVelocity * 0.2); 
    }

    // ENFORCE 90S MISSION CAP
    if (elapsed >= 90.0 || state.missionPhase === 'MISSION_COMPLETE') {
        terminateMission();
        return; 
    }

    try {
        if (canvasCtx) drawPFD();
        
        self.postMessage({ 
            type: 'TELEMETRY', 
            altitude: state.altitude,
            airspeed: state.airspeed,
            verticalVelocity: state.verticalVelocity,
            missionPhase: state.missionPhase,
            vviStatus: state.vviStatus,
            vviDirection: state.vviDirection,
            elapsed: elapsed.toFixed(2),
            sentTime: latestSentTime 
        });
    } catch (e) {
        console.error("PFD_RENDER_FAULT", e);
    }

    requestAnimationFrame(mainLoop);
}

function terminateMission() {
    state.isRunning = false;
    state.isTerminated = true; 
    state.missionPhase = 'MISSION_COMPLETE';
    state.altitude = 0;
    state.airspeed = 0;
    state.verticalVelocity = 0;
    
    if (canvasCtx) drawPFD(); 
    self.postMessage({ type: 'BUS_IDLE' });
}

// RENDER ENGINE
function drawPFD() {
    const ctx = canvasCtx;
    const w = canvasW / dpr; 
    const h = canvasH / dpr; 
    
    ctx.fillStyle = "#020202"; 
    ctx.fillRect(0, 0, w, h);

    // DYNAMIC PPU CALIBRATION
    // Adjusting altPPU slightly higher to make altitude changes more visible
    const altPPU = h / 600; 
    const spdPPU = h / 200;  

    drawStaticHorizon(ctx, w, h);
    drawVerticalTape(ctx, state.airspeed, 5, 65, "SPD", 20, "#00FF41", spdPPU);
    drawVerticalTape(ctx, state.altitude, w - 70, 70, "ALT", 100, "#00FF41", altPPU);
    drawVVI(ctx, w, h, state.verticalVelocity, state.vviStatus, state.vviDirection);
}

function drawVerticalTape(ctx, value, x, width, label, step, themeColor, ppu) {
    const h = canvasH / dpr;
    const centerY = h / 2;
    
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, 10, width, h - 20); 
    ctx.clip(); 
    
    ctx.fillStyle = "rgba(10, 10, 10, 0.95)";
    ctx.fillRect(x, 0, width, h);
    
    ctx.strokeStyle = themeColor;
    ctx.fillStyle = themeColor;
    ctx.font = "11px 'Share Tech Mono'";

    const range = (h / 2) / ppu;
    const firstTick = Math.floor((value - range) / step) * step;
    const lastTick = Math.ceil((value + range) / step) * step;

    for (let i = firstTick; i <= lastTick; i += step) {
        if (i < 0 && label === "ALT") continue;
        const y = centerY - (i - value) * ppu;
        ctx.beginPath();
        ctx.globalAlpha = Math.max(0, 1.1 - (Math.abs(y - centerY) / (h / 2))); 
        
        if (label === "SPD") {
            ctx.moveTo(x + width, y);
            ctx.lineTo(x + width - 8, y);
            ctx.textAlign = "right";
            if (i % (step * 2) === 0) ctx.fillText(i.toString(), x + width - 12, y + 4);
        } else {
            ctx.moveTo(x, y);
            ctx.lineTo(x + 8, y); 
            ctx.textAlign = "left";
            if (i % (step * 2) === 0) ctx.fillText(i.toString(), x + 12, y + 4);
        }
        ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#fff";
    ctx.globalAlpha = 1;
    ctx.fillRect(x - 2, centerY - 12, width + 4, 24);
    ctx.strokeRect(x - 2, centerY - 12, width + 4, 24);
    
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px 'Share Tech Mono'";
    ctx.textAlign = "center";
    ctx.fillText(Math.round(value).toString(), x + width / 2, centerY + 5);
}

function drawVVI(ctx, w, h, vvi, status, direction) {
    const color = (status === 'DANGER') ? "#FF3B3B" : "#00FF41";
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(w/2 - 60, h - 45, 120, 30);
    ctx.strokeStyle = color;
    ctx.strokeRect(w/2 - 60, h - 45, 120, 30);
    
    ctx.fillStyle = color;
    ctx.font = "12px 'Share Tech Mono'";
    ctx.textAlign = "center";
    let arrow = "―";
    if (direction === 'UP') arrow = "▲";
    if (direction === 'DOWN') arrow = "▼";
    ctx.fillText(`${arrow} VVI: ${Math.abs(Math.round(vvi))} FT/M`, w / 2, h - 25);
}

function drawStaticHorizon(ctx, w, h) {
    const midX = w / 2;
    const midY = h / 2;
    ctx.strokeStyle = "#222";
    ctx.strokeRect(75, 10, w - 150, h - 20);
    ctx.strokeStyle = "#00FF41"; 
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(midX - 35, midY); ctx.lineTo(midX - 10, midY); ctx.lineTo(midX - 10, midY + 5);
    ctx.moveTo(midX + 35, midY); ctx.lineTo(midX + 10, midY); ctx.lineTo(midX + 10, midY + 5);
    ctx.stroke();
}