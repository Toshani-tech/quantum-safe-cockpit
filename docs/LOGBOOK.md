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

P.S: The Bug(Took over 2 hours to find): Project files were "hidden" in a sub-folder (/quantum-safe-cockpit-main/), hence Github wasn't reflecting my VS code progress. Bceause Git didn't know who I was (very tiny email mismatch). I flattened the repo (moved files to root), verified identity (git config --global user.email) and synced the world (git reset --hard).