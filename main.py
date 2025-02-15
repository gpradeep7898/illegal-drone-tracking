import os
import time
import smtplib
import requests
import psycopg2
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket
from requests.auth import HTTPBasicAuth
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

app = FastAPI()

# OpenSky API Endpoint
OPENSKY_URL = "https://opensky-network.org/api/states/all"

# Database credentials
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")

# Email credentials
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
ALERT_EMAIL = os.getenv("ALERT_EMAIL")

# CORS Middleware (Allows Frontend to Access API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Function to get DB connection
def get_db_connection():
    return psycopg2.connect(
        dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT
    )

# Function to send email
def send_email(subject, body):
    try:
        message = MIMEMultipart()
        message["From"] = EMAIL_ADDRESS
        message["To"] = ALERT_EMAIL
        message["Subject"] = subject
        message.attach(MIMEText(body, "plain"))

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.sendmail(EMAIL_ADDRESS, ALERT_EMAIL, message.as_string())
        server.quit()
        print(f"✅ Email sent to {ALERT_EMAIL}!")
    except Exception as e:
        print(f"❌ Error sending email: {e}")

# WebSocket Route
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            print(f"📡 Received WebSocket message: {data}")
            await websocket.send_text(f"📡 Acknowledged: {data}")
    except Exception as e:
        print(f"❌ WebSocket Error: {e}")
    finally:
        await websocket.close()

# Fetch Drone Data
@app.get("/fetch-drones")
def fetch_opensky_data():
    print("🔄 Fetching drone data...")
    retries = 3
    for attempt in range(retries):
        try:
            response = requests.get(OPENSKY_URL, auth=HTTPBasicAuth(os.getenv("OPENSKY_USERNAME"), os.getenv("OPENSKY_PASSWORD")), timeout=10)
            if response.status_code == 200:
                data = response.json()
                flights = data.get("states", [])

                structured_flights = []
                conn = get_db_connection()
                cursor = conn.cursor()

                for flight in flights[:10]:  
                    callsign = flight[1].strip() if flight[1] else "Unknown"
                    country = flight[2]
                    latitude = flight[6]
                    longitude = flight[5]
                    altitude = flight[7]
                    velocity = flight[9]

                    print(f"Inserting: {callsign}, {country}, Lat: {latitude}, Lon: {longitude}, Alt: {altitude}, Vel: {velocity}")

                    try:
                        cursor.execute(
                            "INSERT INTO drones (callsign, country, latitude, longitude, altitude, velocity) VALUES (%s, %s, %s, %s, %s, %s)",
                            (callsign, country, latitude, longitude, altitude, velocity)
                        )
                        conn.commit()
                    except Exception as e:
                        print(f"❌ Error Inserting {callsign}: {e}")
                        conn.rollback()

                    structured_flights.append({
                        "callsign": callsign,
                        "country": country,
                        "latitude": latitude,
                        "longitude": longitude,
                        "altitude": altitude,
                        "velocity": velocity
                    })

                cursor.close()
                conn.close()

                # Send email alert
                subject = "New Drone Data Received"
                body = "\n".join([f"Callsign: {flight['callsign']}, Country: {flight['country']}, Lat: {flight['latitude']}, Lon: {flight['longitude']}, Alt: {flight['altitude']}, Vel: {flight['velocity']}" for flight in structured_flights])
                send_email(subject, body)

                return {"drones": structured_flights}

        except requests.exceptions.RequestException as e:
            print(f"❌ API Request Failed: {e}")

    return {"error": "API request failed after multiple retries"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
