Day 1: Feb 21, 2026

Task: Built the basic cockpit layout and integrated the PQC security status bar.

Tech: HTML, CSS.

Note: I spent today just trying to get the general look right. I want it to have a PFD instead of serving as a standard website. I focused on the top security bar first because I want the user to see the encryption monitoring state as soon as the sim boots up.

P.S: I spent almost three hours tonight reading raw research papers on the "ARINC 429" aviation protocol and the new NIST standards for "ML-KEM" lattice cryptography. The math behind Learning With Errors (LWE) looks interesting with all the high dimensional matrix equations (It's way harder than highschool, but I suppose that's where the fun is) However, I realised my original plan of just using basic text strings for data passing isn't going to cut it if I want this to simulate real avionics. I decided to just get the visual HTML panels mapped out first while I figure out how to translate that heavy math into code. 

Day 2: Feb 22, 2026

Task: Developed the "System Boot" logic and live telemetry numbers.

Tech: JavaScript (DOM manipulation, setInterval).

Note: I finally got the numbers moving! It felt weird having the simulation start way up at 35,000 feet, so I changed it to 0 feet to simulate a cold start takeoff from the ground. I had some duplicate functions that were breaking the boot sequence, but I cleared those out. I also tuned the climb rate so the plane actually gets into the air in under 10 seconds.

P.S: I ran into a massive roadblock trying to make the telemetry scaling look realistic. My initial velocity loops made the aircraft accelerate faster than an F-22 on afterburners, which looked ridiculous. I had to look up actual flight profile data and read about atmospheric attenuation and "Bit Error Rates" (BER) in radio links. Trying to figure out how to program random background noise into a basic JavaScript setInterval loop without causing massive frame drops or rounding errors was a huge pain. I ended up having to map out a rough data budget on paper before touching the script again.


Day 3: Feb 23, 2026

Task: Re-engineered the UI into a 3-column PFD and built the Security Terminal.

Tech: CSS Grid, JavaScript (setTimeout).

Note: The new 3-column layout makes the interface look way more like a real primary flight display (PFD). I added an orange amber text log to show when the lattice security handshake happens. I also made sure the airspeed actually matches the altitude gain, capping it at 450 knots so it feels like a real jet and not a rocket ship.

P.S: : I had to completely scrap and rewrite my visual log stream today. I spent a long time looking into how real flight computers handle "bus lag" and text serialization over a shared data pathway. I wanted my terminal to mimic a real postquantum cryptographic handshake, which meant I had to figure out how to visually simulate a key exchange glitch. Trying to take the concept of a lattice-based public key mechanism and turn it into a high-speed, 3-column CSS layout with precise setTimeout triggers took way longer than I care to admit, mostly because the browser kept dropping frames when the text rendering spiked.

Day 4: Feb 24, 2026

Task: Migrated to Modules and built the "Red Alert" Quantum Stress Test.

Tech: ES6 Modules (import/export), HTML5 Canvas, Git/GitHub.

Note: I split up my giant, messy script file into smaller JS modules because it was getting impossible to manage. I also built a lattice visualizer box that starts glitching out on purpose between 20,000 and 25,000 feet. It triggers a flashing red alert state to show the user that the system detected an incoming data attack.

P.S: Spent over two hours losing my mind because GitHub wasn't showing my work. Turns out my files were stuck in a weird subfolder and my global Git email didn't match my VS Code profile email. I had to flatten the folder structure and force sync everything. Git is a nightmare sometimes. (Gained skills of persistence I'd say.)

Day 5: Feb 25, 2026

Task: Multithreaded System Init (POST) and Binary "Black Box" Recording.

Tech: Web Workers API, ArrayBuffer, DataView.

Note: I decided to clean up the basic layout and make it look much more industrial. I moved the physics and rendering engine over to a separate Web Worker thread so the main UI runs with zero lag. I also started building a flight data recorder using raw binary buffers; it stores telemetry as bits instead of standard arrays, mimicking how real black boxes work.

P.S: Took an hour to find a race condition bug. I tried to draw on the canvas from the main script after I had already handed control over to the background worker thread. I had to set up a quick message handshake so the main thread knows it's locked out of those pixels.

Day 6: Feb 26, 2026

Task: Developed Industrial PFD Tapes and Diagnostic Logging.

Tech: HTML5 Canvas, CSS Grid.

Note: I finally replaced the static text readouts with actual scrolling canvas tapes for altitude and airspeed. This makes it way easier to see the trend of the flight path. I also added text notes to the sidebar terminal so you can tell why the screen is flickering; it's not a bug, it's just the background code rolling over encryption keys because of the simulated data breach.

P.S: Fixed a layout glitch in 35 minutes. The terminal logs were getting so long that they literally pushed my footer off the bottom of the page and made the whole screen bounce. I added a fixed height and scroll settings to the box container so the text stays inside its designated boundary.

Day 7: Feb 27, 2026

Task: Implemented Decoupled Execution and OffscreenCanvas Logic.

Tech: JavaScript Web Workers, transferControlToOffscreen().

Note: I completely separated the flight dynamics math into its own thread to keep things stable. Now, even if the main UI thread gets bogged down rendering text, the physics integration won't stutter. I also added a small green status indicator light that blinks to show the background worker thread is actively ticking.

P.S: Fixed a canvas sizing issue. My lattice canvas dots were initializing inside a tiny default 300x150 box before the CSS grid had even finished scaling on page load. I added a check that looks at the actual container size first so the canvas elements scale properly right at boot up.

Day 8: Feb 28, 2026

Task: Hardened Aerodynamics and Fixed Temporal Syncing.

Tech: JavaScript Math (LERP), Frame-Rate Clamping.

Note: I updated the physics math so the simulation behaves a bit more realistically. The jet engines don't just jump to full power instantly anymore; instead, I added a simple smoothing factor to simulate them spooling up. I also fixed a basic coordinate calculation bug where climbing was making the display tape scroll downward instead of upward.

P.S: This took over 3 hours to figure out. The altitude tapes were vibrating and stuttering during climbs even though the raw numbers were perfectly fine. It was an alignment issue because the UI thread and the physics thread weren't ticking at the exact same rate. I used linear interpolation (LERP) to smooth out the values between data updates, and now the rolling movement looks super clean.

Day 9: March 1, 2026

Task: Fixing the UI symmetry so it looks like a real flight deck.

Tech: CSS Grid (repeat(3, 1fr)), Grid-Cell Containment (min-width: 0).

Note: I spent today tweaking the layout to get a balanced, multi-screen cockpit look. The goal is to keep the PFD panel, the lattice visualizer, and the data log terminal locked into identical thirds of the screen. I had to force the grid columns to stay put so they stop shrinking and growing when text lengths change.

P.S: Spent 45 minutes wondering why the canvas panel was stretching out and pushing the telemetry log stream completely off the screen. Turns out browsers make grid items expand to fit wide canvas drawings by default. (I should have figured it out sooner) Overriding this by setting min-width: 0 on the containers kept the layout locked in place.

Day 10: March 3, 2026

Task: Building the "Black Box" (FDR) and Mission Report system.

Tech: JavaScript Array Parsing, CSV Blob Generation.

Note: I finally closed the core simulation loop. Now, when the 90-second flight ends, an overlay panel pops up showing summary stats like your maximum altitude and peak airspeed. I also hooked up the black box recorder array so it captures telemetry every half-second and lets you download it as a real CSV file.

P.S: Fixed a 15-minute bug where the "Initialize" button stayed clickable during flight. I added some simple boolean flags to disable it so you can't spam click it, spawn multiple background worker threads, and crash the whole app.

Day 11: March 4, 2026

Task: Environment Re-Provisioning and SDK fighting.

Tech: Rust Compiler, Windows SDK.

Note: I had to completely redo my project version control directories because things were getting messy. I spent most of the afternoon fighting with my local environment setup because the compiler couldn't find the right system libraries to build the backend security folder. It was a massive headache just to get things to link up.

P.S: My laptop fans were going crazy while installing the build tools. I had to write a quick .gitignore file because the temporary compiler folders were generating thousands of junk files and cluttering my repository tracking.

Day 12: March 5, 2026

Task: Compiling the Rust code to WASM and building the math core.

Tech: Rust, wasm-pack, WebAssembly.

Note: I finally got my Rust security file (lib.rs) to successfully compile down into a WebAssembly binary. I ran into a weird file lock error mid build, but I managed to sort it out pretty quickly. The project folder is split up cleanly now, standard JavaScript handles the frontend cockpit, and the compiled WASM handles the heavy math. I decided to implement the underlying physics calculations using fixed-point math (Fixed32) inside Rust to avoid any weird rounding errors that normal numbers usually hit.

P.S: Spent an hour chasing a bug that turned out to be a classic Windows file pathing issue. I had to change the build commands to use absolute directory paths so the packager could actually find where the source folders were hidden.

Day 13: March 6, 2026

Task: Telemetry Sync & "Bus Lag" (RTT) Calibration.

Tech: JavaScript Web Workers, Timestamp Messaging.

Note: I finished setting up the main telemetry data pipe. I noticed a bug where my network lag counter was showing a hard 0ms, which didn't make sense. I fixed it by creating a basic ping pong loop: the main script sends a timestamp to the background thread, and the thread mirrors it right back so I can calculate the exact processing delay.

P.S: Fixed a quick 15 minute bug where a text ID in my script didn't match my HTML file, which is why the latency text wasn't updating on screen. I also had to move a message counter out of a local loop so it wouldn't get overwritten every time a new packet arrived.

Day 14: March 7, 2026

Task: UI Refit, Lattice Clipping Fix, and "Emergency" Modal.

Tech: CSS Grid, HTML5 Canvas, Script State Toggles.

Note: Fixed an annoying bug where the outer edge of my security lattice dots was getting cropped out by the canvas borders. I also redesigned the alert modal that pops up when a hack is detected to look like a red flashing system override panel. It looks a lot cooler and more alarming now.

P.S: Now that the Rust files compile and link up perfectly, I'm going to spend tomorrow focusing entirely on stabilizing the flight physics model because the drone keeps losing control around the 90-second mark. I am also keeping my Git commit messages clean and simple from now on to stay organized. (Took AI's help in writing the names professionally).

Day 15: March 8, 2026

Task: Global UI Sync, Rust Kernel Link, and Physics Hardening.

Tech: WebAssembly, Rust Backend, JavaScript UI.

Note: I spent today connecting the compiled WebAssembly file to the frontend code so it can handle the encryption handshakes. The security side works fine now, but the flight physics went completely haywire. My rate of climb monitor was jumping up to 17,000 feet per minute out of nowhere. I tried moving some of the delta math variables around to smooth it out, but the calculations are still tripping over themselves.

P.S: Fixed a styling alignment issue. The mode indicator and the flight computer lights weren't changing colors at the exact same time as the main bus. I synced them up so they all snap from amber to green together. I also patched the init button so it highlights green the second you click it.

Day 16: March 11, 2026

Task: Telemetry Stream Integration, Global State Synchronization, and Physics Stress Testing.

Tech: JavaScript Modules, UI Layout Containers, Hex Data Formatting.

Note: Today was a rough lesson in tracking data variables across different files. I spent two hours trying to get the security canvas to turn red when the main simulation logic flagged an attack, but the two files wouldn't talk to each other. I finally got the raw hex stream working, so now it dumps scrolling data codes directly into the sidebar panel. It looks super authentic, but managing the layout container heights to make it look right was a pain.

P.S: The drone is moving like an absolute snail right now because my drag variables are completely messed up. It's better than the nose dives it was doing yesterday, but right now it feels like flying through molasses.

Day 17: March 21, 2026

Task: Phase-Logic Synchronization & Visual State Recovery.

Tech: JavaScript Events, CSS State Classes.

Note: I worked on the color reset logic to make sure the flight display and security grid switch back to standard green once an attack phase ends. I hooked up an attack cutoff trigger tied to the 72-second mark of the flight. I also fixed a bug with the lattice colors by moving the visual swap to a single 
body.under-attack CSS class toggle instead of changing colors line-by-line in JavaScript.

P.S: The simple physics updates I had before were completely blowing up whenever the drone accelerated too quickly. The speed telemetry numbers are still glitching out completely whenever the plane goes too fast. I'm starting to think my simple physics update loop isn't stable enough for this. I probably need to change how the velocity steps are calculated so the math doesn't blow up.

Day 18: April 7, 2026

Task: Rewriting the physics engine and smoothing out the telemetry display.

Tech: JavaScript, Web Workers, Canvas Drawing Loops.

Note: Today was focused entirely on fixing the broken physics engine, and I finally got it working. I rewrote the velocity stepping logic inside the background thread so the math stays completely stable even during sudden maneuvers. I ran a bunch of test flights to make sure the trading off of speed for altitude feels right when the drone climbs.

P.S: The altitude tapes were vibrating and stuttering during climbs even though the raw numbers were perfectly fine. I fixed it by tightening the time-step calculations and capping the frame rate variations so the physics updates don't spike randomly. This took two hours but the data logs are finally flat.

Day 19: April 8, 2026

Task: Hardening Flight Dynamics and Precision Landing logic.

Tech: Web Workers, Math Smoothing Functions.

Note: I changed the movement code from basic jumpy state values to a continuous layout. By adding a limit to how fast the nose pitch can rotate, the plane is forced to respect weight and inertia. This makes the vertical rate climb indicator curve smoothly instead of teleporting to high numbers. I also adjusted the final landing phase logic so it snaps nicely to the runway at the 90-second mark.

P.S: Found a bug where the vertical speed numbers were jumping back and forth like a square wave. I fixed it by separating the actual pitch angle from the target pitch angle, which stops the drone from doing impossible 90 degree turns instantly. Took almost 3 hours to trace down.

Day 20: April 10, 2026

Task: Fixing the "dead" Error Rate display and checking the flight logs.

Tech: HTML Text Updates, JavaScript Randomization.

Note: The bit error rate (BER) percentage text on the panel looked totally fake because it just sat at a hard 0.00%. I fixed this by giving the element a unique ID and writing a quick math function to inject tiny, moving decimal noise so the numbers flutter naturally. I also formatted it to use scientific notation (like 1.10e-07) because it looks way more like an authentic readout. The CSV logs look awesome; you can see a quick lag spike right at boot up while the scripts load, and then it goes completely flat and stable.

P.S: I'm gonna spend a few days reading about how to secure the flight logs because right now, anyone could just open the exported CSV in Notepad and change the altitude numbers to whatever they want. I started researching cryptographic verification methods, specifically how SHA-256 hashing works. The concept makes sense, you run the text through an algorithm and it spits out a unique 64-character string but figuring out how to actually implement hardware accelerated crypto inside a browser environment looks tuff, but again that's where the fun is. I’m going to spend the next few days digging into the documentation for the Web Crypto API before I try writing the actual code. ( I assume the implementaion may span a few days).

Day 21: April 24, 2026

Task: Linking dynamic noise loops into the flight log data recorder.

Tech: JavaScript Web Workers, Basic Hashing, Random Data Generators.

Note: I spent two weeks straight learning how to work with asynchronous browser tools and trying to map out a data verification method that wouldn’t freeze the main screen. Today I focused on making the bit error rate react dynamically instead of just generating flat random numbers. I implemented a function so the error values change realistically depending on the aircraft's speed and what phase of the flight it's in. I also started working with basic data hashing to simulate a secure seal on the flight recorder.

P.S: This was my first time trying to add an encryption signature to the bottom of the flight log file, and it instantly broke. My CSV download footer kept printing out [object Promise] instead of the actual data hash because I forgot that the browser's crypto functions run asynchronously. The script was saving the file before the calculation had actually finished. I had to make the download button use an async structure and map the binary results into a readable text string. Now, if you change a single number in the spreadsheet, the verification hash breaks.

Day 22: May 15, 2026

Task: Creating automated security hashes for the flight data logs.

Tech: Web Crypto API, Data Blob Export.

Note: I upgraded the flight data recorder code so the downloaded CSV logs can't be easily edited or faked. Now, when the flight finishes, the script gathers all the rows of telemetry data, converts them into a text block, and feeds it into the browser's built in hashing tool. It slaps a unique 64 character hash at the very bottom of the document. If someone changes an altitude value or airspeed number in Excel, the verification signature won't match anymore.

P.S: I originally tried creating a hash from a random number generator string, but that completely ruined the validation check because the signature changed every single time you hit download. I fixed it by passing the exact text content of the spreadsheet directly into the hashing engine instead. Now the signature is perfectly repeatable.

Day 23: May 31, 2026

Task: Upgrading the telemetry pipeline to use raw binary array buffers.

Tech: Typed Arrays (Uint32Array), Bitwise Operators.

Note: I spent the last couple of weeks diving into how data labels work on real communication busses. I completely rebuilt the data streaming logic to use raw typed array buffers instead of passing heavy JavaScript data objects between threads, which was slowing things down. Inside the worker script, flight stats are sliced up into explicit binary sections for labels, values, and status flags, followed by a parity check. The main UI script takes these binary buffers and decodes them instantly using bitwise masks. I also made the error rates spike heavily during the combat zone phase to test data corruption.

P.S: Ran into a brutal bug where the rolling console display kept triggering fake error warnings even when the plane was just sitting on the ground. I learned that JavaScript bitwise operations automatically interpret numbers as signed 32-bit integers, which was messing up my high-bit flag masks. I had to force the arrays to use unsigned adjustments (>>> 0) to fix the alignment.

Day 24: June 20, 2026

Task: Rewriting the hacking event trigger and fixing UI transition states.

Tech: Script State Management, Event Listeners.

Note: Today was about cleaning up the timing of the attack sequence so the simulation tells a better story. Instead of pressing the "A" key like a developer cheat code to trigger the hack, the data injection attack now starts completely on its own the exact second the user clicks to close the security warning pop-up box during the flight. I also made sure all the warning indicators clear out automatically when the landing phase begins.

P.S: Ran into an annoying bug where old alert text fragments were still flashing in the scrolling hex window even after the plane had started landing. It was a timing issue where the background thread was still flushing out the last few frames of bad data right during the transition. I fixed it by adding a strict phase check to the stream reader so it ignores any incoming data spikes once the landing sequence drops.

Day 25: June 21, 2026

Task: Upgrading telemetry to actual ARINC-429 bit and tweaking the Rust security kernel.

Tech: Rust Backend, WebAssembly compilation.

Note: I worked on connecting my main frontend scripts to the backend Rust folder (src/lib.rs) to get things ready for the actual encryption math. I set up the basic structural files in Rust so that the simulation data can be passed directly into a low-level memory block. This ensures the heavy mathematical processing runs in an isolated sandbox space and won't freeze up the primary flight display loop while it's trying to animate.

P.S: Right now my entire app is showing a completely blank black screen on launch because of a script loading error in the console. I spent over two hours trying to track down the source of the crash today but couldn't get it to budge. Debugging these import lines is the first thing I have to do tomorrow.

Day 26: June 22, 2026

Task: Fixing background worker loading crashes and WASM build hangs.

Tech: WebAssembly, JavaScript Workers.

Note: I spent a massive chunk of time tracing a silent console crash that was freezing the simulation at startup. The worker thread was failing immediately. It turns out that when I updated the Rust configuration files yesterday, the compiler generated the JavaScript output bindings with the wrong environment settings. The browser didn't know how to read the export setup inside a background worker, causing a hidden syntax error that wiped out all useful error line numbers.

P.S: I still have a lot of troubleshooting left to do for other parts of the data loop, but at least the screen isn't totally blank anymore.

Day 27: June 23, 2026

Task: Fixing canvas line rendering blurriness and updating attack animations.

Tech: HTML5 Canvas, Page Layouts, Text Formatting.

Note: I fixed an issue in my main script where the telemetry monitor was misfiring fake alert messages during transitions. I attached the attack trigger directly to the modal button so the lattice visualization distorts the moment you click close. I also had to fix some blurriness on the canvas text, the high resol. laptop screens were stretching out the drawing space and making the lines look fuzzy. I fixed this by using Math.floor() to keep the elements snapped to whole numbers and adjusted the pixel alignments so the lines look sharp.

P.S: I spent almost the entire time trying to get the security grid to jitter violently during the hack sequence to show the discrete Gaussian error vectors in action. It wasn't working at first, but after looking closely at the code, I realized two different functions were running at the same time and fighting over the exact same animation variables which broke the effect. Everything looks clean now.

Day 28: June 24, 2026

Task: To refactor avionics terminal message delivery

Tech: JavaScript Strings, Array Filtering.

Note: Spent today fixing an annoying layout bug where long terminal strings were breaking past the edges of the cockpit panels and messing up the rest of the alignment. I rewrote the entire message text array to use short, punchy flight deck abbreviations so the text widths never change. I also removed a bunch of old log arrays for the post-flight screen because they were total dead code anyway; the popup CSV summary report already handles everything perfectly. I also fixed a timing bug where logs were printing twice because the system hit the update timer right before the worker changed phases.

P.S: My local repository got a bit messy after pulling down some updates, and my recent changes got unlinked from the main timeline. I had to use the command history tool to find the exact tracking hashes and manually stitch my work back together. Everything matches up on GitHub now.

Day 29: June 25, 2026

Task: Rewrote and hardened the ARINC 429 telemetry stream engine

Tech: Web Workers, Array Throttling.

Note: I spent the day cleaning up how the data logs update on screen. The physics worker sends updates super fast, and it was overloading the browser's rendering loop, so I locked the display updates down to a strict speed limit of 10 times per second. I also caught an issue where the background script would occasionally print out the exact same status message twice in a row when switching phases. I added a simple tracker variable to remember the last message text, so if a duplicate pops up, it flushes it out instantly.

P.S: The log box looked like a broken record repeating identical text lines this afternoon. Turns out I accidentally left some loose duplicate code fragments floating at the bottom of my file rewrite yesterday. It was throwing a breaking syntax error that almost ruined the script startup, but I scrubbed out the orphan text and now it runs perfectly.

Day 30: June 26, 2026

Task: Integrate visual metrics for the LEO satellite quantum key distribution link into the PFD

Tech: HTML Layouts, Inline CSS, Web Worker Messaging.

Note: I added a new data readout block for the satellite stats on the dashboard HTML right under where the standard bit error rate shows up. This gives me a dedicated section on the screen to see real-time stats like the quantum error percentage (QBER), the secure key speed in bits per second, and the satellite's position numbers coming straight from the background worker. I also created a new helper file called quantum-atmosphere.js which basically calculates how thick the air and clouds are based on the plane's altitude so it can figure out how much noise is messing with the satellite's laser beam.

P.S: Encountered a bug where the key rate stayed stuck at 0 bps even after the simulated attack zone had cleared out completely. I isolated the problem to the message listener block inside physics-worker.js. Turns out it was completely ignoring the reset signals because the code was only looking for a specific attack name string rather than checking the actual true/false state flag. It was a quick fix once I spotted it.

Day 31: June 27, 2026

Task: Refactored the telemetry loop to bind the live QKD satellite tracking outputs directly into the cockpit UI elements.

Tech: JavaScript State Modules, UI Refactoring, State Synchronization.

Note: I focused on linking the newly made QKD satellite tracking logic file directly into the actual cockpit interface so the metrics aren't just sitting in the background code. I updated the main game loop inside main.js to constantly trigger the satellite's math formulas using the active simulation timer. This lets fields like the QBER tracker, the secure key rate, and the live azimuth/elevation angles update smoothly on the glass dashboard every frame. I also tied the link reset engine directly to the flight transition states so that the moment the flight lands or gets wiped, all the compromised crypto tracking keys get completely scrubbed out of the system memory automatically.

P.S: Had a weird issue where the telemetry screen was throwing a syntax error on boot up and crashing the entire rendering canvas. I went through the state configuration object and found out I had completely missed a comma right after the new MitM attack flag variable when pasting in the new satellite module object. 

Day 32: June 28, 2026

Task: Completing full ARINC-429 bit-packing logic for the telemetry engine.

Tech: ARINC-429 Protocol Simulation, Type-Safe Bit-Packing, Data Serialization.

Note: (Spent about three hours diving into actual ARINC 429 hardware specifications and low-level bitmasking techniques to map this out. Researched a lot about it too, even highschool's not so tuff. But it isn't fun either so I consider the 3 hours I spent brainstorming fair!) Today was all about breaking down the telemetry system to run on actual bit-level logic matching real world ARINC-429 avionics specs. I fully refactored and completed the communication flow to use Uint32Array buffers to serialize the flight data manually into strict 32-bit words. I wrote custom bitwise operators to handle the bit-packing, stuffing the label, SDI, payload bits, SSM, and parity directly into a single unsigned integer. Up until now, parts of the system were still using standard JavaScript objects and floats under the hood but now it completely mirrors a hardware level word stream before shipping it to the cockpit UI.

P.S: Had a super annoying visual bug where the delta tracking indicator was rendering in an amber alert color even when the data transmission was totally fine. I dug into the updateTelemetryStream loop and realized my status assignment overrides were accidentally overriding the UI color states. (fixed it pretty quick)

Day 33: June 29, 2026

Task: Renaming the Rust crypto engine workspace and setting up the folders for the Python/C++ forensic auditor.

Tech: Post-Quantum Cryptography Architecture, WASM Bindings, Cross-Language Design (Python/C++).

Note: (Spend a solid chunk of time brainstorming how I want to actually handle the post attack analysis phase of this simulation) At the 62 second mark, when the popup drops, I want to spawn a completely separate window—(lets call it) window2 which acts as a hardcore forensic auditor analyzing what the hell just happened to the flight deck. I decided to introduce a brand new forensic-auditor directory containing Python and C++ source files (I went with C++ because it has the raw speed needed to crunch the heavy telemetry logs instantly and Python because its data libraries make scripting the post attack security graphs way easier.) I'm gonna spend the next few weeks heavily researching how to cleanly bridge them together to reconstruct the telemetry history and visualize the lattice defenses. (yes it is going to be tuff i assume!) On top of that I realized calling the other folder security-kernel didn't really make sense since the rust side isn't actually handling the security logic, but rather the heavy deterministic math so I renamed the entire directory to deterministic-engine. (JavaScript introduces random decimal rounding errors that a hacker could use to disguise a telemetry attack as a simple system glitch. My rust code enforces absolute determinism producing identical math down to the last bit, ensuring that any flight path variation is a real physical or security event, not a code glitch.)

P.S: Git and VS Code teamed up to give me an absolute nightmare today. After the folder rename, Git broke and started tracking over 420 auto-generated Rust compiler files that should've been ignored, forcing me to clear the Git cache, rewrite my .gitignore with wildcards, and force a hard re-index just to clear the changes list. ( manual cache clearing takes so much longer than initially thought.)

Day 34: June 30, 2026

Task: Refactoring the cryptographic interface and attempting to resolve WASM build errors.

Tech: Rust/WASM, NIST-Standardized ML-KEM, C-Language Interop.

Note: Today was a grueling battle against the compiler. I add some cryptographic implementation into a new crypto.rs file within the deterministic-engine. The intent was to create a clean interface specifically for calling the ML-KEM libraries. By isolating these calls, I wanted to implement the actual ML-KEM logic in a modular way that didn't clutter the primary library structure. However, this triggered a cascade of linking issues because those underlying NIST libraries are written in C, the build process started demanding the wasi-sdk to locate C headers like stdlib.h and string.h that simply don't exist in the browser’s wasm32-unknown-unknown sandbox. 

P.S:I spent over four hours trying to force the linker to resolve these dependencies, but the build is still failing. I need this crypto.rs to act as the bridge to the post quantum primitives, but the cross compilation between the C based NIST code and the Rust/WASM target is currently broken. I have to keep debugging this tomorrow because without a successful build, the entire sim cannot verify the telemetry stream, and right now its blank! To be frank i am beyond frustrated. Git cache clearing was the easy part but fighting the linker is a total nightmare. I thought isolating the logic would make it cleaner, but instead, it exposed a deep incompatibility between the C code expectations of pqcrypto and the browser environment. I Have to work on this tomorrow. I am in 'C hell' rightnow honestly. I'm basically trying to force these high-speed, industrial grade C cryptography libraries to run inside the browser’s strict, virtual "sandbox," but the compiler is throwing a fit because it can't find the basic system tools it needs to talk to the hardware.

Day 35: July 1, 2026

Task: Migration to Native WSL/Linux toolchain and resolution of WASM compilation blockers.

Tech: Rust/WASM, WSL (Ubuntu), Clang/LLVM, FFI (Foreign Function Interface).

Note: Today was the complete opp. of yesterday’s 'C hell' After spending hours fighting the Windows-native toolchain yesterday, I decided to fully commit to the Linux-native toolchain via WSL. The difference was mind blowing! By leveraging the build essential toolchain on Linux, the linker immediately found the clang and llvm headers it was crying for, and the compilation pipeline finally completed. I successfully reconciled the FFI between my Rust SecurityEngine and the underlying crypto primitives. I’ve now properly exposed the SecurityEngine, init_engine, and telemetry pointers to the JavaScript main thread. (still took me around 3 hours to get it all to work and to finally watch the browser console  stop throwing 404 and reference errors.) 

P.S: Although the compilation process is finally resolved, the simulation itself is still blank. I’m still facing some stubborn errors in the rendering pipeline that I couldn't iron out before the end of the day. Gotta fix it the next time I sit down at the terminal. (spent atleast an hour sorting thru Linux documentation to resolve complex dependency chains and linker errors.) Solving this bug was the biggest one yet, including yesterday I spent over 6 hours dealing with these linker issues!

Day 36: July 6, 2026

Task: Attempted C native integration for crypto math primitives and repository cleanup.

Tech: C, Rust/WASM, FFI, WASI-SDK, Git, WSL.

Note: Today was a total rollercoaster. I noticed my rust files dont have much math, so I really wanted to push the crypto math to the next level by offloading the heavy lifting to native C libraries, so I spent about 3 hours setting up the whole WASI-SDK toolchain. I was grinding through creating new config.toml files, wrestling with linker paths, and trying to weave these high-performance C crypto libraries directly into my Rust engine via FFI. It was intense. But, it ended up creating this massive mess of 6,000+ build artifacts that totally choked my terminal and made everything crawl. (partly cuz my laptop's aged)

P.S: After realizing the repo was getting bloated and the terminal was lagging to the point of being unusable, I made the call to nuke the index and reset everything. It felt like I was deleting my work, but it was the only reasonable move to keep the project working. (Before I can get the sim to start off once again, i'm gonna focus on integrating either C or rust crypto math libraries into the deterministic engine files to provide a full proof crypto math engine) 


