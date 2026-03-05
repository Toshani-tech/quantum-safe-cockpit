use wasm_bindgen::prelude::*;

// This allows us to talk to the browser's console from Rust
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn init_kernel() -> String {
    // This is the first "Industrial" signal sent from the Rust core
    let status = "KERNEL_ACTIVE: Lattice-Engine Initialized (NIST-Standard)";
    log(status);
    return status.into();
}