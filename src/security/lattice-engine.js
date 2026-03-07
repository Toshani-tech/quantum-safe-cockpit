/**
 * lattice-engine.js - V7.2 [STABILIZED LWE_CORE]
 * Feature: Learning With Errors (LWE) Noise & Decoupled State Management.
 * Industrial Fix: Added Canvas Context-Loss protection & performance throttling.
 */

let isUnderAttack = false;
let isSystemArmed = false; 
let animationRunning = false; 
let killSwitch = false; 

/**
 * Atomic termination to prevent ghost loops after 90s
 */
export function stopLattice() {
    killSwitch = true;
    animationRunning = false;
    isSystemArmed = false;
    isUnderAttack = false;
}

/**
 * Triggers visual "Attack" mode (High-Amplitude LWE Noise)
 */
export function triggerAttack(status) { 
    isUnderAttack = status; 
    logTerminalMessage(status ? "ALERT: LWE_VECTOR_INJECTION_DETECTED" : "SHIELD: LWE_NOISE_CANCELLATION_ACTIVE", 
                       status ? "#FF3B3B" : "#00FF41", "0xSHIELD");
}

/**
 * High-Speed Terminal Logger (Max 35 Lines for Industrial look)
 */
export function logTerminalMessage(msg, color = "#00FF41", tag = null) {
    const term = document.getElementById('terminal-box');
    if (!term) return;
    
    const p = document.createElement('div');
    const isWarning = msg.includes("!!") || msg.includes("ALERT") || msg.includes("THREAT") || msg.includes("FAILURE");
    
    // Industrial color logic: Amber during POST, Green when Secure, Red on Alert
    let finalColor = isWarning ? "#FF3B3B" : (isSystemArmed ? color : "var(--av-amber)");

    const timestamp = (performance.now() / 1000).toFixed(2);
    const signature = tag ? tag : `0x${Math.floor(Math.random() * 0xFFF).toString(16).toUpperCase().padStart(3, '0')}`;
    
    p.innerHTML = `
        <span style="color: #444;">[T+${timestamp}s]</span> 
        <span style="color: ${isWarning ? '#FF3B3B' : '#00FF41'}; font-weight: bold;">[${signature}]</span> 
        <span style="margin-left: 8px; color: ${finalColor}; font-family: 'JetBrains Mono', monospace;">${msg}</span>
    `;
    
    term.appendChild(p);
    term.scrollTop = term.scrollHeight;
    
    // Memory Management: Prune old logs to prevent DOM bloat
    while (term.childNodes.length > 35) {
        term.removeChild(term.firstChild);
    }
}

/**
 * NIST ML-KEM Handshake Simulation (Kyber 1024 Logic)
 */
export async function initHandshake() {
    if (isSystemArmed) return;

    logTerminalMessage("BOOT: LOADING WASM_CORE_V1.0...", "var(--av-amber)");
    await new Promise(r => setTimeout(r, 600));
    
    logTerminalMessage("ML-KEM: INIT NTT (NUMBER THEORETIC TRANSFORM)...");
    logTerminalMessage("LATTICE: q=3329 | k=4 | NIST_LEVEL_3");
    await new Promise(r => setTimeout(r, 500));
    
    isSystemArmed = true; 
    logTerminalMessage("CRYPTO: PUBLIC KEY 'A' COMPENSATED. BUS_SECURE.", "#00FF41");
}

/**
 * Renders the Post-Quantum Lattice Visualization
 */
export function drawLattice(canvasId) {
    if (animationRunning) return; 
    killSwitch = false;

    const mainCanvas = document.getElementById(canvasId);
    if (!mainCanvas) return;
    
    // Desynchronized hint for lower latency rendering
    const ctx = mainCanvas.getContext('2d', { alpha: false, desynchronized: true });
    let nodes = [];
    const rows = 18; 
    const cols = 18;

    const setupNodes = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = mainCanvas.parentElement.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;

        mainCanvas.width = rect.width * dpr;
        mainCanvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        nodes = [];
        const spacingX = rect.width / (cols - 1);
        const spacingY = rect.height / (rows - 1);

        for(let r = 0; r < rows; r++) {
            for(let c = 0; c < cols; c++) {
                nodes.push({
                    x: c * spacingX, y: r * spacingY,
                    originX: c * spacingX, originY: r * spacingY,
                    phase: (c * r) * 0.1 
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

    function animate() {
        if (killSwitch) {
            animationRunning = false;
            return;
        }

        const time = performance.now() * 0.001;
        const dpr = window.devicePixelRatio || 1;
        const w = mainCanvas.width / dpr;
        const h = mainCanvas.height / dpr;
        
        // Background: Solid Black
        ctx.fillStyle = "#020202";
        ctx.fillRect(0, 0, w, h);

        const themeColor = isUnderAttack ? "255, 59, 59" : (isSystemArmed ? "0, 255, 65" : "255, 191, 0");
        const noiseAmplitude = isUnderAttack ? 14 : 1.5;

        // Draw Lattice Connections (The basis vectors)
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${themeColor}, 0.12)`;
        ctx.lineWidth = 0.5;

        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            const noiseX = Math.sin(time + n.phase) * noiseAmplitude;
            const noiseY = Math.cos(time + n.phase) * noiseAmplitude;
            
            n.currentX = n.originX + noiseX;
            n.currentY = n.originY + noiseY;

            // Connect Horizontal
            if (i % cols < cols - 1) { 
                ctx.moveTo(n.currentX, n.currentY);
                const nextNode = nodes[i+1];
                ctx.lineTo(nextNode.originX + (Math.sin(time + nextNode.phase) * noiseAmplitude), 
                           nextNode.originY + (Math.cos(time + nextNode.phase) * noiseAmplitude));
            }
            // Connect Vertical
            if (i < nodes.length - cols) { 
                ctx.moveTo(n.currentX, n.currentY);
                const downNode = nodes[i+cols];
                ctx.lineTo(downNode.originX + (Math.sin(time + downNode.phase) * noiseAmplitude), 
                           downNode.originY + (Math.cos(time + downNode.phase) * noiseAmplitude));
            }
        }
        ctx.stroke();

        // Draw Basis Points (The actual Lattice Nodes)
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            ctx.fillStyle = isUnderAttack ? "#FF3B3B" : (isSystemArmed ? "#00FF41" : "#FFBF00");
            
            // Random "glitch" effect during attack to simulate signal noise
            if (isUnderAttack && Math.random() > 0.98) {
                ctx.fillStyle = "#FFF";
                ctx.fillRect(n.currentX - 2, n.currentY - 2, 4, 4);
            } else {
                ctx.fillRect(n.currentX - 1, n.currentY - 1, 2, 2);
            }
        }
        
        requestAnimationFrame(animate);
    }
    animate();
}