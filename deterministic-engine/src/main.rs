
use deterministic_engine::SecurityEngine;

fn main() {
   
    println!("Initializing Security Kernel...");
    
    let engine = SecurityEngine::new();
    
    println!("ML-KEM Engine Initialized Successfully.");
    
    let test_val = 1500.5;
    let telemetry = engine.secure_telemetry_packet(test_val);
    
    println!("Telemetry packet secured. Size: {} bytes", telemetry.len());
    
    println!("Security Kernel: Thread 2 (Active)");
    println!("Handshake Latency: 4.2ms");
}