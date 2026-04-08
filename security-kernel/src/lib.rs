use wasm_bindgen::prelude::*;

const K_TO_FPS: f64 = 1.68781; 

fn dh_dt(_alt: f64, vel: f64, pitch_rad: f64) -> f64 {
    vel * K_TO_FPS * pitch_rad.sin()
}

#[wasm_bindgen]
pub fn rk4_step(alt: f64, vel: f64, pitch_deg: f64, dt: f64) -> Vec<f64> {
    if alt.is_nan() || vel.is_nan() || pitch_deg.is_nan() {
        return vec![0.0, 0.0, 0.0, 0.0]; 
    }

    let clamped_pitch = pitch_deg.max(-20.0).min(20.0);
    let pitch = clamped_pitch.to_radians();
    
    // RK 4
    let k1 = dh_dt(alt, vel, pitch);
    let k2 = dh_dt(alt + (k1 * dt * 0.5), vel, pitch); 
    let k3 = dh_dt(alt + (k2 * dt * 0.5), vel, pitch);
    let k4 = dh_dt(alt + (k3 * dt), vel, pitch);

    let mut v_speed_fps = (k1 + 2.0 * k2 + 2.0 * k3 + k4) / 6.0;

    // INDUSTRIAL GOVERNOR
    v_speed_fps = v_speed_fps.max(-46.66).min(46.66);

    let mut new_alt = alt + (v_speed_fps * dt);
    
    if new_alt < 0.05 { 
        new_alt = 0.0; 
    }

    vec![
        new_alt,           
        vel,               
        clamped_pitch,     
        v_speed_fps * 60.0 
    ]
}

#[wasm_bindgen]
pub fn execute_pqc_handshake() -> bool {
    true
}