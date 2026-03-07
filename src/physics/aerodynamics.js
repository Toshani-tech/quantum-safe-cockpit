/**
 * aerodynamics.js - V7.9 [STABILIZED_ENERGY_MODEL]
 * Strategy: Smooth Phase Transitioning & Energy Conservation.
 * Fix: Removed 'Jolt' transitions; Added Ground-Effect and Drag-Coefficient balancing.
 */

export function calculateFlightDynamics(state, deltaTime, elapsed) {
    // 1. INPUT SANITIZATION
    let alt = parseFloat(state.altitude) || 0;
    let v_ias = parseFloat(state.airspeed) || 0;
    // FPS (Feet Per Second) is what we integrate; FPM is what we display.
    let current_fps = (parseFloat(state.verticalVelocity) || 0) / 60; 
    
    const dt = Math.min(deltaTime, 0.033); 
    const T_END = 90.0;
    const T_LANDING = 75.0; // Start descent earlier for a smoother glide slope
    const T_ENGAGE = 25.0; 
    const T_CLIMB = 4.0; 

    // 2. PHASE DETERMINATION
    let phase = 'PRE_FLIGHT';
    if (elapsed >= T_END) phase = 'MISSION_COMPLETE';
    else if (elapsed >= T_LANDING) phase = 'FINAL_APPROACH';
    else if (elapsed >= T_ENGAGE) phase = 'ENGAGEMENT_ZONE';
    else if (elapsed >= T_CLIMB) phase = 'STEADY_CLIMB';
    else if (elapsed > 0) phase = 'STARTUP_TAXI';

    // 3. ATOMIC TERMINATION
    if (phase === 'MISSION_COMPLETE' || (phase === 'FINAL_APPROACH' && alt <= 0 && elapsed > T_LANDING + 5)) {
        return { 
            altitude: 0, airspeed: 0, verticalVelocity: 0, 
            missionPhase: 'MISSION_COMPLETE', vviStatus: 'NORMAL', vviDirection: 'LEVEL' 
        };
    }

    let targetVV_fps = 0;
    let baseThrust = 0;

    // 4. SMOOTHED PHASE LOGIC
    switch (phase) {
        case 'STARTUP_TAXI':
            baseThrust = 220; 
            targetVV_fps = 0;
            break;

        case 'STEADY_CLIMB':
            baseThrust = 500; 
            // Smoothly ramp up climb rate based on speed (V1 = 120kts)
            const rotationFactor = Math.max(0, Math.min(1, (v_ias - 100) / 40));
            targetVV_fps = 55.0 * rotationFactor; 
            break;

        case 'ENGAGEMENT_ZONE':
            baseThrust = 580; 
            // Soft ceiling at 15,000ft
            const ceilingAlt = 15000;
            targetVV_fps = (ceilingAlt - alt) * 0.1; 
            break;

        case 'FINAL_APPROACH':
            // THE TTI (Time To Impact) FIX
            const timeRemaining = Math.max(1, T_END - elapsed);
            targetVV_fps = -(alt / timeRemaining); 
            
            // Thrust management: slow down to landing speed (~140kts)
            baseThrust = (alt > 100) ? 120 : 40; 
            break;
    }

    // 5. ENERGY CONSERVATION BRIDGE
    // Drag formula: D = Cd * V^2 (Simulated coefficient)
    const dragCoefficient = 0.000025;
    const drag = (v_ias * v_ias) * dragCoefficient;
    
    // Energy Tax: P-Energy vs K-Energy
    // If we are going up (positive current_fps), speed must decrease.
    const energyExchange = current_fps * 1.8; 

    // Net Acceleration
    let acceleration = (baseThrust - energyExchange - drag);

    // 6. INTEGRATION (Applying Physics)
    // Update Airspeed with inertia (0.5 weight)
    v_ias += acceleration * dt;
    
    // Update Vertical Velocity with inertia (0.7 weight to prevent jitter)
    const vviChange = (targetVV_fps - current_fps) * (dt * 0.7);
    current_fps += vviChange;

    // Update Altitude
    alt += current_fps * dt;

    // Ground/Sea Level Constraint
    if (alt < 0) {
        alt = 0;
        current_fps = 0;
        if (phase === 'FINAL_APPROACH') v_ias *= 0.98; // Rolling friction
    }

    // 7. AVIONICS SYMBOLOGY
    const vvi_fpm = current_fps * 60;
    let vviDirection = 'LEVEL';
    if (vvi_fpm > 150) vviDirection = 'UP';
    if (vvi_fpm < -150) vviDirection = 'DOWN';
    
    // Red-out HUD if descending too fast (> 3500 FPM)
    const vviStatus = (vvi_fpm < -3500) ? 'DANGER' : 'NORMAL';

    return {
        altitude: Math.round(alt),
        airspeed: Math.max(0, Math.round(v_ias)),
        verticalVelocity: Math.round(vvi_fpm),
        missionPhase: phase,
        vviStatus: vviStatus,
        vviDirection: vviDirection
    };
}