// physics-worker.js - PRO-SIM ENGINE
let ctx;
let lastTime = 0;

let state = {
    altitude: 0,
    velocity: 150,
    vSpeed: 0,
    isEngineRunning: true
};

self.onmessage = function(e) {
    if (e.data.type === 'INIT') {
        ctx = e.data.canvas.getContext('2d');
        // LOCK RESOLUTION: Ensures text size is consistent regardless of CSS stretching
        ctx.canvas.width = 400; 
        ctx.canvas.height = 600;
    }
    if (e.data.type === 'START_FLIGHT') {
        lastTime = performance.now();
        renderLoop(performance.now());
    }
};

function renderLoop(currentTime) {
    if (!state.isEngineRunning) return;

    const dt = lastTime ? (currentTime - lastTime) / 1000 : 0.016;
    lastTime = currentTime;

    // SIMULATION BOUNDS: Stop at exactly 35,000 ft
    if (state.altitude < 35000) {
        
        // DYNAMIC SPEED: Accelerating through the climb
        state.velocity += 22 * dt; 

        /** * STEP 2: PHYSICS OVERCLOCK 
         * Adding 'Air Density' (Rho) makes it look like a real simulation.
         * As you go higher, the air gets thinner, slowing the climb naturally.
         */
        const rho = Math.max(0.3, 1.225 * Math.exp(-state.altitude / 30000));
        const lift = (state.velocity * 16.5) * (5 / 10) * rho; 
        const gravity = 9.8;
        
        state.vSpeed += (lift - gravity) * dt;
        state.altitude += state.vSpeed * dt; 

        // RENDER: Solid Shield + Data
        drawPFD(state.altitude, state.velocity, state.vSpeed);

        // DATA HANDOVER: Return to main thread
        self.postMessage({ 
            type: 'TELEMETRY', 
            altitude: state.altitude, 
            velocity: state.velocity 
        });

        requestAnimationFrame(renderLoop);
    } else {
        // LEVEL OFF: Cleanly snap to 35,000 for that "Auto-Pilot" feel
        state.altitude = 35000;
        state.vSpeed = 0;
        drawPFD(state.altitude, state.velocity, 0);
    }
}

function drawPFD(alt, spd, vs) {
    if (!ctx) return;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // STEP 3: OPAQUE SHIELD (Hallucination Killer)
    ctx.fillStyle = "#05070a"; 
    ctx.fillRect(0, 0, w, h);

    // TACTICAL UI DECORATION
    ctx.strokeStyle = "rgba(0, 229, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, w-20, h-20); // Border

    // DATA RENDERING
    ctx.fillStyle = "#00e5ff";
    ctx.font = "bold 44px 'Share Tech Mono', monospace";
    
    // Aligned Text with Shadows for "Film Look"
    ctx.shadowColor = "rgba(0, 229, 255, 0.5)";
    ctx.shadowBlur = 8;
    ctx.fillText(`ALT: ${Math.round(alt).toString().padStart(5, '0')}`, 30, 120);
    ctx.fillText(`SPD: ${Math.round(spd)} KTS`, 30, 200);
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = vs >= 0 ? "#00ff41" : "#ff3b3b";
    ctx.font = "bold 24px 'Share Tech Mono', monospace";
    ctx.fillText(`V/S: ${Math.round(vs * 60)} FPM`, 30, 260);

    // BOX DECORATION (The "invisible 4 columns" fix)
    ctx.strokeStyle = "#00e5ff";
    ctx.beginPath();
    ctx.moveTo(30, 280);
    ctx.lineTo(w - 30, 280);
    ctx.stroke();
}