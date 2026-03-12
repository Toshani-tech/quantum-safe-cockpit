/**
 * physics-worker.js - V11.0
 */

import { calculateFlightDynamics } from './aerodynamics.js';
import init from '../../security-kernel/pkg/security_kernel.js'; 

let canvasCtx;
let missionStartTime = 0;
let canvasW = 0;
let canvasH = 0;
let dpr = 1; 
let latestSentTime = 0; 
let physicsInterval;

// Global state tracking for the PFD (Primary Flight Display)
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

    // 1. KERNEL BOOTSTRAPPING
   
    if (e.data.type === 'INIT') {
        const canvas = e.data.canvas;
        dpr = e.data.dpr || 1; 
        canvasW = canvas.width;
        canvasH = canvas.height;
        
        // ow-latency HUD updates
        canvasCtx = canvas.getContext('2d', { 
            alpha: false, 
            desynchronized: true 
        });
        
        canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
        canvasCtx.scale(dpr, dpr);

        try {
            // Booting the Security (ML-KEM/Lattice-Engine)
            await init();
            console.log("WORKER_KERNEL: ONLINE [NIST LEVEL 5 SECURITY]");
            self.postMessage({ type: 'KERNEL_READY' });
        } catch (err) {
            console.error("CRITICAL_SYSTEM_FAULT: WASM Kernel failed to initialize", err);
            self.postMessage({ type: 'BUS_IDLE', error: 'WASM_LOAD_FAIL' });
        }
    }
    
    // 2. MISSION CONTROL
    if (e.data.type === 'START_FLIGHT') {
        if (state.isRunning || state.isTerminated) return; 
        state.isRunning = true;
        state.isPaused = false;
        
        missionStartTime = performance.now();
        startPhysicsLoop();
        requestAnimationFrame(renderLoop);
    }

    if (e.data.type === 'PAUSE_FLIGHT') {
        state.isPaused = true;
        state.pausedAt = performance.now();
        clearInterval(physicsInterval);
    }

    if (e.data.type === 'RESUME_FLIGHT') {
        if (!state.isPaused || state.isTerminated) return;
        missionStartTime += (performance.now() - state.pausedAt);
        state.isPaused = false;
        startPhysicsLoop();
        requestAnimationFrame(renderLoop);
    }
};

/**
 *  RK4 KINEMATIC INTEGRATION
 * We run this at 16.6ms (60Hz) to match the avionics display refresh rate.
 */
function startPhysicsLoop() {
    const DT = 0.0166; 
    physicsInterval = setInterval(() => {
        if (state.isPaused || state.isTerminated) return;

        const elapsed = (performance.now() - missionStartTime) / 1000;

        try {
            // Processing Aerodynamics through the Calculus-based Governor
            const result = calculateFlightDynamics(state, DT, elapsed);
            
            if (result) {
                state.altitude = result.altitude; 
                state.airspeed = result.airspeed;
                state.missionPhase = result.missionPhase;
                state.vviStatus = result.vviStatus;
                state.vviDirection = result.vviDirection;
                
                // DATA DAMPING: 
                // Implementing a weighted moving average (0.7/0.3) to prevent 'jitter' 
        
                state.verticalVelocity = (state.verticalVelocity * 0.7) + (result.verticalVelocity * 0.3); 
            }
        } catch (err) {
            console.error("AVIONICS_BUS_ERROR: Physics step failed", err);
        }

        // Automatic mission termination at the 90-second ceiling
        if (elapsed >= 90.0 || state.missionPhase === 'MISSION_COMPLETE') {
            terminateMission();
        }

        // TELEMETRY UPLINK
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
    }, 16.6);
}

function renderLoop() {
    if (state.isTerminated) return;
    if (canvasCtx) drawPFD();
    if (!state.isPaused) requestAnimationFrame(renderLoop);
}

function terminateMission() {
    clearInterval(physicsInterval);
    state.isRunning = false;
    state.isTerminated = true; 
    state.missionPhase = 'MISSION_COMPLETE';
    if (canvasCtx) drawPFD(); 
    self.postMessage({ type: 'BUS_IDLE' });
}

/**
 * INDUSTRIAL GLASS COCKPIT
 */
function drawPFD() {
    const ctx = canvasCtx;
    const w = canvasW / dpr; 
    const h = canvasH / dpr; 
    
    ctx.fillStyle = "#010101"; 
    ctx.fillRect(0, 0, w, h);

    // PPU (Pixels Per Unit) 
    const altPPU = h / 600; 
    const spdPPU = h / 200;  

    drawStaticHorizon(ctx, w, h);
    
    // TAPE 1: AIRSPEED (IAS)
    drawVerticalTape(ctx, state.airspeed, 5, 65, "SPD", 20, "#00FF41", spdPPU);
    
    // TAPE 2: ALTITUDE (MSL)
    drawVerticalTape(ctx, state.altitude, w - 70, 70, "ALT", 100, "#00FF41", altPPU);
    
    // INDICATOR: VVI (Vertical Velocity Indicator)
    drawVVI(ctx, w, h, state.verticalVelocity, state.vviStatus, state.vviDirection);
}

/**
 *  VERTICAL TAPES
 */
function drawVerticalTape(ctx, value, x, width, label, step, themeColor, ppu) {
    const h = canvasH / dpr;
    const centerY = h / 2;
    
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, 10, width, h - 20); // Clipping path for the tape window
    ctx.clip(); 
    
    ctx.fillStyle = "rgba(5, 5, 5, 0.9)";
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
        // Fading edges 
        ctx.globalAlpha = Math.max(0, 1.1 - (Math.abs(y - centerY) / (h / 2))); 
        
        if (label === "SPD") {
            ctx.moveTo(x + width, y); ctx.lineTo(x + width - 8, y);
            ctx.textAlign = "right";
            if (i % (step * 2) === 0) ctx.fillText(i.toString(), x + width - 12, y + 4);
        } else {
            ctx.moveTo(x, y); ctx.lineTo(x + 8, y); 
            ctx.textAlign = "left";
            if (i % (step * 2) === 0) ctx.fillText(i.toString(), x + 12, y + 4);
        }
        ctx.stroke();
    }
    ctx.restore();

    // The 'Digital Readout' Box 
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
    // Visual warning if descent rate is dangerous
    const color = (status === 'DANGER') ? "#FF3030" : "#00FF41";
    ctx.fillStyle = "rgba(0,0,0,0.85)";
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
    ctx.strokeStyle = "#1a1a1a";
    ctx.strokeRect(75, 10, w - 150, h - 20);
    
    //  Waterline
    ctx.strokeStyle = "#00FF41"; 
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(midX - 35, midY); ctx.lineTo(midX - 10, midY); ctx.lineTo(midX - 10, midY + 5);
    ctx.moveTo(midX + 35, midY); ctx.lineTo(midX + 10, midY); ctx.lineTo(midX + 10, midY + 5);
    ctx.stroke();
}