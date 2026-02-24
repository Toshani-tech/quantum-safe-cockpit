let isUnderAttack = false;

export function triggerAttack(status) {
    isUnderAttack = status;
}

export function logTerminalMessage(message) {
    const terminal = document.getElementById('terminal-box');
    if (!terminal) return;
    const newEntry = document.createElement('p');
    newEntry.className = 'log-entry';
    newEntry.innerText = `> ${message}`;
    terminal.appendChild(newEntry);
    terminal.scrollTop = terminal.scrollHeight;
}

export function initHandshake(callback) {
    logTerminalMessage("Initializing ARINC 429 Data Bus...");
    setTimeout(() => { logTerminalMessage("Establishing ML-KEM Lattice Handshake..."); }, 1000);
    setTimeout(() => {
        logTerminalMessage("Quantum Keys Verified. GPS Integrity Secured.");    
        logTerminalMessage("Beginning Physics-Based Ascent...");
        callback();
    }, 2500);
}

export function drawLattice(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    
    // FIX 1: Force high-resolution scaling to fit the CSS panel perfectly
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const dots = [];
    
    // FIX 2: High-Density Spacing (Changed from 25 to 15 for that "Elite" look)
    const spacing = 15; 

    for (let x = spacing; x < canvas.width; x += spacing) {
        for (let y = spacing; y < canvas.height; y += spacing) {
            dots.push({ x, y, originX: x });
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        dots.forEach(dot => {
            // The diagonal wave math
            const pulse = Math.sin(Date.now() * 0.002 + (dot.x * 0.05) + (dot.y * 0.05)) * 0.4 + 0.6;

            if (isUnderAttack) {
                // PHASE 4 BREACH: Red, aggressive jitter
                dot.x = dot.originX + (Math.random() - 0.5) * 3.5; 
                ctx.fillStyle = `rgba(255, 50, 50, ${pulse})`;
                ctx.shadowColor = "red";
                ctx.shadowBlur = 15;
            } else {
                // STABLE PQC STATE: Cyan, smooth wave
                dot.x = dot.originX;
                ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
                ctx.shadowColor = "cyan";
                ctx.shadowBlur = 8;
            }

            // FIX 3: Increased dot size to 2px for better visibility
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // Reset for performance
        });

        requestAnimationFrame(animate);
    }
    animate();
}