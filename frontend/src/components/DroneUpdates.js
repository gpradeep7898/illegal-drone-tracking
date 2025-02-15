import React, { useState, useEffect } from "react";

const DroneUpdates = () => {
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

    // Connect to WebSocket (NOT using socket.io)
    const socket = new WebSocket("ws://localhost:8000/ws");

    socket.onopen = () => {
      console.log("✅ WebSocket Connected");
      socket.send("Hello from React!");
    };

    socket.onmessage = (event) => {
      console.log("📡 Live Drone Update:", event.data);
    };

    socket.onerror = (error) => {
      console.error("❌ WebSocket Error:", error);
    };

    socket.onclose = () => {
      console.log("❌ WebSocket Disconnected");
    };

    return () => socket.close();
  }, []);

  return (
    <div>
      <h3>Drone Updates</h3>
      <ul>
        {droneData.map((drone, index) => (
          <li key={index}>
            <b>{drone.callsign} ({drone.country})</b> - Lat: {drone.latitude}, Lon: {drone.longitude}, Alt: {drone.altitude} meters, Vel: {drone.velocity} km/h
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DroneUpdates;
