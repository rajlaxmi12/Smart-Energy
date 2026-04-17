import os
import numpy as np
import joblib
from tensorflow.keras.models import load_model

# Get the absolute path to the backend folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'energy_lstm_model.h5')
SCALER_PATH = os.path.join(BASE_DIR, 'models', 'scaler.pkl')

# Fix: Load with compile=False to avoid the 'mse' deserialization error
model = load_model(MODEL_PATH, compile=False)
scaler = joblib.load(SCALER_PATH)

data_buffer = []

def predict_next_hour(current_reading):
    global data_buffer
    
    # Ensure keys match your CSV column names (all lowercase from Phase 1)
    try:
        features = [
            current_reading['global_active_power'],
            current_reading['hour'],
            current_reading['day_of_week'],
            current_reading['is_weekend']
        ]
    except KeyError as e:
        print(f"KeyError: {e} - check your CSV headers!")
        return 0.0

    data_buffer.append(features)
    
    if len(data_buffer) > 24:
        data_buffer.pop(0)
    
    if len(data_buffer) == 24:
        scaled_buffer = scaler.transform(np.array(data_buffer))
        input_seq = np.reshape(scaled_buffer, (1, 24, 4))
        
        prediction_scaled = model.predict(input_seq, verbose=0)
        
        # Inverse Scale
        dummy = np.zeros((1, 4))
        dummy[0, 0] = prediction_scaled[0, 0]
        prediction_final = scaler.inverse_transform(dummy)[0, 0]
        
        return float(prediction_final)
    
    return 0.0