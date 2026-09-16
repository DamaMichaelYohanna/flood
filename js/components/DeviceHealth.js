/**
 * DeviceHealth & MonitoringStation Components
 * Displays IoT hardware telemetry, ESP8266 diagnostic stats, and station deployment metadata.
 */

class DeviceHealth {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(deviceStatus) {
    if (!this.container) return;

    const isDeviceOnline = deviceStatus && deviceStatus.deviceOnline;
    const isSensorConnected = deviceStatus && deviceStatus.sensorConnected;
    const uptimeSec = deviceStatus && deviceStatus.mcuUptimeSeconds ? deviceStatus.mcuUptimeSeconds : 0;
    const uptimeHours = (uptimeSec / 3600).toFixed(1);
    const signal = deviceStatus && typeof deviceStatus.signalStrength === 'number' ? deviceStatus.signalStrength : -62;
    const voltage = deviceStatus && deviceStatus.batteryVoltage ? deviceStatus.batteryVoltage : 3.3;

    this.container.innerHTML = `
      <div class="glass-card rounded-2xl p-6 flex flex-col justify-between">
        
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="cpu" class="w-4 h-4 text-sky-600"></i>
              IoT Device Health & Diagnostics
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">Physical hardware telemetry stream</p>
          </div>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            isDeviceOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }">
            <span class="w-2 h-2 rounded-full ${isDeviceOnline ? 'bg-emerald-500 pulse-dot' : 'bg-rose-500'}"></span>
            ${isDeviceOnline ? 'System Nominal' : 'Station Offline'}
          </span>
        </div>

        <!-- Diagnostic Indicators List -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-4">
          
          <!-- NodeMCU MCU Status -->
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full ${isDeviceOnline ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
              <div>
                <span class="text-xs font-semibold text-slate-700 block">NodeMCU ESP8266</span>
                <span class="text-[11px] text-slate-500">Uptime: ${isDeviceOnline ? `${uptimeHours} hrs` : '--'}</span>
              </div>
            </div>
            <span class="text-xs font-mono font-bold ${isDeviceOnline ? 'text-emerald-600' : 'text-rose-600'}">
              ${isDeviceOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <!-- JSN-SR04T Sensor Probe Status -->
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full ${isSensorConnected ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
              <div>
                <span class="text-xs font-semibold text-slate-700 block">JSN-SR04T Sensor</span>
                <span class="text-[11px] text-slate-500">Echo Ping: ${isSensorConnected ? 'Valid' : 'Timeout'}</span>
              </div>
            </div>
            <span class="text-xs font-mono font-bold ${isSensorConnected ? 'text-emerald-600' : 'text-rose-600'}">
              ${isSensorConnected ? 'Connected' : 'Error'}
            </span>
          </div>

          <!-- Wi-Fi Link & Signal -->
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full ${isDeviceOnline ? 'bg-emerald-500' : 'bg-slate-400'}"></span>
              <div>
                <span class="text-xs font-semibold text-slate-700 block">Wi-Fi (802.11 b/g/n)</span>
                <span class="text-[11px] text-slate-500">SSID: ${window.appConfig.getStation().ssid}</span>
              </div>
            </div>
            <span class="text-xs font-mono font-bold text-slate-700">
              ${isDeviceOnline ? `${signal} dBm` : 'No Signal'}
            </span>
          </div>

          <!-- Power Rail & Voltage -->
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full ${isDeviceOnline ? 'bg-emerald-500' : 'bg-slate-400'}"></span>
              <div>
                <span class="text-xs font-semibold text-slate-700 block">VCC Rail Voltage</span>
                <span class="text-[11px] text-slate-500">Supply: 3.3V Step-down</span>
              </div>
            </div>
            <span class="text-xs font-mono font-bold text-slate-700">
              ${isDeviceOnline ? `${voltage.toFixed(2)} V` : '--'}
            </span>
          </div>

        </div>

        <!-- Last Heartbeat Banner -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span class="flex items-center gap-1.5">
            <i data-lucide="radio" class="w-3.5 h-3.5 ${isDeviceOnline ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}"></i>
            Telemetry Heartbeat: ${isDeviceOnline ? 'Active (every 3s)' : 'Disconnected'}
          </span>
          <span class="font-mono text-[11px] text-slate-400">
            Node: ESP8266-12E
          </span>
        </div>

      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
}

class MonitoringStation {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(deviceStatus) {
    if (!this.container) return;

    const station = window.appConfig.getStation();
    const isOnline = deviceStatus && deviceStatus.deviceOnline && deviceStatus.sensorConnected;

    this.container.innerHTML = `
      <div class="glass-card rounded-2xl p-6 flex flex-col justify-between">
        
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="map-pin" class="w-4 h-4 text-sky-600"></i>
              Monitoring Station Information
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">Deployment location & hardware setup</p>
          </div>
          <span class="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            ${station.id}
          </span>
        </div>

        <div class="space-y-3 my-4 text-xs">
          <div class="flex justify-between py-1.5 border-b border-slate-50">
            <span class="text-slate-500">Location Name:</span>
            <span class="font-semibold text-slate-800">${station.location}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-50">
            <span class="text-slate-500">Coordinates:</span>
            <span class="font-mono text-slate-700">${station.coordinates}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-50">
            <span class="text-slate-500">Microcontroller:</span>
            <span class="font-semibold text-slate-800">${station.microcontroller}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-50">
            <span class="text-slate-500">Water Sensor:</span>
            <span class="font-semibold text-slate-800">${station.sensor}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-50">
            <span class="text-slate-500">Operational Range:</span>
            <span class="font-mono text-slate-700">${station.minSensorRange} m – ${station.maxSensorRange} m (±1cm)</span>
          </div>
          <div class="flex justify-between py-1.5">
            <span class="text-slate-500">Deployment Status:</span>
            <span class="font-bold ${isOnline ? 'text-emerald-600' : 'text-rose-600'}">
              ${isOnline ? '● Operational / Online' : '● Maintenance / Offline'}
            </span>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button id="open-pipeline-modal-btn" class="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline">
            <i data-lucide="info" class="w-3.5 h-3.5"></i>
            View Academic IoT Architecture & Formula
          </button>
        </div>

      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
}

window.DeviceHealth = DeviceHealth;
window.MonitoringStation = MonitoringStation;
