/**
 * FloodGuard Data Service Layer
 * Clean abstraction separating UI components from the underlying data source (Mock, REST API, Firebase).
 */

class DataService {
  constructor() {
    this.provider = null;
    this.listeners = new Set();
  }

  setProvider(provider) {
    if (this.provider && typeof this.provider.stop === 'function') {
      this.provider.stop();
    }
    this.provider = provider;
    if (this.provider && typeof this.provider.start === 'function') {
      this.provider.start(this.notifySubscribers.bind(this));
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifySubscribers(data) {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error("Error in data service subscriber:", err);
      }
    });
  }

  async getLatestReading() {
    if (!this.provider) throw new Error("No DataProvider attached to DataService.");
    return await this.provider.getLatestReading();
  }

  async getHistoricalReadings(timeframe = '24h') {
    if (!this.provider) throw new Error("No DataProvider attached to DataService.");
    return await this.provider.getHistoricalReadings(timeframe);
  }

  async getAlerts() {
    if (!this.provider) throw new Error("No DataProvider attached to DataService.");
    return await this.provider.getAlerts();
  }

  async getDeviceStatus() {
    if (!this.provider) throw new Error("No DataProvider attached to DataService.");
    return await this.provider.getDeviceStatus();
  }
}

window.dataService = new DataService();
