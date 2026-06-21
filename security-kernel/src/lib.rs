
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