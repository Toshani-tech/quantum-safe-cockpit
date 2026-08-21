# Quantum-Safe Cockpit: A Post-Quantum Cryptography Flight Simulator

**A 90-second military jet flight simulation that demonstrates how post-quantum cryptography defends against cyberattacks.**

---

## 🎯 What Is This?

Imagine an aircraft's flight computer gets attacked by a hacker. Can the quantum-resistant encryption protect it? This project answers that question by simulating a real-world cyber engagement at 20,000+ feet.

You run a 90-second combat mission. Somewhere during the climb, a cyberattack hits the avionics system. The simulation shows:

- **What happens** when the system is under attack (glitching displays, corrupted data)
- **How post-quantum cryptography defends** it (lattice-based math that quantum computers can't break)
- **What the forensic analysis reveals** after attack (a detailed "black box" audit of the attack)
- **Downloadable flight logs** as a CSV file with SHA-256 verification signatures to prove the data hasn't been tampered with

It's part flight simulator, part security demo, all real cryptography.

---

## 🚀 Features

### **Window 1: The Flight Deck (Real-Time Simulation)**

- **Live primary flight display (PFD)** showing altitude, airspeed, and vertical velocity
- **Realistic physics engine** using RK4 numerical integration (written in Rust for precision)
- **ARINC-429 telemetry stream** — the actual protocol used by real aircraft
- **Security lattice visualizer** — dancing green points that turn RED during attack
- **Quantum Key Distribution (QKD) link** to a simulated LEO satellite — tracks secure key rates and quantum bit error rates (QBER)
- **90-second mission timeline** with 4 flight phases: Startup → Climb → Engagement → Landing
- **Automatic cyberattack** triggered during engagement zone 
- **Flight data recorder (FDR)** — captures telemetry every 500ms and exports as CSV

### **Window 2: Forensic Auditor (Post-Flight Analysis)**

- **Python HTTP backend** that reads the flight telemetry CSV
- **C++ analysis engine** that crunches the data in milliseconds
- **Security verdict dashboard** showing whether lattice defenses held up
- **Attack timeline visualization** showing when QBER spiked and secure key rates dropped
- **Tamper-proof flight logs** with SHA-256 verification signatures

---

## 🏗️ Architecture

```
Browser (JavaScript)                     Backend (Python + C++)
┌─────────────────────────────┐         ┌────────────────────────┐
│  main.js (Flight Loop)      │         │  app.py (HTTP Server)  │
│  ├─ UI Rendering            │────────→│  └─ JSON telemetry      │
│  ├─ Physics Worker Thread   │         │                        │
│  └─ Security State Manager  │         │  bridge.cpp + WASM     │
│                             │         │  └─ C++ Analysis Engine│
│  Rust/WASM (Deterministic)  │         │                        │
│  ├─ ML-KEM-768 Crypto       │         │  auditor-engine.cpp    │
│  ├─ Atomic Telemetry Buffer │         │  └─ Fast Stats Calc    │
│  └─ Zero-Copy Memory Bridge │         └────────────────────────┘
└─────────────────────────────┘
```

### **Key Technical Decisions**

1. **Rust + WebAssembly for Physics & Crypto**
   - Deterministic execution = no random timing variations
   - Fixed-point math (Fixed32) prevents floating-point rounding errors
   - ML-KEM-768 (NIST standardized) instead of deprecated RSA
   - Atomic operations ensure thread-safe telemetry updates

2. **Web Workers for Physics**
   - Main UI thread stays responsive
   - Background physics loop runs at 60+ FPS
   - Smooth data flow via message passing

3. **Real ARINC-429 Protocol**
   - Bit-packing telemetry into 32-bit words
   - Proper label/SDI/payload/parity encoding
   - Mimics actual avionics communication

4. **Python + C++ for Analysis**
   - Python handles HTTP requests and JSON parsing
   - C++ performs heavy computation in nanoseconds
   - Direct memory access = no intermediate serialization overhead

---

## 🎖️ Development Timeline

- **Days 1-10** (Feb-Mar): UI, physics, flight data recording
- **Days 11-30** (Mar-Jun): ARINC-429 integration, QKD satellite simulation
- **Days 31-47** (Jun-Jul): Rust/WASM cryptography, deep ML-KEM research
- **Days 48-54** (Jul): Stabilizing PFD, building forensic auditor UI
- **Days 55-80** (Jul-Aug): Python/C++ backend, cryptographic analysis, final polish

**Total work:** ~6 months, 80 days documented in the project logbook.

For a detailed log entry record, see [docs/LOGBOOK.md](docs/LOGBOOK.md).

---

## 📋 How to Run

**For detailed setup and execution instructions, see [SETUP_GUIDE.txt](SETUP_GUIDE.txt).**

Quick summary:

1. Build the Rust engine: `cargo build --target wasm32-unknown-unknown --release` (in `deterministic-engine/`)
2. Start the Python server: `python app.py` (in `forensic-auditor/`)
3. Open `http://127.0.0.1:8000` in your browser
4. Click **"ENGAGE MISSION BUS"** and run the 90-second simulation

---

## 🧠 What I Built (and Learned)

### **Core Simulation (Feb-June 2026)**

- **Flight physics**: RK4 numerical integration, atmospheric drag, realistic climb/descent rates
- **Real-time rendering**: Canvas-based altitude and airspeed "tapes" that scroll smoothly
- **Threading**: Separated physics from UI using Web Workers to prevent jank
- **Data integrity**: ARINC-429 bit-packing to match real avionics protocols

### **Security Layer (June-July 2026)**

- **Post-quantum cryptography**: Studied NIST FIPS 203, CRYSTALS-Kyber research papers, and Ring Learning With Errors (RLWE) math
- **Deterministic Rust code**: Used `AtomicU32` for lock-free shared memory between JS and WASM
- **QKD satellite simulation**: Modeled laser attenuation, quantum bit error rates, and signal transmittance

### **Forensic Analysis (July-August 2026)**

- **Python-C++ bridge**: Used Python C-API to safely pass telemetry from Python to compiled C++ code
- **Zero-copy memory**: Designed data flow to avoid unnecessary serialization overhead
- **Cryptographic verification**: SHA-256 hashing of flight logs to detect tampering


## 📊 Performance

- **Main UI thread:** 60 FPS, <2ms per frame
- **Physics worker:** Deterministic 100 Hz update rate
- **Crypto operations:** <1ms per ML-KEM operation
- **C++ forensic analysis:** <5ms for 1000-record telemetry CSV

---

## 🎓 Why I Built This

I was watching a Hindi series on Netflix about the Kandahar hijacking, and it got me thinking: I have heard of planes getting hijacked, but can they get hacked? In the future that may be possible so what would actually happen if someone broke into an avionics system mid-flight?

That question sent me down a rabbit hole. I started reading about ARINC protocols, telemetry standards, and how modern aircraft authenticate data. I got to know that the post-quantum cryptography defense isn't theoretical anymore and NIST standardized it in 2023, plus aerospace companies are already auditing legacy avionics systems. It fed my curiosity, but most of what I found was either theoretical or scattered across different subjects.

So I decided to build this simulation to actually see how it would work. How would a flight system behave under attack? What would cryptographic defense look like in real time? How would you even verify that the system recovered properly? This project was my way of exploring those questions hands on.

---

## 📁 Project Structure

```
quantum-safe-cockpit/
├── index.html                          # Main flight deck interface
├── style.css                           # PFD styling 
├── src/
│   ├── main.js                         # Mission coordinator & UI loop
│   ├── physics/
│   │   ├── physics-worker.js           # Background thread for flight dynamics
│   │   ├── aerodynamics.js             # RK4 physics equations
│   │   └── quantum-atmosphere.js       # Atmospheric attenuation modeling
│   └── security/
│       ├── lattice-engine.js           # Security visualization (red flashing)
│       └── qkd-satellite-link.js       # QKD metrics (QBER, key rate)
├── deterministic-engine/               # Rust/WASM cryptographic kernel
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs                      # SecurityEngine & telemetry buffer
│       └── crypto.rs                   # ML-KEM-768 implementation
├── forensic-auditor/                   # Post-flight analysis ("Window 2")
│   ├── app.py                          # Python HTTP server
│   ├── auditor-engine.cpp/hpp          # C++ telemetry analysis
│   ├── bridge.cpp                      # Python C-API wrapper
│   └── CMakeLists.txt                  # Build configuration
└── docs/
    ├── LOGBOOK.md                      # Day by day development diary (80 days)
    └── SETUP_GUIDE.txt                 # Local execution instructions
```

---


## 📚 Resources I Used

- **NIST FIPS 203** — ML-KEM specification
- **CRYSTALS-Kyber Papers** — Ring LWE problem and NTT transforms
- **ARINC 429 Specifications** — Avionics communication protocol
- **Rust WASM Book** — FFI and memory management
- **Python C-API Documentation** — Bridging to C++
- **AI use** — Code review, documentation feedback, and essay refinement 

---

## 📝 Copyright

Copyright © 2026. All rights reserved.

See [COPYRIGHT.txt](COPYRIGHT.txt) for details.

---


