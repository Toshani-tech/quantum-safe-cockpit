
use pqcrypto_kyber::kyber1024::*;

pub use pqcrypto_kyber::kyber1024::{PublicKey, SecretKey, Ciphertext, SharedSecret};

pub fn generate_keypair() -> (PublicKey, SecretKey) {
    keypair()
}

pub fn seal_telemetry(pk: &PublicKey) -> (SharedSecret, Ciphertext) {
    encapsulate(pk)
}

pub fn verify_telemetry(ct: &Ciphertext, sk: &SecretKey) -> SharedSecret {
    decapsulate(ct, sk)
}