import os
import time
import smtplib
import requests
import psycopg2
import uvicorn
import json
import asyncio
import logging
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from requests.auth import HTTPBasicAuth
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi.middleware.cors import CORSMiddleware
from math import radians, cos, sin, sqrt, atan2
import random
from pydantic import BaseModel
from typing import List

# ✅ Load environment variables
load_dotenv()

# ✅ Configure logging
logging.basicConfig(filename="drone_tracking.log", level=logging.INFO, 
                    format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI()

# ✅ OpenSky API URL
OPENSKY_URL = "https://opensky-network.org/api/states/all"

# ✅ Database & Email Configs from .env
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
ALERT_EMAIL = os.getenv("ALERT_EMAIL")

# ✅ Allow CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Restricted Zones
RESTRICTED_ZONES = [
    # Major Airports
    {"name": "JFK Airport", "latitude": 40.6413, "longitude": -73.7781, "radius": 10},
    {"name": "Los Angeles Airport", "latitude": 33.9416, "longitude": -118.4085, "radius": 10},
    {"name": "Hartsfield-Jackson Atlanta Airport", "latitude": 33.6407, "longitude": -84.4277, "radius": 10},
    {"name": "Denver International Airport", "latitude": 39.8561, "longitude": -104.6737, "radius": 10},
    {"name": "Chicago O'Hare Airport", "latitude": 41.9742, "longitude": -87.9073, "radius": 10},
    {"name": "Dallas/Fort Worth Airport", "latitude": 32.8998, "longitude": -97.0403, "radius": 10},
    {"name": "Miami International Airport", "latitude": 25.7959, "longitude": -80.2870, "radius": 10},
    {"name": "San Francisco International Airport", "latitude": 37.6213, "longitude": -122.3790, "radius": 10},
    {"name": "Seattle-Tacoma International Airport", "latitude": 47.4502, "longitude": -122.3088, "radius": 10},
    {"name": "Orlando International Airport", "latitude": 28.4312, "longitude": -81.3081, "radius": 10},

    # Military Bases
    {"name": "Pentagon", "latitude": 38.8719, "longitude": -77.0563, "radius": 5},
    {"name": "Fort Bragg", "latitude": 35.1401, "longitude": -79.0060, "radius": 10},
    {"name": "Edwards Air Force Base", "latitude": 34.9054, "longitude": -117.8844, "radius": 15},
    {"name": "Wright-Patterson Air Force Base", "latitude": 39.8149, "longitude": -84.0497, "radius": 10},
    {"name": "Norfolk Naval Base", "latitude": 36.9460, "longitude": -76.3087, "radius": 10},

    # Government Restricted Locations
    {"name": "White House", "latitude": 38.8977, "longitude": -77.0365, "radius": 3},
    {"name": "Area 51", "latitude": 37.2431, "longitude": -115.7930, "radius": 15},
    {"name": "Cheyenne Mountain Complex", "latitude": 38.6766, "longitude": -104.7887, "radius": 8},
    {"name": "Los Alamos National Lab", "latitude": 35.8440, "longitude": -106.2857, "radius": 8},
    {"name": "Groom Lake Facility (CIA)", "latitude": 37.2491, "longitude": -115.8001, "radius": 12},
]

# ✅ Database Connection
def get_db_connection():
    return psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT)

# ✅ Haversine formula to check if a drone is in a restricted area
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Radius of Earth in km
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * R * atan2(sqrt(a), sqrt(1 - a))

# ✅ Check if drone is in a restricted zone
def is_unauthorized_flight(latitude, longitude):
    for zone in RESTRICTED_ZONES:
        distance = haversine(latitude, longitude, zone["latitude"], zone["longitude"])
        if distance <= zone["radius"]:
            return True, zone["name"]
    return False, None

# ✅ Validate Drone Data
def validate_drone_counts(drone_data):
    total_drones = len(drone_data)
    authorized_count = 0
    unauthorized_count = 0
    unknown_count = 0

    for drone in drone_data:
        if "unauthorized" in drone:
            if drone["unauthorized"]:
                unauthorized_count += 1
            else:
                authorized_count += 1
        else:
            unknown_count += 1  

    calculated_total = authorized_count + unauthorized_count + unknown_count
    validation_status = calculated_total == total_drones

    return {
        "total_drones": total_drones,
        "authorized": authorized_count,
        "unauthorized": unauthorized_count,
        "unknown": unknown_count,
        "validation_passed": validation_status
    }

# ✅ Fetch Live Drone Data
@app.get("/fetch-drones-live")
def fetch_opensky_data():
    try:
        response = requests.get(OPENSKY_URL, timeout=10)

        if response.status_code == 200:
            data = response.json()
            flights = data.get("states", [])
        else:
            flights = []

    except requests.exceptions.RequestException:
        logging.error("❌ OpenSky API is unreachable. Using simulated data.")
        flights = []

    simulated_flights = [
        {"callsign": f"SIM-{i+1}", "latitude": 40.0 + random.uniform(-1, 1), 
         "longitude": -74.0 + random.uniform(-1, 1), "altitude": random.randint(500, 2000), 
         "velocity": random.uniform(50, 300), "unauthorized": random.choice([True, False])}
        for i in range(5)
    ]

    structured_flights = simulated_flights if not flights else [
        {
            "callsign": flight[1].strip() if flight[1] else "Unknown",
            "latitude": flight[6] or 0.0,
            "longitude": flight[5] or 0.0,
            "altitude": flight[7] or 0.0,
            "velocity": flight[9] or 0.0,
            "unauthorized": is_unauthorized_flight(flight[6], flight[5])[0]
        }
        for flight in flights[:20]
    ]

    validation_result = validate_drone_counts(structured_flights)

    return {"drones": structured_flights, "validation": validation_result}

# ✅ WebSocket Streaming for Real-Time Data
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            drones = fetch_opensky_data()
            await websocket.send_text(json.dumps(drones))
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        logging.info("⚠️ WebSocket Disconnected.")
    finally:
        await websocket.close()

# ✅ Get Restricted Zones
@app.get("/restricted-zones")
def get_restricted_zones():
    return {"restricted_zones": RESTRICTED_ZONES}

# ✅ Force a Test Drone
@app.post("/force-drone")
def force_custom_drone(latitude: float = Query(...), longitude: float = Query(...)):
    unauthorized, zone_name = is_unauthorized_flight(latitude, longitude)
    return {
        "callsign": "TEST-DRONE",
        "latitude": latitude,
        "longitude": longitude,
        "unauthorized": unauthorized,
        "zone": zone_name if unauthorized else "None"
    }

# ✅ Validate Drone Data Manually
@app.post("/validate-drones")
def validate_drones(drone_data: List[dict]):
    return validate_drone_counts(drone_data)

# ✅ Home Route
@app.get("/")
def home():
    return {"message": "🚁 Illegal Drone Tracking API with WebSocket running at ws://localhost:8000/ws"}

# ✅ Run FastAPI Server
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)