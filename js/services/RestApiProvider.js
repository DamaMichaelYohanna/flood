/**
 * FloodGuard REST API Provider
 * Connects directly to backend API (Django, FastAPI, Firebase Functions, or NodeMCU direct endpoints).
 */

class RestApiProvider {
  constructor(baseUrl = "http://localhost:8000/api") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.timer = null;
    this.updateInterval = 3000;
    this.updateCallback = null;
    this.isConnected = false;
  }

  setBaseUrl(url) {
    this.baseUrl = url.replace(/\/$/, "");
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
      const [reading, history, alerts, deviceStatus] = await Promise.all([
        this.getLatestReading(),
        this.getHistoricalReadings(),
        this.getAlerts(),
        this.getDeviceStatus()
      ]);

      this.isConnected = true;
      if (this.updateCallback) {
        this.updateCallback({ reading, history, alerts, deviceStatus });
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
            description: `Unable to retrieve latest sensor data from API (${this.baseUrl}).`,
            timestamp: new Date().toISOString(),
            timeFormatted: 'Just now',
            resolved: false
          }],
          deviceStatus: {
            station: window.appConfig.getStation(),
            deviceOnline: false,
            sensorConnected: false,
            lastCommunication: null
          }
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
