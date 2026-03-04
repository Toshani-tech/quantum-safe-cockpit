use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct FlightData {
    pub altitude: f32,
    pub velocity: f32,
}

#[wasm_bindgen]
impl FlightData {
    #[wasm_bindgen(constructor)]
    pub fn new(altitude: f32, velocity: f32) -> FlightData {
        FlightData { altitude, velocity }
    }

    // This is the "Hardened" math for MIT
    pub fn calculate_vsi(&self, previous_alt: f32, delta_time: f32) -> f32 {
        if delta_time <= 0.0 { return 0.0; }
        // Standard FPM calculation: (Change in Alt) / (Change in Time in Minutes)
        (self.altitude - previous_alt) / (delta_time / 60.0)
    }
}

#[wasm_bindgen]
pub fn check_integrity(packet_id: u32) -> bool {
    // Simulated Lattice-Based Verification Check
    // In a real system, this would involve matrix multiplication
    packet_id % 2 == 0
}