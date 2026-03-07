/**
 * aerodynamics.js - V8.1 [STABILIZED_UNITS]
 * Fix: Corrected FPS-to-FPM conversion & initial rotation dip.
 */

export function calculateFlightDynamics(state, deltaTime, elapsed) {
    // 1. INPUT SANITIZATION
    let alt = parseFloat(state.altitude) || 0;
    let v_ias = parseFloat(state.airspeed) || 0;
    
    // FIX: Maintain precision by working in FPS internally
    let current_fps = (parseFloat(state.verticalVelocity) || 0) / 60; 
    
    const dt = Math.min(deltaTime, 0.033); 
    const T_END = 90.0;
    const T_LANDING = 70.0; 
    const T_ENGAGE = 25.0; 
    const T_CLIMB = 4.0; 

    // 2. PHASE DETERMINATION
    let phase = 'PRE_FLIGHT';
    if (elapsed >= T_END) phase = 'MISSION_COMPLETE';
    else if (elapsed >= T_LANDING) phase = 'FINAL_APPROACH';
    else if (elapsed >= T_ENGAGE) phase = 'ENGAGEMENT_ZONE';
    else if (elapsed >= T_CLIMB) phase = 'STEADY_CLIMB';
    else if (elapsed > 0) phase = 'STARTUP_TAXI';

    if (phase === 'MISSION_COMPLETE') {
        return { 
            altitude: 0, airspeed: 0, verticalVelocity: 0, 
            missionPhase: 'MISSION_COMPLETE', vviStatus: 'NORMAL', vviDirection: 'LEVEL' 
        };
    }

    let targetVV_fps = 0;
    let thrust = 0;

    // 3. PHASE LOGIC
    switch (phase) {
        case 'STARTUP_TAXI':
            thrust = 320; 
            targetVV_fps = 0;
            break;

        case 'STEADY_CLIMB':
            thrust = 750; // Increased thrust for better speed-alt trade
            // Rotation begins at 120kts.
            const rotPct = Math.max(0, Math.min(1, (v_ias - 110) / 40));
            targetVV_fps = 70.0 * rotPct; // Max climb ~4200 FPM
            break;

        case 'ENGAGEMENT_ZONE':
            thrust = 550; 
            targetVV_fps = (12000 - alt) * 0.1; // Snappier response to altitude target
            break;

        case 'FINAL_APPROACH':
            const timeToImpact = Math.max(0.5, T_END - elapsed);
            targetVV_fps = -(alt / timeToImpact); 
            const landingSlowdown = Math.max(0.1, (timeToImpact / 20)); 
            thrust = 120 * landingSlowdown; 
            break;
    }

    // 4. THE PHYSICS ENGINE
    const drag = (v_ias * v_ias) * 0.00004;

    // FIX: Gravity only affects speed if we are actually in the air (alt > 0)
    // This prevents the "Minus Sign" and speed bleed while still on the runway.
    const gravityEffect = alt > 0 ? (current_fps * 1.8) : 0; 

    let acceleration = (thrust - drag - gravityEffect);
    v_ias += acceleration * dt;

    // 5. INTEGRATION
    const inertia = phase === 'FINAL_APPROACH' ? 1.2 : 0.8; 
    current_fps += (targetVV_fps - current_fps) * (dt * inertia);

    // FIX: Altitude Integration
    // We ensure the crawl stops by using the updated FPS
    alt += current_fps * dt;

    // Ground Constraints
    if (alt <= 0) {
        alt = 0;
        // Kill the minus sign on the VVI when on ground
        current_fps = Math.max(0, current_fps);
        if (phase === 'STARTUP_TAXI' || phase === 'PRE_FLIGHT') v_ias = Math.max(v_ias, thrust * 0.1);
    }

    // 6. AVIONICS SYMBOLOGY
    const vvi_fpm = current_fps * 60;
    let vviDirection = 'LEVEL';
    if (vvi_fpm > 50) vviDirection = 'UP';
    if (vvi_fpm < -50) vviDirection = 'DOWN';
    
    const vviStatus = (vvi_fpm < -4500) ? 'DANGER' : 'NORMAL';

    return {
        altitude: Math.max(0, alt), // Keep decimals for Worker-state, Round in UI
        airspeed: Math.max(0, v_ias),
        verticalVelocity: vvi_fpm,
        missionPhase: phase,
        vviStatus: vviStatus,
        vviDirection: vviDirection
    };
}