import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()
DL = os.getenv("DIRECT_LINE_ENDPOINT", "https://directline.botframework.com/v3/directline")
SECRET = (os.getenv("DIRECT_LINE_SECRET") or "").strip()

app = FastAPI(title="Copilot Token Proxy")

# CORS abierto para pruebas; luego lo afinamos
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"ok": True, "has_secret": bool(SECRET)}

@app.post("/api/copilot/token")
async def token(userId: str | None = None):
    if not SECRET:
        raise HTTPException(status_code=503, detail="Falta DIRECT_LINE_SECRET en .env")
    payload = {"user": {"id": userId or f"user-{os.getpid()}"}}
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            r = await c.post(
                f"{DL}/tokens/generate",
                headers={"Authorization": f"Bearer {SECRET}"},
                json=payload
            )
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=r.text)
        data = r.json()
        return {"token": data.get("token"), "expires_in": data.get("expires_in")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token error: {e}") from e
