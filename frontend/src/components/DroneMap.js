import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./DroneMap.css";
import { FaTachometerAlt, FaExclamationTriangle, FaCog, FaEye, FaClock } from "react-icons/fa";

import redMarkerIcon from "../assets/red_marker.png";
import greenMarkerIcon from "../assets/green_marker.png";
import airportIconImg from "../assets/airport.png";
import militaryIconImg from "../assets/military.jpg";
import governmentIconImg from "../assets/government.jpg";

const DroneMap = () => {
    const [droneData, setDroneData] = useState([]);
    const [restrictedZones, setRestrictedZones] = useState([]);
    const [showLiveDetections, setShowLiveDetections] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [lastUpdated, setLastUpdated] = useState("");

    const socketRef = useRef(null);
    const handleToggleDetections = () => {
      setShowLiveDetections(!showLiveDetections);
  };
    useEffect(() => {
        const fetchDroneData = async () => {
            try {
                const response = await fetch("http://127.0.0.1:8000/fetch-drones-live");
                const data = await response.json();
                setDroneData(data.drones || []);
                setLastUpdated(new Date().toLocaleTimeString()); // ✅ Store last update time
            } catch (error) {
                console.error("Error fetching drone data:", error);
                setDroneData([]);
            }
        };

        const fetchRestrictedZones = async () => {
            try {
                const response = await fetch("http://127.0.0.1:8000/restricted-zones");
                const data = await response.json();
                setRestrictedZones(data.restricted_zones || []);
            } catch (error) {
                console.error("Error fetching restricted zones:", error);
                setRestrictedZones([]);
            }
        };

        fetchDroneData();
        fetchRestrictedZones();

        socketRef.current = new WebSocket("ws://localhost:8000/ws");

        socketRef.current.onopen = () => console.log("✅ WebSocket Connected");

        socketRef.current.onmessage = (event) => {
            try {
                const receivedData = JSON.parse(event.data);
                if (receivedData.drones && Array.isArray(receivedData.drones)) {
                    setDroneData(receivedData.drones);
                    setLastUpdated(new Date().toLocaleTimeString()); // ✅ Update last detected time
                } else {
                    console.warn("⚠️ Unexpected WebSocket Data Format:", receivedData);
                }
            } catch (error) {
                console.error("❌ WebSocket Error Parsing Data:", event.data);
            }
        };

        socketRef.current.onerror = (error) => console.error("❌ WebSocket Error:", error);

        socketRef.current.onclose = () => {
            console.warn("⚠️ WebSocket Disconnected. Reconnecting...");
            setTimeout(() => {
                socketRef.current = new WebSocket("ws://localhost:8000/ws");
            }, 10000);
        };

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);

    const getZoneIcon = (zoneType) => {
        let iconImage;
        if (zoneType.includes("Airport")) iconImage = airportIconImg;
        else if (zoneType.includes("Base") || zoneType.includes("Fort")) iconImage = militaryIconImg;
        else iconImage = governmentIconImg;

        return L.icon({
            iconUrl: iconImage,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -35],
        });
    };

    const getMarkerIcon = (drone) => {
        return L.icon({
            iconUrl: drone.unauthorized ? redMarkerIcon : greenMarkerIcon,
            iconSize: [30, 40],
            iconAnchor: [15, 40],
            popupAnchor: [0, -35]
        });
    };

    return (
        <div className="drone-dashboard">
            {/* 🚀 Navigation Bar */}
            <nav className="navbar">
                <h1 className="logo">🚁 Illegal Drone Tracking System</h1>
                <div className="nav-links">
                    <button className="nav-button" onClick={handleToggleDetections}>
                        <FaEye /> Live Detections
                    </button>
                </div>
            </nav>

            {/* 🗺️ Full-Width Map */}
            <div className="map-container">
            <MapContainer  center={[37.7749, -99.4194]}  // Adjusted to focus on broader US view
                    zoom={4}  // Adjusted zoom to fit the whole region
                    style={{ height: "600px", width: "100%" }}  // Increased height
                >

                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {/* ✅ Display Restricted Zones */}
                    {restrictedZones.map((zone, index) => (
                        <Marker key={index} position={[zone.latitude, zone.longitude]} icon={getZoneIcon(zone.name)}>
                            <Popup>
                                ⚠️ <strong>{zone.name}</strong>
                                <br /> Restricted Zone - Radius: {zone.radius} km
                            </Popup>
                        </Marker>
                    ))}

                    {/* ✅ Display Drones */}
                    {droneData.map((drone, index) => (
                        <Marker key={index} position={[drone.latitude, drone.longitude]} icon={getMarkerIcon(drone)}>
                            <Popup>
                                🚁 <strong>{drone.callsign || "Unknown"}</strong>
                                <br />🌍 {drone.latitude.toFixed(2)}, {drone.longitude.toFixed(2)}
                                <br />📍 Altitude: {drone.altitude.toFixed(2)} meters
                                <br />💨 Velocity: {drone.velocity.toFixed(2)} km/h
                                <br />🔴 Restricted Area: {drone.unauthorized ? "YES 🚨" : "NO ✅"}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* 📡 Live Detections Modal */}
            {showLiveDetections && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-button" onClick={() => setShowLiveDetections(false)}>×</span>
                        <h2>📡 Live Drone Detections</h2>
                        <p><FaClock /> Last Updated: {lastUpdated}</p>
                        <div className="stats-container">
                            <div className="stats-card">
                                <h3>🚀 Total Drones</h3>
                                <p>{droneData.length}</p>
                            </div>
                            <div className="stats-card unauthorized">
                                <h3>⚠️ Unauthorized Drones</h3>
                                <p>{droneData.filter(d => d.unauthorized).length}</p>
                            </div>
                        </div>
                        <ul>
                            {droneData.map((drone, index) => (
                                <li key={index} className={drone.unauthorized ? "unauthorized-drone" : "authorized-drone"}>
                                    🚁 <strong>{drone.callsign || "Unknown"}</strong> - Lat: {drone.latitude?.toFixed(2) || "N/A"}, 
                                    Lon: {drone.longitude?.toFixed(2) || "N/A"}, Alt: {drone.altitude?.toFixed(2) || "N/A"} m, 
                                    Vel: {drone.velocity?.toFixed(2) || "N/A"} km/h
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DroneMap;
