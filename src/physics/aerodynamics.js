/**
 * aerodynamics.js - V10.5
 */

import { rk4_step } from '../../security-kernel/pkg/security_kernel.js';

export function calculateFlightDynamics(state, deltaTime, elapsed) {
    // 1. Telemetry parsing
    let alt = parseFloat(state.altitude) || 0;
    let v_ias = parseFloat(state.airspeed) || 0;
    
    const dt = deltaTime; 
    const T_END = 90.0;
    const T_LANDING = 72.0; 

    // 2. Logic phase transitions
    let phase = 'PRE_FLIGHT';
    if (elapsed >= T_END) phase = 'MISSION_COMPLETE';
    else if (elapsed >= T_LANDING) phase = 'FINAL_APPROACH';
    else if (elapsed >= 25.0) phase = 'ENGAGEMENT_ZONE';
    else if (elapsed >= 5.0) phase = 'STEADY_CLIMB';
    else if (elapsed > 0) phase = 'STARTUP_TAXI';

    if (phase === 'MISSION_COMPLETE') {
        return { 
            altitude: 0, airspeed: 0, verticalVelocity: 0, 
            missionPhase: 'MISSION_COMPLETE', vviStatus: 'NORMAL', vviDirection: 'LEVEL' 
        };
    }

    // 3. Autopilot logic
    let targetPitch = 0; 
    let thrust = 0;

    switch (phase) {
        case 'STARTUP_TAXI':
            thrust = 95; 
            targetPitch = 0;
            break;

        case 'STEADY_CLIMB':
            thrust = 260; 
            targetPitch = v_ias > 115 ? 13.5 : 0; 
            break;

        case 'ENGAGEMENT_ZONE':
            thrust = 160; 
            // Hold altitude at 7500ft
            targetPitch = (7500 - alt) * 0.006; 
            targetPitch = Math.max(-6, Math.min(6, targetPitch)); 
            break;

        case 'FINAL_APPROACH':
            thrust = 25; 
            
            // DYNAMIC GLIDESLOPE (Sync with Rust Constants)
            const secondsLeft = Math.max(0.1, T_END - elapsed);
            const timeRemainingMin = secondsLeft / 60;
            const reqVVI = -(alt / timeRemainingMin); // Required FPM

            let correlatedPitch = ((reqVVI / 60) / (v_ias * 1.68781)) * (180 / Math.PI);
            
            if (alt < 70 && alt > 1.5) {
                targetPitch = 3.5; 
            } else {
                targetPitch = Math.max(-14, Math.min(-2, correlatedPitch)); 
            }
            break;
    }

    // 4. Forces
    let inducedDrag = Math.abs(targetPitch) * 0.02;
    let drag = (v_ias * 0.04) + inducedDrag; 
    let acceleration = (thrust - drag) * 0.16;
    let newVel = v_ias + (acceleration * dt);

    // 5.  Calling my True RK4 Rust Kernel
    const rustResult = rk4_step(alt, newVel, targetPitch, dt);

    if (!rustResult || rustResult.length < 4) {
        return { ...state, missionPhase: phase };
    }

    let newAlt = rustResult[0];
    let vvi_fpm = rustResult[3];

    // 6. Ground & Friction Physics
    if (newAlt <= 0) {
        newAlt = 0;
        vvi_fpm = Math.max(0, vvi_fpm);
        
        // Rapid deceleration on touchdown
        if (phase === 'FINAL_APPROACH' || phase === 'MISSION_COMPLETE') {
            newVel = Math.max(0, newVel - (45 * dt)); 
        }
    }

    // 7. Telemetry Metadata for HUD
    let vviDirection = 'LEVEL';
    if (vvi_fpm > 100) vviDirection = 'UP';
    if (vvi_fpm < -100) vviDirection = 'DOWN';
    
    return {
        altitude: newAlt, 
        airspeed: newVel,
        verticalVelocity: vvi_fpm,
        missionPhase: phase,
        vviStatus: (vvi_fpm < -3200) ? 'DANGER' : 'NORMAL',
        vviDirection: vviDirection
    };
}