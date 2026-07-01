
use deterministic_engine::SecurityEngine;

fn main() {
    println!("Initializing Security Kernel...");
    
   
    let engine = SecurityEngine::new();
    
    println!("ML-KEM Engine Initialized Successfully.");
    
   
    let test_val = 1500.5;
    let telemetry = engine.secure_telemetry_step(test_val);
    
    println!("Telemetry packet size: {} bytes", telemetry.len());
}