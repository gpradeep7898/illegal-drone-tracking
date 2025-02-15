import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./DroneMap.css";

const DroneMap = () => {
  const [droneData, setDroneData] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    // Fetch initial drone data from backend
    fetch("http://localhost:8000/fetch-drones")
      .then((response) => response.json())
      .then((data) => {
        if (data.drones) {
          setDroneData(data.drones);
        }
      })
      .catch((error) => console.error("❌ Error fetching drone data:", error));

    // Connect WebSocket for real-time updates
    socketRef.current = new WebSocket("ws://localhost:8000/ws");

    socketRef.current.onopen = () => {
      console.log("✅ WebSocket Connected");
      socketRef.current.send(JSON.stringify({ message: "Hello from React!" }));
    };

    socketRef.current.onmessage = (event) => {
      try {
        const updatedData = JSON.parse(event.data);
        if (Array.isArray(updatedData) && updatedData.length > 0) {
          console.log("📡 Live Drone Update:", updatedData);
          setDroneData(updatedData);
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

  // Function to set marker icons dynamically based on velocity
  const getMarkerIcon = (velocity) => {
    return L.icon({
      iconUrl: velocity > 50 ? "/assets/red_marker.png" : "/assets/green_marker.png",
      iconSize: [30, 40],
      iconAnchor: [15, 40],
      popupAnchor: [0, -35],
    });
  };

  return (
    <div className="drone-container">
      <p>Monitoring real-time drone activity & alerts 🛰️</p>

      <MapContainer center={[37.7749, -122.4194]} zoom={3} style={{ height: "600px", width: "90%", margin: "auto" }}>
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

      {/* Live Drone Updates Below the Map */}
      <div className="drone-updates">
        <h3>📊 Live Drone Updates</h3>
        <p>⚡ <strong>Avg Velocity:</strong> {droneData.length > 0 ? (droneData.reduce((sum, drone) => sum + drone.velocity, 0) / droneData.length).toFixed(2) : 0} km/h</p>
        <ul>
          {droneData.map((drone, index) => (
            <li key={index}>
              <strong>🚁 {drone.callsign} ({drone.country})</strong> - Lat: {drone.latitude.toFixed(2)}, Lon: {drone.longitude.toFixed(2)}, Alt: {drone.altitude.toFixed(2)} meters, Vel: {drone.velocity.toFixed(2)} km/h
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DroneMap;