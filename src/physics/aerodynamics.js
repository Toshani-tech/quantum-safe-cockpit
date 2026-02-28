/**
 * aerodynamics.js - INDUSTRIAL FLIGHT PHYSICS
 * Architecture: Deterministic State Integration with Phase-Logic Sequencing
 * Fix: Hardened Ground Clamping and Final Flare Logic.
 */

export function calculateFlightDynamics(state, deltaTime) {
    const M_TO_FT = 3.28084;
    const FT_TO_M = 1 / M_TO_FT;
    
    // 0. INPUT SANITIZATION
    let alt = Math.max(0, parseFloat(state.altitude) || 0);
    let vv = (parseFloat(state.verticalVelocity) / 60) || 0; // FPS (Feet per second)
    let v_ias = Math.max(0, parseFloat(state.airspeed) || 0);     
    const phase = state.missionPhase || 'PRE_FLIGHT';

    // 1. ATMOSPHERIC MODEL (ISA Standard)
    const h_m = alt * FT_TO_M;
    const temp_k = Math.max(216.65, 288.15 - (0.0065 * h_m)); 
    const rho = 1.225 * Math.pow(temp_k / 288.15, 4.256);   
    const densityRatio = rho / 1.225;

    // 2. FORCE VECTORS
    const gravity = 32.174; // ft/s^2
    let thrust_z = gravity; // Default to neutral lift
    let thrust_x = 0;       
    let drag_x = 0.00018 * Math.pow(v_ias, 2) * densityRatio; 

    // 3. PHASE-LOGIC ENGINE
    switch (phase) {
        case 'STARTUP_TAXI':
            thrust_x = 35.0; // Stronger taxi push
            vv = 0; 
            break;

        case 'STEADY_CLIMB':
            const climbCeiling = 15000;
            const climbEfficiency = Math.max(0.1, (climbCeiling - alt) / climbCeiling);
            thrust_x = 240.0 * densityRatio; 
            thrust_z = gravity + (48.0 * climbEfficiency); 
            break;

        case 'LOITERING':
            const targetAltLoiter = 15500;
            const loiterError = targetAltLoiter - alt;
            thrust_z = gravity + (loiterError * 0.1); 
            vv *= 0.95; 
            thrust_x = 90.0; 
            break;

        case 'ENGAGEMENT_ZONE':
            thrust_z = gravity + (Math.sin(Date.now() * 0.003) * 2.0); 
            thrust_x = 280.0; 
            break;

        case 'FINAL_APPROACH':
            thrust_x = 15.0; // Keep some forward momentum
            if (alt < 50) { // THE FLARE: Final 50 feet
                thrust_z = gravity + 2.0; // Positive lift to "cushion" the landing
                vv *= 0.85; // Rapidly bleed vertical speed
            } else if (alt < 1000) {
                thrust_z = gravity - 8.0; // Gentle 8ft/s^2 descent
            } else {
                thrust_z = gravity - 15.0; // Standard descent
            }
            break;

        case 'MISSION_COMPLETE':
            thrust_x = 0;
            thrust_z = gravity;
            vv = 0; // Force-kill vertical movement
            break;

        default:
            thrust_x = 0;
            thrust_z = gravity;
    }

    // 4. INERTIAL INTEGRATION (Hardened)
    const accel_z = thrust_z - gravity;
    vv += accel_z * deltaTime;
    
    // Safety Envelope: Max descent/climb rates
    vv = Math.max(-40, Math.min(vv, 80)); 
    
    // PREDICTIVE CLAMPING: Don't let the next step go below 0
    const nextAlt = alt + (vv * deltaTime);
    if (nextAlt <= 0) {
        alt = 0;
        vv = 0; // Kill vertical speed on impact
    } else {
        alt = nextAlt;
    }

    const accel_x = (thrust_x - drag_x);
    v_ias += accel_x * deltaTime;

    // 5. GROUND FRICTION MODEL
    if (alt <= 0.1) {
        alt = 0;
        // If we are on the ground and not taking off, apply heavy friction
        if (phase === 'FINAL_APPROACH' || phase === 'MISSION_COMPLETE') {
            v_ias *= 0.96; // Bleed speed until 0
            if (v_ias < 1) v_ias = 0;
        }
    }

    return {
        altitude: parseFloat(alt.toFixed(2)),
        verticalVelocity: parseFloat((vv * 60).toFixed(2)), 
        airspeed: parseFloat(v_ias.toFixed(2)),
        densityRatio: parseFloat(densityRatio.toFixed(4)),
        isSafe: true
    };
}