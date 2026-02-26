

/**
 * aerodynamics.js - Professional State-Based Physics
 * Located in /src/physics/
 */

/**
 * CALCULATE PHYSICS
 * This runs inside the Worker. 
 * It uses Euler Integration: v = u + at | s = s + vt
 */
export function calculateFlightDynamics(state, deltaTime) {
    const gravity = 9.8; 
    // Thrust is higher than gravity when climbing to allow lift
    const thrust = state.isClimbing ? 15.0 : 0;
    
    // 1. Vertical Dynamics (Y-Axis)
    const accelerationY = thrust - gravity;
    state.verticalVelocity += accelerationY * deltaTime;
    state.altitude += state.verticalVelocity * deltaTime;

    // 2. Horizontal Dynamics (X-Axis)
    // Drag formula: D = v² * Cd
    const dragCoefficient = 0.01;
    const drag = state.airspeed * state.airspeed * dragCoefficient;
    const enginePower = 500; 
    
    const accelerationX = (enginePower - drag) / 100; 
    state.airspeed += accelerationX * deltaTime;

    // 3. Ground Collision Safety
    if (state.altitude < 0) {
        state.altitude = 0;
        state.verticalVelocity = 0;
    }

    return state;
}

/**
 * UPDATE UI
 * This runs in main.js. It bridges the data from the Worker to your HTML.
 */
export function updateDisplay(altitude, airspeed) {
    const altSpan = document.getElementById('alt');
    const spdSpan = document.getElementById('spd');
    
    // Standard Avionics formatting: 00000 for ALT, 000 for SPD
    if (altSpan) {
        altSpan.innerText = Math.round(altitude).toString().padStart(5, '0');
    }
    if (spdSpan) {
        spdSpan.innerText = Math.round(airspeed).toString().padStart(3, '0');
    }
}