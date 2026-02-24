


let isUnderAttack = false; 

export function triggerAttack(status) {
    isUnderAttack = status;
}

export function logTerminalMessage(message) {
    const terminal = document.getElementById('terminal-box');
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
    const dots = [];
    const spacing = 25;

    for (let x = spacing; x < canvas.width; x += spacing) {
        for (let y = spacing; y < canvas.height; y += spacing) {
            dots.push({ x, y, originX: x }); // originX helps the jitter stay in place
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        dots.forEach(dot => {
            const pulse = Math.sin(Date.now() * 0.002 + (dot.x * 0.05) + (dot.y * 0.05)) * 0.4 + 0.6;
            
            // Handle the Jitter logic
            if (isUnderAttack) {
                dot.x = dot.originX + (Math.random() - 0.5) * 1.5;
                ctx.fillStyle = `rgba(255, 50, 50, ${pulse})`;
                ctx.shadowColor = "red";
            } else {
                dot.x = dot.originX; // Return to normal
                ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
                ctx.shadowColor = "cyan";
            }

            // Draw the Dot
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 1.5, 0, Math.PI * 2);
            ctx.shadowBlur = 10;
            ctx.fill();

            // Draw Connection Line (Only if NOT under attack for extra "broken" effect)
            if (!isUnderAttack) {
                ctx.beginPath();
                ctx.moveTo(dot.x, dot.y);
                ctx.lineTo(dot.x + 5, dot.y + 5);
                ctx.strokeStyle = `rgba(0, 255, 255, ${pulse * 0.2})`;
                ctx.stroke();
            }
            
            ctx.shadowBlur = 0; // Reset for performance
        });
        
        requestAnimationFrame(animate);
    }
    animate();
}