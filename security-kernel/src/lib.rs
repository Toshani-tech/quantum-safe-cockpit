// security-kernel/src/lib.rs
// V12.1

use wasm_bindgen::prelude::*;

const K_TO_FPS: f64 = 1.68781; 

/// Derivative Function

fn dh_dt(vel: f64, pitch_rad: f64) -> f64 {
    vel * K_TO_FPS * pitch_rad.sin()
}

#[wasm_bindgen]
pub fn rk4_step(alt: f64, vel: f64, pitch_deg: f64, dt: f64) -> Vec<f64> {
    let pitch = pitch_deg.to_radians();
    
    //  RK4 INTEGRATION ON ALTITUDE STATE 
    
    // 1. Start of interval
    let k1 = dh_dt(vel, pitch);
    
    // 2. Midpoint 
    let k2 = dh_dt(vel, pitch); 
    
    // 3. Midpoint 
    let k3 = dh_dt(vel, pitch);
    
    // 4. End of interval
    let k4 = dh_dt(vel, pitch);

    // Simpson's Rule Weighted Average
    let v_speed_fps = (k1 + 2.0 * k2 + 2.0 * k3 + k4) / 6.0;

    // Numerical Integration
    let mut new_alt = alt + (v_speed_fps * dt);
    
    
    // PHYSICAL CONSTRAINTS 
    if new_alt < 0.0 { 
        new_alt = 0.0; 
    }

    // Return the state vector 
    
    vec![
        new_alt, 
        vel, 
        pitch_deg, 
        v_speed_fps * 60.0 
    ]
}