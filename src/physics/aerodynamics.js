/**
 * aerodynamics.js - V12.1 
 */

import { rk4_step } from '../../security-kernel/pkg/security_kernel.js';

export function calculateFlightDynamics(state, deltaTime, elapsed) {
    // 1. Telemetry 
    let alt = parseFloat(state.altitude) || 0;
    let v_ias = parseFloat(state.airspeed) || 0;
    const dt = deltaTime; 
    
    // Timeline Constants 
    const T_END = 90.0;
    // UPDATED: Started descent earlier to allow for a realistic glide path
    const T_LANDING = 60.0; 

    // 2. Mission Phase State Machine
    let phase = 'PRE_FLIGHT';
    if (elapsed >= T_END) phase = 'MISSION_COMPLETE';
    else if (elapsed >= T_LANDING) phase = 'FINAL_APPROACH';
    else if (elapsed >= 25.0) phase = 'ENGAGEMENT_ZONE';
    else if (elapsed >= 5.0) phase = 'STEADY_CLIMB';
    else if (elapsed > 0) phase = 'STARTUP_TAXI';

    if (phase === 'MISSION_COMPLETE') {
        return { altitude: 0, airspeed: 0, verticalVelocity: 0, missionPhase: 'MISSION_COMPLETE' };
    }

    // 3. ISA Atmospheric Model
    const rho0 = 1.225; 
    const rho = rho0 * Math.exp(-alt / 8500); 

    // 4. Flight Control Logic 
    let targetPitch = 0; 
    let thrust = 0;

    switch (phase) {
        case 'STARTUP_TAXI':
            thrust = 150; 
            targetPitch = 0;
            break;

        case 'STEADY_CLIMB':
            thrust = 550; 
            targetPitch = v_ias > 140 ? 15.0 : 8.0; 
            break;

        case 'ENGAGEMENT_ZONE':
            thrust = 350; 
           
            const altError = 5000 - alt;
            targetPitch = altError * 0.002; 
            targetPitch = Math.max(-3, Math.min(10, targetPitch)); 
            break;

        case 'FINAL_APPROACH':
            thrust = 60; 
            const secondsToImpact = Math.max(0.1, T_END - elapsed);
            // Glideslope calculation
            const reqVVI = -(alt / (secondsToImpact / 60)); 
            let correlatedPitch = ((reqVVI / 60) / (Math.max(1, v_ias) * 1.68781)) * (180 / Math.PI);
            
            // Standard Landing logic
            targetPitch = (alt < 50) ? 3.0 : Math.max(-12, Math.min(-1, correlatedPitch)); 
            break;
    }

    // 5. Velocity Verlet Implementation
    const mass = 150;
    const dragCoeff = 0.025;
    
    // Calculate Forces 
    let q = 0.5 * rho * Math.pow(v_ias, 2); 
    let totalDrag = (q * dragCoeff) + (Math.abs(targetPitch) * 2.1);
    
    // a = F/m
    let accel_t = (thrust - totalDrag) / mass;

    // Verlet Integration Start 
    let v_mid = v_ias + (accel_t * (dt * 0.5));
    
    const rustResult = rk4_step(alt, v_mid, targetPitch, dt);

    if (!rustResult || rustResult.length < 4) return { ...state, missionPhase: phase };

    let newAlt = rustResult[0];
    let vvi_fpm = rustResult[3];
    
    // Calculate new acceleration for velocity 
    let new_q = 0.5 * rho * Math.pow(v_mid, 2);
    let accel_next = (thrust - ((new_q * dragCoeff) + (Math.abs(targetPitch) * 2.1))) / mass;
    
    // Final Velocity Step
    let newVel = v_mid + (accel_next * (dt * 0.5));
    
    // 6. Ground  Safety
    if (newAlt <= 0) {
        newAlt = 0;
        vvi_fpm = Math.max(0, vvi_fpm);
        //  friction
        if (phase === 'FINAL_APPROACH' || phase === 'MISSION_COMPLETE') {
            newVel = Math.max(0, newVel - (50 * dt)); 
        }
    }

    return {
        altitude: newAlt, 
        airspeed: newVel,
        verticalVelocity: vvi_fpm,
        missionPhase: phase,
        vviStatus: (vvi_fpm < -5000) ? 'CRITICAL' : (vvi_fpm < -3500) ? 'CAUTION' : 'NORMAL',
        vviDirection: vvi_fpm > 100 ? 'UP' : vvi_fpm < -100 ? 'DOWN' : 'LEVEL'
    };
}