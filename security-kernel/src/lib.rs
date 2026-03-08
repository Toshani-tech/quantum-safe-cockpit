use wasm_bindgen::prelude::*;

const K_TO_FPS: f64 = 1.68781; 


fn get_v_speed(_alt: f64, vel: f64, pitch_rad: f64) -> f64 {
    
    vel * K_TO_FPS * pitch_rad.sin()
}

#[wasm_bindgen]
pub fn rk4_step(alt: f64, vel: f64, pitch_deg: f64, dt: f64) -> Vec<f64> {
    let pitch = pitch_deg.to_radians();
    
    //Sample slope at the start
    let k1 = get_v_speed(alt, vel, pitch);
    
    // Sample slope at midpoint using k1 prediction
    let k2 = get_v_speed(alt + k1 * dt / 2.0, vel, pitch); 
    
    // Sample slope at midpoint  using k2 prediction
    let k3 = get_v_speed(alt + k2 * dt / 2.0, vel, pitch);
    
    //  Sample slope at end using k3 prediction
    let k4 = get_v_speed(alt + k3 * dt, vel, pitch);

    // The weighted average (The actual RK4 core)
    let v_speed_fps = (k1 + 2.0 * k2 + 2.0 * k3 + k4) / 6.0;

    let mut new_alt = alt + (v_speed_fps * dt);
    
    // Ground collision safety
    if new_alt < 0.0 { 
        new_alt = 0.0; 
    }


    vec![new_alt, vel, pitch_deg, v_speed_fps * 60.0]
}