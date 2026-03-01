/**
 * aerodynamics.js - INDUSTRIAL FLIGHT KERNEL (V5.0 - MISSION MASTER)
 * Architecture: Hard-synced 90-second mission profile.
 * Calibration: Integrated Phase Controller for autonomous state transitions.
 */

export function calculateFlightDynamics(state, deltaTime, elapsed) {
    // 1. DATA SANITIZATION (Critical for bit-level integrity)
    let alt = Math.max(0, Number(state.altitude) || 0);
    let v_ias = Math.max(0, Number(state.airspeed) || 0);
    let vv_fps = (Number(state.verticalVelocity) || 0) / 60; // Convert FPM to FPS for internal calc
    
    // 2. TIMING CALIBRATION
    const dt = Math.min(deltaTime, 0.033); // Cap dt to prevent physics "explosions"
    let phase = state.missionPhase || 'PRE_FLIGHT';

    // --- MISSION TIMELINE DEFINITION (STRICT 90s SCRIPT) ---
    const MISSION_END = 90.0;
    const LANDING_START = 75.0;     // Adjusted for smoother flare
    const ENGAGEMENT_START = 30.0;  // 45-second loiter window
    const CLIMB_START = 8.0;        // Quick rotation after taxi

    // --- AUTONOMOUS PHASE CONTROLLER ---
    if (elapsed >= MISSION_END) {
        phase = 'MISSION_COMPLETE';
    } else if (elapsed >= LANDING_START) {
        phase = 'FINAL_APPROACH';
    } else if (elapsed >= ENGAGEMENT_START) {
        phase = 'ENGAGEMENT_ZONE';
    } else if (elapsed >= CLIMB_START) {
        phase = 'STEADY_CLIMB';
    } else if (elapsed > 0) {
        phase = 'STARTUP_TAXI';
    }

    // --- PHYSICAL CONSTANTS ---
    const gravity = 32.174; 
    let thrust_x = 0;
    let target_lift = gravity; 
    const mass = 45.0; 

    // --- PHASE-SPECIFIC PHYSICS LOGIC ---
    if (phase === 'FINAL_APPROACH') {
        // Calculate remaining time for precision glideslope
        const timeRemaining = Math.max(0.1, MISSION_END - elapsed);
        
        // Linear Glideslope: VV required to kiss the ground at T+90
        vv_fps = -(alt / timeRemaining); 

        // Exponential Speed Decay: Bleed airspeed for landing
        v_ias *= (1 - (dt / timeRemaining));
        
        alt += vv_fps * dt;
    } 
    else if (phase === 'MISSION_COMPLETE') {
        alt = 0;
        v_ias = 0;
        vv_fps = 0;
    } 
    else {
        // --- ACTIVE FLIGHT PHYSICS (0s to 75s) ---
        switch (phase) {
            case 'STARTUP_TAXI':
                thrust_x = v_ias < 80 ? 1200 : 400; // Power up for rotation
                vv_fps = 0;
                break;

            case 'STEADY_CLIMB':
                thrust_x = 2200; // Afterburners for ascent
                if (v_ias > 90) {
                    const pitchFactor = Math.min((v_ias - 90) / 40, 1.8);
                    target_lift = gravity + (65.0 * pitchFactor); 
                }
                break;

            case 'ENGAGEMENT_ZONE':
                thrust_x = 1100; // Cruise thrust
                const targetAlt = 14500; // Ceiling
                const altError = targetAlt - alt;
                // Proportional-Integral style altitude hold
                target_lift = gravity + (altError * 0.08); 
                break;
        }

        // Standard Drag Equation
        const drag_force = 0.0022 * Math.pow(v_ias, 2);
        v_ias += ((thrust_x - drag_force) / mass) * dt;
        
        // Vertical acceleration & Damping
        const v_accel = (target_lift - gravity);
        vv_fps += v_accel * dt;
        
        // Apply damping to prevent oscillations in cruise
        if (phase === 'ENGAGEMENT_ZONE') vv_fps *= 0.92; 
        
        alt += vv_fps * dt;
    }

    // 3. BOUNDARY ENFORCEMENT
    if (alt <= 0.1) {
        alt = 0;
        if (phase !== 'STARTUP_TAXI' && phase !== 'MISSION_COMPLETE') vv_fps = 0;
    }

    // Ensure we don't return NaN or Infinite values which break the PFD
    return {
        altitude: isFinite(alt) ? parseFloat(alt.toFixed(2)) : 0,
        airspeed: isFinite(v_ias) ? parseFloat(v_ias.toFixed(2)) : 0,
        verticalVelocity: isFinite(vv_fps) ? parseFloat((vv_fps * 60).toFixed(2)) : 0,
        actualPhase: phase 
    };
}