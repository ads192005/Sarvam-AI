import os
import json
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.config import settings
from backend.sarvam_client import SarvamClient
from backend.tutor_engine import TutorEngine, PERSONAS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sarvam_tutor_app")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multimodal AI Avatar Tutor powered by Sarvam AI (Saaras STT, Bulbul TTS, Sarvam-105B LLM, Sarvam Translate)"
)

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
sarvam_client = SarvamClient()
tutor_engine = TutorEngine(sarvam_client)


class ChatRequest(BaseModel):
    message: str
    persona: str = "priya"
    language_code: str = "hi-IN"
    history: Optional[List[Dict[str, str]]] = None
    context_document: Optional[str] = None
    sarvam_api_key: Optional[str] = None


class TTSRequest(BaseModel):
    text: str
    target_language_code: str = "hi-IN"
    speaker: str = "meera"
    pace: float = 1.0
    sarvam_api_key: Optional[str] = None


class TranslateRequest(BaseModel):
    text: str
    source_language_code: str = "auto"
    target_language_code: str = "hi-IN"
    sarvam_api_key: Optional[str] = None


class SaveKeyRequest(BaseModel):
    api_key: str


@app.get("/api/health")
async def health_check():
    """Returns system status, active personas, and Sarvam API readiness."""
    has_key = sarvam_client.has_api_key
    masked_key = (sarvam_client.api_key[:4] + "..." + sarvam_client.api_key[-4:]) if has_key else None
    
    return {
        "status": "healthy",
        "sarvam_connected": has_key,
        "masked_key": masked_key,
        "personas": PERSONAS,
        "languages": [
            {"code": "hi-IN", "name": "Hindi (हिंदी)"},
            {"code": "en-IN", "name": "Indian English"},
            {"code": "bn-IN", "name": "Bengali (বাংলা)"},
            {"code": "ta-IN", "name": "Tamil (தமிழ்)"},
            {"code": "te-IN", "name": "Telugu (తెలుగు)"},
            {"code": "mr-IN", "name": "Marathi (मराठी)"},
            {"code": "gu-IN", "name": "Gujarati (ગુજરાતી)"},
            {"code": "kn-IN", "name": "Kannada (ಕನ್ನಡ)"},
            {"code": "ml-IN", "name": "Malayalam (മലയാളം)"},
            {"code": "pa-IN", "name": "Punjabi (ਪੰਜਾਬੀ)"},
            {"code": "od-IN", "name": "Odia (ଓଡ଼ିଆ)"}
        ]
    }


@app.post("/api/save-key")
async def save_sarvam_key(req: SaveKeyRequest):
    """Save user's Sarvam API Key dynamically in memory & .env file."""
    key = req.api_key.strip()
    sarvam_client.api_key = key
    tutor_engine.sarvam.api_key = key
    
    # Also persist to .env
    env_path = settings.BASE_DIR / ".env"
    try:
        lines = []
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                lines = [l for l in f.readlines() if not l.startswith("SARVAM_API_KEY=")]
        lines.append(f"SARVAM_API_KEY={key}\n")
        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(lines)
    except Exception as e:
        logger.warning(f"Could not persist to .env: {e}")

    return {
        "success": True,
        "message": "Sarvam API Key updated successfully!",
        "has_key": bool(key)
    }


@app.post("/api/chat")
async def chat_with_tutor(req: ChatRequest):
    """
    Main multimodal endpoint:
    Processes student query and generates:
    - Socratic pedagogical response
    - Bulbul TTS audio base64
    - Avatar gesture & emotion
    - Interactive Whiteboard (KaTeX, Mermaid, Simulation)
    - Adaptive Quiz & Diagnostic Check
    """
    try:
        # Use provided key if sent in request
        client_to_use = tutor_engine
        if req.sarvam_api_key and req.sarvam_api_key != sarvam_client.api_key:
            temp_client = SarvamClient(api_key=req.sarvam_api_key)
            client_to_use = TutorEngine(temp_client)

        lesson = await client_to_use.generate_lesson(
            student_query=req.message,
            persona_key=req.persona,
            language_code=req.language_code,
            history=req.history,
            context_document=req.context_document
        )
        return lesson
    except Exception as e:
        logger.error(f"Chat error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/stt")
async def speech_to_text(
    file: UploadFile = File(...),
    language_code: str = Form("hi-IN"),
    model: str = Form("saaras:v4"),
    sarvam_api_key: Optional[str] = Form(None)
):
    """Transcribe audio recording using Sarvam Saaras model."""
    try:
        audio_bytes = await file.read()
        client = SarvamClient(api_key=sarvam_api_key) if sarvam_api_key else sarvam_client
        res = await client.transcribe_audio(
            audio_bytes=audio_bytes,
            filename=file.filename or "recording.wav",
            language_code=language_code,
            model=model
        )
        return res
    except Exception as e:
        logger.error(f"STT Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tts")
async def text_to_speech(req: TTSRequest):
    """Synthesize voice using Sarvam Bulbul model."""
    try:
        client = SarvamClient(api_key=req.sarvam_api_key) if req.sarvam_api_key else sarvam_client
        res = await client.text_to_speech(
            text=req.text,
            target_language_code=req.target_language_code,
            speaker=req.speaker,
            pace=req.pace
        )
        return res
    except Exception as e:
        logger.error(f"TTS Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/translate")
async def translate_text(req: TranslateRequest):
    """Translate educational text using Sarvam Mayura / Translate."""
    try:
        client = SarvamClient(api_key=req.sarvam_api_key) if req.sarvam_api_key else sarvam_client
        res = await client.translate(
            text=req.text,
            source_language_code=req.source_language_code,
            target_language_code=req.target_language_code
        )
        return res
    except Exception as e:
        logger.error(f"Translate Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    persona: str = Form("priya"),
    language_code: str = Form("hi-IN")
):
    """Upload textbook page, notes, or homework problem for tutor explanation."""
    try:
        filename = file.filename or "document.txt"
        file_path = settings.UPLOADS_DIR / filename
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        # Extract text (supports plain text, markdown, or utf-8 strings)
        text_preview = ""
        try:
            text_preview = content.decode("utf-8", errors="ignore")[:3000]
        except Exception:
            text_preview = f"Uploaded document: {filename}"

        # Generate custom introductory lesson explaining this document
        lesson = await tutor_engine.generate_lesson(
            student_query=f"Please explain this document: {filename}. Summarize key concepts and walk me through step-by-step.",
            persona_key=persona,
            language_code=language_code,
            context_document=text_preview
        )
        lesson["document_filename"] = filename
        lesson["document_preview"] = text_preview[:400]
        return lesson
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Mount static frontend
frontend_dir = settings.FRONTEND_DIR
if frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")

    @app.get("/")
    async def serve_index():
        return FileResponse(frontend_dir / "index.html")
