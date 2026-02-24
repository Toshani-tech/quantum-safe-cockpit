


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
    
    // FIX: This ensures the dots appear by matching the canvas pixels to the screen size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const dots = [];
    const spacing = 25;

    for (let x = spacing; x < canvas.width; x += spacing) {
        for (let y = spacing; y < canvas.height; y += spacing) {
            dots.push({ x, y, originX: x });
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        dots.forEach(dot => {
            // THE WAVE MATH
            const pulse = Math.sin(Date.now() * 0.002 + (dot.x * 0.05) + (dot.y * 0.05)) * 0.4 + 0.6;

            if (isUnderAttack) {
                // RED JITTER STATE (20k-25k)
                dot.x = dot.originX + (Math.random() - 0.5) * 2.5;
                ctx.fillStyle = `rgba(255, 50, 50, ${pulse})`;
                ctx.shadowColor = "red";
            } else {
                // NORMAL CYAN WAVE
                dot.x = dot.originX;
                ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
                ctx.shadowColor = "cyan";
            }

            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 1.5, 0, Math.PI * 2);
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        requestAnimationFrame(animate);
    }
    animate();
}