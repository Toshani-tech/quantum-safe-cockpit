/**
 * physics-worker.js - PRO-SIM ENGINE (AVIONICS GRADE)
 * Strategy: Sub-pixel tape interpolation & high-fidelity state integration.
 * Fix: Corrected Tape Directionality & Ground-Floor Clamping.
 */

import { calculateFlightDynamics } from './aerodynamics.js';

let canvasCtx;
let lastTime = 0;
let missionStartTime = 0;

let state = {
    altitude: 0,
    airspeed: 0,
    verticalVelocity: 0,
    missionPhase: 'PRE_FLIGHT',
    isRunning: false
};

self.onmessage = function(e) {
    if (e.data.type === 'INIT') {
        // alpha: false improves performance on high-speed avionics updates
        canvasCtx = e.data.canvas.getContext('2d', { alpha: false });
    }
    if (e.data.type === 'SET_PHASE') {
        state.missionPhase = e.data.phase;
    }
    if (e.data.type === 'START_FLIGHT') {
        state.isRunning = true;
        missionStartTime = performance.now();
        lastTime = performance.now();
        renderLoop(performance.now());
    }
};

function renderLoop(currentTime) {
    if (!state.isRunning) return;

    // Hardened Delta-Time: prevents negative spikes or logic "explosions"
    const dt = Math.max(0, Math.min((currentTime - lastTime) / 1000, 0.032)); 
    lastTime = currentTime;
    const elapsed = (currentTime - missionStartTime) / 1000;

    // PHYSICS PASS
    const physicsResult = calculateFlightDynamics(state, dt);
    
    state.altitude = Math.max(0, physicsResult.altitude); // Ground Clamp
    state.airspeed = Math.max(0, physicsResult.airspeed);
    state.verticalVelocity = physicsResult.verticalVelocity; 
    
    // RENDER PASS
    drawPFD();

    self.postMessage({ 
        type: 'TELEMETRY', 
        altitude: state.altitude, 
        airspeed: state.airspeed,
        verticalVelocity: state.verticalVelocity,
        missionPhase: state.missionPhase,
        elapsed: elapsed.toFixed(1)
    });

    requestAnimationFrame(renderLoop);
}

function drawPFD() {
    const ctx = canvasCtx;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Zero-out background
    ctx.fillStyle = "#020202"; 
    ctx.fillRect(0, 0, w, h);

    // DRAW TAPES (Independently Scaled)
    // Speed Tape: Left side. High PPU for sensitivity.
    drawVerticalTape(ctx, state.airspeed, 10, 70, "SPD", 20, "#00FF41", 4.0);
    
    // Altitude Tape: Right side. Lower PPU for high-alt stability.
    drawVerticalTape(ctx, state.altitude, w - 80, 70, "ALT", 100, "#00FF41", 0.4);

    // VERTICAL SPEED INDICATOR (VSI) - TACTICAL OVERLAY
    const fpm = state.verticalVelocity;
    let vsColor = "#00FF41"; 
    if (Math.abs(fpm) > 500) vsColor = "#FFBF00"; // Amber Caution
    if (Math.abs(fpm) > 1500) vsColor = "#FF3B3B"; // Red Alert
    
    ctx.fillStyle = vsColor;
    ctx.font = "12px 'Share Tech Mono'";
    ctx.textAlign = "center";
    ctx.fillText(`V/S: ${Math.round(fpm)} FPM`, w / 2, h - 20);
}

/**
 * FIXED-DIRECTION TAPE LOGIC
 * Corrects the Y-Coord inversion so numbers move UP during ascent.
 */
function drawVerticalTape(ctx, value, x, width, label, step, themeColor, ppu) {
    const h = ctx.canvas.height;
    const centerY = h / 2;

    // 1. Draw Tape Housing
    ctx.fillStyle = "#080808";
    ctx.fillRect(x, 0, width, h);
    
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, 0, width, h);
    ctx.clip(); 

    ctx.strokeStyle = themeColor;
    ctx.fillStyle = themeColor;
    ctx.lineWidth = 1.2;
    ctx.font = "11px monospace";

    // 2. Logic: Calculate the nearest "Step" to the current value
    const startValue = Math.floor((value - (h / 2) / ppu) / step) * step;
    const endValue = Math.ceil((value + (h / 2) / ppu) / step) * step;

    for (let i = startValue; i <= endValue; i += step) {
        // GROUND LOCK: Don't draw negative altitude markers
        if (i < 0 && label === "ALT") continue;

        // THE FIX: (i - value) * ppu determines the offset from center.
        // Subtracting it from centerY ensures that as 'i' increases, 'y' decreases (moves UP).
        const y = centerY - (i - value) * ppu;

        ctx.beginPath();
        if (label === "SPD") {
            ctx.moveTo(x + width, y);
            ctx.lineTo(x + width - 10, y);
            ctx.stroke();
            if (i % (step * 2) === 0) ctx.fillText(i.toString(), x + 5, y + 4);
        } else {
            ctx.moveTo(x, y);
            ctx.lineTo(x + 10, y);
            ctx.stroke();
            if (i % (step * 1) === 0) ctx.fillText(i.toString(), x + width - 35, y + 4);
        }
    }
    ctx.restore();

    // 3. FIXED DIGITAL READOUT (The Center Indicator)
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 1.5;
    ctx.fillRect(x - 5, centerY - 15, width + 10, 30);
    ctx.strokeRect(x - 5, centerY - 15, width + 10, 30);
    
    ctx.fillStyle = "#FFF";
    ctx.font = "bold 15px 'Share Tech Mono'";
    ctx.textAlign = "center";
    ctx.fillText(Math.round(value), x + width / 2, centerY + 6);
}