/**
 * WaterGauge Component
 * Renders the primary water-level hero card with animated SVG fluid wave and scale gauge.
 */

class WaterGauge {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(reading) {
    if (!this.container) return;

    const thresholds = window.appConfig.getThresholds();
    const waterLevel = reading && typeof reading.waterLevel === 'number' ? reading.waterLevel : 0;
    const isOnline = reading && reading.deviceOnline && reading.sensorConnected;

    // Calculate fill percentage relative to max gauge capacity (2.50m default)
    const maxCapacity = thresholds.maxGauge || 2.50;
    const fillPercent = Math.min(100, Math.max(8, (waterLevel / maxCapacity) * 100));

    // Calculate percentage relative to danger threshold
    const dangerPercent = Math.round((waterLevel / thresholds.danger) * 100);

    // Liquid fill gradient based on level
    let waveFillColor = "#0284c7"; // Default Sky Blue (Safe)
    let waveBgColor = "#e0f2fe";
    let statusTheme = "safe";

    if (!isOnline) {
      waveFillColor = "#94a3b8"; // Slate Gray for offline/error
      waveBgColor = "#f1f5f9";
      statusTheme = "offline";
    } else if (waterLevel >= thresholds.critical) {
      waveFillColor = "#dc2626"; // Crimson Red
      waveBgColor = "#fee2e2";
      statusTheme = "critical";
    } else if (waterLevel >= thresholds.danger) {
      waveFillColor = "#ea580c"; // Orange
      waveBgColor = "#ffedd5";
      statusTheme = "danger";
    } else if (waterLevel >= thresholds.warning) {
      waveFillColor = "#d97706"; // Amber
      waveBgColor = "#fef3c7";
      statusTheme = "warning";
    }

    const warningMarkBottom = (thresholds.warning / maxCapacity) * 100;
    const dangerMarkBottom = (thresholds.danger / maxCapacity) * 100;
    const criticalMarkBottom = (thresholds.critical / maxCapacity) * 100;

    this.container.innerHTML = `
      <div class="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between min-h-[380px]">
        
        <!-- Header & Unit Information -->
        <div class="flex items-center justify-between z-10">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <i data-lucide="waves" class="w-4 h-4 text-sky-600"></i>
              Current Water Level
            </span>
            <p class="text-xs text-slate-400 mt-0.5">Ultrasonic Echo (JSN-SR04T)</p>
          </div>
          <div class="text-right">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              isOnline 
                ? 'bg-sky-50 text-sky-700 border border-sky-200/60' 
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }">
              ${dangerPercent}% of Danger Threshold
            </span>
          </div>
        </div>

        <!-- Big Metric Display & Visual Meter -->
        <div class="my-6 flex items-baseline justify-between z-10">
          <div>
            <div class="flex items-baseline gap-2">
              <span class="text-6xl sm:text-7xl font-extrabold tracking-tight ${
                !isOnline ? 'text-slate-400' : 'text-slate-900'
              } font-mono">
                ${isOnline ? waterLevel.toFixed(2) : '--.--'}
              </span>
              <span class="text-3xl font-bold text-slate-500 font-sans">m</span>
            </div>
            <p class="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              ${isOnline ? `Measured from riverbed datum (0.00 m)` : `Sensor reading unavailable`}
            </p>
          </div>

          <!-- Vertical Scale Indicator -->
          <div class="hidden sm:flex flex-col items-end text-xs font-mono text-slate-400 space-y-1">
            <span class="text-red-600 font-semibold">Max: ${maxCapacity.toFixed(2)}m</span>
            <span class="text-amber-600">Warn: ${thresholds.warning.toFixed(2)}m</span>
            <span class="text-emerald-600">Safe: &lt;${thresholds.normal.toFixed(2)}m</span>
          </div>
        </div>

        <!-- Horizontal Threshold Progress Bar Gauge -->
        <div class="relative z-10 w-full bg-slate-100/90 rounded-xl p-3 border border-slate-200/60">
          <div class="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
            <span>0.00 m</span>
            <span class="text-amber-600 font-semibold">Warn (${thresholds.warning}m)</span>
            <span class="text-red-600 font-semibold">Danger (${thresholds.danger}m)</span>
            <span>${maxCapacity} m</span>
          </div>
          
          <div class="relative h-4 w-full bg-slate-200 rounded-full overflow-hidden">
            <!-- Normal Segment -->
            <div class="absolute inset-y-0 left-0 bg-emerald-100" style="width: ${(thresholds.warning / maxCapacity) * 100}%"></div>
            <!-- Warning Segment -->
            <div class="absolute inset-y-0 bg-amber-100" style="left: ${(thresholds.warning / maxCapacity) * 100}%; width: ${((thresholds.danger - thresholds.warning) / maxCapacity) * 100}%"></div>
            <!-- Danger Segment -->
            <div class="absolute inset-y-0 right-0 bg-red-100" style="left: ${(thresholds.danger / maxCapacity) * 100}%"></div>

            <!-- Active Water Level Bar -->
            <div 
              class="absolute top-0 bottom-0 left-0 transition-all duration-700 rounded-full" 
              style="width: ${fillPercent}%; background-color: ${waveFillColor};"
            ></div>
          </div>

          <div class="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
            <span>Datum Level</span>
            <span class="font-bold text-slate-700">▲ Current: ${isOnline ? waterLevel.toFixed(2) + ' m' : 'Offline'}</span>
            <span>Overbank Spillway</span>
          </div>
        </div>

        <!-- Wave Liquid Fill Background with animated waves -->
        <div 
          class="liquid-fill" 
          style="height: ${fillPercent * 0.45}%; background: linear-gradient(180deg, ${waveFillColor}15 0%, ${waveFillColor}30 100%); fill: ${waveFillColor}20;"
        >
          <svg class="wave-svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,40 L1200,120 L0,120 Z"></path>
          </svg>
          <svg class="wave-svg-2" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,20 C200,100 400,-20 600,60 C800,140 1000,20 1200,60 L1200,120 L0,120 Z"></path>
          </svg>
        </div>

        <!-- Footer Ticker -->
        <div class="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400 z-10 mt-4">
          <span class="flex items-center gap-1.5" id="water-last-updated-text">
            <i data-lucide="clock" class="w-3.5 h-3.5"></i>
            Updated just now
          </span>
          <span class="font-mono text-slate-500">
            Station: ${window.appConfig.getStation().id}
          </span>
        </div>

      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
}

window.WaterGauge = WaterGauge;
