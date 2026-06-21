/* main.js - V13.2 */

import init, { init_panic_hook, get_telemetry_buffer_ptr, memory } from '../security-kernel/pkg/security_kernel.js';
import { initHandshake, logTerminalMessage, drawLattice, triggerAttack, stopLattice } from './security/lattice-engine.js';

const state = {
    isBooted: false,
    attackLogged: false,
    physicsWorker: null,
    latency: 0.0, 
    canvasTransferred: false,
    currentPhase: 'PRE_FLIGHT',
    isMissionActive: false,
    isLoopRunning: false, 
    triggeredEvents: new Set(),
    maxAlt: 0,
    maxSpd: 0,
    fdrBuffer: [], 
    isKernelReady: false,
    lastWorkerData: null,
    isBusBusy: false,
    isTerminated: false,
    securityEventLocked: false,
    telemetryLines: [],
    isMitMAttackActive: false
};