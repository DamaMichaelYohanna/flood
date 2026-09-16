/**
 * FloodGuard Mock Provider & Real-time Simulation Engine
 * Simulates ESP8266 telemetry, realistic water fluctuation, rapid rise scenarios, and sensor fault injection.
 */

class MockProvider {
  constructor() {
    this.current = JSON.parse(JSON.stringify(SAMPLE_DATA.currentReading));
    this.history = SAMPLE_DATA.generate24hHistory();
    this.alerts = JSON.parse(JSON.stringify(SAMPLE_DATA.initialAlerts));
    this.timer = null;
    this.updateCallback = null;
    
    // Simulation state
    this.isDemoActive = true;
    this.activeScenario = 'surge'; // 'steady', 'surge', 'receding', 'sensor_fault', 'device_offline'
    this.scenarioStep = 0;
    this.updateInterval = 3000; // ms
    this.simulationSequence = [];
    this.previousLevel = this.current.waterLevel;
  }

  start(onUpdate) {
    this.updateCallback = onUpdate;
    this.stop();
    this.timer = setInterval(() => {
      this.tick();
    }, this.updateInterval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  setUpdateInterval(ms) {
    this.updateInterval = ms;
    if (this.timer) {
      this.start(this.updateCallback);
    }
  }

  setDemoActive(active) {
    this.isDemoActive = active;
  }

  setScenario(scenarioName) {
    this.activeScenario = scenarioName;
    this.scenarioStep = 0;

    if (scenarioName === 'surge') {
      // Step sequence from normal up to critical
      this.simulationSequence = [1.25, 1.35, 1.46, 1.58, 1.72, 1.86, 2.05, 2.18];
    } else if (scenarioName === 'receding') {
      // Step sequence draining down to safe
      this.simulationSequence = [2.10, 1.92, 1.75, 1.55, 1.38, 1.15, 0.95, 0.82];
    } else if (scenarioName === 'steady') {
      this.simulationSequence = [0.82, 0.86, 0.90, 0.88, 0.94, 0.91, 0.87, 0.89];
    }
  }

  setManualLevel(waterLevel) {
    this.current.waterLevel = Math.max(0, Math.min(2.5, parseFloat(waterLevel)));
    this.current.deviceOnline = true;
    this.current.sensorConnected = true;
    this.current.timestamp = new Date().toISOString();
    this.evaluateAlertsAndPushHistory();
    if (this.updateCallback) {
      this.updateCallback({
        reading: this.current,
        history: this.history,
        alerts: this.alerts,
        deviceStatus: this.getDeviceStatusSync()
      });
    }
  }

  setDeviceState({ deviceOnline, sensorConnected }) {
    if (deviceOnline !== undefined) this.current.deviceOnline = deviceOnline;
    if (sensorConnected !== undefined) this.current.sensorConnected = sensorConnected;
    this.current.timestamp = new Date().toISOString();
    if (this.updateCallback) {
      this.updateCallback({
        reading: this.current,
        history: this.history,
        alerts: this.alerts,
        deviceStatus: this.getDeviceStatusSync()
      });
    }
  }

  resetToBaseline() {
    this.current = JSON.parse(JSON.stringify(SAMPLE_DATA.currentReading));
    this.current.timestamp = new Date().toISOString();
    this.history = SAMPLE_DATA.generate24hHistory();
    this.alerts = JSON.parse(JSON.stringify(SAMPLE_DATA.initialAlerts));
    this.scenarioStep = 0;
    this.activeScenario = 'surge';
    if (this.updateCallback) {
      this.updateCallback({
        reading: this.current,
        history: this.history,
        alerts: this.alerts,
        deviceStatus: this.getDeviceStatusSync()
      });
    }
  }

  tick() {
    if (!this.isDemoActive) {
      // In live passive mode, small micro-jitter (+- 0.01m)
      if (this.current.deviceOnline && this.current.sensorConnected) {
        const jitter = (Math.random() - 0.5) * 0.02;
        this.current.waterLevel = Math.max(0.2, Math.min(2.4, +(this.current.waterLevel + jitter).toFixed(2)));
      }
    } else {
      // Active Demo Scenario execution
      if (this.activeScenario === 'sensor_fault') {
        this.current.sensorConnected = false;
        this.current.deviceOnline = true;
      } else if (this.activeScenario === 'device_offline') {
        this.current.deviceOnline = false;
      } else {
        this.current.deviceOnline = true;
        this.current.sensorConnected = true;

        if (this.simulationSequence && this.simulationSequence.length > 0) {
          const nextLevel = this.simulationSequence[this.scenarioStep % this.simulationSequence.length];
          this.current.waterLevel = parseFloat(nextLevel.toFixed(2));
          this.scenarioStep++;
        }
      }
    }

    this.current.timestamp = new Date().toISOString();
    this.current.mcuUptimeSeconds += 3;
    this.current.signalStrength = -60 - Math.floor(Math.random() * 8);

    // Calculate rate of rise
    const diff = +(this.current.waterLevel - this.previousLevel).toFixed(2);
    this.current.rateOfRise = diff;
    this.previousLevel = this.current.waterLevel;

    this.evaluateAlertsAndPushHistory();

    if (this.updateCallback) {
      this.updateCallback({
        reading: this.current,
        history: this.history,
        alerts: this.alerts,
        deviceStatus: this.getDeviceStatusSync()
      });
    }
  }

  evaluateAlertsAndPushHistory() {
    if (!this.current.deviceOnline || !this.current.sensorConnected) {
      return;
    }

    const thresholds = window.appConfig.getThresholds();
    const lvl = this.current.waterLevel;
    const now = new Date();
    const timeFormatted = "Just now (" + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ")";

    // Check for critical / danger crossings
    if (lvl >= thresholds.critical) {
      const exists = this.alerts.some(a => a.type === 'CRITICAL' && !a.resolved);
      if (!exists) {
        this.alerts.unshift({
          id: 'alt-' + Date.now(),
          type: 'CRITICAL',
          severity: 'critical',
          title: `CRITICAL: Water Level at ${lvl.toFixed(2)} m`,
          description: `Critical emergency threshold (${thresholds.critical} m) exceeded! Immediate community alert activated.`,
          timestamp: now.toISOString(),
          timeFormatted: timeFormatted,
          resolved: false
        });
      }
    } else if (lvl >= thresholds.danger) {
      const exists = this.alerts.some(a => a.type === 'DANGER' && !a.resolved);
      if (!exists) {
        this.alerts.unshift({
          id: 'alt-' + Date.now(),
          type: 'DANGER',
          severity: 'danger',
          title: `DANGER: Water Level at ${lvl.toFixed(2)} m`,
          description: `Water height reached danger threshold (${thresholds.danger} m). Evacuation readiness recommended.`,
          timestamp: now.toISOString(),
          timeFormatted: timeFormatted,
          resolved: false
        });
      }
    } else if (lvl >= thresholds.warning) {
      const exists = this.alerts.some(a => a.type === 'WARNING' && !a.resolved);
      if (!exists) {
        this.alerts.unshift({
          id: 'alt-' + Date.now(),
          type: 'WARNING',
          severity: 'warning',
          title: `WARNING: Water Level at ${lvl.toFixed(2)} m`,
          description: `Approaching warning threshold (${thresholds.warning} m). Monitoring station heightened sampling.`,
          timestamp: now.toISOString(),
          timeFormatted: timeFormatted,
          resolved: false
        });
      }
    }

    // Keep alert list capped at 15
    if (this.alerts.length > 15) {
      this.alerts = this.alerts.slice(0, 15);
    }

    // Append to live history
    const lastPoint = this.history[this.history.length - 1];
    const pointTime = new Date();
    this.history.push({
      timestamp: pointTime.toISOString(),
      timeLabel: pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      waterLevel: lvl,
      sensorConnected: this.current.sensorConnected,
      deviceOnline: this.current.deviceOnline
    });

    if (this.history.length > 30) {
      this.history.shift();
    }
  }

  getDeviceStatusSync() {
    return {
      station: window.appConfig.getStation(),
      deviceOnline: this.current.deviceOnline,
      sensorConnected: this.current.sensorConnected,
      signalStrength: this.current.signalStrength,
      batteryVoltage: this.current.batteryVoltage,
      mcuUptimeSeconds: this.current.mcuUptimeSeconds,
      freeHeapBytes: this.current.freeHeapBytes,
      lastCommunication: this.current.timestamp
    };
  }

  async getLatestReading() {
    return this.current;
  }

  async getHistoricalReadings() {
    return this.history;
  }

  async getAlerts() {
    return this.alerts;
  }

  async getDeviceStatus() {
    return this.getDeviceStatusSync();
  }
}

window.MockProvider = MockProvider;
