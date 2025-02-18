import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./DroneMap.css";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { fetchDroneUpdates } from "./DroneUpdates";

const DroneMap = () => {
  const [droneData, setDroneData] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:8000/fetch-drones")
      .then((response) => response.json())
      .then((data) => {
        if (data.drones) {
          const correctedData = data.drones.map(drone => ({
            callsign: drone.callsign ?? "Unknown",
            latitude: drone.latitude ?? 0,
            longitude: drone.longitude ?? 0,
            altitude: drone.altitude ?? 0,
            velocity: drone.velocity ?? 0,
            timestamp: drone.timestamp ? 
              (drone.timestamp < 10000000000 ? drone.timestamp * 1000 : drone.timestamp) 
              : Date.now(),
          }));
          setDroneData(correctedData);
        }
      })
      .catch((error) => console.error("❌ Error fetching drone data:", error));

    socketRef.current = new WebSocket("ws://localhost:8000/ws");
    socketRef.current.onopen = () => {
      console.log("✅ WebSocket Connected");
      socketRef.current.send(JSON.stringify({ message: "Hello from React!" }));
    };

    socketRef.current.onmessage = (event) => {
        try {
          const updatedData = JSON.parse(event.data);
          console.log("📡 WebSocket Drone Data:", updatedData);  // Debugging logs
      
          if (Array.isArray(updatedData) && updatedData.length > 0) {
            const correctedData = updatedData.map(drone => ({
              callsign: drone.callsign ?? "Unknown",
              latitude: drone.latitude ?? 0,
              longitude: drone.longitude ?? 0,
              altitude: drone.altitude ?? 0,
              velocity: drone.velocity ?? 0,
              country: drone.country ?? "N/A",  // Ensure country exists
              timestamp: drone.timestamp 
                ? (drone.timestamp < 10000000000 ? drone.timestamp * 1000 : drone.timestamp) 
                : Date.now(),
            }));
      
            setDroneData(correctedData);
          } else {
            console.warn("⚠️ Unexpected WebSocket Data:", updatedData);
          }
        } catch (error) {
          console.error("❌ Error parsing WebSocket data:", event.data);
        }
    };      

    socketRef.current.onclose = () => {
      console.warn("⚠️ WebSocket Disconnected");
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const getMarkerIcon = (velocity) => {
    return L.icon({
      iconUrl: velocity > 50 ? "/assets/red_marker.png" : "/assets/green_marker.png",
      iconSize: [30, 40],
      iconAnchor: [15, 40],
      popupAnchor: [0, -35],
    });
  };

  return (
    <div>

        {/* Page Header */}
        <div className="header">
        Tracking Unauthorized Drone Activity in Real-Time 🛰️
        </div>

        {/* Main Container */}
        <div className="container">

            {/* Map Section */}
            <div className="map-container">
                <MapContainer center={[37.7749, -122.4194]} zoom={3} style={{ height: "100%", width: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {droneData.map((drone, index) =>
                        drone.latitude && drone.longitude ? (
                            <Marker key={index} position={[drone.latitude, drone.longitude]} icon={getMarkerIcon(drone.velocity)}>
                                <Popup>
                                    <strong>🚁 Callsign: </strong>{drone.callsign}<br />
                                    <strong>🌍 Country: </strong>{drone.country}<br />
                                    <strong>📍 Altitude: </strong>{drone.altitude.toFixed(2)} meters<br />
                                    <strong>💨 Velocity: </strong>{drone.velocity.toFixed(2)} km/h
                                </Popup>
                            </Marker>
                        ) : null
                    )}
                </MapContainer>
            </div>

            {/* Live Drone Updates */}
            <div className="drone-updates">
                <h3>📊 Live Drone Updates</h3>
                <p>⚡ <strong>Avg Velocity:</strong> {droneData.length > 0 ? 
                    (droneData.reduce((sum, drone) => sum + drone.velocity, 0) / droneData.length).toFixed(2) 
                    : 0} km/h</p>
                <ul>
                    {droneData.map((drone, index) => (
                        <li key={index}>
                            <strong>🚁 {drone.callsign} ({drone.country})</strong> - 
                            Lat: {drone.latitude.toFixed(2)}, Lon: {drone.longitude.toFixed(2)}, 
                            Alt: {drone.altitude.toFixed(2)} meters, Vel: {drone.velocity.toFixed(2)} km/h
                        </li>
                    ))}
                </ul>
            </div>

            {/* Drone Speed & Altitude Trends */}
            <div className="chart-container">
                <h2>Drone Speed & Altitude Trends</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={droneData}>
                        <XAxis dataKey="timestamp" tickFormatter={(tick) => new Date(Number(tick)).toLocaleTimeString()} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="speed" stroke="#8884d8" name="Speed (km/h)" dot={false} />
                        <Line type="monotone" dataKey="altitude" stroke="#82ca9d" name="Altitude (m)" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

        </div>
    </div>
);
};

export default DroneMap;
