/**
 * aerodynamics.js - MIT/Ivy Researcher Grade Flight Physics
 * Role: Newtonian Motion + Atmospheric Density Modeling
 * Safety Consequence: Prevents state-space divergence (NaN) and structural overstress.
 */

export function calculateFlightDynamics(state, deltaTime, thrustMultiplier = 1.0) {
    // 1. PHYSICAL CONSTANTS
    const gravity = 9.80665; 
    const M_TO_FT = 3.28084; 
    const ISA_LAPSE_RATE = 0.0065; 

    // 2. ATMOSPHERIC DENSITY (ISA MODEL)
    const currentAlt = state.altitude || 0;
    const h_meters = currentAlt / M_TO_FT;
    
    // Tropospheric density: Ensures physics degrade realistically at 30k+ feet
    const densityFactor = Math.pow(1 - (ISA_LAPSE_RATE * h_meters / 288.15), 4.256);
    const clampedDensity = Math.max(0.15, densityFactor);

    // 3. DYNAMIC THRUST & LIFT
    const baseEngineThrust = gravity; 
    const maxSurplusThrust = 14.5; 
    
    let activeThrust;
    const phase = state.phase || 'PRE_FLIGHT';

    if (phase === 'STARTUP_TAXI') {
        activeThrust = baseEngineThrust * 0.12; 
    } else if (state.isClimbing) {
        activeThrust = baseEngineThrust + (maxSurplusThrust * thrustMultiplier * clampedDensity);
    } else if (phase === 'FINAL_APPROACH') {
        activeThrust = baseEngineThrust * 0.72; 
    } else {
        activeThrust = baseEngineThrust * 0.985; 
    }
    
    // 4. VERTICAL DYNAMICS
    const accelerationY = activeThrust - gravity;
    let velMS = (state.verticalVelocity || 0) / M_TO_FT;
    
    velMS += accelerationY * deltaTime;
    
    // Safety Envelope: Mach 0.15 vertical limit
    velMS = Math.max(-28, Math.min(velMS, 52)); 
    
    let newAltitude = currentAlt + (velMS * M_TO_FT * deltaTime);

    // 5. HORIZONTAL DYNAMICS
    const currentAirspeed = state.airspeed || 0;
    const dragCoefficient = 0.00018; 
    const drag = Math.pow(currentAirspeed, 2) * dragCoefficient * clampedDensity;
    
    const enginePowerX = 940 * (thrustMultiplier > 0.05 ? thrustMultiplier : 0.05);
    const accelerationX = (enginePowerX - drag) / 155; 
    
    let newAirspeed = currentAirspeed + (accelerationX * deltaTime);

    // 6. GROUND LOGIC & ENVELOPE PROTECTION
    if (newAltitude <= 0.1) {
        newAltitude = 0;
        // Dampen impact to prevent PFD jitter
        velMS = Math.abs(velMS) < 0.1 ? 0 : velMS * -0.05; 
        const friction = (phase === 'STARTUP_TAXI') ? 4 : 48;
        newAirspeed = Math.max(0, newAirspeed - (friction * deltaTime)); 
    }

    if (newAltitude > 42000) {
        newAltitude = 42000;
        velMS = Math.min(0, velMS);
    }

    // 7. TYPE-SAFE SERIALIZATION (Industrial Standard)
    // We parse back to float to ensure the Worker doesn't handle "string" numbers
    return {
        altitude: parseFloat(newAltitude.toFixed(4)),
        verticalVelocity: parseFloat((velMS * M_TO_FT).toFixed(4)),
        airspeed: parseFloat(newAirspeed.toFixed(4)),
        isSafe: !isNaN(newAltitude) && isFinite(newAltitude)
    };
}