// security/lattice-engine.js
let isUnderAttack = false;
let animationId = null;

export function triggerAttack(status) { isUnderAttack = status; }

export async function initHandshake() {
    logTerminalMessage("INITIALIZING ARINC 429 BUS...");
    await new Promise(r => setTimeout(r, 800));
    
    logTerminalMessage("ML-KEM HANDSHAKE: GENERATING LATTICE VECTORS...");
    await new Promise(r => setTimeout(r, 1200));
    
    logTerminalMessage("QUANTUM KEYS VERIFIED [OK].");
    logTerminalMessage("PQC SHIELD ACTIVE.");
}

export function logTerminalMessage(message) {
    const terminal = document.getElementById('terminal-box');
    if (!terminal) return;
    
    const newEntry = document.createElement('p');
    newEntry.className = 'log-entry';
    newEntry.style.margin = "2px 0";
    newEntry.style.fontFamily = "'Share Tech Mono', monospace";
    
    if (message.includes("CRITICAL") || message.includes("BREACH")) {
        newEntry.style.color = "#ff3b3b";
        newEntry.style.fontWeight = "bold";
        newEntry.style.textShadow = "0 0 5px #ff3b3b";
    } else {
        newEntry.style.color = "#00e5ff";
    }
    
    newEntry.innerText = `> ${message}`;
    terminal.appendChild(newEntry);
    terminal.scrollTop = terminal.scrollHeight;
}

export function drawLattice(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let dots = [];
    const spacing = 22; // Slightly wider for better performance

    function buildGrid() {
        const dpr = window.devicePixelRatio || 1;
        // FIX: Force layout recalculation to prevent "weird large" stretching
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        dots = [];
        // Calculate based on actual CSS pixels to keep the grid tight
        for (let x = spacing; x < rect.width; x += spacing) {
            for (let y = spacing; y < rect.height; y += spacing) {
                dots.push({ x, y, originX: x, originY: y, phase: Math.random() * Math.PI * 2 });
            }
        }
    }

    window.addEventListener('resize', buildGrid);
    buildGrid();

    function animate() {
        // STEP 3: SOLID OPAQUE CLEAR
        // This ensures the "Quantum Lattice" doesn't have ghost text behind it
        ctx.fillStyle = "#05070a"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const time = Date.now() * 0.003;

        for (let i = 0; i < dots.length; i++) {
            const dot = dots[i];
            
            if (isUnderAttack) {
                // VIOLENT SHOCKWAVE: High amplitude vibration
                dot.x = dot.originX + Math.sin(time * 5 + i) * 6;
                dot.y = dot.originY + Math.cos(time * 5 + i) * 6;
                ctx.fillStyle = "#ff3b3b";
            } else {
                // CALM DRIFT: Gentle breathing effect
                const drift = Math.sin(time + dot.phase) * 2;
                dot.x = dot.originX + drift;
                dot.y = dot.originY + drift;
                
                const pulse = Math.sin(time + (dot.originX * 0.02)) * 0.4 + 0.6;
                ctx.fillStyle = `rgba(0, 229, 255, ${pulse})`;
            }

            ctx.beginPath();
            // Larger dots (1.5) to look more "tactical" and less like noise
            ctx.arc(dot.x, dot.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        animationId = requestAnimationFrame(animate);
    }

    if (animationId) cancelAnimationFrame(animationId);
    animate();
}