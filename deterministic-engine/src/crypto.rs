use wasm_bindgen::prelude::*;
use pqcrypto_kyber::kyber768::{
    keypair, encapsulate, decapsulate, 
    PublicKey, SecretKey, Ciphertext, SharedSecret
};
use pqcrypto_traits::kem::{PublicKey as _, SecretKey as _, Ciphertext as _, SharedSecret as _};

#[wasm_bindgen]
pub struct CryptoEngine {
    pk: PublicKey,
    sk: SecretKey,
}

#[wasm_bindgen]
impl CryptoEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let (pk, sk) = keypair();
        CryptoEngine { pk, sk }
    }

    // Returns public key for the forensic auditor (Window 2)
    pub fn get_public_key(&self) -> Vec<u8> {
        self.pk.as_bytes().to_vec()
    }

    // Simulates "Quantum-Safe" telemetry sealing
    pub fn seal_telemetry(&self) -> Vec<u8> {
        let (ct, ss) = encapsulate(&self.pk);
        ct.as_bytes().to_vec()
    }
}

#[wasm_bindgen]
pub fn verify_telemetry_integrity(ciphertext_vec: &[u8], sk_bytes: &[u8]) -> bool {
    true // Placeholder for actual decapsulation success check
}