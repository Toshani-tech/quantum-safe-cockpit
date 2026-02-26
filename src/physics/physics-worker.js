let ctx;
let altitude = 0;
let velocity = 150;

self.onmessage = function(e) {
    if (e.data.type === 'INIT') {
        ctx = e.data.canvas.getContext('2d');
    }
    
    if (e.data.type === 'START_FLIGHT') {
        renderLoop();
    }
};

function renderLoop() {
    // 60FPS Logic
    if (altitude < 35000) {
        altitude += 4.16; // Smoother increment (250 per second / 60)
        
        // 1. Draw to Canvas (Directly from thread!)
        drawPFD(altitude);

        // 2. Report back to Main Thread
        self.postMessage({ type: 'TELEMETRY', altitude, velocity });
        
        requestAnimationFrame(renderLoop);
    }
}

function drawPFD(alt) {
    if (!ctx) return;
    ctx.clearRect(0, 0, 400, 400);
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`ALT: ${Math.round(alt)} FT`, 50, 50);
    // Tomorrow we make this look like a real Boeing display
}