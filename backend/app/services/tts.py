"""ElevenLabs Multilingual Text-to-Speech service for AgriEdge."""

import logging
import os
import httpx
from app.config import get_settings

logger = logging.getLogger(__name__)

# Standard natural voice IDs in ElevenLabs
# Rachel: 21m00Tcm4TlvDq8ikWAM (Clear, highly intelligible for Indian languages)
DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"
ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"


class ElevenLabsTTSService:
    """Handles text-to-speech requests via ElevenLabs Multilingual V2 API."""

    def __init__(self, api_key: str | None = None):
        settings = get_settings()
        self.api_key = api_key or settings.elevenlabs_api_key or os.getenv("ELEVENLABS_API_KEY", "")

    async def generate_speech(
        self,
        text: str,
        voice_id: str | None = None,
        language: str = "hi",
        api_key_override: str | None = None,
    ) -> bytes | None:
        key = api_key_override or self.api_key
        if not key:
            logger.info("ElevenLabs API key not configured, returning None for client fallback.")
            return None

        target_voice = voice_id or DEFAULT_VOICE_ID
        url = ELEVENLABS_TTS_URL.format(voice_id=target_voice)

        headers = {
            "xi-api-key": key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }

        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.8,
                "style": 0.1,
                "use_speaker_boost": True,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code == 200:
                    return response.content
                else:
                    logger.error(f"ElevenLabs TTS failed: {response.status_code} - {response.text}")
                    return None
        except Exception as e:
            logger.error(f"Error connecting to ElevenLabs API: {e}")
            return None
