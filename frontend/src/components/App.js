import React from "react";
import DroneMap from "./DroneMap";
import DroneUpdates from "./DroneUpdates"; 
import DroneValidation from "./DroneValidation";

const App = () => {
  return (
    <div>
      <h1>🚁 Illegal Drone Tracking System</h1>
      <DroneMap />
      <DroneUpdates /> {/* ✅ Now included in the app */}
      <DroneValidation />
    </div>
  );
};

export default App;
