import React, { useState, useEffect } from "react";

const DroneValidation = () => {
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchValidationData();
    const interval = setInterval(fetchValidationData, 10000); // 🔄 Updated to refresh every 10 sec
    return () => clearInterval(interval);
  }, []);

  const fetchValidationData = async () => {
    try {
        const response = await fetch("http://127.0.0.1:8000/fetch-drones-live");
        const data = await response.json();

        if (data.validation) {
            setValidationResult(data.validation);
        } else {
            setValidationResult(null);  // Ensure it handles missing validation correctly
        }

        setError(null);
    } catch (err) {
        setError("Error fetching validation results.");
        setValidationResult(null);
    }
};


  return (
    <div className="drone-validation">
      <h2>📊 Drone Data Validation</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {validationResult && (
        <div>
          <p><strong>🚁 Total Drones:</strong> {validationResult.total_drones}</p>
          <p><strong>✅ Authorized:</strong> {validationResult.authorized}</p>
          <p><strong>❌ Unauthorized:</strong> {validationResult.unauthorized}</p>
          <p><strong>❓ Unknown:</strong> {validationResult.unknown}</p>
          <p style={{ color: validationResult.validation_passed ? "green" : "red", fontWeight: "bold" }}>
            {validationResult.validation_passed ? "✔ Validation Passed" : "❌ Validation Failed"}
          </p>
        </div>
      )}
    </div>
  );
};

export default DroneValidation;
