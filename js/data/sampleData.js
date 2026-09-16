/**
 * FloodGuard Realistic Sample Data & Historical Readings
 * Used for initial state and 24-hour visualization baseline.
 */

const SAMPLE_DATA = {
  // Baseline initial reading as specified:
  // Water Level: 1.42 m, Status: WARNING, Device: Online, Sensor: Connected, Station: FLOOD-001
  currentReading: {
    stationId: "FLOOD-001",
    waterLevel: 1.42,
    unit: "m",
    timestamp: new Date().toISOString(),
    deviceOnline: true,
    sensorConnected: true,
    signalStrength: -62, // dBm (Good Wi-Fi)
    batteryVoltage: 3.31, // Volts
    mcuUptimeSeconds: 142890,
    freeHeapBytes: 42180,
    rateOfRise: 0.18 // m in last 10 minutes
  },

  // 24-hour historical readings: 24 data points representing the last 24 hours
  generate24hHistory: function () {
    const now = new Date();
    const history = [];
    
    // Baseline realistic 24-hour water level curve (gradual rise, afternoon peak, moderate evening)
    const curvePoints = [
      0.68, 0.65, 0.64, 0.66, 0.72, 0.81, 
      0.92, 1.05, 1.18, 1.29, 1.38, 1.52, 
      1.67, 1.78, 1.74, 1.62, 1.54, 1.48, 
      1.45, 1.40, 1.36, 1.38, 1.40, 1.42
    ];

    for (let i = 23; i >= 0; i--) {
      const pointTime = new Date(now.getTime() - i * 60 * 60 * 1000);
      const level = curvePoints[23 - i];
      history.push({
        timestamp: pointTime.toISOString(),
        timeLabel: pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        waterLevel: parseFloat(level.toFixed(2)),
        sensorConnected: true,
        deviceOnline: true
      });
    }

    return history;
  },

  // Sample historical alerts
  initialAlerts: [
    {
      id: "alt-001",
      type: "WARNING",
      severity: "warning",
      title: "Warning Threshold Approached",
      description: "Water level rose past 1.40 m and is currently at 1.42 m.",
      timestamp: new Date(Date.now() - 8 * 1000).toISOString(),
      timeFormatted: "8 seconds ago",
      resolved: false
    },
    {
      id: "alt-002",
      type: "WARNING",
      severity: "warning",
      title: "Water Level Exceeded 1.50 m",
      description: "Measured water height reached peak of 1.78 m during afternoon heavy precipitation.",
      timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      timeFormatted: "Today, 14:32",
      resolved: true
    },
    {
      id: "alt-003",
      type: "NORMAL",
      severity: "safe",
      title: "Water Level Returned Below Warning",
      description: "Runoff drainage stabilized level back to 1.38 m.",
      timestamp: new Date(Date.now() - 4.5 * 3600 * 1000).toISOString(),
      timeFormatted: "Today, 13:48",
      resolved: true
    },
    {
      id: "alt-004",
      type: "WARNING",
      severity: "warning",
      title: "Warning Threshold Exceeded (1.50 m)",
      description: "Early morning downpour increased surface runoff in Sector 04.",
      timestamp: new Date(Date.now() - 8.5 * 3600 * 1000).toISOString(),
      timeFormatted: "Today, 09:17",
      resolved: true
    }
  ]
};

window.SAMPLE_DATA = SAMPLE_DATA;
