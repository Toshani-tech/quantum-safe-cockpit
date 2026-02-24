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