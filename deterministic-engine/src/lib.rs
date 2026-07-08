
#![allow(unexpected_cfgs)]
use wasm_bindgen::prelude::*;
use ml_kem::{PublicKey, SecretKey, Keypair};
use rand::thread_rng;
use std::cell::RefCell;

// Global Constants & Types
pub const FRACTIONAL_BITS: u32 = 16;
pub const FIXED_SCALE: f64 = 65536.0;
pub type Fixed32 = i32;

// Macros 
#[macro_export]
macro_rules! to_fixed { 
    ($x:expr) => { ($x as $crate::Fixed32) << $crate::FRACTIONAL_BITS }; 
}

#[macro_export]
macro_rules! to_float { 
    ($x:expr) => { ($x as f64) / ($crate::FIXED_SCALE as f64) }; 
}

// --- Security Engine ---
#[wasm_bindgen]
pub struct SecurityEngine {
    pk: PublicKey,
    sk: SecretKey,
}

#[wasm_bindgen]
impl SecurityEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let mut rng = thread_rng();
        let keys = Keypair::generate(&mut rng);
        Self { pk: keys.public, sk: keys.secret }
    }

    pub fn secure_telemetry_packet(&self, val: f64) -> Vec<u8> {
        let mut rng = thread_rng();
        let (ct, _ss) = self.pk.encapsulate(&mut rng);
        
        let mut output = ct.to_vec();
        let fixed_val: i32 = (val * FIXED_SCALE) as i32;
        output.extend_from_slice(&fixed_val.to_le_bytes());
        output
    }
}

// Deterministic Math Engine 
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
pub fn init_engine() {
    SYSTEM_STATE.with(|s| {
        let mut state = s.borrow_mut();
        state.altitude = 0;
        state.airspeed = 0;
        state.vertical_velocity = 0;
    });
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

// Math Helpers
#[no_mangle]
pub extern "C" fn fp_add(a: Fixed32, b: Fixed32) -> Fixed32 { a.checked_add(b).unwrap_or(i32::MAX) }
#[no_mangle]
pub extern "C" fn fp_sub(a: Fixed32, b: Fixed32) -> Fixed32 { a.checked_sub(b).unwrap_or(i32::MIN) }
#[no_mangle]
pub extern "C" fn fp_from_int(val: i32) -> Fixed32 { val << FRACTIONAL_BITS }
#[no_mangle]
pub extern "C" fn fp_mul(a: Fixed32, b: Fixed32) -> Fixed32 {
    let product = (a as i64) * (b as i64);
    (product >> FRACTIONAL_BITS) as Fixed32
}
#[no_mangle]
pub extern "C" fn fp_div(a: Fixed32, b: Fixed32) -> Fixed32 {
    if b == 0 { return i32::MAX; }
    let numerator = (a as i64) << FRACTIONAL_BITS;
    (numerator / (b as i64)) as Fixed32
}
#[no_mangle]
pub extern "C" fn fp_exp(x: Fixed32) -> Fixed32 {
    if x < -to_fixed!(10) { return 0; }
    let one = to_fixed!(1);
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
#[no_mangle]
pub extern "C" fn set_initial_state(alt: i32, spd: i32) {
    SYSTEM_STATE.with(|s| {
        let mut state = s.borrow_mut();
        state.altitude = fp_from_int(alt);
        state.airspeed = fp_from_int(spd);
        state.vertical_velocity = 0;
    });
}

fn float_to_fp(val: f64) -> Fixed32 { (val * FIXED_SCALE) as Fixed32 }
fn fp_to_float(val: Fixed32) -> f64 { (val as f64) / FIXED_SCALE }

fn flight_dynamics_derivative_fp(v_ias_fp: Fixed32, pitch_rad_fp: Fixed32) -> Fixed32 {
    let x = pitch_rad_fp;
    let x_squared = fp_mul(x, x);
    let x_cubed = fp_mul(x_squared, x);
    let x_fifth = fp_mul(fp_mul(x_cubed, x_squared), x);
    
    let term1 = x;
    let term2 = fp_div(x_cubed, fp_from_int(6));
    let term3 = fp_div(x_fifth, fp_from_int(120));
    
    let sin_approx = fp_add(fp_sub(term1, term2), term3);
    let raw_vvi_fps = fp_mul(v_ias_fp, sin_approx);

    raw_vvi_fps.clamp(-3058346, 3058346)
}

#[wasm_bindgen]
pub fn rk4_step(current_alt: f64, v_ias: f64, pitch_deg: f64, dt: f64) -> Vec<f64> {
    let alt_fp = float_to_fp(current_alt);
    let v_ias_fp = float_to_fp(v_ias);
    let dt_fp = float_to_fp(dt);
    
    let pi_div_180_fp = float_to_fp(std::f64::consts::PI / 180.0);
    let pitch_rad_fp = fp_mul(float_to_fp(pitch_deg), pi_div_180_fp);

    let two = fp_from_int(2);

    let k1 = flight_dynamics_derivative_fp(v_ias_fp, pitch_rad_fp);
    let k2 = k1; 
    let k3 = k1;
    let k4 = k1;

    let inner_sum = fp_add(
        fp_add(k1, fp_mul(two, k2)),
        fp_add(fp_mul(two, k3), k4)
    );
    let sixth_dt = fp_div(dt_fp, fp_from_int(6));
    let delta_alt_fp = fp_mul(sixth_dt, inner_sum);
    let new_alt_fp = fp_add(alt_fp, delta_alt_fp);

    vec![fp_to_float(new_alt_fp), v_ias, fp_to_float(k1), fp_to_float(k1) * 60.0]
}

#[wasm_bindgen]
pub fn get_telemetry_data() -> Vec<u32> {
    TELEMETRY_BUFFER.with(|buf| buf.borrow().to_vec())
}