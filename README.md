# 🛰️ Illegal Drone Traffic Tracking System

A real-time drone monitoring solution designed to detect unauthorized drones entering restricted airspace using geofencing and live alert notifications.

## 📌 Overview

This capstone project for CS691 (Spring 2025) aims to enhance airspace security by tracking illegal drone activity using real-time data processing, geofencing logic, and live dashboards. Drones entering forbidden areas are automatically identified, visualized, and flagged, triggering email alerts for security teams.

---

## ⚠️ Problem Statement

The growing use of drones for deliveries, surveillance, and recreation has led to increased risks of:

- Illegal surveillance
- Smuggling
- Airspace violations near sensitive infrastructure like airports, military zones, and power plants

Current systems lack efficient **automated** monitoring, relying heavily on manual intervention and reactive responses.

---

## ✅ Key Features

- 🚁 **Real-Time Drone Detection** using ADS-B flight data
- 📍 **Geofencing Validation** to filter out legal drone activity
- 📡 **Live Dashboard** with Leaflet maps to visualize drone paths and behavior
- 🔔 **Automated Alerts** via email for unauthorized drone entries
- 📊 **Visual Analytics** of drone activity using chart components

---

## 🧠 Tech Stack

| Layer       | Technologies Used                            |
|-------------|-----------------------------------------------|
| **Backend** | Python, FastAPI, PostgreSQL (PostGIS), WebSocket |
| **Frontend**| React.js, Leaflet.js, WebSockets              |
| **Data**    | OpenSky Network API (ADS-B Data), RF Signals |
| **Deployment** | Docker, AWS/GCP                          |
| **Styling** | Custom CSS (`DroneMap.css`)                  |

---

## 🛠️ System Architecture

1. **Drone Detection**: Pulls real-time ADS-B data from OpenSky API.
2. **Processing Logic**: Filters out legal drones using geofencing coordinates.
3. **Alerting System**: Sends emails automatically when unauthorized drones are detected.
4. **Dashboard Interface**: Displays drone movements and status on an interactive map.

---

## 🧪 How to Run the Project

### 📦 Backend Setup

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --reload
```
### Frontend Setup
cd frontend
npm install
npm start

###  PostgreSQL + PostGIS Setup
-- Setup example
CREATE DATABASE drone_tracking;
\c drone_tracking
CREATE EXTENSION postgis;

-- Table to store drone logs
CREATE TABLE drone_logs (
    id SERIAL PRIMARY KEY,
    drone_id TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    altitude DOUBLE PRECISION,
    is_authorized BOOLEAN,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
🖥️ UI Components

DroneMap.js: Displays real-time map with tracked drones
DroneUpdates.js: Renders drone activity feed with unauthorized entries marked
DroneMap.css: Custom styles for UI (cards, container, map)
📤 Email Alerts

Uses smtplib to send alerts to designated emails.

Environment Variables (.env):
EMAIL_ADDRESS=your_email@gmail.com
EMAIL_PASSWORD=your_password_or_app_password
ALERT_EMAIL=recipient_email@gmail.com
📬 Contact

Developer: Pradeep Gatti
Email: gpradeep7898@gmail.com
GitHub: github.com/gpradeep7898

📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

Let me know if you'd like a version with badges, contributor credits, or demo video links added.
