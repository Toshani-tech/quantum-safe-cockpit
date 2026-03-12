/**
 * aerodynamics.js - V11.0 
 */

import { rk4_step } from '../../security-kernel/pkg/security_kernel.js';

export function calculateFlightDynamics(state, deltaTime, elapsed) {
    // 1. Telemetry parsing
    let alt = parseFloat(state.altitude) || 0;
    let v_ias = parseFloat(state.airspeed) || 0;
    
    const dt = deltaTime; 
    const T_END = 90.0;
    const T_LANDING = 72.0; 

    // 2. Logic phase transitions (The 90-second arc)
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

    
    // As altitude increases, air density (rho) drops. 

    const rho0 = 1.225; 
    const rho = rho0 * Math.exp(-alt / 30480); 

    // 4. Autopilot logic 
    let targetPitch = 0; 
    let thrust = 0;

    switch (phase) {
        case 'STARTUP_TAXI':
            thrust = 120; 
            targetPitch = 0;
            break;

        case 'STEADY_CLIMB':
            thrust = 450; 
            // Climbing at a safe angle; if we go too slow, drop nose to gain speed (Stall protection)
            targetPitch = v_ias > 120 ? 12.0 : 5.0; 
            break;

        case 'ENGAGEMENT_ZONE':
            thrust = 220; // Cruise power
            
            const altError = 7500 - alt;
            targetPitch = altError * 0.004; 
            targetPitch = Math.max(-5, Math.min(5, targetPitch)); 
            break;

        case 'FINAL_APPROACH':
            thrust = 45; 
            const secondsLeft = Math.max(0.1, T_END - elapsed);
            const reqVVI = -(alt / (secondsLeft / 60)); 

            // Convert required VVI to a pitch angle based on current speed
            let correlatedPitch = ((reqVVI / 60) / (v_ias * 1.68781)) * (180 / Math.PI);
            
            if (alt < 50 && alt > 2) {
                targetPitch = 4.0; 
            } else {
                targetPitch = Math.max(-12, Math.min(-1, correlatedPitch)); 
            }
            break;
    }

    // 5. Calculus-Based Force Balance
    
    let dragCoefficient = 0.035; 
    let parasiticDrag = 0.5 * rho * Math.pow(v_ias, 2) * dragCoefficient;
    let inducedDrag = Math.abs(targetPitch) * 1.5; 
    
    let totalDrag = parasiticDrag + inducedDrag;
    
    // F = ma -> a = F/m. 
    let acceleration = (thrust - totalDrag) / 120; 
    let newVel = v_ias + (acceleration * dt);

    
    // We pass our calculated velocity/pitch into the Rust RK4 step.
    const rustResult = rk4_step(alt, newVel, targetPitch, dt);

    if (!rustResult || rustResult.length < 4) {
        return { ...state, missionPhase: phase };
    }

    let newAlt = rustResult[0];
    let vvi_fpm = rustResult[3];

    // 7. Surface Physics 
    if (newAlt <= 0) {
        newAlt = 0;
        vvi_fpm = Math.max(0, vvi_fpm);
        
        // Ground friction braking
        if (phase === 'FINAL_APPROACH') {
            newVel = Math.max(0, newVel - (60 * dt)); 
        }
    }

    // 8. Safety Envelope Checks
    let vviDirection = 'LEVEL';
    if (vvi_fpm > 150) vviDirection = 'UP';
    if (vvi_fpm < -150) vviDirection = 'DOWN';
    
    return {
        altitude: newAlt, 
        airspeed: newVel,
        verticalVelocity: vvi_fpm,
        missionPhase: phase,
        vviStatus: (vvi_fpm < -4500) ? 'DANGER' : 'NORMAL', // Structural limit
        vviDirection: vviDirection
    };
}