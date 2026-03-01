/**
 * lattice-engine.js - NIST ML-KEM (Lattice-Based) Security Engine
 * Pitch: Visualizing Shortest Vector Problem (SVP) entropy via point-cloud matrix.
 * Architecture: Optimized for industrial symmetry and pixel-perfect scaling.
 */

let isUnderAttack = false;
let animationRunning = false; 

export function triggerAttack(status) { 
    isUnderAttack = status; 
}

export async function initHandshake() {
    logTerminalMessage("NIST_ML_KEM_1024: INJECTING ENTROPY...");
    await new Promise(r => setTimeout(r, 1200));
    logTerminalMessage("LATTICE_ENGINE: BASIS VECTORS STABILIZED.", "#00FF41");
}

export function logTerminalMessage(msg, color = "#00FF41") {
    const term = document.getElementById('terminal-box');
    if (!term) return;
    const p = document.createElement('div');
    p.style.margin = "0 0 2px 0";
    
    const isWarning = msg.includes("!!") || msg.includes("ALERT") || msg.includes("THREAT");
    p.style.color = isWarning ? "#FF3B3B" : color;
    
    const timestamp = performance.now().toFixed(0).slice(-4);
    p.innerHTML = `<span style="color: #444;">[${timestamp}]</span> ${msg}`;
    term.appendChild(p);
    
    term.scrollTop = term.scrollHeight;
    if (term.childNodes.length > 40) term.removeChild(term.firstChild);
}

export function drawLattice(canvasId) {
    if (animationRunning) return; 

    const mainCanvas = document.getElementById(canvasId);
    if (!mainCanvas) return;
    
    const ctx = mainCanvas.getContext('2d', { alpha: false, desynchronized: true });
    
    let nodes = [];
    const rows = 18; // Slightly fewer rows for a cleaner, high-tech look
    const cols = 18;

    const setupNodes = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = mainCanvas.parentElement.getBoundingClientRect();
        
        if (rect.width <= 0 || rect.height <= 0) return false;

        mainCanvas.width = rect.width * dpr;
        mainCanvas.height = rect.height * dpr;
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        
        nodes = [];
        
        // ADDING INDUSTRIAL MARGIN (So dots don't touch the border)
        const margin = 30; 
        const drawW = rect.width - (margin * 2);
        const drawH = rect.height - (margin * 2);
        
        const spacingX = drawW / (cols - 1);
        const spacingY = drawH / (rows - 1);

        for(let r = 0; r < rows; r++) {
            for(let c = 0; c < cols; c++) {
                nodes.push({
                    x: margin + (c * spacingX),
                    y: margin + (r * spacingY),
                    phase: (c + r) * 0.4, 
                    row: r,
                    col: c
                });
            }
        }
        return true;
    };

    if (!setupNodes()) {
        setTimeout(() => drawLattice(canvasId), 100);
        return;
    }

    animationRunning = true;
    window.addEventListener('resize', setupNodes);

    function animate() {
        const time = performance.now() * 0.001;
        const displayW = mainCanvas.width / (window.devicePixelRatio || 1);
        const displayH = mainCanvas.height / (window.devicePixelRatio || 1);
        
        ctx.fillStyle = "#020202";
        ctx.fillRect(0, 0, displayW, displayH);

        const currentPos = nodes.map(n => {
            let tx = n.x + Math.sin(time + n.phase) * 1.5;
            let ty = n.y + Math.cos(time + n.phase) * 1.5;
            
            if (isUnderAttack) {
                // High-frequency noise injection
                tx += (Math.random() - 0.5) * 8;
                ty += (Math.random() - 0.5) * 8;
            }
            return { x: tx, y: ty };
        });

        // 1. LATTICE MESH
        ctx.beginPath();
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = isUnderAttack ? "rgba(255, 59, 59, 0.3)" : "rgba(0, 255, 65, 0.12)";

        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            const pos = currentPos[i];
            if (n.col < cols - 1) {
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(currentPos[i + 1].x, currentPos[i + 1].y);
            }
            if (n.row < rows - 1) {
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(currentPos[i + cols].x, currentPos[i + cols].y);
            }
        }
        ctx.stroke();

        // 2. BASIS POINTS
        for (let i = 0; i < currentPos.length; i++) {
            const pos = currentPos[i];
            if (isUnderAttack && Math.random() > 0.97) {
                ctx.fillStyle = "#FFFFFF"; // Glitch highlight
                ctx.fillRect(pos.x - 2, pos.y - 2, 4, 4);
            } else {
                ctx.fillStyle = isUnderAttack ? "#FF3B3B" : "#00FF41";
                ctx.fillRect(pos.x - 1, pos.y - 1, 2, 2);
            }
        }
        
        requestAnimationFrame(animate);
    }
    animate();
}