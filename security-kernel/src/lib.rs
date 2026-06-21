
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