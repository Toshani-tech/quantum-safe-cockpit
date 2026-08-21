# Quantum-Safe Cockpit: A Post-Quantum Cryptography Flight Simulator

**A 90-second military jet flight simulation I built to explore how post-quantum cryptography actually defends against cyberattacks in real time.**

---

## 🎯 What Is This?

I started this project wondering: if planes can be hijacked, can they be *hacked*? What would actually happen if someone broke into an avionics system mid-flight?

So I built a simulation. You run a 90-second flight mission as the pilot, and during the climb, a cyberattack hits. The simulation shows:

- **What the attack looks like** — glitching displays, corrupted data streaming in real time
- **How ML-KEM-768 defends it** — lattice-based post-quantum encryption that protects against quantum computers
- **The forensic analysis after** — a detailed "black box" audit that reconstructs what happened
- **Tamper-proof flight logs** — CSV files with SHA-256 signatures so you can verify nothing's been changed

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
- **Flight data recorder (FDR)** — captures telemetry every 500ms and exports as CSV with SHA-256 verification signatures

### **Window 2: Forensic Auditor (Post-Attack Analysis)**

- **Python HTTP backend** that reads the flight telemetry CSV (of the attack phase)
- **C++ analysis engine** that crunches the data in milliseconds
- **Security verdict dashboard** showing whether lattice defenses held up

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

### **Why I Built It This Way**

1. **Rust + WebAssembly for Physics & Crypto**
   - I needed deterministic execution (no random timing variations that could hide a real attack)
   - Fixed-point math (Fixed32) to avoid floating-point rounding errors (attackers could exploit those)
   - ML-KEM-768 because it's NIST-standardized and actually post-quantum resistant
   - Atomic operations so the physics thread and crypto thread never step on each other

2. **Web Workers for Physics**
   - Keeps the UI responsive even while flight physics runs at 100 Hz
   - Physics in a background thread so the animation never stutters
   - Data flows between threads via message passing (no shared memory chaos)

3. **Real ARINC-429 Protocol**
   - I implemented actual bit-packing into 32-bit words
   - Proper label/SDI/payload/parity encoding like real aircraft use
   - Learned ARINC specs to make sure I was doing this right

4. **Python + C++ for the Backend**
   - Python for easy HTTP server and JSON handling
   - C++ because analyzing 1000-record telemetry logs needs to be *fast*
   - Direct memory access avoids serialization overhead

---

## 🎖️ Development Timeline

I worked on this for 6 months straight (Feb–Aug 2026), tracking almost every day in a logbook:

- **Days 1-10** (Feb-Mar): Built the basic cockpit UI and physics engine
- **Days 11-30** (Mar-Jun): Learned ARINC-429 protocol, added QKD satellite simulation
- **Days 31-47** (Jun-Jul): Deep dive into ML-KEM cryptography, read NIST FIPS 203 papers
- **Days 48-54** (Jul): Fixed the flight display bugs, built the forensic auditor interface
- **Days 55-80** (Jul-Aug): Python/C++ backend, integrated everything, final debugging

80 days of work, documented in [docs/LOGBOOK.md](docs/LOGBOOK.md). 

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

- **Flight physics**: Implemented RK4 numerical integration (takes 4 samples per time step for accuracy). Added atmospheric drag that increases with altitude. Got the climb/descent rates to feel realistic by studying actual jet performance charts.
- **Real-time rendering**: Built canvas-based altitude and airspeed "tapes" that scroll like actual flight instruments. Took a while to get smoothing right so they don't jitter.
- **Threading**: Separated physics from UI using Web Workers so animation stays smooth even when physics gets heavy. Without this the whole app would freeze.
- **Data integrity**: Implemented actual ARINC-429 bit-packing. Not just for show—I wanted telemetry to match what real avionics do.

### **Security Layer (June-July 2026)**

- **Post-quantum cryptography**: Read NIST FIPS 203 spec cover to cover. Studied CRYSTALS-Kyber research papers to understand Ring Learning With Errors (RLWE). It's genuinely complex—lattice-based crypto is way harder than RSA.
- **Deterministic Rust code**: Used `AtomicU32` primitives so physics thread and crypto thread can safely share memory without race conditions. Important because any timing variation could hide an attack.
- **QKD satellite simulation**: Modeled how quantum key distribution works—laser attenuation at different altitudes, quantum bit error rates (QBER), signal transmittance. Real satellite links are noisy.

### **Forensic Analysis (July-August 2026)**

- **Python-C++ bridge**: Used Python's C-API to pass telemetry from Python server directly into compiled C++ code. Low-level memory access, no intermediate serialization.
- **Zero-copy memory**: Designed data flow so telemetry moves between threads without unnecessary copying. Matters when processing thousands of records.
- **Cryptographic verification**: SHA-256 hashing so you can download flight logs and verify they haven't been tampered with. Change one altitude value in Excel and the hash breaks.


## 📊 Performance

- **Main UI thread:** 60 FPS, <2ms per frame
- **Physics worker:** Deterministic 100 Hz update rate
- **Crypto operations:** <1ms per ML-KEM operation
- **C++ forensic analysis:** <5ms for 1000-record telemetry CSV

---

## 🎓 Why I Built This

I was watching a Hindi series about the Kandahar hijacking and thought: planes get hijacked, but what about hacked? Can someone actually break into an avionics system mid-flight?

That question stuck with me. I started researching the ARINC protocols, how aircraft authenticate data, what happens when you get a cyberattack in real time. I found out that post-quantum cryptography isn't theoretical anymore. NIST standardized ML-KEM in 2023, and aerospace companies are *already* auditing legacy systems for quantum vulnerabilities.

But everything I found was either highly theoretical or scattered across different papers and specs. Nobody had built a simulation that actually *showed* what an attack would look like in real time, or how the defenses would work.

So I built one. I wanted to understand: How does a flight system behave under attack? What does cryptographic defense actually look like when it's running? How do you verify that the system recovered properly? This project was my way of exploring those questions hands on instead of just reading about them.

---

## 📁 Project Structure

```
quantum-safe-cockpit/
├── index.html                          # Main flight deck interface
├── style.css                           # PFD styling
├── README.md                           # Project overview
├── SETUP_GUIDE.txt                     # Local execution instructions
├── COPYRIGHT.txt                       # Copyright notice
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
    └── LOGBOOK.md                      # Day by day development diary (80 days)
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


