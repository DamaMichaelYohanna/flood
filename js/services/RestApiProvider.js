/**
 * FloodGuard REST API Provider
 * Connects directly to backend API (Vercel Serverless Functions, Django, FastAPI, or NodeMCU).
 */

class RestApiProvider {
  constructor(baseUrl = null) {
    this.storageKey = 'floodguard_custom_api_url';
    const savedUrl = (typeof localStorage !== 'undefined') ? localStorage.getItem(this.storageKey) : null;
    
    if (savedUrl) {
      this.baseUrl = savedUrl.replace(/\/$/, "");
    } else if (baseUrl) {
      this.baseUrl = baseUrl.replace(/\/$/, "");
    } else if (typeof window !== 'undefined' && window.location && window.location.hostname === 'iot-flood.vercel.app') {
      this.baseUrl = `${window.location.origin}/api`;
    } else {
      // Use the deployed station API when the dashboard is opened locally.
      this.baseUrl = "https://iot-flood.vercel.app/api";
    }

    this.timer = null;
    this.updateInterval = 3000;
    this.updateCallback = null;
    this.isConnected = false;
  }

  setBaseUrl(url) {
    if (!url) return;
    this.baseUrl = url.replace(/\/$/, "");
    try {
      localStorage.setItem(this.storageKey, this.baseUrl);
    } catch (e) {
      console.warn("Could not save custom API URL to localStorage", e);
    }
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  start(onUpdate) {
    this.updateCallback = onUpdate;
    this.stop();
    this.poll();
    this.timer = setInterval(() => this.poll(), this.updateInterval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async poll() {
    try {
      // 1. Fast path: Attempt unified endpoint (Vercel Serverless /api/readings)
      try {
        const unifiedRes = await fetch(`${this.baseUrl}/readings`, {
          headers: { 'Accept': 'application/json' }
        });
        if (unifiedRes.ok) {
          const data = await unifiedRes.json();
          const reading = data && (data.reading || data.received || data);
          if (reading && typeof reading.waterLevel === 'number') {
            this.isConnected = true;
            if (this.updateCallback) {
              this.updateCallback({
                reading: reading,
                history: data.history || [],
                alerts: data.alerts || [],
                rawApiResponse: data,
                deviceStatus: data.deviceStatus || {
                  station: window.appConfig.getStation(),
                  deviceOnline: reading.deviceOnline,
                  sensorConnected: reading.sensorConnected,
                  signalStrength: reading.signalStrength,
                  batteryVoltage: reading.batteryVoltage,
                  lastCommunication: reading.timestamp
                }
              });
            }
            return;
          }
        }
      } catch (unifiedErr) {
        // Fallback to separate endpoints below
      }

      // 2. Legacy path: Fetch separate endpoints (Django/FastAPI style)
      const [reading, history, alerts, deviceStatus] = await Promise.all([
        this.getLatestReading(),
        this.getHistoricalReadings(),
        this.getAlerts(),
        this.getDeviceStatus()
      ]);

      this.isConnected = true;
      if (this.updateCallback) {
        this.updateCallback({
          reading,
          history,
          alerts,
          deviceStatus,
          rawApiResponse: { reading, history, alerts, deviceStatus }
        });
      }
    } catch (err) {
      console.warn("RestApiProvider poll error:", err);
      this.isConnected = false;
      if (this.updateCallback) {
        this.updateCallback({
          reading: {
            stationId: "FLOOD-001",
            waterLevel: 0,
            unit: "m",
            timestamp: new Date().toISOString(),
            deviceOnline: false,
            sensorConnected: false,
            signalStrength: 0
          },
          history: [],
          alerts: [{
            id: 'net-err-' + Date.now(),
            type: 'ERROR',
            severity: 'critical',
            title: 'Connection Problem',
            description: `Unable to retrieve latest sensor data from API (${this.baseUrl}). Please verify that your NodeMCU is posting to this endpoint or check internet connection.`,
            timestamp: new Date().toISOString(),
            timeFormatted: 'Just now',
            resolved: false
          }],
          deviceStatus: {
            station: window.appConfig.getStation(),
            deviceOnline: false,
            sensorConnected: false,
            lastCommunication: null
          },
          rawApiResponse: null
        });
      }
    }
  }

  async getLatestReading() {
    const res = await fetch(`${this.baseUrl}/readings/latest/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async getHistoricalReadings(timeframe = '24h') {
    const res = await fetch(`${this.baseUrl}/readings/history/?range=${timeframe}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async getAlerts() {
    const res = await fetch(`${this.baseUrl}/alerts/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async getDeviceStatus() {
    const res = await fetch(`${this.baseUrl}/device/status/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }
}

window.RestApiProvider = RestApiProvider;
