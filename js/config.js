/**
 * FloodGuard Configuration & Threshold Constants
 * Centralized settings for water levels, hardware specs, and application behavior.
 */

const DEFAULT_CONFIG = {
  station: {
    id: "FLOOD-001",
    name: "Monitoring Station 01",
    location: "Riverbank Sector 04 (Flood-Prone Area)",
    coordinates: "8°53'12.4\"N 7°43'28.1\"E",
    microcontroller: "NodeMCU ESP8266 (Wi-Fi 802.11 b/g/n)",
    sensor: "JSN-SR04T Waterproof Ultrasonic Sensor",
    maxSensorRange: 6.0, // metres
    minSensorRange: 0.2, // metres (dead zone)
    riverBedTotalDepth: 3.0, // total distance from mounted sensor to river bed
    ssid: "FloodNet-IoT",
    firmwareVersion: "v1.2.4-prod"
  },
  thresholds: {
    normal: 1.20,   // Below 1.20m -> SAFE
    warning: 1.50,  // 1.20m to 1.50m -> WARNING
    danger: 1.80,   // 1.50m to 1.80m -> DANGER
    critical: 2.10, // Above 1.80m / 2.10m -> CRITICAL
    maxGauge: 2.50  // Visual top limit of gauge
  },
  updateIntervalMs: 3000,
  rateOfRiseTimeWindowMins: 10,
  rapidRiseThresholdRate: 0.15 // Metres per 10 mins considered rapid rise
};

class ConfigManager {
  constructor() {
    this.storageKey = 'floodguard_threshold_config';
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_CONFIG,
          thresholds: { ...DEFAULT_CONFIG.thresholds, ...parsed }
        };
      }
    } catch (e) {
      console.warn("Using default config due to error reading storage", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  saveThresholds(newThresholds) {
    this.config.thresholds = { ...this.config.thresholds, ...newThresholds };
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config.thresholds));
    } catch (e) {
      console.error("Failed to save thresholds to localStorage", e);
    }
    return this.config.thresholds;
  }

  resetThresholds() {
    this.config.thresholds = { ...DEFAULT_CONFIG.thresholds };
    localStorage.removeItem(this.storageKey);
    return this.config.thresholds;
  }

  getThresholds() {
    return this.config.thresholds;
  }

  getStation() {
    return this.config.station;
  }
}

// Global instance
window.appConfig = new ConfigManager();
