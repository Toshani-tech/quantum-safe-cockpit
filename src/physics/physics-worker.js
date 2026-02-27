// physics-worker.js - PRO-SIM ENGINE (AVIONICS GRADE)
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
        // LOCK RESOLUTION: Sharp pixel density for data readability
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

    if (state.altitude < 35000) {
        state.velocity += 22 * dt; 
        const rho = Math.max(0.3, 1.225 * Math.exp(-state.altitude / 30000));
        const lift = (state.velocity * 16.5) * (5 / 10) * rho; 
        const gravity = 9.8;
        
        state.vSpeed += (lift - gravity) * dt;
        state.altitude += state.vSpeed * dt; 

        drawPFD(state.altitude, state.velocity, state.vSpeed);

        self.postMessage({ 
            type: 'TELEMETRY', 
            altitude: state.altitude, 
            velocity: state.velocity 
        });

        requestAnimationFrame(renderLoop);
    } else {
        state.altitude = 35000;
        state.vSpeed = 0;
        drawPFD(state.altitude, state.velocity, 0);
    }
}

function drawPFD(alt, spd, vs) {
    if (!ctx) return;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // 1. INDUSTRIAL BLACKOUT
    ctx.fillStyle = "#030303"; 
    ctx.fillRect(0, 0, w, h);

    // 2. DRAW VERTICAL TAPES (AIRSPEED & ALTITUDE)
    drawVerticalTape(ctx, spd, 0, 80, h, "SPD", 10);      // Left Tape: Speed
    drawVerticalTape(ctx, alt, w - 80, 80, h, "ALT", 100); // Right Tape: Altitude

    // 3. CENTER DATA (VERTICAL SPEED & HEADING INDICATOR)
    ctx.fillStyle = "#00FF41"; // Aviation Green
    ctx.font = "bold 14px 'Share Tech Mono'";
    ctx.textAlign = "center";
    ctx.fillText(`V/S: ${Math.round(vs * 60)} FPM`, w/2, h/2 - 50);

    // Artificial Horizon Line (Minimalist Industrial)
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w/2 - 50, h/2);
    ctx.lineTo(w/2 + 50, h/2);
    ctx.stroke();
}

/**
 * INDUSTRIAL TAPE FUNCTION
 * Mimics Boeing/Airbus PFD Tape Logic
 */
function drawVerticalTape(ctx, value, x, width, height, label, step) {
    const centerY = height / 2;
    const pixelsPerUnit = 0.5;

    // Tape Background
    ctx.fillStyle = "rgba(15, 15, 15, 0.9)";
    ctx.fillRect(x, 0, width, height);
    ctx.strokeStyle = "#333";
    ctx.strokeRect(x, 0, width, height);

    // Tick Marks
    ctx.strokeStyle = "#00FF41";
    ctx.fillStyle = "#00FF41";
    ctx.font = "12px 'Share Tech Mono'";
    ctx.textAlign = (label === "ALT") ? "left" : "right";

    const startValue = Math.floor((value - 500) / step) * step;
    const endValue = Math.ceil((value + 500) / step) * step;

    for (let i = startValue; i <= endValue; i += step) {
        const y = centerY - (i - value) * pixelsPerUnit;
        if (y < 0 || y > height) continue;

        ctx.beginPath();
        ctx.moveTo(x + (label === "ALT" ? 0 : width), y);
        ctx.lineTo(x + (label === "ALT" ? 20 : width - 20), y);
        ctx.stroke();

        if (i % (step * 5) === 0) {
            const textX = (label === "ALT") ? x + 25 : x + width - 25;
            ctx.fillText(i.toString(), textX, y + 4);
        }
    }

    // CURRENT VALUE BOX (THE "POINTER")
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#00FF41";
    ctx.lineWidth = 2;
    ctx.fillRect(x - 5, centerY - 15, width + 10, 30);
    ctx.strokeRect(x - 5, centerY - 15, width + 10, 30);

    ctx.fillStyle = "#FFF";
    ctx.font = "bold 18px 'Share Tech Mono'";
    ctx.textAlign = "center";
    ctx.fillText(Math.round(value).toString(), x + width/2, centerY + 7);
}