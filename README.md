# Quantum-Safe-Cockpit: A Post-Quantum Cryptography Flight Simulator

**A military jet flight simulation I built to explore how post-quantum cryptography can be incorporated into a simulated avionics cybersecurity scenario.**

Watch Video Demo [To be Attached]
---

## 🎯 What Is This?

I started this project wondering: if planes can be hijacked, can they be *hacked*? What would actually happen if someone compromised a simulated avionics system during flight?

So I built a simulation. You run a flight mission as the pilot, and during the mission, a simulated cyberattack occurs. The simulation shows:

* **What the attack looks like** — glitching displays, corrupted telemetry, and changing security states
* **How ML-KEM-768 is incorporated into the security layer** — a lattice-based, post-quantum key-encapsulation mechanism
* **The forensic analysis afterward** — an audit interface that analyzes the simulated attack telemetry
* **Flight-log integrity verification** — CSV flight logs accompanied by SHA-256 hashes that can be used to detect changes to the recorded data

---

## 🎓 Why I Built This

I was watching a Hindi series about the Kandahar hijacking and thought: planes get hijacked, but what about hacked? Can someone actually compromise an avionics system during flight?

That question stuck with me. I started researching ARINC protocols, how aircraft systems authenticate data, and how cybersecurity considerations apply to avionics environments. I also became interested in post-quantum cryptography and how emerging cryptographic standards could eventually affect long-lived systems.

Much of what I found was highly theoretical or spread across different papers, standards, and technical resources. I wanted to build something that could bring some of those concepts together in an interactive simulation.

So I built one. I wanted to understand: How might a simulated flight system behave under a cyberattack? What does a cryptographic security layer look like when it is running inside a simulation? How can telemetry be analyzed after an incident? This project was my way of exploring those questions hands-on instead of only reading about them.

**Important:** This project is an educational simulation. It is not an aviation-certified flight-control system, avionics system, operational QKD system, or validated model of real-world aircraft cybersecurity. The flight dynamics, attack scenario, security response, and satellite link are simulated for experimentation and learning.

---

## 🚀 Features

### **Window 1: The Flight Deck (Real-Time Simulation)**

* **Live primary flight display (PFD)** showing altitude, airspeed, and vertical velocity
* **Flight physics engine** using RK4 numerical integration, written in Rust
* **ARINC-429 telemetry simulation** using 32-bit word formatting inspired by the avionics communication standard
* **Security lattice visualizer** — animated lattice points that change state during the simulated attack
* **Quantum Key Distribution (QKD) link** to a simulated satellite — models metrics such as key rate and quantum bit error rate (QBER)
* **Mission timeline** with multiple simulated flight phases
* **Automatic simulated cyberattack** triggered during the engagement phase
* **Flight data recorder (FDR)** — captures telemetry at regular intervals and exports it as CSV with SHA-256 integrity hashes

### **Window 2: Forensic Auditor (Post-Attack Analysis)**

* **Python HTTP backend** that receives the live telemetry snapshot from the main flight deck via `/upload`
* **C++ analysis engine** that computes telemetry statistics and evaluates the simulated security state
* **Security verdict dashboard** showing the simulated result of the lattice security layer during the engagement phase
* **Flight recorder stream** that renders recent attack-phase telemetry records and an integrity summary for review

---

## 🏗️ Architecture

```text
Browser (JavaScript)                     Backend (Python + C++)
┌─────────────────────────────┐         ┌────────────────────────┐
│  main.js (Flight Loop)      │         │  app.py (HTTP Server)  │
│  ├─ UI Rendering            │────────→│  └─ JSON telemetry      │
│  ├─ Physics Worker Thread   │         │                        │
│  └─ Security State Manager  │         │  bridge.cpp + WASM     │
│                             │         │  └─ C++ Analysis Engine│
│  Rust/WASM                   │         │                        │
│  ├─ ML-KEM-768 Crypto       │         │  auditor-engine.cpp    │
│  ├─ Atomic Telemetry Buffer │         │  └─ Telemetry Analysis │
│  └─ Memory Bridge           │         └────────────────────────┘
└─────────────────────────────┘
```

### **Why I Built It This Way**

1. **Rust + WebAssembly for Physics & Crypto**

   * I wanted predictable numerical behavior in the core simulation
   * Fixed-point math (`Fixed32`) to provide consistent numerical operations
   * ML-KEM-768 because it is standardized by NIST and designed as a post-quantum key-encapsulation mechanism
   * Atomic operations for synchronized access to shared state

2. **Web Workers for Physics**

   * Keeps the UI responsive while flight physics runs in a background thread
   * Separates physics computation from the main rendering loop
   * Data flows between threads through message passing

3. **ARINC-429 Protocol Simulation**

   * Implements bit-packing into 32-bit words
   * Models fields such as label, SDI, data/status information, and parity
   * Used ARINC-429 documentation as a reference for the implementation

4. **Python + C++ for the Backend**

   * Python for HTTP server and JSON handling
   * C++ for compiled telemetry analysis
   * Uses a native bridge between Python and the C++ analysis component

---

## 🎖️ Development Timeline

I worked on this project over several months, keeping a development log throughout the process.

The project progressed through several stages:

* **Early development:** Built the cockpit UI and physics engine
* **Simulation development:** Studied ARINC-429 and added the simulated satellite QKD link
* **Security development:** Studied ML-KEM and the underlying lattice-based cryptography
* **Forensic development:** Built the auditor interface and telemetry analysis system
* **Integration:** Connected the browser simulation, Rust/WASM security layer, Python backend, and C++ analysis engine

Development notes are documented in [docs/LOGBOOK.md](docs/LOGBOOK.md).

---

## 📋 How to Run

**For detailed setup and execution instructions, see [SETUP_GUIDE.txt](SETUP_GUIDE.txt).**

---

## 🧠 What I Built (and Learned)

### **Core Simulation**

* **Flight physics:** Implemented RK4 numerical integration and modeled atmospheric drag as part of the simulated flight dynamics. Used publicly available aircraft performance information as a reference while tuning the simulation.
* **Real-time rendering:** Built canvas-based altitude and airspeed "tapes" inspired by modern flight displays, with smoothing to make the simulated instruments easier to read.
* **Threading:** Separated physics computation from UI rendering using Web Workers so intensive calculations do not have to run on the main rendering thread.
* **Data formatting:** Implemented ARINC-429-style bit packing to explore how structured avionics telemetry can be represented.

### **Security Layer**

* **Post-quantum cryptography:** Studied the NIST FIPS 203 specification and CRYSTALS-Kyber research to understand lattice-based cryptography, Ring Learning With Errors (RLWE), and related mathematical concepts.
* **Rust security code:** Used `AtomicU32` primitives for synchronized access to shared state between concurrent components.
* **QKD satellite simulation:** Modeled concepts associated with quantum key distribution, including attenuation, quantum bit error rate (QBER), and signal transmittance. The satellite link is a simulation rather than an operational QKD system.

### **Forensic Analysis**

* **Python-C++ bridge:** Used Python's C API to connect the Python server with compiled C++ telemetry-analysis code.
* **Window 2 monitoring flow:** The auditor receives the simulated engagement-phase telemetry, calculates summary metrics, and displays recent recorder data without requiring a separate on-disk CSV import.
* **Cryptographic verification:** Uses SHA-256 hashing to detect changes to recorded flight-log data. If the contents of a file change, its newly calculated digest will differ from the original recorded digest.

---


## 📁 Project Structure

```text
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
│       ├── lattice-engine.js           # Security visualization
│       └── qkd-satellite-link.js       # QKD simulation metrics
├── deterministic-engine/               # Rust/WASM cryptographic kernel
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs                      # SecurityEngine & telemetry buffer
│       └── crypto.rs                   # ML-KEM-768 implementation
├── forensic-auditor/                   # Post-attack analysis ("Window 2")
│   ├── app.py                          # Python HTTP server
│   ├── auditor-engine.cpp/hpp          # C++ telemetry analysis
│   ├── bridge.cpp                      # Python C API wrapper
│   └── CMakeLists.txt                  # Build configuration
└── docs/
    └── LOGBOOK.md                      # Development diary
```

---

## 📚 Resources I Used

* **NIST FIPS 203** — ML-KEM specification
* **CRYSTALS-Kyber Papers** — lattice-based cryptography, Ring Learning With Errors, and NTT-related concepts
* **ARINC 429 Specifications** — avionics communication protocol
* **Rust and WebAssembly documentation** — FFI and memory management
* **Python C API Documentation** — connecting Python with native code
* **AI use** — code review, documentation feedback, and essay refinement

---

## 📝 Copyright

Copyright © 2026. All rights reserved.

See [COPYRIGHT.txt](COPYRIGHT.txt) for details.

---
