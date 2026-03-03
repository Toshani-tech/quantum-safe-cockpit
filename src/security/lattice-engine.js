/**
 * lattice-engine.js - V6.0 NIST ML-KEM SECURITY KERNEL
 * Strategy: Visualizing the Shortest Vector Problem (SVP) and LWE Noise.
 * Safety: Thread-safe terminal logging and DPI-aware canvas scaling.
 */

let isUnderAttack = false;
let animationRunning = false; 

export function triggerAttack(status) { 
    isUnderAttack = status; 
}

/**
 * High-Speed Terminal Logger
 * Optimized for ARINC-429 data density.
 */
export function logTerminalMessage(msg, color = "#00FF41") {
    const term = document.getElementById('terminal-box');
    if (!term) return;
    
    const p = document.createElement('div');
    const isWarning = msg.includes("!!") || msg.includes("ALERT") || msg.includes("THREAT") || msg.includes("FAILURE");
    
    // Industrial styling: Use Amber for security info, Red for alerts
    p.style.color = isWarning ? "#FF3B3B" : (color === "#00FF41" ? "var(--av-amber)" : color);
    
    const timestamp = performance.now().toFixed(0).slice(-5);
    // Mimicking Hex-Encoded Telemetry
    const hexHeader = `0x${Math.floor(Math.random() * 0xFFF).toString(16).toUpperCase().padStart(3, '0')}`;
    
    p.innerHTML = `<span style="color: #444;">[${timestamp}]</span> <span style="color: #666;">${hexHeader}</span> ${msg}`;
    term.appendChild(p);
    
    // Keep the stream lean
    term.scrollTop = term.scrollHeight;
    while (term.childNodes.length > 35) {
        term.removeChild(term.firstChild);
    }
}

export async function initHandshake() {
    logTerminalMessage("BOOT: LOADING WASM_CORE_V1.0...");
    await new Promise(r => setTimeout(r, 600));
    
    logTerminalMessage("ML-KEM: INIT NTT (NUMBER THEORETIC TRANSFORM)...");
    await new Promise(r => setTimeout(r, 400));
    
    logTerminalMessage("LATTICE: MODULUS q=3329 | DIMENSION k=4");
    
    logTerminalMessage("CRYPTO: GENERATING SECRET VECTOR 's'...");
    await new Promise(r => setTimeout(r, 500));
    
    logTerminalMessage("CRYPTO: PUBLIC KEY 'A' COMPENSATED.", "#00FF41");
}
export function drawLattice(canvasId) {
    if (animationRunning) return; 

    const mainCanvas = document.getElementById(canvasId);
    if (!mainCanvas) return;
    
    const ctx = mainCanvas.getContext('2d', { alpha: false, desynchronized: true });
    
    let nodes = [];
    const rows = 20; 
    const cols = 20;

    const setupNodes = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = mainCanvas.parentElement.getBoundingClientRect();
        
        if (rect.width <= 0 || rect.height <= 0) return false;

        mainCanvas.width = rect.width * dpr;
        mainCanvas.height = rect.height * dpr;
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        
        nodes = [];
        const margin = 40; 
        const spacingX = (rect.width - (margin * 2)) / (cols - 1);
        const spacingY = (rect.height - (margin * 2)) / (rows - 1);

        for(let r = 0; r < rows; r++) {
            for(let c = 0; c < cols; c++) {
                nodes.push({
                    x: margin + (c * spacingX),
                    y: margin + (r * spacingY),
                    originX: margin + (c * spacingX),
                    originY: margin + (r * spacingY),
                    phase: (c + r) * 0.3
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
        const w = mainCanvas.width / (window.devicePixelRatio || 1);
        const h = mainCanvas.height / (window.devicePixelRatio || 1);
        
        ctx.fillStyle = "#020202";
        ctx.fillRect(0, 0, w, h);

        // Calculate LWE (Learning With Errors) Noise
        const noiseAmplitude = isUnderAttack ? 12 : 1.5;

        // 1. RENDER LATTICE CONNECTIONS (Symmetry)
        ctx.beginPath();
        ctx.strokeStyle = isUnderAttack ? "rgba(255, 59, 59, 0.2)" : "rgba(0, 255, 65, 0.08)";
        ctx.lineWidth = 0.5;

        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            // Apply NIST-Standard Noise Simulation
            const noiseX = Math.sin(time + n.phase) * noiseAmplitude;
            const noiseY = Math.cos(time + n.phase) * noiseAmplitude;
            
            n.currentX = n.originX + noiseX;
            n.currentY = n.originY + noiseY;

            if (i % cols < cols - 1) { // Horizontal lines
                ctx.moveTo(n.currentX, n.currentY);
                const next = nodes[i + 1];
                ctx.lineTo(next.originX + Math.sin(time + next.phase) * noiseAmplitude, 
                           next.originY + Math.cos(time + next.phase) * noiseAmplitude);
            }
        }
        ctx.stroke();

        // 2. RENDER BASIS VECTORS (Basis points)
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            
            if (isUnderAttack && Math.random() > 0.98) {
                ctx.fillStyle = "#FFFFFF"; // Decryption Error Glitch
                ctx.fillRect(n.currentX - 2, n.currentY - 2, 4, 4);
            } else {
                ctx.fillStyle = isUnderAttack ? "#FF3B3B" : "#00FF41";
                ctx.fillRect(n.currentX - 1, n.currentY - 1, 2, 2);
            }
        }
        
        requestAnimationFrame(animate);
    }
    animate();
}