import os
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.simulator import EnergySimulator
from app.model_loader import predict_next_hour

app = FastAPI()

# Robust CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
ELECTRICITY_RATE = 0.15 
ANOMALY_THRESHOLD = 0.25 

# Path handling
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'cleaned_hourly_data.csv')

# Initialize simulator once
sim = EnergySimulator(DATA_PATH)

@app.websocket("/ws/energy")
async def websocket_endpoint(websocket: WebSocket):
    # CRITICAL: Accept connection immediately for Render wss stability
    await websocket.accept()
    print("Dashboard connected via WebSocket")
    
    try:
        while True:
            current_data = sim.get_next_reading()
            
            # Predict
            prediction = predict_next_hour(current_data)
            
            actual_val = float(current_data['global_active_power'])
            pred_val = float(prediction)
            
            # 1. Anomaly Detection
            is_anomaly = False
            if pred_val > 0:
                deviation = abs(actual_val - pred_val) / pred_val
                if deviation > ANOMALY_THRESHOLD:
                    is_anomaly = True

            # 2. Cost Calculation
            cost_estimate = round(actual_val * ELECTRICITY_RATE, 2)

            payload = {
                "actual": actual_val,
                "predicted": pred_val,
                "timestamp": str(current_data['dt']),
                "voltage": float(current_data['voltage']),
                "is_anomaly": is_anomaly,
                "cost_hour": cost_estimate,
                "trend": [pred_val, round(pred_val * 1.02, 2), round(pred_val * 0.97, 2)]
            }
            
            await websocket.send_json(payload)
            # 2 seconds sleep works better on free tier to avoid rate limiting
            await asyncio.sleep(2) 

    except WebSocketDisconnect:
        print("Dashboard disconnected normally")
    except Exception as e:
        print(f"WebSocket Error: {e}")
    finally:
        # Close connection properly if it's still open
        try:
            await websocket.close()
        except:
            pass