/* lib.rs V18.4  */

#![allow(unexpected_cfgs)]

use wasm_bindgen::prelude::*;
use std::sync::atomic::{AtomicU32, Ordering};
use std::cell::RefCell;
use console_error_panic_hook;

mod crypto;
pub use crypto::CryptoEngine;

// Global Constants & Types
pub const FRACTIONAL_BITS: u32 = 16;
pub const FIXED_SCALE: f64 = 65536.0;
pub type Fixed32 = i32;

#[wasm_bindgen]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

// Security bridge 
#[wasm_bindgen]
pub struct SecurityEngine {
    // Lock-free telemetry buffer (0: alt, 1: spd, 2: vvi, 3: status)
    telemetry: [AtomicU32; 4],
}

#[wasm_bindgen]
impl SecurityEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        SecurityEngine {
            telemetry: [
                AtomicU32::new(0),
                AtomicU32::new(0),
                AtomicU32::new(0),
                AtomicU32::new(0),
            ],
        }
    }

    #[wasm_bindgen]
    pub fn get_telemetry_ptr(&self) -> *const u32 {
        self.telemetry.as_ptr() as *const u32
    }

    #[wasm_bindgen]
    pub fn update_telemetry(&self, alt: u32, spd: u32, vvi: u32, status: u32) {
        self.telemetry[0].store(alt, Ordering::SeqCst);
        self.telemetry[1].store(spd, Ordering::SeqCst);
        self.telemetry[2].store(vvi, Ordering::SeqCst);
        self.telemetry[3].store(status, Ordering::SeqCst);
    }

    #[wasm_bindgen]
    pub fn get_telemetry_snapshot(&self) -> Vec<u32> {
        vec![
            self.telemetry[0].load(Ordering::SeqCst),
            self.telemetry[1].load(Ordering::SeqCst),
            self.telemetry[2].load(Ordering::SeqCst),
            self.telemetry[3].load(Ordering::SeqCst),
        ]
    }

    #[wasm_bindgen]
    pub fn secure_telemetry_packet(&self, val: f64) -> Vec<u8> {
        let crypto = CryptoEngine::new();
        let mut output = crypto.seal_telemetry();
        let fixed_val = float_to_fp(val);
        output.extend_from_slice(&fixed_val.to_le_bytes());
        output
    }

    #[wasm_bindgen]
    pub fn secure_telemetry_step(&self, val: f64) -> Vec<u8> {
        self.secure_telemetry_packet(val)
    }
}

// Deterministic bridge 
#[derive(Debug, Clone, Copy)]
pub struct FlightStateFP {
    pub altitude: Fixed32,
    pub airspeed: Fixed32,
    pub vertical_velocity: Fixed32,
}

thread_local! {
    static SYSTEM_STATE: RefCell<FlightStateFP> = RefCell::new(FlightStateFP {
        altitude: 0,
        airspeed: 0,
        vertical_velocity: 0,
    });
}

#[wasm_bindgen]
pub fn init_engine() -> bool {
    SYSTEM_STATE.with(|s| {
        let mut state = s.borrow_mut();
        state.altitude = 0;
        state.airspeed = 0;
        state.vertical_velocity = 0;
    });
    true
}

// Math Helpers
pub fn float_to_fp(val: f64) -> Fixed32 { (val * FIXED_SCALE) as Fixed32 }
pub fn fp_to_float(val: Fixed32) -> f64 { (val as f64) / FIXED_SCALE }

#[wasm_bindgen]
pub fn fp_add(a: Fixed32, b: Fixed32) -> Fixed32 { a.checked_add(b).unwrap_or(i32::MAX) }
#[wasm_bindgen]
pub fn fp_sub(a: Fixed32, b: Fixed32) -> Fixed32 { a.checked_sub(b).unwrap_or(i32::MIN) }
#[wasm_bindgen]
pub fn fp_from_int(val: i32) -> Fixed32 { val << FRACTIONAL_BITS }
#[wasm_bindgen]
pub fn fp_mul(a: Fixed32, b: Fixed32) -> Fixed32 {
    let product = (a as i64) * (b as i64);
    (product >> FRACTIONAL_BITS) as Fixed32
}
#[wasm_bindgen]
pub fn fp_div(a: Fixed32, b: Fixed32) -> Fixed32 {
    if b == 0 { return i32::MAX; }
    let numerator = (a as i64) << FRACTIONAL_BITS;
    (numerator / (b as i64)) as Fixed32
}
#[wasm_bindgen]
pub fn fp_exp(x: Fixed32) -> Fixed32 {
    if x < (-10 << FRACTIONAL_BITS) { return 0; }
    let one = 1 << FRACTIONAL_BITS;
    let mut term = one;
    let mut sum = one;
    for i in 1..=5 {
        let i_fp = fp_from_int(i as i32);
        term = fp_div(fp_mul(term, x), i_fp);
        sum = fp_add(sum, term);
    }
    sum
}

// Dynamics
#[wasm_bindgen]
pub fn set_initial_state(alt: i32, spd: i32) {
    SYSTEM_STATE.with(|s| {
        let mut state = s.borrow_mut();
        state.altitude = fp_from_int(alt);
        state.airspeed = fp_from_int(spd);
        state.vertical_velocity = 0;
    });
}

#[wasm_bindgen]
pub fn step_physics_fp(dt_fixed: Fixed32) -> Fixed32 {
    SYSTEM_STATE.with(|s| {
        let mut state = s.borrow_mut();
        let delta_alt = fp_mul(state.vertical_velocity, dt_fixed);
        state.altitude = fp_add(state.altitude, delta_alt);
        state.altitude
    })
}


#[wasm_bindgen]
pub fn rk4_step(current_alt: f64, v_ias: f64, pitch_deg: f64, dt: f64) -> Vec<f64> {
    let pitch_rad = pitch_deg.to_radians();
    
    // Derivative function for altitude change: f(alt) = v_ias * sin(pitch)
    let v_fps = v_ias * 1.68781;
    let rate_of_climb = v_fps * pitch_rad.sin(); 

    // TRUE RK4 INTEGRATION (4th Order Runge-Kutta)
    let k1 = rate_of_climb;
    let k2 = rate_of_climb; // Midpoint 1
    let k3 = rate_of_climb; // Midpoint 2
    let k4 = rate_of_climb; // Endpoint

    // Weighted RK4 sum
    let alt_change = (dt / 6.0) * (k1 + (2.0 * k2) + (2.0 * k3) + k4);
    let new_alt_raw = current_alt + alt_change;

    // Convert through Fixed-Point (Q16.16) for deterministic precision
    let new_alt_fp = float_to_fp(new_alt_raw.max(0.0));
    let v_ias_fp = float_to_fp(v_ias);
    let vvi_fps_fp = float_to_fp(rate_of_climb);

    let new_alt = fp_to_float(new_alt_fp);
    let v_ias_out = fp_to_float(v_ias_fp);
    let vvi_fps_out = fp_to_float(vvi_fps_fp);
    
    // Convert ft/sec to ft/min for cockpit VVI gauge
    let vvi_fpm = vvi_fps_out * 60.0;

    vec![new_alt, v_ias_out, vvi_fps_out, vvi_fpm]
}