/**
 * RiskStatus Component
 * Computes and renders the flood hazard status, safety guidance, and rate-of-rise metrics.
 */

class RiskStatus {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  evaluateStatus(reading, thresholds) {
    if (!reading || !reading.deviceOnline) {
      return {
        level: 'OFFLINE',
        title: 'DEVICE OFFLINE',
        icon: 'wifi-off',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
        bgClass: 'bg-slate-50 border-slate-300',
        textColor: 'text-slate-900',
        description: 'The NodeMCU ESP8266 monitoring station is not communicating. Check Wi-Fi connectivity or power source.',
        subtext: 'Offline sensor status cannot guarantee safe water conditions.',
        isCritical: false
      };
    }

    if (!reading.sensorConnected) {
      return {
        level: 'SENSOR_ERROR',
        title: 'SENSOR ERROR',
        icon: 'alert-triangle',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        bgClass: 'bg-rose-50/70 border-rose-300',
        textColor: 'text-rose-900',
        description: 'Unable to acquire valid ultrasonic echo pulses from JSN-SR04T. Possible probe obstruction or cable fault.',
        subtext: 'Hardware inspection required at flood station.',
        isCritical: false
      };
    }

    const val = reading.waterLevel;

    if (val >= thresholds.critical) {
      return {
        level: 'CRITICAL',
        title: '!! CRITICAL',
        icon: 'flame',
        badgeClass: 'bg-red-600 text-white border-red-700 animate-pulse',
        bgClass: 'bg-red-50 border-red-300 critical-border-pulse',
        textColor: 'text-red-950',
        description: 'Critical water level detected! Immediate community alert activated. Flash flooding imminent.',
        subtext: 'Coordinate with local emergency services and initiate low-lying evacuation protocols.',
        isCritical: true
      };
    }

    if (val >= thresholds.danger) {
      return {
        level: 'DANGER',
        title: '! DANGER',
        icon: 'alert-octagon',
        badgeClass: 'bg-orange-500 text-white border-orange-600',
        bgClass: 'bg-orange-50 border-orange-200',
        textColor: 'text-orange-950',
        description: 'Water level has reached a dangerous level. Immediate attention and safety vigilance required.',
        subtext: 'Prepare flood barriers, alert riverside residents, and monitor real-time discharge.',
        isCritical: false
      };
    }

    if (val >= thresholds.warning) {
      return {
        level: 'WARNING',
        title: '⚠ WARNING',
        icon: 'alert-triangle',
        badgeClass: 'bg-amber-500 text-white border-amber-600',
        bgClass: 'bg-amber-50 border-amber-200',
        textColor: 'text-amber-950',
        description: 'Water level is rising and approaching the danger threshold. Caution advised.',
        subtext: 'Continue automated telemetry tracking; inspect downstream drainage channels.',
        isCritical: false
      };
    }

    // Default SAFE
    return {
      level: 'SAFE',
      title: '✓ SAFE',
      icon: 'check-circle',
      badgeClass: 'bg-emerald-600 text-white border-emerald-700',
      bgClass: 'bg-emerald-50/80 border-emerald-200',
      textColor: 'text-emerald-950',
      description: 'Water level is within the normal range. Normal baseline drainage observed.',
      subtext: 'Standard routine monitoring in progress across Sector 04.',
      isCritical: false
    };
  }

  render(reading) {
    if (!this.container) return;

    const thresholds = window.appConfig.getThresholds();
    const status = this.evaluateStatus(reading, thresholds);
    const rateOfRise = reading && typeof reading.rateOfRise === 'number' ? reading.rateOfRise : 0;
    const isRising = rateOfRise > 0.05;

    this.container.innerHTML = `
      <div class="rounded-2xl border p-6 flex flex-col justify-between min-h-[380px] shadow-sm transition-all duration-300 ${status.bgClass}">
        
        <!-- Top Status Indicator Badge & Icon -->
        <div>
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">
              Flood Risk Assessment
            </span>
            <span class="px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase shadow-sm ${status.badgeClass}">
              ${status.title}
            </span>
          </div>

          <!-- Status Headline -->
          <div class="mt-5 flex items-start gap-4">
            <div class="p-3.5 rounded-xl bg-white/80 border border-slate-200/60 shadow-sm shrink-0">
              <i data-lucide="${status.icon}" class="w-8 h-8 ${
                status.level === 'CRITICAL' ? 'text-red-600' :
                status.level === 'DANGER' ? 'text-orange-600' :
                status.level === 'WARNING' ? 'text-amber-600' :
                status.level === 'SAFE' ? 'text-emerald-600' : 'text-slate-600'
              }"></i>
            </div>
            <div>
              <h2 class="text-2xl sm:text-3xl font-bold tracking-tight ${status.textColor}">
                ${status.title.replace(/[!✓⚠]/g, '').trim()}
              </h2>
              <p class="text-sm font-medium text-slate-700 mt-1 leading-relaxed">
                ${status.description}
              </p>
            </div>
          </div>

          <div class="mt-4 p-3.5 bg-white/70 rounded-xl border border-slate-200/50">
            <p class="text-xs text-slate-600 leading-relaxed font-medium">
              ${status.subtext}
            </p>
          </div>
        </div>

        <!-- Rapid Rate of Rise Metric Section -->
        <div class="mt-6 pt-4 border-t border-slate-200/60">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <i data-lucide="${isRising ? 'trending-up' : 'activity'}" class="w-4 h-4 ${isRising ? 'text-amber-600' : 'text-slate-400'}"></i>
              <span>Water Level Velocity:</span>
            </div>
            <span class="text-xs font-mono font-bold ${isRising ? 'text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded' : 'text-slate-700'}">
              ${rateOfRise > 0 ? `↑ +${rateOfRise.toFixed(2)} m / 10m` : rateOfRise < 0 ? `↓ ${rateOfRise.toFixed(2)} m / 10m` : '↔ Steady (0.00 m)'}
            </span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">
            Calculated over short-term 10-minute sliding measurement window.
          </p>
        </div>

      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
}

window.RiskStatus = RiskStatus;
