/* lib.rs V18.3 */

#![allow(unexpected_cfgs)]

use wasm_bindgen::prelude::*;
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

// Macros 
#[macro_export]
macro_rules! to_fixed { 
    ($x:expr) => { ($x as $crate::Fixed32) << $crate::FRACTIONAL_BITS }; 
}

#[macro_export]
macro_rules! to_float { 
    ($x:expr) => { ($x as f64) / ($crate::FIXED_SCALE as f64) }; 
}

// Security bridge 
#[wasm_bindgen]
pub struct SecurityEngine;

#[wasm_bindgen]
impl SecurityEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        SecurityEngine
    }

    #[wasm_bindgen]
    pub fn secure_telemetry_packet(&self, val: f64) -> Vec<u8> {
        let crypto = CryptoEngine::new();
        let mut output = crypto.seal_telemetry();
        let fixed_val = float_to_fp(val);
        output.extend_from_slice(&fixed_val.to_le_bytes());
        output
    }

    //  Bridge to resolve main.js call
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

    static TELEMETRY_BUFFER: RefCell<[u32; 4]> = RefCell::new([0; 4]);
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

#[wasm_bindgen]
pub fn get_telemetry_buffer_ptr() -> *const u32 {
    TELEMETRY_BUFFER.with(|buf| {
        // We borrow the RefCell, get a pointer to the array, 
        // then cast that array pointer to a *const u32 pointer.
        buf.as_ptr() as *const u32
    })
}

// Math Helpers
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

fn float_to_fp(val: f64) -> Fixed32 { (val * FIXED_SCALE) as Fixed32 }
fn fp_to_float(val: Fixed32) -> f64 { (val as f64) / FIXED_SCALE }

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
    let v_ias_fp = float_to_fp(v_ias);
    let pitch_rad = pitch_deg.to_radians();
    let vvi = v_ias * (pitch_rad.sin()) * 0.05;
    let vvi_fp = float_to_fp(vvi);
    let new_alt_fp = float_to_fp(current_alt + (vvi * dt));

    let new_alt = fp_to_float(new_alt_fp);
    let v_ias_out = fp_to_float(v_ias_fp);
    let vvi_out = fp_to_float(vvi_fp);

    vec![new_alt, v_ias_out, vvi_out, vvi_out * 60.0]
}

#[wasm_bindgen]
pub fn get_telemetry_data() -> Vec<u32> {
    TELEMETRY_BUFFER.with(|buf| buf.borrow().to_vec())
}