import os
from typing import Optional
import uvicorn
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Belajar Bahasa Arab AI Backend",
    description="Python FastAPI backend untuk interaksi percakapan dan pembelajaran bahasa Arab dengan AI",
    version="1.0.0"
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GARDA_API_URL = os.getenv(
    "GARDA_API_URL", "https://iss-uitjbt.inovasiuitjbt.uk/garda-api/v1/chat/completions"
)
GARDA_AUTH_KEY = os.getenv("GARDA_AUTH_KEY", "sk-garda-30f8204c5747651c99dce89d")
GARDA_MODEL = os.getenv("GARDA_MODEL", "gemma4:e4b")

SYSTEM_PROMPT = """
Anda adalah "Mudarris AI" (مُدَرِّس الذَّكاء الاصطِناعي), guru dan mitra percakapan bahasa Arab interaktif dari Dien Islam.
Panduan:
1. Balas dengan bahasa Arab yang fasih dan selalu berikan HARAKAT LENGKAP (Tasykil).
2. Berikan transliterasi baca latin dan terjemahan bahasa Indonesia.
3. Berikan catatan mufradat (kosakata) atau kaidah nahwu/shorof sederhana bila ada.
4. Berikan rekomendasi 2-3 opsi jawaban yang bisa diucapkan pengguna (Arab berharakat, Latin, dan Terjemahan).
"""

class ChatRequest(BaseModel):
    message: str
    session_id: str = "session-python-001"
    mode: str = "general"
    scenario_prompt: Optional[str] = None
    scenario_name: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    model: str

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "Belajar Bahasa Arab AI (FastAPI)",
        "model": GARDA_MODEL
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat_arabic(payload: ChatRequest):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Pesan tidak boleh kosong")

    system_prompt = SYSTEM_PROMPT.strip()
    if payload.scenario_prompt and payload.scenario_prompt.strip():
        system_prompt += f"\n\nSKENARIO & SUASANA PERCAKAPAN SAAT INI ({payload.scenario_name or 'Kustom'}):\n{payload.scenario_prompt.strip()}\nSesuaikan kosakata dan gaya bahasa percakapan Mudarris AI dengan situasi di atas. Tetap berikan teks Arab berharakat lengkap, transliterasi Latin, arti Indonesia, dan rekomendasi pilihan jawaban pengguna."

    upstream_body = {
        "session_id": payload.session_id,
        "model": GARDA_MODEL,
        "message": payload.message,
        "system_prompt": system_prompt
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": GARDA_AUTH_KEY
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(GARDA_API_URL, json=upstream_body, headers=headers)
            if res.status_code == 200:
                data = res.json()
                return ChatResponse(
                    response=data.get("response", "مَرْحَبًا بِكَ"),
                    session_id=payload.session_id,
                    model=data.get("model", GARDA_MODEL)
                )
            else:
                return ChatResponse(
                    response="عَفْوًا، حَدَثَ خَطَأٌ فِي خَادِمِ الذَّكَاءِ الِاصْطِنَاعِيّ. يُرْجَى إِعَادَةُ الْمُحَاوَلَةِ.",
                    session_id=payload.session_id,
                    model=GARDA_MODEL
                )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

class TranslateRequest(BaseModel):
    text: str
    direction: str = "id-ar"
    session_id: str = "translate-py-001"

@app.post("/api/translate")
async def translate_arabic(payload: TranslateRequest):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Teks terjemahan tidak boleh kosong")

    is_id_to_ar = payload.direction == "id-ar"
    system_prompt = (
        "Anda adalah Penerjemah Dwibahasa Indonesia - Arab profesional. "
        "WAJIB berikan: 1. 'arabic' (teks Arab berharakat LENGKAP / tasykil), "
        "2. 'latin' (transliterasi ejaan latin presisi), "
        "3. 'indonesian' (terjemahan bahasa Indonesia), "
        "4. 'notes' (penjelasan ringkas kosakata atau kaidah). "
        "Balas HANYA JSON: {\"arabic\":\"...\",\"latin\":\"...\",\"indonesian\":\"...\",\"notes\":\"...\"}"
    )

    user_msg = (
        f"Terjemahkan ke bahasa Arab berharakat dan Latin: {payload.text.strip()}"
        if is_id_to_ar
        else f"Terjemahkan ke bahasa Indonesia dengan harakat dan Latin: {payload.text.strip()}"
    )

    upstream_body = {
        "session_id": payload.session_id,
        "model": GARDA_MODEL,
        "message": user_msg,
        "system_prompt": system_prompt
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": GARDA_AUTH_KEY
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(GARDA_API_URL, json=upstream_body, headers=headers)
            if res.status_code == 200:
                data = res.json()
                raw_text = data.get("response", "{}")
                clean = raw_text.strip()
                if clean.startswith("```"):
                    clean = clean.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                import json
                try:
                    parsed = json.loads(clean)
                    return parsed
                except Exception:
                    return {
                        "arabic": payload.text if not is_id_to_ar else raw_text,
                        "latin": "",
                        "indonesian": payload.text if is_id_to_ar else raw_text,
                        "notes": ""
                    }
            else:
                raise HTTPException(status_code=res.status_code, detail="Garda API error")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8001, reload=True)
