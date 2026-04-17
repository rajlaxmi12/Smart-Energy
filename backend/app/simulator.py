import pandas as pd
import time
import json

class EnergySimulator:
    def __init__(self, file_path):
        self.df = pd.read_csv(file_path)
        self.current_row = 0

    def get_next_reading(self):
        if self.current_row >= len(self.df):
            self.current_row = 0  # Loop back to start
        
        reading = self.df.iloc[self.current_row].to_dict()
        self.current_row += 1
        return reading