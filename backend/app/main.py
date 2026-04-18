from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json

app = FastAPI()

# Sabse pehle CORS ensure karein
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    return {"status": "alive"}

@app.websocket("/ws/energy")
async def websocket_endpoint(websocket: WebSocket):
    # Render ke liye origin check bypass
    await websocket.accept()
    print("Dashboard connected")
    try:
        while True:
            # Dummy data pehle test karte hain (agar simulator crash ho raha ho)
            payload = {
                "actual": 1.5,
                "predicted": 1.4,
                "timestamp": "2026-04-18 19:00:00",
                "voltage": 230.5,
                "is_anomaly": False,
                "cost_hour": 0.22
            }
            await websocket.send_json(payload)
            await asyncio.sleep(2)
    except Exception as e:
        print(f"Error: {e}")
