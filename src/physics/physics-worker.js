/**
 * physics-worker.js - Decoupled Main-Thread Execution
 * Role: High-fidelity physics integration + Offscreen Canvas PFD Rendering.
 */

import { calculateFlightDynamics } from './aerodynamics.js';

let ctx, lastTime = 0, missionStart = 0;
const CEILING = 32000; 
const TIMELINE = { TAXI: 10, CLIMB: 50, LOITER: 80, FINAL: 90 };

let state = { 
    altitude: 0, 
    verticalVelocity: 0, 
    airspeed: 0, 
    phase: 'PRE_FLIGHT', 
    isClimbing: false, 
    isEngineRunning: true, 
    thrustMultiplier: 0 
};

self.onmessage = function(e) {
    if (e.data.type === 'INIT') {
        ctx = e.data.canvas.getContext('2d', { alpha: false }); 
        // Force internal resolution to match physical display
        ctx.canvas.width = e.data.width; 
        ctx.canvas.height = e.data.height;
    }
    if (e.data.type === 'START_FLIGHT') {
        missionStart = performance.now();
        lastTime = performance.now();
        requestAnimationFrame(tick);
    }
};

function tick(t) {
    if (!state.isEngineRunning || !ctx) return;
    
    const dt = Math.min((t - lastTime) / 1000, 0.1);
    const elapsed = (t - missionStart) / 1000;
    lastTime = t;

    updatePhases(elapsed);
    
    const updated = calculateFlightDynamics(state, dt, state.thrustMultiplier);
    Object.assign(state, updated);

    // INDUSTRIAL RENDER
    drawPFD(state.altitude, state.airspeed, state.verticalVelocity, state.phase);
    
    // Type-Safe Telemetry Stream
    self.postMessage({ type: 'TELEMETRY', ...state });
    
    requestAnimationFrame(tick);
}

function updatePhases(elapsed) {
    if (elapsed < TIMELINE.TAXI) { 
        state.phase = 'STARTUP_TAXI'; 
        state.thrustMultiplier = 0.15; 
    } else if (elapsed < TIMELINE.CLIMB) { 
        state.phase = 'THROTTLED_ASCENT'; 
        state.thrustMultiplier = 1.9; 
        state.isClimbing = state.altitude < CEILING; 
    } else if (elapsed < TIMELINE.LOITER) { 
        state.phase = 'ENGAGEMENT_ZONE'; 
        state.thrustMultiplier = 1.0; 
        state.isClimbing = false;
    } else if (elapsed < TIMELINE.FINAL) { 
        state.phase = 'FINAL_APPROACH'; 
        state.thrustMultiplier = 0.4; 
        state.isClimbing = false; 
    } else { 
        state.phase = 'MISSION_COMPLETE'; 
        state.isEngineRunning = false; 
    }
}

function drawPFD(alt, spd, vs, phase) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const centerY = h / 2;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#030303"; 
    ctx.fillRect(0, 0, w, h);

    const themeColor = (phase === 'ENGAGEMENT_ZONE') ? "#FF3B3B" : "#00FF41";
    ctx.strokeStyle = themeColor;
    ctx.fillStyle = themeColor;
    ctx.font = "11px 'Share Tech Mono'"; 

    // 1. HORIZON LINE (Pitch: Moves opposite to Vertical Velocity)
    const pitchShift = Math.max(-h/3, Math.min(vs / 4, h/3));
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.2, centerY + pitchShift); 
    ctx.lineTo(w * 0.8, centerY + pitchShift);
    ctx.stroke();

    // 2. TAPES
    drawVerticalTape(ctx, w - 55, centerY, alt, "ALT", themeColor, false);
    drawVerticalTape(ctx, 15, centerY, spd, "SPD", themeColor, true);

    // 3. READOUT
    ctx.textAlign = "center";
    ctx.font = "bold 22px 'Share Tech Mono'";
    ctx.fillText(Math.round(alt), w/2, centerY - 5);
    ctx.font = "9px 'Share Tech Mono'";
    ctx.fillStyle = "#444";
    ctx.fillText("FT MSL", w/2, centerY + 10);
}

function drawVerticalTape(ctx, x, centerY, value, label, color, isLeft) {
    const tapeW = 40;
    const tapeH = ctx.canvas.height * 0.7;
    const startY = (ctx.canvas.height - tapeH) / 2;

    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, startY, tapeW, tapeH);
    
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(label, x + tapeW/2, startY - 10);

    // INDUSTRIAL PRECISION: Fixed scrolling logic
    const gap = 50; // Pixels between each 100-unit increment
    const offset = (value % 100) * (gap / 100);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, startY, tapeW, tapeH);
    ctx.clip();

    for (let i = -4; i <= 4; i++) {
        const roundedVal = Math.floor(value / 100) * 100;
        const displayNum = roundedVal + (i * 100);
        if (displayNum < 0) continue;

        // Numbers move DOWN as value increases
        const yPos = centerY + offset - (i * gap);
        
        ctx.globalAlpha = Math.max(0, 1 - Math.abs(yPos - centerY) / (tapeH/2));
        ctx.font = "12px 'Share Tech Mono'";
        ctx.fillText(displayNum, x + tapeW/2, yPos);
        
        // Add tick marks
        ctx.beginPath();
        ctx.moveTo(isLeft ? x + tapeW : x, yPos);
        ctx.lineTo(isLeft ? x + tapeW - 8 : x + 8, yPos);
        ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1.0;
}