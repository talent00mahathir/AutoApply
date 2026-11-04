"""AutoApply - One-Click Application Launcher.

Starts the Uvicorn server, performs environment pre-flight diagnostics,
and automatically launches the interactive dashboard in the user's default web browser.

Usage:
    python run.py
"""

import os
import sys
import time
import socket
import threading
import webbrowser
from dotenv import load_dotenv

load_dotenv()

APP_HOST = "127.0.0.1"
APP_PORT = 8000
SERVER_URL = f"http://{APP_HOST}:{APP_PORT}"


def print_banner():
    banner = f"""
=======================================================================================
  █████╗  ██╗   ██╗ ████████╗  ██████╗   █████╗  ██████╗  ██████╗  ██╗      ██╗   ██╗
 ██╔══██╗ ██║   ██║ ╚══██╔══╝ ██╔═══██╗ ██╔══██╗ ██╔══██╗ ██╔══██╗ ██║      ╚██╗ ██╔╝
 ███████║ ██║   ██║    ██║    ██║   ██║ ███████║ ██████╔╝ ██████╔╝ ██║       ╚████╔╝ 
 ██╔══██║ ██║   ██║    ██║    ██║   ██║ ██╔══██║ ██╔═══╝  ██╔═══╝  ██║        ╚██╔╝  
 ██║  ██║ ╚██████╔╝    ██║    ╚██████╔╝ ██║  ██║ ██║      ██║      ███████╗    ██║   
 ╚═╝  ╚═╝  ╚═════╝     ╚═╝     ╚═════╝  ╚═╝  ╚═╝ ╚═╝      ╚═╝      ╚══════╝    ╚═╝   
                     Agentic AI Job Application Assistant | v1.0.0            
=======================================================================================
"""
    print(banner)


def check_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    """Check if a network port is actively open and listening."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.6)
        return s.connect_ex((host, port)) == 0


def preflight_checks():
    """Perform health and readiness diagnostics before starting server."""
    print("[PRE-FLIGHT] Checking environment and services...")

    # 1. Check Gemini API Key
    api_key = os.getenv("GOOGLE_API_KEY", "").strip()
    if api_key and not api_key.startswith("your_"):
        masked = api_key[:6] + "..." + api_key[-4:] if len(api_key) > 10 else "***"
        print(f"  [+] Google Gemini API Key : Configured ({masked})")
    else:
        print("  [!] Google Gemini API Key : MISSING or Placeholder in .env")
        print("      (AI pipeline requires a valid key from https://aistudio.google.com/)")

    # 2. Check Database Service
    mysql_active = check_port_in_use(3306, "127.0.0.1")
    if mysql_active:
        print("  [+] Database Service      : MySQL service detected on port 3306")
    else:
        print("  [i] Database Service      : MySQL port 3306 not detected")
        print("      -> AutoApply will run seamlessly with local SQLite fallback.")

    # 3. Check App Port
    if check_port_in_use(APP_PORT, APP_HOST):
        print(f"  [!] Port Conflict Warning : Port {APP_PORT} is already in use!")
        print(f"      Another instance might be running. Attempting to start...")

    print("----------------------------------------------------------------------")


def open_browser_when_ready():
    """Polls the backend until responsive, then opens the browser."""
    import urllib.request

    health_url = f"{SERVER_URL}/api/health"
    max_attempts = 30
    for _ in range(max_attempts):
        time.sleep(0.5)
        try:
            with urllib.request.urlopen(health_url, timeout=1) as response:
                if response.status == 200:
                    print(f"\n[SERVER ONLINE] Server is healthy and listening on {SERVER_URL}")
                    print("[BROWSER] Opening AutoApply dashboard in your web browser...")
                    webbrowser.open(SERVER_URL)
                    return
        except Exception:
            pass


def main():
    print_banner()
    preflight_checks()

    # Launch browser-opener thread
    browser_thread = threading.Thread(target=open_browser_when_ready, daemon=True)
    browser_thread.start()

    print(f"[*] Starting AutoApply Server at {SERVER_URL}...")
    print("[*] Press Ctrl+C in this window to stop the server at any time.\n")

    import uvicorn
    try:
        uvicorn.run(
            "main:app",
            host=APP_HOST,
            port=APP_PORT,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n[SHUTDOWN] AutoApply server stopped cleanly. Goodbye!")
    except Exception as e:
        print(f"\n[ERROR] Server failed to start: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
