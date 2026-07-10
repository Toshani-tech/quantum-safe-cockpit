
use wasm_bindgen::prelude::*;
use ml_kem::{MlKem768, KemCore};
use kem::Encapsulate;
use rand::thread_rng;

#[wasm_bindgen]
pub struct CryptoEngine;

#[wasm_bindgen]
impl CryptoEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        CryptoEngine
    }

              pub fn seal_telemetry(&self) -> Vec<u8> {
        let mut rng = thread_rng();
        let (_dk, ek) = MlKem768::generate(&mut rng);
        let (ct, _ss) = ek.encapsulate(&mut rng).expect("encapsulation failed");
        ct.to_vec()
    }
    
}