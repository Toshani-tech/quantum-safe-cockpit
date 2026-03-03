Day 1: Feb 21, 2026

Task: Built the basic cockpit layout and integrated the PQC (Post-Quantum Cryptography) security status bar.

Tech: Used HTML/CSS for the "Glass Cockpit" type aesthetic.

Note: Focused on making the security bar look active to show the AI-monitoring state.

Day 2: Feb 22, 2026

Task: Developed the "System Boot" logic and made the flight telemetry numbers move in real-time.

Tech: Used JavaScript (DOM manipulation and setInterval) to link the HTML buttons to the data display.

Note: Adjusted the starting altitude to 0 FT instead of 35,000 FT to simulate a "cold start" takeoff sequence. Fixed an issue with duplicate functions to ensure the boot sequence triggers correctly. Also, optimized telemetry climb rates for a faster climb(in under 10 seconds). 

Day 3: Feb 23, 2026 

Task: Re-engineered the UI into a 3-column Primary Flight Display (PFD) and built an AI Security Terminal.

Tech: CSS Grid for aerospace-grade layout; JavaScript setTimeout and DOM injection for simulated data-bus handshakes.

Note: Implemented a "Safety Amber" logging system to visualize the ML-KEM (Lattice-Based) handshake. Integrated physics-based airspeed scaling, ensuring the velocity correlates with altitude gain and caps at a realistic cruise speed of 450 KTS to simulate commercial jet performance.

Day 4: Feb 24, 2026

Task: Migrated to a Modular Architecture and implemented a Dynamic Quantum Stress Test (Red Alert).

Tech: ES6 Modules (import/export) for scalable code management; HTML5 Canvas API for real-time mathematical lattice rendering; Git/GitHub for professional version control and CI/CD foundations.

Note: Refactored the monolithic script into a modular engine, separating physics telemetry from security visualization. Engineered a PQC (Post-Quantum Cryptography) Lattice Visualizer that simulates "Quantum Decoherence." Integrated an automated stress test that triggers a high-visibility "Red Alert" state (color shift and coordinate jitter) between 20,000 and 25,000 feet, simulating a successful detection and mitigation of a lattice-based attack.

P.S: The Bug(Took over 2 hours to find): Project files were "hidden" in a sub-folder (/quantum-safe-cockpit-main/), hence Github wasn't reflecting my VS code progress. Because Git didn't know who I was (very tiny email mismatch). I flattened the repo (moved files to root), verified identity (git config --global user.email) and synced the world (git reset --hard).

Day 5: Feb 25, 2026

Task: Implemented Multithreaded System Initialization (POST) and Binary Flight Data Recording (Black Box).

Tech: Web Workers API (Thread Concurrency); ArrayBuffer & DataView for low-level memory mapping; CSS ::before overlays for CRT/Hardware scanline emulation; OffscreenCanvas for non-blocking 60FPS rendering.

Note: Executed a "Professional Pivot" to kill the "kid-coded" aesthetic. Engineered a Power-On Self-Test (POST) sequence that simulates hardware register checks and memory allocation before flight ops commence. Migrated core telemetry and rendering to a Physics Worker thread, decoupling the math from the UI to ensure 0ms input lag. Implemented a Binary Circular Buffer (Black Box) using a 10KB raw ArrayBuffer. Instead of high-level arrays, the system now performs pointer arithmetic to store altitude and velocity as Float32 bits, mirroring real-world FDR (Flight Data Recorder) logic used in Airbus/Boeing avionics.

P.S: The Bug(Took 1 hour to find): Spent time debugging a "Race Condition" where the Main Thread tried to draw to the Canvas after I had already transferred control to the Worker via transferControlToOffscreen(). The Fix: Created a "System State" handshake where the Main Thread strictly handles UI (tags/terminal) and the Worker owns the Canvas context exclusively. Once ownership is transferred, the Main Thread is "locked out" of the pixels—true hardware-level separation. 

Day 6: Feb 26, 2026

Task: Developed Industrial "Glass Cockpit" PFD Components and Contextual Diagnostic Logging.

Tech: HTML5 Canvas (Linear Scale Interpolation); CSS Grid (Rigid Hardware Geometry); NIST-Standardized ML-KEM (Lattice-Based) Logic Hooks; HMI (Human-Machine Interface) Design Patterns.

Note: Refined the UI from "game-like" to "Industrial Research Tool." Replaced static text with scrolling Vertical Altitude and Airspeed Tapes that use linear interpolation to provide pilots with "trend awareness" rather than just digits. Locked the UI into a Rigid Grid with min-height: 0 and flex-shrink: 0 constraints to prevent "layout bouncing" during high-velocity data bursts. Integrated Contextual Annotations into the telemetry stream; the system now narrates its own state transitions (e.g., SIGNAL_NOISE_THRESHOLD_EXCEEDED). This ensures the "Observer" (admissions/recruiters) understands that the red lattice flicker isn't a glitch, but a deliberate NIST-Standardized ML-KEM re-keying event in response to a simulated quantum breach.

P.S: The Bug (Fixed under 35 minutes): Encountered a "Visual Hallucination" where the terminal data pushed the footer off-screen, causing the entire UI to stretch and "bounce" with every new line of hex code. The Fix: Implemented a Hard Bezel Lock using overflow-y: auto on the terminal and fixed-height footer containers. This forced the data to scroll within its allocated hardware address space rather than resizing the physical display—preserving the "Glass Cockpit" structural integrity.

Day 7: Feb 27, 2026
Task: Implemented Decoupled Main-Thread Execution and OffscreenCanvas Logic.

Tech: Web Workers (Concurrency); transferControlToOffscreen() (Worker-Side Rendering); High-Fidelity Physics Integration (Euler Method); Arinc-429 Type-Safe Serialization.

Note: Migrated the Primary Flight Display (PFD) and Aerodynamics Engine to a dedicated Web Worker to ensure "Safety-Critical" performance. By offloading complex Newtonian calculations and canvas rendering to a background thread, I’ve prevented the UI Event Loop from "blocking" during high-entropy Lattice generation. This architecture mirrors real-world avionics where the Display Processor is physically isolated from the Flight Control Computer. Added a Worker-Side Heartbeat (Thread_002) to visualize this concurrency—providing a real-time "Health Status" of the decoupled process.

P.S: The Bug (Fixed under 1 hr): Resolved the "Constellation Cluster" anomaly where lattice nodes initialized in a default 300x150 coordinate space before the CSS Grid had settled. The Fix: Implemented a Resolution Guard that captures parent-container dimensions via getBoundingClientRect() before transferring canvas control, ensuring the mathematical lattice scales to the physical hardware resolution upon boot.

Day 8: Feb 28, 2026 

Task: Hardened Aerodynamics Core & Temporal Synchronization.

Tech: Thrust Spooling Logic (Linear Interpolation); Y-Axis Coordinate Inversion (Cartesian-to-Screen Mapping); Deterministic Frame-Rate Clamping; Predictive Ground-Contact Guards.

Note: Refactored the Physics Engine to move beyond "Game Logic" into "Simulation Grade" territory. Implemented Thrust Spooling to simulate jet engine spool-up times, successfully resolving a 4800 FPM vertical velocity spike caused by instantaneous force application. Further hardened the PFD by correcting a Y-coordinate inversion bug; the instrumentation now utilizes a true Cartesian-to-Screen mapping where altitude increases represent a decrease in pixel-Y, mirroring actual glass cockpit behavior.

P.S: The Bug ( Took over 3 hours to resolve) During the "Steady Climb" phase, the altitude and airspeed tapes appeared to "vibrate" or stutter, despite the physics worker reporting smooth data.This was a Temporal Aliasing issue. The Main Thread (UI) and the Physics Worker (Logic) were running at slightly different frequencies. When the UI requested a frame, it was sometimes grabbing a physics state from 2ms ago and sometimes from 10ms ago, causing a "micro-teleportation" effect on the vertical bars. The Fix: Implemented Linear Interpolation (LERP) & Sub-Pixel Translation. Instead of rounding the altitude to the nearest pixel, I refactored the drawVerticalTape function to use floating-point offsets for the Y coordinates. By calculating the exact pixel remainder ( y = centerY - (i - value)* ppu), the tapes now slide with "Retina-grade" smoothness, regardless of the worker's internal tick rate.

Day 9: March 1, 2026

Task: Industrial UI Symmetrization & Multi-Threaded State Synchronization.

Tech: Strict CSS Grid (repeat(3, 1fr) with minmax(0, 1fr)); Grid-Cell Containment (min-width: 0 logic); NIST ML-KEM Basis Vector Margin-Scaling; Flex-End Data Streaming.

Note: Achieved a mathematical 1:1:1 "Triple-Glass" symmetry across the avionics suite to eliminate the "chindi" adaptive stretching. Implemented grid-template-columns: repeat(3, minmax(0, 1fr)) and min-width: 0 on the panel containers to force the PFD, Lattice Engine, and Telemetry into identical thirds of the viewport, regardless of internal canvas scaling. This ensures the Primary Flight Display cannot "bully" the Security Engine for screen real estate, maintaining the visual authority required for an industrial flight deck.

P.S: The Bug (Took 45 mins to fix): Even with 1fr grid columns, the PFD was stretching the left panel, pushing the Telemetry sidebar into a overflow state. The browser's default min-width: auto behavior for grid items was causing it. If a canvas child is "wide," the grid cell expands to fit it, breaking the 33.33% ratio. The Fix: Overrode the implicit minimum width with min-width: 0 and applied calc(33.33% - gap) logic. Now, the PFD is "hardened" inside its container, and the UI remains perfectly balanced on high-resolution displays.

Day 10: March 3 2026 

Task: Implementation of Post-Flight Data Analysis (PFD) and Black Box (FDR) Serialization.

Tech: ARINC-429 Mimicry, CSV Blob Serialization, and State Persistence.

Note: Successfully closed the simulation loop by implementing a "Mission Report" overlay. The system now tracks maxAlt and maxSpd in real-time. Added a "Black Box" feature that captures a telemetry snapshot every 1,000ms into a fdrBuffer. Upon mission completion, the user can trigger an exportFDR() function which generates a RFC 4180-compliant CSV file for external flight analysis. This proves the simulation is processing real data, not just playing an animation.

P.S: Fixed a UI bug ( took 15 min to solve) where the "Initialize" button remained active during the flight; added state.isBooted guarding to prevent multiple worker instances from spawning and crashing the telemetry bus.