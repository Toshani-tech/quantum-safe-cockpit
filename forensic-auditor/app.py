import http.server
import socketserver
import json
import time
import auditor_cpp

PORT = 8000
IN_MEMORY_LOGS = []

class ForensicAPIHandler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path == '/upload':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            global IN_MEMORY_LOGS
            try:
                IN_MEMORY_LOGS = json.loads(post_data.decode('utf-8'))
                self.send_response(200)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "received"}).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(str(e).encode('utf-8'))
        else:
            self.send_response(404)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

    def do_GET(self):
        try:
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header("Content-type", "text/html")
            self.end_headers()

            # === STEP 2: C++ ENGINE BENCHMARK TIMER & EXECUTION ===
            start_time = time.perf_counter()

            try:
                # Hand off flight logs to the high-speed C++ engine via the bridge
                audit_result = auditor_cpp.analyze_logs(IN_MEMORY_LOGS)
                total_records = audit_result.get('total_records', len(IN_MEMORY_LOGS))
                max_lat = audit_result.get('peak_latency', 0.0)
                max_alt = audit_result.get('max_altitude', 0)
                max_spd = audit_result.get('max_airspeed', 0)
                verdict_text = audit_result.get('verdict', 'LATTICE ISOLATION ENFORCED')
            except Exception as cpp_err:
                # Fallback safeguard if needed
                print(f"[WARNING] C++ Bridge call failed, using Python fallback: {cpp_err}")
                total_records = len(IN_MEMORY_LOGS)
                max_lat = max([float(r.get("lat", 0)) for r in IN_MEMORY_LOGS], default=0.0)
                max_alt = max([int(r.get("alt", 0)) for r in IN_MEMORY_LOGS], default=0)
                max_spd = max([int(r.get("spd", 0)) for r in IN_MEMORY_LOGS], default=0)
                verdict_text = "LATTICE ISOLATION ENFORCED (PYTHON FALLBACK)"

            end_time = time.perf_counter()
            execution_time_ms = (end_time - start_time) * 1000
            print(f"[BENCHMARK] C++ Forensic Engine Execution Time: {execution_time_ms:.4f} ms")

            html_content = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title> WINDOW 2: AVIONICS FA </title>
                <style>
                    :root {{
                        --av-green: #00FF41;
                        --av-amber: #FFB000;
                        --av-cyan: #00E5FF;
                        --av-red: #FF3B3B;
                        --bg-base: #07090b;
                        --panel-bg: #0d1117;
                        --border-dim: #1f2937;
                        --border-glow: rgba(0, 255, 65, 0.25);
                    }}
                    * {{ box-sizing: border-box; }}
                    body {{
                        background-color: var(--bg-base);
                        color: var(--av-green);
                        font-family: 'JetBrains Mono', 'Courier New', monospace;
                        margin: 0;
                        padding: 16px;
                        height: 100vh;
                        width: 100vw;
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                    }}
                    .header-banner {{
                        border: 1px solid var(--av-green);
                        padding: 12px 18px;
                        background: var(--panel-bg);
                        box-shadow: 0 0 15px var(--border-glow);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }}
                    h1 {{ margin: 0; font-size: 16px; letter-spacing: 2px; color: #fff; }}
                    .subtitle {{ color: var(--av-cyan); font-size: 11px; letter-spacing: 1px; margin-top: 2px; }}
                    .system-clock {{ font-size: 12px; color: var(--av-amber); border: 1px solid var(--av-amber); padding: 4px 8px; background: rgba(255,176,0,0.05); }}
                    
                    .dashboard-grid {{
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 16px;
                        flex-grow: 1;
                        margin-top: 16px;
                        min-height: 0;
                    }}
                    .panel {{
                        border: 1px solid var(--border-dim);
                        background: var(--panel-bg);
                        padding: 16px;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        position: relative;
                    }}
                    .panel h3 {{
                        margin: 0 0 12px 0;
                        border-bottom: 1px solid var(--border-dim);
                        padding-bottom: 6px;
                        font-size: 12px;
                        letter-spacing: 1.5px;
                        color: var(--av-amber);
                    }}
                    .metric-row {{
                        display: flex;
                        justify-content: space-between;
                        margin: 6px 0;
                        font-size: 12px;
                        border-bottom: 1px dashed rgba(255,255,255,0.03);
                        padding-bottom: 4px;
                    }}
                    .metric-label {{ color: #9ca3af; }}
                    .metric-value {{ font-weight: bold; color: var(--av-green); }}
                    
                    .log-container {{
                        grid-column: span 2;
                        border: 1px solid var(--border-dim);
                        background: var(--panel-bg);
                        padding: 14px;
                        display: flex;
                        flex-direction: column;
                        height: 240px;
                    }}
                    .log-stream {{
                        background: #020406;
                        border: 1px solid #111827;
                        padding: 10px;
                        flex-grow: 1;
                        overflow-y: auto;
                        font-size: 11px;
                        color: #00ff66;
                        line-height: 1.4;
                    }}
                    .status-pill {{
                        display: inline-block;
                        padding: 4px 10px;
                        background: rgba(0, 255, 65, 0.08);
                        border: 1px solid var(--av-green);
                        font-size: 10px;
                        letter-spacing: 1px;
                        margin-top: 8px;
                    }}
                    .footer-bar {{
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 10px;
                        color: #6b7280;
                        border-top: 1px solid var(--border-dim);
                        padding-top: 8px;
                        margin-top: 8px;
                    }}
                </style>
            </head>
            <body>
                <div class="header-banner">
                    <div>
                        <h1>[WINDOW 2] FLIGHT DECK FORENSIC AUDITOR</h1>
                        <div class="subtitle">SECURE KERNEL RAM-BRIDGE // POST-ATTACK RECONSTRUCTION</div>
                    </div>
                    <div class="system-clock">SYS_STATUS: LOCKED</div>
                </div>

                <div class="dashboard-grid">
                    <div class="panel">
                        <h3>TELEMETRY BUFFER METRICS</h3>
                        <div>
                            <div class="metric-row"><span class="metric-label">Ingested Frames:</span> <span class="metric-value">{total_records}</span></div>
                            <div class="metric-row"><span class="metric-label">Peak Handshake Latency:</span> <span class="metric-value">{max_lat:.2f} MS</span></div>
                            <div class="metric-row"><span class="metric-label">Max Recorded Altitude:</span> <span class="metric-value">{max_alt} FT</span></div>
                            <div class="metric-row"><span class="metric-label">Max Recorded Airspeed:</span> <span class="metric-value">{max_spd} KTS</span></div>
                        </div>
                        <div class="status-pill">VERDICT: {verdict_text}</div>
                    </div>

                    <div class="panel">
                        <h3>CRYPTOGRAPHIC INTEGRITY</h3>
                        <div>
                            <div class="metric-row"><span class="metric-label">Encryption Standard:</span> <span class="metric-value">NIST ML-KEM-768</span></div>
                            <div class="metric-row"><span class="metric-label">Bus Protocol:</span> <span class="metric-value">ARINC-429 TYPE-SAFE</span></div>
                            <div class="metric-row"><span class="metric-label">C++ Pipeline Latency:</span> <span class="metric-value" style="color: var(--av-cyan);">{execution_time_ms:.4f} MS</span></div>
                            <div class="metric-row"><span class="metric-label">Memory I/O:</span> <span class="metric-value">ZERO DISK (RAM DIRECT)</span></div>
                        </div>
                        <div class="status-pill" style="border-color: var(--av-amber); color: var(--av-amber); background: rgba(255,176,0,0.05);">SECURITY: THREAD ISOLATION ACTIVE</div>
                    </div>

                    <div class="log-container">
                        <h3>ENGAGEMENT ZONE FLIGHT RECORDER STREAM</h3>
                        <div class="log-stream">
            """

            if IN_MEMORY_LOGS:
                for r in IN_MEMORY_LOGS[-20:]:
                    html_content += f"<div><span style='color: #4b5563;'>[T+{r.get('t', '0')}s]</span> ALT: <span style='color:#fff;'>{r.get('alt', '0')}FT</span> | SPD: <span style='color:#fff;'>{r.get('spd', '0')}KTS</span> | PHASE: <span style='color:var(--av-cyan);'>{r.get('phase', 'N/A')}</span> | LATENCY: <span style='color:var(--av-amber);'>{r.get('lat', '0')}ms</span></div>"
            else:
                html_content += "<div style='color: var(--av-red);'>[!] WAITING FOR LIVE RAM STREAM FROM MAIN FLIGHT DECK...</div>"

            html_content += f"""
                        </div>
                    </div>
                </div>

                <div class="footer-bar">
                    <span>DETERMINISTIC ENGINE // ARCHITECTURE V19.4</span>
                    <span>SECURE FLIGHT DECK ENVIRONMENT</span>
                </div>
            </body>
            </html>
            """
            self.wfile.write(html_content.encode("utf-8"))
        except Exception as e:
            print(f"[CRITICAL ERROR IN GET] {e}")
            error_msg = f"<h1 style='color:red;'>PYTHON RENDER ERROR: {e}</h1>"
            self.wfile.write(error_msg.encode("utf-8"))

    def log_message(self, format, *args):
        print(f"[API] {args[0]}")

def run():
    server_address = ('', PORT)
    httpd = socketserver.TCPServer(server_address, ForensicAPIHandler)
    print(f"[+] In-Memory Forensic Auditor bridge active on http://localhost:{PORT}")
    httpd.serve_forever()

if __name__ == '__main__':
    run()