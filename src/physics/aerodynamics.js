/**
 * aerodynamics.js - V5.2 INDUSTRIAL FLIGHT KERNEL
 * Fix: Adjusted rotation threshold and vertical acceleration integration.
 * Priority: Immediate altitude tape response upon VR speed.
 */

export function calculateFlightDynamics(state, deltaTime, elapsed) {
    let alt = Math.max(0, Number(state.altitude) || 0);
    let v_ias = Math.max(0, Number(state.airspeed) || 0);
    let vv_fps = (Number(state.verticalVelocity) || 0) / 60; 
    
    const dt = Math.min(deltaTime, 0.033); 
    let phase = 'PRE_FLIGHT';

    const MISSION_END = 90.0;
    const LANDING_START = 75.0;     
    const ENGAGEMENT_START = 30.0;  
    const CLIMB_START = 8.0;        

    if (elapsed >= MISSION_END) phase = 'MISSION_COMPLETE';
    else if (elapsed >= LANDING_START) phase = 'FINAL_APPROACH';
    else if (elapsed >= ENGAGEMENT_START) phase = 'ENGAGEMENT_ZONE';
    else if (elapsed >= CLIMB_START) phase = 'STEADY_CLIMB';
    else if (elapsed > 0) phase = 'STARTUP_TAXI';

    const airDensityRatio = Math.max(0.6, 1 - (alt / 40000)); 
    const gravity = 32.174; 
    const mass = 45.0; 
    let thrust_x = 0;
    let target_lift = gravity; 

    if (phase === 'FINAL_APPROACH') {
        const timeRemaining = Math.max(0.5, MISSION_END - elapsed);
        vv_fps = -(alt / timeRemaining); 
        v_ias *= (1 - (dt / timeRemaining)); 
        alt += vv_fps * dt;
    } 
    else if (phase === 'MISSION_COMPLETE') {
        alt = 0; v_ias = 0; vv_fps = 0;
    } 
    else {
        switch (phase) {
            case 'STARTUP_TAXI':
                thrust_x = 1800; // Increased initial kick
                vv_fps = 0;
                break;

            case 'STEADY_CLIMB':
                thrust_x = 2800 * airDensityRatio; 
                // ROTATION FIX: Start lifting at 60 knots (V_Rotation) instead of 100
                if (v_ias > 60) {
                    const pitchFactor = Math.min((v_ias - 60) / 40, 2.5);
                    target_lift = gravity + (85.0 * pitchFactor); 
                }
                break;

            case 'ENGAGEMENT_ZONE':
                thrust_x = 1400 * airDensityRatio; 
                const targetAlt = 14500;
                const altError = targetAlt - alt;
                target_lift = gravity + (altError * 0.15); 
                break;
        }

        // Fd = 1/2 * rho * v^2 * Cd * A
        const drag_force = (0.0020 * airDensityRatio) * Math.pow(v_ias, 2);
        v_ias += ((thrust_x - drag_force) / mass) * dt;
        
        // Integration Fix: Apply vertical acceleration more aggressively
        const v_accel = (target_lift - gravity);
        vv_fps += v_accel * dt;
        
        // Damping and Ground Effect
        if (phase === 'ENGAGEMENT_ZONE') vv_fps *= 0.92; 
        
        alt += vv_fps * dt;
    }

    // 3. BOUNDARY ENFORCEMENT
    if (alt <= 0.1) {
        alt = 0;
        // Kill downward velocity if on ground, but allow forward taxi
        if (vv_fps < 0) vv_fps = 0; 
    }

    return {
        altitude: isFinite(alt) ? parseFloat(alt.toFixed(2)) : 0,
        airspeed: isFinite(v_ias) ? parseFloat(v_ias.toFixed(2)) : 0,
        verticalVelocity: isFinite(vv_fps) ? parseFloat((vv_fps * 60).toFixed(2)) : 0,
        actualPhase: phase,
        density: parseFloat(airDensityRatio.toFixed(3))
    };
}