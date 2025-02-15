import React from 'react';
import DroneMap from './DroneMap';
import DroneUpdates from './DroneUpdates';

const App = () => {
  return (
    <div>
      <h1>Illegal Drone Traffic Tracking</h1>
      <DroneMap />
      <DroneUpdates />
    </div>
  );
};

export default App;
