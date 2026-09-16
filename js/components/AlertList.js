/**
 * AlertList Component
 * Displays recent incident logs, audio alerts via Web Audio API, and status badges.
 */

class AlertList {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.audioAlertEnabled = false;
    this.audioCtx = null;
  }

  playAlertSound() {
    if (!this.audioAlertEnabled) return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5
      gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn("AudioContext playback prevented:", e);
    }
  }

  render(alerts) {
    if (!this.container) return;

    const alertItems = alerts || [];
    const activeAlertsCount = alertItems.filter(a => !a.resolved).length;

    let itemsHtml = '';

    if (alertItems.length === 0) {
      itemsHtml = `
        <div class="py-12 text-center text-slate-400">
          <i data-lucide="bell-off" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
          <p class="text-sm font-medium">No recent alerts recorded</p>
          <p class="text-xs text-slate-400 mt-0.5">Water levels are normal and device is stable.</p>
        </div>
      `;
    } else {
      itemsHtml = alertItems.map(alert => {
        let badgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
        let iconName = 'info';
        let iconColor = 'text-slate-500';

        if (alert.severity === 'critical') {
          badgeBg = 'bg-red-100 text-red-800 border-red-200';
          iconName = 'alert-octagon';
          iconColor = 'text-red-600';
        } else if (alert.severity === 'danger') {
          badgeBg = 'bg-orange-100 text-orange-800 border-orange-200';
          iconName = 'alert-triangle';
          iconColor = 'text-orange-600';
        } else if (alert.severity === 'warning') {
          badgeBg = 'bg-amber-100 text-amber-800 border-amber-200';
          iconName = 'alert-circle';
          iconColor = 'text-amber-600';
        } else if (alert.severity === 'safe') {
          badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-200';
          iconName = 'check-circle-2';
          iconColor = 'text-emerald-600';
        }

        return `
          <div class="p-3.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/80 transition-colors flex items-start gap-3">
            <div class="p-2 rounded-lg bg-slate-50 shrink-0 mt-0.5">
              <i data-lucide="${iconName}" class="w-4 h-4 ${iconColor}"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${badgeBg}">
                  ${alert.type}
                </span>
                <span class="text-[11px] font-mono text-slate-400 shrink-0">
                  ${alert.timeFormatted || new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h4 class="text-xs font-semibold text-slate-800 mt-1.5 truncate">
                ${alert.title || alert.description}
              </h4>
              <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">
                ${alert.description}
              </p>
            </div>
          </div>
        `;
      }).join('');
    }

    this.container.innerHTML = `
      <div class="glass-card rounded-2xl p-6 flex flex-col justify-between">
        
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <i data-lucide="bell-ring" class="w-4 h-4 text-sky-600"></i>
                Recent Flood Alerts
              </h3>
              ${activeAlertsCount > 0 ? `
                <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                  ${activeAlertsCount} active
                </span>
              ` : ''}
            </div>
            <p class="text-xs text-slate-500 mt-0.5">Automated threshold crossing incident logs</p>
          </div>

          <!-- Audio alert toggle -->
          <button id="toggle-audio-alert-btn" class="p-2 rounded-xl text-xs font-medium border ${
            this.audioAlertEnabled ? 'bg-sky-50 text-sky-700 border-sky-300' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
          } flex items-center gap-1.5" title="Toggle audio alert chime">
            <i data-lucide="${this.audioAlertEnabled ? 'volume-2' : 'volume-x'}" class="w-3.5 h-3.5"></i>
            <span class="hidden sm:inline">${this.audioAlertEnabled ? 'Sound On' : 'Muted'}</span>
          </button>
        </div>

        <div class="my-4 space-y-2.5 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
          ${itemsHtml}
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Threshold triggers evaluate every 3s</span>
          <span class="font-mono">Log buffer: 15 events</span>
        </div>

      </div>
    `;

    // Attach sound toggle listener
    const soundBtn = document.getElementById('toggle-audio-alert-btn');
    if (soundBtn) {
      soundBtn.onclick = () => {
        this.audioAlertEnabled = !this.audioAlertEnabled;
        if (this.audioAlertEnabled) {
          this.playAlertSound();
        }
        this.render(alerts);
      };
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
}

window.AlertList = AlertList;
