use wasm_bindgen::prelude::*;
use ml_kem::{MlKem768, Encapsulated}; // Added trait import
use rand::thread_rng;

#[wasm_bindgen]
pub struct CryptoEngine {
    pk: ml_kem::PublicKey<MlKem768>,
    sk: ml_kem::SecretKey<MlKem768>,
}

#[wasm_bindgen]
impl CryptoEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let mut rng = thread_rng();
        let (sk, pk) = MlKem768::generate_keypair(&mut rng);
        CryptoEngine { pk, sk }
    }

    pub fn get_public_key(&self) -> Vec<u8> {
        // ml-kem v0.2+ uses .as_ref() for byte access
        self.pk.as_ref().to_vec()
    }

    pub fn seal_telemetry(&self) -> Vec<u8> {
        let mut rng = thread_rng();
        let (ct, _ss) = self.pk.encapsulate(&mut rng);
        // The ciphertext ct implements AsRef<[u8]>
        ct.as_ref().to_vec()
    }
}