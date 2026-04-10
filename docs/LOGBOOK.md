
Day 1: Feb 21, 2026

Task: Built the basic cockpit layout and integrated the PQC security status bar.

Tech: HTML/CSS, "Glass Cockpit" aesthetic.

Note: I spent today just trying to get the "vibe" right. I want it to look like a high-tech flight display, not a basic website. I focused on the security bar first because I want the user to see that "AI-monitoring" state as soon as they boot it up.

Day 2: Feb 22, 2026

Task: Developed the "System Boot" logic and live telemetry numbers.

Tech: JavaScript (DOM manipulation, setInterval).

Note: I finally got the numbers moving! It felt weird starting at 35,000 FT, so I changed it to 0 FT to simulate a "cold start" takeoff. I had some duplicate functions that were breaking the boot sequence, but I cleared those out. Also tuned the climb rate so you can actually get into the air in under 10 seconds.

Day 3: Feb 23, 2026

Task: Re-engineered the UI into a 3-column PFD and built the Security Terminal.

Tech: CSS Grid, JavaScript (setTimeout, DOM injection).

Note: The 3-column layout makes it look way more professional, more like a real Primary Flight Display (PFD). I added a "Safety Amber" log to show the lattice handshake happening. I also made sure the airspeed actually matches the altitude gain, capping it at 450 KTS so it feels like a real jet and not a rocket ship.

Day 4: Feb 24, 2026

Task: Migrated to Modules and built the "Red Alert" Quantum Stress Test.

Tech: ES6 Modules (import/export), HTML5 Canvas, Git/GitHub.

Note: I refactored my giant messy script into smaller modules because it was getting impossible to manage. I also built a "Lattice Visualizer" that starts glitching out between 20k and 25k feet. It triggers this high-visibility "Red Alert" to show the system detecting a quantum attack.

P.S: Spent over 2 hours losing my mind because GitHub wasn't showing my work. Turns out my files were stuck in a weird subfolder and my Git email didn't match my VS Code email. I had to flatten the whole repo and force sync everything. Git is a nightmare sometimes.

Day 5: Feb 25, 2026

Task: Multithreaded System Init (POST) and Binary "Black Box" Recording.

Tech: Web Workers API, ArrayBuffer & DataView, OffscreenCanvas.

Note: I decided to kill the "kid-coded" look and go full industrial. I moved the physics and rendering to a Web Worker so the UI has zero lag. I also built a "Black Box" using raw ArrayBuffers; it stores data as bits instead of normal arrays, which is exactly how real flight recorders in a Boeing or Airbus work.

P.S: Took an hour to find a "Race Condition." I tried to draw on the canvas from the main thread after I already gave control to the worker. Now I have a "handshake" where the main thread knows it's locked out of the pixels. True hardware separation!

Day 6: Feb 26, 2026

Task: Developed Industrial PFD Tapes and Diagnostic Logging.

Tech: HTML5 Canvas (Linear Interpolation), CSS Grid, NIST ML-KEM Logic.

Note: Finally replaced the static text with scrolling Altitude and Airspeed Tapes. It makes the pilot much more aware of the "trend" of the flight. I also added annotations so you can actually tell why the screen is flickering; it's not a glitch, it's the system re-keying in response to a breach.

P.S: Fixed a "Visual Hallucination" in 35 minutes. The terminal logs were getting so long they pushed my footer off the screen and made the whole UI "bounce." I forced a "Hard Bezel Lock" so the logs scroll inside a fixed space instead of stretching the display.

Day 7: Feb 27, 2026

Task: Implemented Decoupled Execution and OffscreenCanvas Logic.

Tech: Web Workers, transferControlToOffscreen(), Arinc-429 Serialization.

Note: I moved the Aerodynamics engine to its own thread to keep things "safety-critical." If the UI thread gets busy, the physics won't stop. It’s like real avionics where the display processor is separate from the flight computer. I even added a "Heartbeat" light to show the threads working.

P.S: Fixed the "Constellation Cluster" mess. My lattice dots were initializing in a tiny 300x150 box before the CSS grid even loaded. I added a "Resolution Guard" that checks the container size first so the lattice scales to the screen properly on boot.

Day 8: Feb 28, 2026

Task: Hardened Aerodynamics and Fixed Temporal Syncing.

Tech: Thrust Spooling (LERP), Y-Axis Inversion, Frame-Rate Clamping.

Note: I refactored the physics to feel like a real simulation. Engines don't just hit max thrust instantly, so I added "spooling." I also fixed a Y-coordinate bug where climbing actually looked like falling on the screen.

P.S: This one took over 3 hours. The altitude tapes were "vibrating" or stuttering during the climb even though the math was right. It was "Temporal Aliasing"—the UI and Physics threads weren't perfectly in sync. I fixed it by using LERP (Linear Interpolation) to smooth out the bars between data packets. It finally looks like a pro HUD.

Day 9: March 1, 2026

Task: Fixing the UI symmetry so it looks like a real flight deck.

Tech: CSS Grid (repeat(3, 1fr)), Grid-Cell Containment (min-width: 0), NIST ML-KEM Scaling.

Note: I spent today trying to get that "Triple-Glass" cockpit look where everything stays perfectly in its own lane. I wanted the PFD, the Lattice map, and the logs to stay in identical thirds of the screen. I had to force the grid columns to stop "bullying" each other for space, which actually makes it feel like an industrial flight tool.

P.S: Spent 45 mins wondering why the PFD was stretching its panel and pushing the Telemetry logs off-screen. Turns out the browser’s default behavior for grid items is to expand to fit a "wide" child (the canvas). I had to override it with min-width: 0 to "harden" the containers and keep the layout balanced.

Day 10: March 3, 2026

Task: Building the "Black Box" (FDR) and Mission Report system.

Tech: ARINC-429 Mimicry, CSV Serialization, State Persistence.

Note: Finally closed the simulation loop. Now, at the end of a flight, a report pops up showing your max altitude and speed. I also added a "Black Box" feature that captures data every second into a buffer. You can actually export it as a CSV file for real analysis. It proves the simulation is running on real data and isn't just a canned animation.

P.S: Found a 15-minute bug where the "Initialize" button stayed active during flight. I added some isBooted guarding to stop the user from accidentally spawning 10 different workers and crashing the entire data bus.

Day 11: March 4, 2026

Task: Environment Re-Provisioning & SDK Fighting.

Tech: MSVC v14.44, Rust Toolchain, Windows SDK.

Note: I had to redo my version control because things got messy. I spent most of the day fighting with the Windows SDK because the Rust compiler couldn't link to the right memory libraries. It was a massive headache just to get the "Security Kernel" to talk to the hardware properly.

P.S: My laptop was screaming with high CPU usage during the SDK install. I had to set up a global .gitignore fast because the Rust build artifacts were basically trying to eat my SSD.

Day 12: March 5, 2026

Task: Rust-to-WASM Compilation & Repo Hardening.

Tech: Rust, wasm-pack, WebAssembly, Git.

Note: Finally got the Security Kernel to compile to WASM! I hit a weird "OS Error 112" while getting the toolchain, but I figured it out in 15 minutes. I also cleaned up the GitHub repo so the UI code and the Crypto code are totally separate. It’s a "Polyglot" setup now—JS for the HUD and Rust for the encryption math.

P.S: Spent an hour chasing a bug that turned out to be Windows pathing issues. I had to switch to absolute directory paths to get the compiler to actually find the source files.

Day 13: March 6, 2026

Task: Telemetry Sync & "Bus Lag" (RTT) Calibration.

Tech: Web Workers, RTT Latency Reflection, ARINC-429 Logic.

Note: Finished the Master Engine today. I had this weird "Silent Zero" bug where my lag was showing as 0ms, which is impossible. I built an RTT (Round-Trip Time) Reflection Protocol—the main thread pings the worker with a timestamp, and it mirrors it back. Now I can actually see the real-world micro-lag of the data bus.

P.S: Fixed a 15-minute "ghost update" where a DOM ID in the JS didn't match the HTML, so the latency wasn't showing. I also had to move a variable to the global worker scope to prevent "shadowing" from losing my data packets.

Day 14: March 7, 2026

Task: UI Refit, Lattice Clipping Fix, and "Emergency" Modal.

Tech: CSS Grid, HTML5 Canvas, NIST ML-KEM-L5 (Kyber-1024).

Note: Fixed the bug where the Lattice dots were getting cut off at the edges of the canvas. I also redesigned the Kyber security popup to look like a high-threat "Emergency Override." It feels way more intense now when the attack triggers.

P.S: The Rust environment is solid and the WASM kernel is linked. I'm spending Day 15 focusing purely on the physics engine to stop the 90-second stability issues that have been a mess for a while. Decided to keep my GitHub messages strictly professional (feat/fix) so I can stay organized.

Day 15: March 8, 2026

Task: Global UI Sync, Rust Kernel Link, and Physics Hardening.

Tech: WASM, Rust (security-kernel), CSS Transitions, ARINC-429.

Note: Spent the entire day buried in the Rust environment. Got the WASM kernel fully linked for the ML-KEM-1024 handshake, so the security side is rock solid. But the physics was absolute trash, I was seeing VVI spikes of 17,000+ FT/M. I tried using the Rust core for some of the RK (Runge-Kutta) integration to stabilize the flight path, but the math is still tripling over itself.

P.S: Fixed the "visual weight" issue. The Mode and FCC buttons weren't matching the Main Bus. Now all three snap from Amber to Green at the exact same millisecond. Also patched the Init button so it turns Green the instant you click it.

Day 16: March 11, 2026

Task: Telemetry Stream Integration, Global State Synchronization, and Physics Stress Testing.

Tech: JavaScript Modules, CSS Glass Cockpit UI, ARINC-style Hex Serialization.

Note: Today was a brutal lesson in State Management. I spent 2 hours fighting with the lattice-engine; it turns red via the console but was refusing to sync with the main mission logic. I finally got the Persistent Hex Stream working, it's now dumping raw ARINC-429 style data words into the sidebar. It looks incredibly industrial, but the sizing was a nightmare; had to hard-code container heights to make it readable.

P.S: The craft is currently moving like a snail because my drag coefficients are completely off. Better than the suicide-dives from yesterday, but now it feels like flying through molasses.

Day 17: March 21, 2026

Task: Phase-Logic Synchronization & Visual State Recovery.

Tech: Decoupled Main-Thread Execution, State-Driven UI Synchronicity, NIST ML-KEM Visuals.

Note: Refined the "Aviation Green" recovery logic to ensure the PFD and Lattice Shield revert to nominal colors after a security event. Implemented a triggerAttack(false) hook tied to the 72-second mission milestone. Finally fixed the lattice dots bug by using a centralized body.under-attack CSS class toggle. This keeps all components synchronized without manual color overrides in every function.

P.S: The telemetry is still going absolutely haywire at high velocities. I'm realizing that standard RK-4 might not be good enough for this simulation. I need to move toward something more numerically stable like a Velocity Verlet integrator to keep the flight path from collapsing.

Day 18: April 7, 2026

Task: Refinement of Aero-Physics Engine and Integration of High-Contrast Avionics Telemetry.

Tech: Rust (Verlet Integration), JavaScript (Web Workers), HTML5 Canvas.

Note: Today was focused entirely on Physics, which I finally managed to fix. I transitioned the core movement logic to a Velocity Verlet Integrator in the Rust security kernel to ensure numerical stability during high-speed maneuvers. I ran multiple flight tests to verify the Energy Exchange ensuring that as the UAV climbs, the Airspeed reacts realistically based on thrust.

P.S: Encountered a minor "energy leak" where the altitude would drift even at zero VVI. Resolved this by tightening the Euler to Verlet integration delta and normalizing the dt governor to prevent frame rate induced physics spikes. This took over 2 hours but the logs finally look consistent.

Day 19: April 8, 2026

Task: Hardening Flight Dynamics and Precision Landing logic.

Tech: Decoupled Main-Thread Execution, RK4 Integration (Rust Kernel), Slew-Rate Limited Pitch Control.

Note: Transformed the flight model from a discrete-state simulation to a continuous inertial model. By implementing a Slew-Rate Limited Pitch Controller, I forced the airframe to respect inertia, limiting nose rotation. This ensured that the VVI curves naturally rather than jumping instantly. Also refined the FINAL_APPROACH phase with a "Ground Snap" logic for the 90-second touchdown.

P.S: Discovered a "Square Wave" bug in the VVI telemetry where the sink rate was teleporting between values. Resolved this by decoupling the targetPitch from the actualPitch, preventing the drone from executing non-physical 10G maneuvers. Took close to 3 hours to resolve.

Day 20: April 10, 2026

Task: Fixing the "dead" Error Rate display and checking the flight logs.

Tech: Web Workers (Multi-threading), NIST ML-KEM (Post-Quantum Cryptography), WebAssembly (Wasm).

Note: The Bit Error Rate (BER) on the dashboard was looking super fake, just a static 0.00%. I fixed this by giving the HTML element a specific ID and writing a script to add a tiny bit of "noise" so the numbers actually move. I also switched it to scientific notation (like 1.10e-07) because it looks way more like a real flight computer. I checked the csv export and it looks sick; you can actually see the computer "struggling" for a split second at the start (260ms latency) while it loads the security kernel, then it levels out perfectly.