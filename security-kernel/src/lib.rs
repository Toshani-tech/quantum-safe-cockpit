
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