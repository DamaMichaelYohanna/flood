/**
 * StatisticCards Component
 * Renders Today's Peak, 24h Average, 24h Lowest, and Transmission Latency/RSSI.
 */

class StatisticCards {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(history, reading) {
    if (!this.container) return;

    // Calculate peak, avg, lowest from history array
    let peak = 1.78;
    let lowest = 0.64;
    let avg = 1.21;

    if (history && history.length > 0) {
      const validLevels = history.map(h => h.waterLevel).filter(l => typeof l === 'number' && !isNaN(l));
      if (validLevels.length > 0) {
        peak = Math.max(...validLevels);
        lowest = Math.min(...validLevels);
        avg = validLevels.reduce((a, b) => a + b, 0) / validLevels.length;
      }
    }

    const isOnline = reading && reading.deviceOnline && reading.sensorConnected;
    const rssi = reading ? reading.signalStrength || -62 : -99;
    const latencyText = isOnline ? "3 sec poll" : "Unreachable";

    this.container.innerHTML = `
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Peak Level -->
        <div class="glass-card rounded-xl p-4 flex flex-col justify-between border-l-4 border-l-red-500">
          <div class="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>24h Peak Level</span>
            <i data-lucide="arrow-up-circle" class="w-4 h-4 text-red-500"></i>
          </div>
          <div class="mt-2">
            <span class="text-2xl sm:text-3xl font-bold font-mono text-slate-900">${peak.toFixed(2)}</span>
            <span class="text-sm font-semibold text-slate-500">m</span>
          </div>
          <div class="mt-1 text-[11px] text-slate-400">
            Recorded during rainfall peak
          </div>
        </div>

        <!-- 24h Average -->
        <div class="glass-card rounded-xl p-4 flex flex-col justify-between border-l-4 border-l-sky-500">
          <div class="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>24h Average</span>
            <i data-lucide="bar-chart-2" class="w-4 h-4 text-sky-500"></i>
          </div>
          <div class="mt-2">
            <span class="text-2xl sm:text-3xl font-bold font-mono text-slate-900">${avg.toFixed(2)}</span>
            <span class="text-sm font-semibold text-slate-500">m</span>
          </div>
          <div class="mt-1 text-[11px] text-slate-400">
            Rolling daily average
          </div>
        </div>

        <!-- 24h Lowest -->
        <div class="glass-card rounded-xl p-4 flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div class="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>24h Lowest</span>
            <i data-lucide="arrow-down-circle" class="w-4 h-4 text-emerald-500"></i>
          </div>
          <div class="mt-2">
            <span class="text-2xl sm:text-3xl font-bold font-mono text-slate-900">${lowest.toFixed(2)}</span>
            <span class="text-sm font-semibold text-slate-500">m</span>
          </div>
          <div class="mt-1 text-[11px] text-slate-400">
            Base dry-weather discharge
          </div>
        </div>

        <!-- Last Reading & Signal -->
        <div class="glass-card rounded-xl p-4 flex flex-col justify-between border-l-4 ${isOnline ? 'border-l-indigo-500' : 'border-l-slate-400'}">
          <div class="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Telemetry Ping</span>
            <i data-lucide="${isOnline ? 'wifi' : 'wifi-off'}" class="w-4 h-4 ${isOnline ? 'text-indigo-500' : 'text-slate-400'}"></i>
          </div>
          <div class="mt-2 flex items-baseline justify-between">
            <div>
              <span class="text-xl sm:text-2xl font-bold font-mono ${isOnline ? 'text-slate-900' : 'text-slate-400'}">${isOnline ? rssi : 'ERR'}</span>
              <span class="text-xs font-semibold text-slate-500">${isOnline ? 'dBm' : ''}</span>
            </div>
            <span class="text-xs font-medium px-2 py-0.5 rounded ${isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">
              ${isOnline ? 'Active' : 'Offline'}
            </span>
          </div>
          <div class="mt-1 text-[11px] text-slate-400">
            Cycle: ${latencyText}
          </div>
        </div>

      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
}

window.StatisticCards = StatisticCards;
