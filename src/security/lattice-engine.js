/**
 * lattice-engine.js - Post-Quantum Cryptographic Visualization
 * Role: Simulating NIST ML-KEM (Lattice-Based) entropy.
 */

let isUnderAttack = false;
let animationRunning = false; 

export function triggerAttack(status) { 
    isUnderAttack = status; 
}

export async function initHandshake() {
    logTerminalMessage("NIST_ML_KEM_768: INJECTING ENTROPY...");
    await new Promise(r => setTimeout(r, 800));
    logTerminalMessage("CRYPTO_ENGINE: LATTICE VECTORS VERIFIED.");
}

export function logTerminalMessage(msg, color = "#00FF41") {
    const term = document.getElementById('terminal-box');
    if (!term) return;
    
    const p = document.createElement('p');
    p.style.margin = "2px 0";
    p.style.color = (msg.includes("!!") || msg.includes("WARNING")) ? "#FF3B3B" : color;
    p.style.fontSize = "10px";
    p.style.fontFamily = "'Share Tech Mono', monospace";
    p.innerText = `> ${msg}`;
    
    term.appendChild(p);
    if (term.childNodes.length > 50) term.removeChild(term.firstChild);
    term.scrollTop = term.scrollHeight;
}

export function drawLattice(canvasId) {
    if (animationRunning) return; 
    animationRunning = true;

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // INDUSTRIAL FIX: Force precise dimensions based on Parent container
    const resize = () => {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    };
    window.addEventListener('resize', resize);
    resize();

    const nodes = [];
    // MIT RESEARCHER DETAIL: Sparsity = Intelligence.
    const nodeCount = 28; 

    // INITIALIZE NODES: We use canvas dimensions after the first resize()
    for(let i = 0; i < nodeCount; i++) {
        nodes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4
        });
    }

    function animate() {
        // High-end trailing effect
        ctx.fillStyle = "rgba(3, 3, 3, 0.4)"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const themeColor = isUnderAttack ? "255, 59, 59" : "0, 255, 65";
        
        nodes.forEach((node, i) => {
            const multiplier = isUnderAttack ? 6 : 1;
            node.x += node.vx * multiplier;
            node.y += node.vy * multiplier;

            // Bounce logic with slight padding to prevent edge-clustering
            if (node.x < 5 || node.x > canvas.width - 5) node.vx *= -1;
            if (node.y < 5 || node.y > canvas.height - 5) node.vy *= -1;

            // DRAW DOTS (Entropy Seeds)
            ctx.beginPath();
            ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgb(${themeColor})`;
            ctx.fill();

            // DRAW STRUCTURED LATTICE
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = node.x - nodes[j].x;
                const dy = node.y - nodes[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                // Tighten the connection limit to 55 for absolute clarity
                if (dist < 55) {
                    ctx.beginPath();
                    const opacity = (1 - dist / 55) * 0.25;
                    ctx.strokeStyle = `rgba(${themeColor}, ${opacity})`;
                    ctx.lineWidth = 0.8;
                    ctx.moveTo(node.x, node.y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        });

        requestAnimationFrame(animate);
    }
    animate();
}