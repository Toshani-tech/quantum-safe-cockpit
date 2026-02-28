/**
 * lattice-engine.js - NIST ML-KEM (Lattice-Based) Security Engine
 * Pitch: Visualizing Shortest Vector Problem (SVP) entropy via point-cloud matrix.
 * Strategy: Basis-Vector Mesh rendering with Stochastic Jitter.
 */

let isUnderAttack = false;
let animationRunning = false; 

export function triggerAttack(status) { 
    isUnderAttack = status; 
}

export async function initHandshake() {
    logTerminalMessage("NIST_ML_KEM_1024: INJECTING ENTROPY...");
    await new Promise(r => setTimeout(r, 800));
    logTerminalMessage("LATTICE_ENGINE: VECTORS STABILIZED.");
}

export function logTerminalMessage(msg, color = "#00FF41") {
    const term = document.getElementById('terminal-box');
    if (!term) return;
    const p = document.createElement('p');
    p.style.margin = "2px 0";
    p.style.color = msg.includes("!!") || msg.includes("WARNING") ? "#FF3B3B" : color;
    p.style.fontSize = "10px";
    p.style.fontFamily = "monospace";
    p.textContent = `> ${msg}`;
    term.appendChild(p);
    term.scrollTop = term.scrollHeight;
}

export function drawLattice(canvasId) {
    if (animationRunning) return; 
    animationRunning = true;

    const mainCanvas = document.getElementById(canvasId);
    if (!mainCanvas) return;
    const mainCtx = mainCanvas.getContext('2d', { alpha: false, desynchronized: true });

    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d', { alpha: false });
    
    let nodes = [];
    const rows = 20; // Reduced density for cleaner "Vector" look
    const cols = 20;

    const setupNodes = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = mainCanvas.parentElement.getBoundingClientRect();
        const w = Math.floor(rect.width);
        const h = Math.floor(rect.height);

        mainCanvas.width = offCanvas.width = w * dpr;
        mainCanvas.height = offCanvas.height = h * dpr;
        mainCanvas.style.width = w + 'px';
        mainCanvas.style.height = h + 'px';

        offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        nodes = [];
        const spacingX = w / cols;
        const spacingY = h / rows;

        for(let r = 0; r < rows; r++) {
            for(let c = 0; c < cols; c++) {
                nodes.push({
                    x: c * spacingX + spacingX / 2,
                    y: r * spacingY + spacingY / 2,
                    originX: c * spacingX + spacingX / 2,
                    originY: r * spacingY + spacingY / 2,
                    p: Math.random() * Math.PI * 2,
                    s: 2 + Math.random() * 2, // Slower, more "Industrial" oscillation
                    row: r,
                    col: c
                });
            }
        }
    };

    setupNodes();
    window.addEventListener('resize', setupNodes);

    function animate() {
        const time = Date.now() * 0.001;

        offCtx.fillStyle = "#000000";
        offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

        // RESEARCHER DETAIL: The Basis Vector Mesh
        // Draws faint lines between dots to represent the Lattice Geometry
        offCtx.lineWidth = 0.5;
        offCtx.beginPath();

        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            
            // Core oscillation logic
            let curX = n.x + Math.sin(time * n.s + n.p) * 1.5;
            let curY = n.y + Math.cos(time * n.s + n.p) * 1.5;

            if (isUnderAttack) {
                // High-Frequency Seismic Jitter
                curX += (Math.random() - 0.5) * 6;
                curY += (Math.random() - 0.5) * 6;
                offCtx.fillStyle = "#FF3B3B";
                offCtx.strokeStyle = "rgba(255, 59, 59, 0.15)";
            } else {
                offCtx.fillStyle = "#00FF41";
                offCtx.strokeStyle = "rgba(0, 255, 65, 0.08)";
            }

            // Draw connections to the right and bottom neighbors
            if (n.col < cols - 1) {
                const right = nodes[i + 1];
                offCtx.moveTo(curX, curY);
                offCtx.lineTo(right.x, right.y);
            }
            if (n.row < rows - 1) {
                const bottom = nodes[i + cols];
                offCtx.moveTo(curX, curY);
                offCtx.lineTo(bottom.x, bottom.y);
            }

            // Snap and Draw Node
            const dx = (curX + 0.5) | 0;
            const dy = (curY + 0.5) | 0;
            offCtx.fillRect(dx - 1, dy - 1, 2, 2);
        }
        offCtx.stroke(); // Batch draw connections for performance

        // DRAW BUFFER TO MAIN
        mainCtx.drawImage(offCanvas, 0, 0);
        requestAnimationFrame(animate);
    }
    animate();
}