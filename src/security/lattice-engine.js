/**
 * lattice-engine.js - V7.3
 */

let isUnderAttack = false;
let isSystemArmed = false; 
let animationRunning = false; 
let killSwitch = false; 

export function stopLattice() {
    killSwitch = true;
    animationRunning = false;
    isSystemArmed = false;
    isUnderAttack = false;
}

export function triggerAttack(status) { 
    isUnderAttack = status; 
    logTerminalMessage(status ? "ALERT: LWE_VECTOR_INJECTION_DETECTED" : "SHIELD: LWE_NOISE_CANCELLATION_ACTIVE", 
                        status ? "#FF3B3B" : "#00FF41", "0xSHIELD");
}

/**
 * terminal logger
 */
export function logTerminalMessage(msg, color = "#00FF41", tag = null) {
    const term = document.getElementById('terminal-box');
    if (!term) return;
    
    const p = document.createElement('div');
    const isWarning = msg.includes("!!") || msg.includes("ALERT") || msg.includes("THREAT") || msg.includes("FAILURE");
    

    let finalColor = isWarning ? "#FF3B3B" : (isUnderAttack ? "#FF3B3B" : (isSystemArmed ? color : "#FFBF00"));

    const timestamp = (performance.now() / 1000).toFixed(2);
    const signature = tag ? tag : `0x${Math.floor(Math.random() * 0xFFF).toString(16).toUpperCase().padStart(3, '0')}`;
    
    p.innerHTML = `
        <span style="color: #444;">[T+${timestamp}s]</span> 
        <span style="color: ${isWarning ? '#FF3B3B' : '#00FF41'}; font-weight: bold;">[${signature}]</span> 
        <span style="margin-left: 8px; color: ${finalColor}; font-family: 'JetBrains Mono', monospace;">${msg}</span>
    `;
    
    term.appendChild(p);
    term.scrollTop = term.scrollHeight;
    
    while (term.childNodes.length > 35) {
        term.removeChild(term.firstChild);
    }
}

/**
 * Synchronize with Rust Kernel NIST Level 5
 */

export async function initHandshake() {
    if (isSystemArmed) return;

    logTerminalMessage("BOOT: LOADING WASM_CORE_V1.1 [HARDENED]...", "#FFBF00");
    await new Promise(r => setTimeout(r, 600));
    
    logTerminalMessage("ML-KEM: NTT (NUMBER THEORETIC TRANSFORM) ACTIVE");
    logTerminalMessage("LATTICE: q=3329 | k=4 | NIST_LEVEL_5"); 
    await new Promise(r => setTimeout(r, 500));
    
    isSystemArmed = true; 
    logTerminalMessage("CRYPTO: KYBER_1024_KEY_EXCHANGE: BUS_SECURE.", "#00FF41");
}

// Lattice Geometry Renderer
 
export function drawLattice(canvasId) {
    if (animationRunning) return; 
    killSwitch = false;

    const mainCanvas = document.getElementById(canvasId);
    if (!mainCanvas) return;
    
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
        const padding = 10;
        const spacingX = (rect.width - padding * 2) / (cols - 1);
        const spacingY = (rect.height - padding * 2) / (rows - 1);

        for(let r = 0; r < rows; r++) {
            for(let c = 0; c < cols; c++) {
                nodes.push({
                    x: padding + c * spacingX, y: padding + r * spacingY,
                    originX: padding + c * spacingX, originY: padding + r * spacingY,
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
        
        ctx.fillStyle = "#020202";
        ctx.fillRect(0, 0, w, h);

        const themeColor = isUnderAttack ? "255, 59, 59" : (isSystemArmed ? "0, 255, 65" : "255, 191, 0");
        const noiseAmplitude = isUnderAttack ? 15 : 1.5; // Level 5 higher error margin

        ctx.beginPath();
        ctx.strokeStyle = `rgba(${themeColor}, 0.12)`;
        ctx.lineWidth = 0.5;

        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            const noiseX = Math.sin(time + n.phase) * noiseAmplitude;
            const noiseY = Math.cos(time + n.phase) * noiseAmplitude;
            
            n.currentX = n.originX + noiseX;
            n.currentY = n.originY + noiseY;

            if (i % cols < cols - 1) { 
                ctx.moveTo(n.currentX, n.currentY);
                const nextNode = nodes[i+1];
                ctx.lineTo(nextNode.originX + (Math.sin(time + nextNode.phase) * noiseAmplitude), 
                           nextNode.originY + (Math.cos(time + nextNode.phase) * noiseAmplitude));
            }
            if (i < nodes.length - cols) { 
                ctx.moveTo(n.currentX, n.currentY);
                const downNode = nodes[i+cols];
                ctx.lineTo(downNode.originX + (Math.sin(time + downNode.phase) * noiseAmplitude), 
                           downNode.originY + (Math.cos(time + downNode.phase) * noiseAmplitude));
            }
        }
        ctx.stroke();

        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            ctx.fillStyle = isUnderAttack ? "#FF3B3B" : (isSystemArmed ? "#00FF41" : "#FFBF00");
            
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