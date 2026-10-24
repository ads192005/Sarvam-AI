"""
Sarvam AI Avatar Tutor - Local Launcher
Run: python run_server.py
"""

import sys
import os
from pathlib import Path

# Fix Windows console UTF-8 encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add current workspace to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

import uvicorn
from backend.config import settings

if __name__ == "__main__":
    print("=" * 65)
    print(">> Starting Sarvam AI Avatar Tutor Platform")
    print(f">> Server URL: http://localhost:{settings.PORT}")
    print(f">> Sarvam Key Status: {'Active' if settings.SARVAM_API_KEY else 'Demo Mode (Add key in Settings modal)'}")
    print("=" * 65)
    uvicorn.run("backend.app:app", host=settings.HOST, port=settings.PORT, reload=False)
