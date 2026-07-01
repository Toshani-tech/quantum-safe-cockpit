pub mod crypto;
use wasm_bindgen::prelude::*;
use js_sys::Uint32Array;

pub type Fixed32 = i32;

pub const FRACTIONAL_BITS: u32 = 16;
pub const FIXED_SCALE: i32 = 1 << FRACTIONAL_BITS; 


#[macro_export]
macro_rules! to_fixed {
    ($x:expr) => {
        ($x as i32) << FRACTIONAL_BITS
    };
}

#[macro_export]
macro_rules! to_float {
    ($x:expr) => {
        ($x as f64) / (FIXED_SCALE as f64)
    };
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}



#[no_mangle]
pub extern "C" fn fp_add(a: Fixed32, b: Fixed32) -> Fixed32 {
    a.checked_add(b).unwrap_or(i32::MAX)
}

#[no_mangle]
pub extern "C" fn fp_sub(a: Fixed32, b: Fixed32) -> Fixed32 {
    a.checked_sub(b).unwrap_or(i32::MIN)
}

#[no_mangle]
pub extern "C" fn fp_from_int(val: i32) -> Fixed32 {
    val << FRACTIONAL_BITS
}

#[no_mangle]
pub extern "C" fn fp_mul(a: Fixed32, b: Fixed32) -> Fixed32 {
    let product = (a as i64) * (b as i64);
    (product >> FRACTIONAL_BITS) as Fixed32
}

#[no_mangle]
pub extern "C" fn fp_div(a: Fixed32, b: Fixed32) -> Fixed32 {
    if b == 0 {
        return i32::MAX; 
    }
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



#[derive(Debug, Clone, Copy)]
pub struct FlightStateFP {
    pub altitude: Fixed32,
    pub airspeed: Fixed32,
    pub vertical_velocity: Fixed32,
}

static mut SYSTEM_STATE: FlightStateFP = FlightStateFP {
    altitude: 0,
    airspeed: 0,
    vertical_velocity: 0,
};

static mut TELEMETRY_BUFFER: [u32; 4] = [0; 4];

#[no_mangle]
pub extern "C" fn set_initial_state(alt: i32, spd: i32) {
    unsafe {
        SYSTEM_STATE.altitude = fp_from_int(alt);
        SYSTEM_STATE.airspeed = fp_from_int(spd);
        SYSTEM_STATE.vertical_velocity = 0;
    }
}

#[no_mangle]
pub extern "C" fn step_physics_fp(dt_raw: i32) -> i32 {
    unsafe {
        let dt = dt_raw;
        let climb_rate = fp_from_int(15);
        let delta_alt = fp_mul(climb_rate, dt);
        SYSTEM_STATE.altitude = fp_add(SYSTEM_STATE.altitude, delta_alt);
        
        SYSTEM_STATE.altitude
    }
}


fn float_to_fp(val: f64) -> Fixed32 {
    (val * (FIXED_SCALE as f64)) as Fixed32
}

fn fp_to_float(val: Fixed32) -> f64 {
    (val as f64) / (FIXED_SCALE as f64)
}


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

    let max_vvi_fps = 3058346;
    let min_vvi_fps = -3058346;

    if raw_vvi_fps > max_vvi_fps {
        max_vvi_fps
    } else if raw_vvi_fps < min_vvi_fps {
        min_vvi_fps
    } else {
        raw_vvi_fps
    }
}

#[wasm_bindgen]
pub fn rk4_step(current_alt: f64, v_ias: f64, pitch_deg: f64, dt: f64) -> Vec<f64> {
    
    let alt_fp = float_to_fp(current_alt);
    let v_ias_fp = float_to_fp(v_ias);
    let dt_fp = float_to_fp(dt);
    
   
    let pi_div_180_fp = float_to_fp(std::f64::consts::PI / 180.0);
    let pitch_rad_fp = fp_mul(float_to_fp(pitch_deg), pi_div_180_fp);

    let half_dt = fp_div(dt_fp, fp_from_int(2));
    let two = fp_from_int(2);

    
    let k1 = flight_dynamics_derivative_fp(v_ias_fp, pitch_rad_fp);

    
    let _alt_k2 = fp_add(alt_fp, fp_mul(half_dt, k1));
    let k2 = flight_dynamics_derivative_fp(v_ias_fp, pitch_rad_fp);

    
    let _alt_k3 = fp_add(alt_fp, fp_mul(half_dt, k2));
    let k3 = flight_dynamics_derivative_fp(v_ias_fp, pitch_rad_fp);

    
    let _alt_k4 = fp_add(alt_fp, fp_mul(dt_fp, k3));
    let k4 = flight_dynamics_derivative_fp(v_ias_fp, pitch_rad_fp);

    
    let inner_sum = fp_add(
        fp_add(k1, fp_mul(two, k2)),
        fp_add(fp_mul(two, k3), k4)
    );
    let sixth_dt = fp_div(dt_fp, fp_from_int(6));
    let delta_alt_fp = fp_mul(sixth_dt, inner_sum);
    let new_alt_fp = fp_add(alt_fp, delta_alt_fp);

    
    let final_alt = fp_to_float(new_alt_fp);
    let vvi_fps = fp_to_float(k1);
    let vvi_fpm = vvi_fps * 60.0;

    vec![final_alt, v_ias, vvi_fps, vvi_fpm]
}

#[wasm_bindgen]
pub fn get_telemetry_buffer_ptr() -> *const u32 {
    unsafe { TELEMETRY_BUFFER.as_ptr() }
}