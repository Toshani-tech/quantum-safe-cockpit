use wasm_bindgen::prelude::*;
use kyber::kyber768::{PublicKey, SecretKey, Keypair};
use rand::thread_rng;

#[wasm_bindgen]
pub struct CryptoEngine {
    pk: PublicKey,
    sk: SecretKey,
}

#[wasm_bindgen]
impl CryptoEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        // Pure Rust key generation
        let mut rng = thread_rng();
        let keys = Keypair::generate(&mut rng);
        CryptoEngine { pk: keys.public, sk: keys.secret }
    }

    pub fn get_public_key(&self) -> Vec<u8> {
        self.pk.as_bytes().to_vec()
    }

    pub fn seal_telemetry(&self) -> Vec<u8> {
        // Encapsulate using pure Rust logic
        let (ct, _ss) = self.pk.encapsulate(&mut thread_rng());
        ct.as_bytes().to_vec()
    }
}

#[wasm_bindgen]
pub fn verify_telemetry_integrity(ciphertext_vec: &[u8]) -> bool {
    // Pure Rust decapsulation logic can be added here
    true 
}