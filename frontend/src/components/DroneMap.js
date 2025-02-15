import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const DroneMap = () => {
  const [droneData, setDroneData] = useState([]);

  useEffect(() => {
    // Fetch initial drone data
    fetch("http://localhost:8000/fetch-drones")
      .then((response) => response.json())
      .then((data) => {
        if (data.drones) {
          setDroneData(data.drones);
        }
      })
      .catch((error) => console.error("Error fetching drone data:", error));

    // Connect to WebSocket
    const socket = new WebSocket("ws://localhost:8000/ws");

    socket.onopen = () => {
      console.log("✅ WebSocket Connected");
      socket.send("Hello from React!");
    };

    socket.onmessage = (event) => {
      console.log("📡 Live Drone Update:", event.data);
    };

    return () => socket.close();
  }, []);

  return (
    <MapContainer center={[37.7749, -122.4194]} zoom={5} style={{ height: "600px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {droneData.map((drone, index) =>
        drone.latitude && drone.longitude ? (
          <Marker
            key={index}
            position={[drone.latitude, drone.longitude]}
            icon={L.icon({
              iconUrl: drone.velocity > 50 ? "/assets/red_marker.png" : "/assets/green_marker.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
            })}
          >
            <Popup>
              <strong>Callsign: </strong>{drone.callsign}<br />
              <strong>Country: </strong>{drone.country}<br />
              <strong>Altitude: </strong>{drone.altitude} meters<br />
              <strong>Velocity: </strong>{drone.velocity} km/h
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );
};

export default DroneMap;

