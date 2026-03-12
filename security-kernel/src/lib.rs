// security-kernel/src/lib.rs
// V11.0 - High-Fidelity Kinematic Integration Kernel

use wasm_bindgen::prelude::*;

// Knots to Feet Per Second
const K_TO_FPS: f64 = 1.68781; 

// Calculates the instantaneous vertical rate (dh/dt)

fn get_v_speed(_alt: f64, vel: f64, pitch_rad: f64) -> f64 {
   
    vel * K_TO_FPS * pitch_rad.sin()
}

#[wasm_bindgen]
pub fn rk4_step(alt: f64, vel: f64, pitch_deg: f64, dt: f64) -> Vec<f64> {
    let pitch = pitch_deg.to_radians();
    
    // RK4 WEIGHTED AVERAGE ALGORITHM

    // 1. Initial slope at the start of the interval
    let k1 = get_v_speed(alt, vel, pitch);
    
    // 2. Midpoint slope (Trial step using k1)
    let k2 = get_v_speed(alt + k1 * dt / 2.0, vel, pitch); 
    
    // 3. Refined midpoint slope (Trial step using k2)
    let k3 = get_v_speed(alt + k2 * dt / 2.0, vel, pitch);
    
    // 4. End-point slope (Full step using k3)
    let k4 = get_v_speed(alt + k3 * dt, vel, pitch);

    let v_speed_fps = (k1 + 2.0 * k2 + 2.0 * k3 + k4) / 6.0;

    let mut new_alt = alt + (v_speed_fps * dt);
    
    // COLLISION DETECTION / GROUND CLAMP
    if new_alt < 0.0 { 
        new_alt = 0.0; 
    }

    // VVI is converted to Feet Per Minute for the PFD display.
    vec![new_alt, vel, pitch_deg, v_speed_fps * 60.0]
}