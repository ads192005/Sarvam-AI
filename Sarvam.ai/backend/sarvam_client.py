import json
import logging
import base64
from typing import Optional, Dict, Any, List
import httpx
from backend.config import settings

logger = logging.getLogger("sarvam_client")
logging.basicConfig(level=logging.INFO)

class SarvamClient:
    """
    Production-grade client for Sarvam AI APIs:
    - Saaras STT (Speech to Text)
    - Bulbul TTS (Text to Speech)
    - Sarvam-105B LLM (Chat Completions)
    - Mayura / Sarvam-Translate (Translation)
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.SARVAM_API_KEY
        self.base_url = settings.SARVAM_BASE_URL.rstrip("/")
        self.timeout = 60.0

    @property
    def has_api_key(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    def _get_headers(self, is_json: bool = True) -> Dict[str, str]:
        headers = {
            "api-subscription-key": self.api_key,
        }
        if is_json:
            headers["Content-Type"] = "application/json"
        return headers

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        filename: str = "input.wav",
        language_code: str = "hi-IN",
        model: str = "saaras:v4",
    ) -> Dict[str, Any]:
        """
        Transcribe speech using Sarvam Saaras model.
        """
        if not self.has_api_key:
            logger.info("Using mock STT because SARVAM_API_KEY is not configured.")
            return {
                "transcript": "नमस्ते टीचर, कृपया मुझे प्रोजेक्टाइल मोशन और न्यूटन के नियम समझाइए।",
                "language_code": language_code,
                "is_mock": True,
            }

        url = f"{self.base_url}/speech-to-text"
        headers = self._get_headers(is_json=False)

        # Prepare multipart/form-data
        files = {
            "file": (filename, audio_bytes, "audio/wav")
        }
        data = {
            "model": model,
            "language_code": language_code
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(url, headers=headers, files=files, data=data)
                response.raise_for_status()
                res_data = response.json()
                return {
                    "transcript": res_data.get("transcript", ""),
                    "language_code": res_data.get("language_code", language_code),
                    "is_mock": False,
                }
            except httpx.HTTPStatusError as e:
                logger.error(f"Sarvam STT HTTP error: {e.response.status_code} - {e.response.text}")
                raise RuntimeError(f"Sarvam STT failed: {e.response.text}")
            except Exception as e:
                logger.error(f"Sarvam STT error: {str(e)}")
                raise

    async def text_to_speech(
        self,
        text: str,
        target_language_code: str = "hi-IN",
        speaker: str = "meera",
        pitch: float = 0.0,
        pace: float = 1.0,
        loudness: float = 1.5,
        speech_sample_rate: int = 22050,
        model: str = "bulbul:v1",
    ) -> Dict[str, Any]:
        """
        Synthesize natural Indic voice using Sarvam Bulbul model.
        """
        if not self.has_api_key:
            logger.info("Using mock TTS because SARVAM_API_KEY is not configured.")
            return {
                "audio_base64": None,
                "format": "wav",
                "is_mock": True,
                "text": text,
                "target_language_code": target_language_code,
                "speaker": speaker
            }

        url = f"{self.base_url}/text-to-speech"
        headers = self._get_headers(is_json=True)

        # Limit text length per chunk if needed (Bulbul max ~2500 chars)
        clean_text = text.strip()[:2400]

        payload = {
            "inputs": [clean_text],
            "target_language_code": target_language_code,
            "speaker": speaker,
            "pitch": pitch,
            "pace": pace,
            "loudness": loudness,
            "speech_sample_rate": speech_sample_rate,
            "enable_preprocessing": True,
            "model": model
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                audios = data.get("audios", [])
                audio_b64 = audios[0] if audios else None
                return {
                    "audio_base64": audio_b64,
                    "format": "wav",
                    "is_mock": False,
                    "target_language_code": target_language_code,
                    "speaker": speaker
                }
            except httpx.HTTPStatusError as e:
                logger.error(f"Sarvam TTS HTTP error: {e.response.status_code} - {e.response.text}")
                raise RuntimeError(f"Sarvam TTS failed: {e.response.text}")
            except Exception as e:
                logger.error(f"Sarvam TTS connection error: {str(e)}")
                raise

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "sarvam-105b",
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> Dict[str, Any]:
        """
        Call Sarvam-105B Indic LLM for reasoning and tutoring.
        """
        if not self.has_api_key:
            logger.info("Using mock Chat because SARVAM_API_KEY is not configured.")
            return {
                "content": None,
                "is_mock": True
            }

        url = f"{self.base_url}/v1/chat/completions"
        headers = self._get_headers(is_json=True)

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return {
                    "content": content,
                    "is_mock": False
                }
            except httpx.HTTPStatusError as e:
                logger.error(f"Sarvam Chat HTTP error: {e.response.status_code} - {e.response.text}")
                raise RuntimeError(f"Sarvam Chat failed: {e.response.text}")
            except Exception as e:
                logger.error(f"Sarvam Chat connection error: {str(e)}")
                raise

    async def translate(
        self,
        text: str,
        source_language_code: str = "auto",
        target_language_code: str = "hi-IN",
        model: str = "sarvam-translate:v1",
        mode: str = "formal"
    ) -> Dict[str, Any]:
        """
        Translate educational content across Indian languages.
        """
        if not self.has_api_key:
            return {
                "translated_text": f"[Translated to {target_language_code}]: {text}",
                "is_mock": True
            }

        url = f"{self.base_url}/translate"
        headers = self._get_headers(is_json=True)

        payload = {
            "input": text[:2000],
            "source_language_code": source_language_code,
            "target_language_code": target_language_code,
            "model": model,
            "mode": mode,
            "enable_preprocessing": True
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                return {
                    "translated_text": data.get("translated_text", text),
                    "is_mock": False
                }
            except Exception as e:
                logger.error(f"Sarvam Translate error: {str(e)}")
                return {"translated_text": text, "error": str(e), "is_mock": True}
