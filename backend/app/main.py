from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import random # Random import kiya fluctuation ke liye
from datetime import datetime

app = FastAPI()

# CORS Middleware
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
    await websocket.accept()
    print("Dashboard connected")
    try:
        while True:
            # Random Variation Logic (Option 1)
            actual_usage = round(random.uniform(1.2, 1.9), 2)  # 1.2 se 1.9 kW ke beech variation
            predicted_usage = 1.45 # Constant forecast line
            voltage_val = round(random.uniform(229.0, 231.5), 1) # Normal voltage fluctuations
            
            # 5% chance ki anomaly detect ho (Red alert test karne ke liye)
            is_anomaly = random.random() > 0.95 
            if is_anomaly:
                actual_usage = round(random.uniform(2.5, 3.5), 2) # Spike value
            
            payload = {
                "actual": actual_usage,
                "predicted": predicted_usage,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "voltage": voltage_val,
                "is_anomaly": is_anomaly,
                "cost_hour": round(actual_usage * 0.15, 2) # Usage ke hisaab se cost
            }
            
            await websocket.send_json(payload)
            await asyncio.sleep(2) # Har 2 second mein naya data
            
    except WebSocketDisconnect:
        print("Dashboard disconnected")
    except Exception as e:
        print(f"Error: {e}")
