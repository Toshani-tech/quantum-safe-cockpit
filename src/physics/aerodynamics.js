// aerodynamics.js - V16.4

import init, { rk4_step } from '../../deterministic-engine/pkg/deterministic_engine.js';

let wasmReady = false;
let actualPitch = 0;

init().then(() => {
    wasmReady = true;
    console.log(">> deterministic_engine: FIXED-POINT RK4 ENGINE INITIALIZED");
}).catch(err => {
    console.error(">> deterministic_engine_CRITICAL: WASM INIT FAILED", err);
});

export function calculateFlightDynamics(state, deltaTime, elapsed) {
    //  prevent NaN 
    const safeDeltaTime = (typeof deltaTime === 'number' && !isNaN(deltaTime) && deltaTime > 0) ? deltaTime : 0.016;
    const dt = Math.min(safeDeltaTime, 0.03); 

    // Reset module pitch 
    if (elapsed <= 0.05) {
        actualPitch = 0;
    }

    if (!wasmReady) {
        return { 
            ...state, 
            missionPhase: 'INITIALIZING',
            verticalVelocity: 0,
            vviStatus: 'NORMAL',
            vviDirection: 'LEVEL'
        };
    }

    let alt = parseFloat(state.altitude);
    let v_ias = parseFloat(state.airspeed);
    
    if (isNaN(alt)) alt = 0;
    if (isNaN(v_ias)) v_ias = 0;

    const T_END = 90.0;
    const T_APPROACH = 60.0; 
    const T_ENGAGEMENT = 35.0; 
    const T_CLIMB = 8.0;     

    let phase = 'PRE_FLIGHT';
    if (elapsed >= T_END) phase = 'MISSION_COMPLETE';
    else if (elapsed >= T_APPROACH) phase = 'FINAL_APPROACH';
    else if (elapsed >= T_ENGAGEMENT) phase = 'ENGAGEMENT_ZONE';
    else if (elapsed >= T_CLIMB) phase = 'STEADY_CLIMB';
    else if (elapsed > 0) phase = 'STARTUP_TAXI';

    if (phase === 'MISSION_COMPLETE') {
        return { 
            altitude: 0, 
            airspeed: 0, 
            verticalVelocity: 0, 
            missionPhase: 'MISSION_COMPLETE',
            vviStatus: 'NORMAL',
            vviDirection: 'LEVEL'
        };
    }

    const rho = 1.225 * Math.exp(-alt / 8500); 
    let targetPitch = 0; 
    let thrust = 0;

    switch (phase) {
        case 'STARTUP_TAXI':
            thrust = 2800; 
            targetPitch = 0;
            break;
            
        case 'STEADY_CLIMB':
            thrust = 2400; 
            targetPitch = (alt < 1000) ? 15.0 : 7.0;
            break;
            
        case 'ENGAGEMENT_ZONE':
            thrust = 1100;
            targetPitch = Math.max(-8, Math.min(8, (1400 - alt) * 0.008)); 
            break;
            
        case 'FINAL_APPROACH':
            thrust = 30; 
            const timeRem = Math.max(0.1, T_END - elapsed);
            const reqVVI = -(alt / (timeRem / 60)) * 1.05; 
            let pitchCmd = (reqVVI / (Math.max(40, v_ias) * 101.2)); 
            
            if (alt < 10 && alt > 0) {
                targetPitch = 2.0; 
                thrust = 0;
            } else {
                targetPitch = Math.max(-18.0, Math.min(2, pitchCmd * 57.3)); 
            }
            break;
    }

    
    const maxDelta = 8.0 * dt; 
    actualPitch += Math.max(-maxDelta, Math.min(maxDelta, targetPitch - actualPitch));

    const mass = 150; 
    let q = 0.5 * rho * Math.pow(v_ias, 2); 
    
    let accel_t = (thrust - ((q * 0.038) + (Math.abs(actualPitch) * 5.2))) / mass;
    let v_mid = v_ias + (accel_t * (dt * 0.5));
    
    // Call Rust WASM Fixed point Engine
    const rustResult = rk4_step(alt, v_mid, actualPitch, dt);
    
    // Telemetry Guard 
    if (!rustResult || isNaN(rustResult[0])) {
        return { 
            ...state, 
            missionPhase: phase,
            verticalVelocity: state.verticalVelocity || 0,
            vviStatus: state.vviStatus || 'NORMAL',
            vviDirection: state.vviDirection || 'LEVEL'
        };
    }

    let newAlt = rustResult[0];
    let vvi_fpm = rustResult[3]; 
    
    let accel_next = (thrust - ((0.5 * rho * Math.pow(Math.max(0, v_mid), 2) * 0.038) + (Math.abs(actualPitch) * 5.2))) / mass;
    let newVel = v_mid + (accel_next * (dt * 0.5));
    
    if (newAlt <= 10.0 && phase === 'FINAL_APPROACH' && elapsed > 88.0) {
        newAlt = 0;
        newVel = Math.max(0, newVel - (120 * dt));
        vvi_fpm = 0;
    } else if (newAlt <= 0.1) {
        newAlt = 0;
        vvi_fpm = 0;
    }

    return {
        altitude: isNaN(newAlt) ? 0 : newAlt, 
        airspeed: isNaN(newVel) ? 0 : newVel,
        verticalVelocity: isNaN(vvi_fpm) ? 0 : vvi_fpm,
        missionPhase: phase,
        vviStatus: (vvi_fpm < -2500) ? 'CRITICAL' : (vvi_fpm < -1500) ? 'CAUTION' : 'NORMAL',
        vviDirection: vvi_fpm > 100 ? 'UP' : vvi_fpm < -100 ? 'DOWN' : 'LEVEL'
    };
}