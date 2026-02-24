let isUnderAttack = false;
export function triggerAttack(status) { isUnderAttack = status; }

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
        logTerminalMessage("Quantum Keys Verified.");
        logTerminalMessage("Beginning Physics-Based Ascent...");
        callback();
    }, 2500);
}

export function drawLattice(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let dots = [];
    const spacing = 18;

    function buildGrid() {
        // Now that CSS is set to 100%, these will return the full panel size
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        
        dots = [];
        for (let x = spacing; x < canvas.width; x += spacing) {
            for (let y = spacing; y < canvas.height; y += spacing) {
                dots.push({ x, y, originX: x, originY: y });
            }
        }
    }

    // Initialize and listen for resize
    buildGrid();
    window.addEventListener('resize', buildGrid);

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        dots.forEach(dot => {
            const pulse = Math.sin(Date.now() * 0.002 + (dot.originX * 0.05) + (dot.originY * 0.05)) * 0.4 + 0.6;
            
            ctx.beginPath();
            if (isUnderAttack) {
                const jitterX = (Math.random() - 0.5) * 4;
                const jitterY = (Math.random() - 0.5) * 4;
                ctx.fillStyle = `rgba(255, 50, 50, ${pulse})`;
                ctx.arc(dot.originX + jitterX, dot.originY + jitterY, 1.5, 0, Math.PI * 2);
            } else {
                ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
                ctx.arc(dot.originX, dot.originY, 1.5, 0, Math.PI * 2);
            }
            ctx.fill();
        });
        requestAnimationFrame(animate);
    }
    animate();
}