// physics-worker.js - PRO-SIM ENGINE (AVIONICS GRADE)
let ctx;
let lastTime = 0;
let missionStart = 0;

let state = {
    altitude: 0,
    velocity: 0,
    vSpeed: 0,
    phase: 'PRE_FLIGHT', // PRE_FLIGHT | CLIMB | ENGAGEMENT | CRUISE
    isEngineRunning: true
};

self.onmessage = function(e) {
    if (e.data.type === 'INIT') {
        ctx = e.data.canvas.getContext('2d');
        ctx.canvas.width = 400; 
        ctx.canvas.height = 600;
    }
    if (e.data.type === 'START_FLIGHT') {
        missionStart = performance.now();
        lastTime = performance.now();
        renderLoop(performance.now());
    }
};

function renderLoop(currentTime) {
    if (!state.isEngineRunning) return;

    const dt = lastTime ? (currentTime - lastTime) / 1000 : 0.016;
    const elapsed = (currentTime - missionStart) / 1000;
    lastTime = currentTime;

    // --- PHASE LOGIC (STRETCHING TO 90s) ---
    
    if (elapsed < 10) {
        // PHASE 1: PRE-FLIGHT (0-10s) - System Warmup
        state.phase = 'PRE_FLIGHT';
        state.altitude = 0;
        state.velocity = 0;
        state.vSpeed = 0;
    } 
    else if (elapsed < 40) {
        // PHASE 2: STEADY CLIMB (10-40s)
        state.phase = 'CLIMB';
        state.velocity = Math.min(250, state.velocity + 15 * dt);
        state.vSpeed = 80; // Controlled ascent
        state.altitude += state.vSpeed * dt;
    }
    else if (elapsed < 70) {
        // PHASE 3: ENGAGEMENT / LOITER (40-70s) - THE ATTACK ZONE
        state.phase = 'ENGAGEMENT';
        state.velocity = 240 + (Math.random() * 4); // Simulated turbulence
        state.vSpeed = (state.altitude > 25000) ? -10 : 10; // "Hover" around 25k ft
        state.altitude += state.vSpeed * dt;
    }
    else if (elapsed < 90) {
        // PHASE 4: FINAL CRUISE (70-90s)
        state.phase = 'CRUISE';
        state.velocity = 450;
        state.vSpeed = 20;
        state.altitude += state.vSpeed * dt;
    } else {
        // MISSION COMPLETE
        state.phase = 'COMPLETE';
    }

    // DRAW & SYNC
    drawPFD(state.altitude, state.velocity, state.vSpeed, state.phase);

    self.postMessage({ 
        type: 'TELEMETRY', 
        altitude: state.altitude, 
        velocity: state.velocity,
        phase: state.phase,
        timestamp: currentTime // For Latency Calc
    });

    requestAnimationFrame(renderLoop);
}

function drawPFD(alt, spd, vs, phase) {
    if (!ctx) return;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ctx.fillStyle = "#030303"; 
    ctx.fillRect(0, 0, w, h);

    drawVerticalTape(ctx, spd, 0, 80, h, "SPD", 10);
    drawVerticalTape(ctx, alt, w - 80, 80, h, "ALT", 100);

    // MISSION PHASE INDICATOR (New)
    ctx.fillStyle = (phase === 'ENGAGEMENT') ? "#FF3B3B" : "#00FF41";
    ctx.font = "bold 16px 'Share Tech Mono'";
    ctx.textAlign = "center";
    ctx.fillText(`PHASE: ${phase}`, w/2, 40);

    // V/S INDICATOR
    ctx.fillStyle = "#00FF41";
    ctx.font = "bold 14px 'Share Tech Mono'";
    ctx.fillText(`V/S: ${Math.round(vs * 60)} FPM`, w/2, h/2 - 50);

    // Artificial Horizon
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w/2 - 50, h/2);
    ctx.lineTo(w/2 + 50, h/2);
    ctx.stroke();
}

// ... (Keep your drawVerticalTape function exactly as is)