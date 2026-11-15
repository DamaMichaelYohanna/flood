/**
 * FloodGuard Serverless API Endpoint (Vercel)
 * 
 * Handles:
 * - POST /api/readings: Ingests sensor telemetry from NodeMCU ESP8266
 * - GET /api/readings: Returns latest telemetry, 24h history, alerts, and device status
 * - Sub-queries via ?type=latest, ?type=history, ?type=alerts, ?type=device
 * 
 * Storage:
 * - Automatically integrates with Upstash Redis / Vercel KV if environment variables are set
 *   (KV_REST_API_URL / UPSTASH_REDIS_REST_URL and KV_REST_API_TOKEN / UPSTASH_REDIS_REST_TOKEN)
 * - Gracefully falls back to in-memory state during execution
 */

// In-memory cache fallback for warm serverless invocations
let memoryReading = {
  stationId: "FLOOD-001",
  waterLevel: 1.42,
  unit: "m",
  timestamp: new Date().toISOString(),
  deviceOnline: true,
  sensorConnected: true,
  signalStrength: -65,
  batteryVoltage: 3.30,
  rateOfRise: 0.05
};

let memoryHistory = [];
let memoryAlerts = [
  {
    id: "alt-init-01",
    type: "SAFE",
    severity: "safe",
    title: "System Initialized",
    description: "FloodGuard monitoring station FLOOD-001 connected.",
    timestamp: new Date().toISOString(),
    timeFormatted: "Just now",
    resolved: true
  }
];

// Helper to generate baseline 24-hour curve if history is empty
function getBaselineHistory() {
  if (memoryHistory.length > 0) return memoryHistory;
  
  const now = Date.now();
  const curvePoints = [
    0.68, 0.65, 0.64, 0.66, 0.72, 0.81, 
    0.92, 1.05, 1.18, 1.29, 1.38, 1.52, 
    1.67, 1.78, 1.74, 1.62, 1.54, 1.48, 
    1.45, 1.40, 1.36, 1.38, 1.40, 1.42
  ];

  for (let i = 23; i >= 0; i--) {
    const pointTime = new Date(now - i * 3600 * 1000);
    memoryHistory.push({
      timestamp: pointTime.toISOString(),
      timeLabel: pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      waterLevel: curvePoints[23 - i],
      sensorConnected: true,
      deviceOnline: true
    });
  }
  return memoryHistory;
}

// Check for Vercel KV / Upstash Redis configuration
const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function kvGet(key) {
  if (!redisUrl || !redisToken) return null;
  try {
    const res = await fetch(`${redisUrl}/get/${key}`, {
      headers: { Authorization: `Bearer ${redisToken}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.result ? JSON.parse(data.result) : null;
  } catch (err) {
    console.warn("KV Get failed:", err);
    return null;
  }
}

async function kvSet(key, value) {
  if (!redisUrl || !redisToken) return false;
  try {
    await fetch(`${redisUrl}/set/${key}`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(value)
    });
    return true;
  } catch (err) {
    console.warn("KV Set failed:", err);
    return false;
  }
}

/**
 * Safely read and parse the request body.
 * Vercel's built-in body parser (micro) throws "Invalid JSON" if Content-Type
 * is application/json but the body is empty or malformed (common with ESP8266).
 * This function catches that and falls back to reading the raw stream.
 */
async function safeParseBody(req) {
  // 1. Try Vercel's pre-parsed req.body (may throw "Invalid JSON")
  try {
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === "object") return req.body;
      if (typeof req.body === "string" && req.body.length > 0) {
        return JSON.parse(req.body);
      }
    }
  } catch (e) {
    // req.body threw or JSON.parse failed — fall through to raw stream
  }

  // 2. Fallback: read the raw body from the request stream
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const raw = Buffer.concat(chunks).toString("utf-8").trim();
    if (raw.length === 0) return {};
    return JSON.parse(raw);
  } catch (e) {
    // Completely unreadable — return empty object so the POST still succeeds
    return {};
  }
}

module.exports = async function handler(req, res) {
  // Global CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Ensure baseline history exists
  getBaselineHistory();

  // Try retrieving persisted state from KV if available
  let latestReading = (await kvGet("floodguard_latest")) || memoryReading;
  let history = (await kvGet("floodguard_history")) || memoryHistory;
  let alerts = (await kvGet("floodguard_alerts")) || memoryAlerts;

  // -------------------------------------------------------------
  // POST: Receive Sensor Telemetry from NodeMCU ESP8266
  // -------------------------------------------------------------
  if (req.method === "POST") {
    try {
      const body = await safeParseBody(req);

      const rawLevel = parseFloat(body.waterLevel);
      const waterLevel = isNaN(rawLevel) ? latestReading.waterLevel : Math.max(0, parseFloat(rawLevel.toFixed(2)));
      const prevLevel = latestReading.waterLevel;
      const rateOfRise = parseFloat((waterLevel - prevLevel).toFixed(2));
      const now = new Date();

      const newReading = {
        stationId: body.stationId || "FLOOD-001",
        waterLevel: waterLevel,
        unit: "m",
        timestamp: now.toISOString(),
        deviceOnline: body.deviceOnline !== undefined ? Boolean(body.deviceOnline) : true,
        sensorConnected: body.sensorConnected !== undefined ? Boolean(body.sensorConnected) : true,
        signalStrength: body.signalStrength !== undefined ? parseInt(body.signalStrength, 10) : -62,
        batteryVoltage: body.batteryVoltage !== undefined ? parseFloat(body.batteryVoltage) : 3.30,
        rateOfRise: rateOfRise
      };

      // Add to telemetry history
      const newHistoryPoint = {
        timestamp: now.toISOString(),
        timeLabel: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        waterLevel: waterLevel,
        sensorConnected: newReading.sensorConnected,
        deviceOnline: newReading.deviceOnline
      };

      history.push(newHistoryPoint);
      if (history.length > 50) {
        history.shift();
      }

      // Check for alert conditions
      if (waterLevel >= 2.10) {
        alerts.unshift({
          id: `alt-${Date.now()}`,
          type: "CRITICAL",
          severity: "critical",
          title: "Critical Flood Overflow Detected",
          description: `Water level measured at ${waterLevel.toFixed(2)} m. Emergency siren and evacuation procedures required!`,
          timestamp: now.toISOString(),
          timeFormatted: "Just now",
          resolved: false
        });
      } else if (waterLevel >= 1.80) {
        alerts.unshift({
          id: `alt-${Date.now()}`,
          type: "DANGER",
          severity: "danger",
          title: "Danger Threshold Exceeded (1.80 m)",
          description: `Water level reached ${waterLevel.toFixed(2)} m. Deploy flood barriers immediately.`,
          timestamp: now.toISOString(),
          timeFormatted: "Just now",
          resolved: false
        });
      } else if (waterLevel >= 1.50) {
        alerts.unshift({
          id: `alt-${Date.now()}`,
          type: "WARNING",
          severity: "warning",
          title: "Warning Threshold Reached (1.50 m)",
          description: `Water height elevated to ${waterLevel.toFixed(2)} m. Heightened monitoring advised.`,
          timestamp: now.toISOString(),
          timeFormatted: "Just now",
          resolved: false
        });
      }

      if (alerts.length > 20) {
        alerts.pop();
      }

      // Update in-memory & KV
      memoryReading = newReading;
      memoryHistory = history;
      memoryAlerts = alerts;

      await kvSet("floodguard_latest", newReading);
      await kvSet("floodguard_history", history);
      await kvSet("floodguard_alerts", alerts);

      return res.status(200).json({
        status: "success",
        message: "Telemetry ingested successfully",
        received: newReading
      });
    } catch (err) {
      console.error("POST /api/readings error:", err);
      return res.status(500).json({ status: "error", message: err.message });
    }
  }

  // -------------------------------------------------------------
  // GET: Serve Data to FloodGuard Dashboard
  // -------------------------------------------------------------
  if (req.method === "GET") {
    const type = req.query ? req.query.type : null;

    const deviceStatus = {
      station: {
        id: latestReading.stationId || "FLOOD-001",
        name: "Monitoring Station 01",
        location: "Riverbank Sector 04 (Flood-Prone Area)",
        microcontroller: "NodeMCU ESP8266 (Wi-Fi 802.11 b/g/n)",
        sensor: "JSN-SR04T Waterproof Ultrasonic Sensor"
      },
      deviceOnline: latestReading.deviceOnline,
      sensorConnected: latestReading.sensorConnected,
      lastCommunication: latestReading.timestamp,
      signalStrength: latestReading.signalStrength,
      batteryVoltage: latestReading.batteryVoltage,
      kvPersistenceActive: Boolean(redisUrl && redisToken)
    };

    // Sub-endpoints support
    if (type === "latest") {
      return res.status(200).json(latestReading);
    }
    if (type === "history") {
      return res.status(200).json(history);
    }
    if (type === "alerts") {
      return res.status(200).json(alerts);
    }
    if (type === "device" || type === "status") {
      return res.status(200).json(deviceStatus);
    }

    // Default: Single unified payload containing full telemetry snapshot
    return res.status(200).json({
      reading: latestReading,
      history: history,
      alerts: alerts,
      deviceStatus: deviceStatus
    });
  }

  return res.status(405).json({ error: `Method ${req.method} not allowed` });
};
