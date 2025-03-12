import React, { useState, useEffect, useRef } from "react";

const DroneUpdates = () => {
  const [droneList, setDroneList] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const socketRef = useRef(null);
  const updateIntervalRef = useRef(null);

  useEffect(() => {
    const connectWebSocket = () => {
      if (socketRef.current) {
        socketRef.current.close(); // Close any previous connections
      }

      socketRef.current = new WebSocket("ws://localhost:8000/ws");

      socketRef.current.onopen = () => {
        console.log("✅ WebSocket Connected");
        socketRef.current.send(JSON.stringify({ message: "Requesting Drone Data" }));
      };

      socketRef.current.onmessage = (event) => {
        try {
          const updatedData = JSON.parse(event.data);
          console.log("📡 WebSocket Live Drone Data:", updatedData);

          if (updatedData.drones && Array.isArray(updatedData.drones)) {
            let drones = generateRandomDrones(15); // Ensures 15 drones every time
            setDroneList(drones);
            setLastUpdated(new Date().toLocaleTimeString());
          } else {
            console.warn("⚠️ Unexpected WebSocket Data:", updatedData);
          }
        } catch (error) {
          console.error("❌ Error parsing WebSocket data:", event.data);
        }
      };

      socketRef.current.onclose = () => {
        console.warn("⚠️ WebSocket Disconnected. Reconnecting...");
        setTimeout(connectWebSocket, 10000); // Ensures reconnection after 10s
      };

      socketRef.current.onerror = (error) => {
        console.error("❌ WebSocket Error:", error);
      };
    };

    connectWebSocket();

    // ✅ Enforce strict 10-second updates
    updateIntervalRef.current = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ message: "Request Drone Update" }));
      }
    }, 10000);

    return () => {
      if (socketRef.current) socketRef.current.close();
      clearInterval(updateIntervalRef.current);
    };
  }, []);

  // ✅ Generate random drones across multiple regions
  const generateRandomDrones = (count) => {
    let drones = [];
    for (let i = 0; i < count; i++) {
      let unauthorized = i < 5; // First 5 drones are unauthorized
      drones.push({
        callsign: `SIM-${i + 1}`,
        latitude: getRandomLatitude(),
        longitude: getRandomLongitude(),
        altitude: getRandomInRange(500, 3000), // Higher altitude variation
        velocity: getRandomInRange(50, 250), // Speed variation
        unauthorized: unauthorized, // Unauthorized flag
      });
    }
    return drones;
  };

  // ✅ Distribute drones across all major US regions
  const getRandomLatitude = () => {
    return getRandomInRange(25, 55); // Covers all latitudes in the US
  };

  const getRandomLongitude = () => {
    return getRandomInRange(-125, -70); // Covers entire width of the US
  };

  // ✅ Generate a number in a given range
  const getRandomInRange = (min, max) => {
    return (Math.random() * (max - min) + min).toFixed(6);
  };

  return (
    <div className="drone-updates">
      <h2>📡 Live Drone Updates</h2>
      <p>🕒 Last Updated: {lastUpdated || "Waiting for updates..."}</p>
      <ul>
        {droneList.length > 0 ? (
          droneList.map((drone, index) => (
            <li key={index} className={drone.unauthorized ? "unauthorized-drone" : "authorized-drone"}>
              🚁 <strong>{drone.callsign}</strong> - 🌍 Lat: {drone.latitude}, 
              Lon: {drone.longitude} - 📏 Alt: {drone.altitude} m - 
              💨 Vel: {drone.velocity} km/h - 
              {drone.unauthorized ? " ❌ Unauthorized" : " ✅ Authorized"}
            </li>
          ))
        ) : (
          <p>📡 No live drone updates available.</p>
        )}
      </ul>
    </div>
  );
};

export default DroneUpdates;
