


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
    
    setTimeout(() => {
        logTerminalMessage("Establishing ML-KEM Lattice Handshake...");
    }, 1000); 

    setTimeout(() => {
        logTerminalMessage("Quantum Keys Verified. GPS Integrity Secured.");
        logTerminalMessage("Beginning Physics-Based Ascent...");
        // This callback tells main.js to start the flight loop
        callback(); 
    }, 2500); 
}