/**
 * FloodGuard Main Application Controller
 * Orchestrates components, DataService subscriptions, interactive simulation scenarios, and UI state.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Components
  const waterGauge = new WaterGauge('water-gauge-container');
  const riskStatus = new RiskStatus('risk-status-container');
  const statisticCards = new StatisticCards('statistics-container');
  const telemetryChart = new TelemetryChart('telemetry-chart-canvas');
  const deviceHealth = new DeviceHealth('device-health-container');
  const monitoringStation = new MonitoringStation('monitoring-station-container');
  const alertList = new AlertList('alert-list-container');
  const thresholdModal = new ThresholdModal('threshold-modal');
  const iotPipelineModal = new IoTPipelineModal('pipeline-modal');

  // Initialize Data Providers
  const mockProvider = new MockProvider();
  const restProvider = new RestApiProvider();
  window.restApiProvider = restProvider;

  // Set default provider to Mock Provider
  window.dataService.setProvider(mockProvider);

  // Initialize Modals
  thresholdModal.init(() => {
    // When thresholds change, re-render immediately
    window.dataService.getLatestReading().then(reading => {
      waterGauge.render(reading);
      riskStatus.render(reading);
      window.dataService.getHistoricalReadings().then(history => {
        telemetryChart.update(history);
      });
    });
  });
  iotPipelineModal.init();

  // Subscribe UI to DataService updates
  window.dataService.subscribe(({ reading, history, alerts, deviceStatus }) => {
    waterGauge.render(reading);
    riskStatus.render(reading);
    statisticCards.render(history, reading);
    telemetryChart.update(history);
    deviceHealth.render(deviceStatus);
    monitoringStation.render(deviceStatus);
    alertList.render(alerts);

    // Update Header Status Indicator
    updateHeaderStatus(reading, deviceStatus);
  });

  function updateHeaderStatus(reading, deviceStatus) {
    const statusDot = document.getElementById('header-status-dot');
    const statusText = document.getElementById('header-status-text');
    const stationIdText = document.getElementById('header-station-id');

    if (stationIdText) {
      stationIdText.innerText = window.appConfig.getStation().name;
    }

    if (!statusDot || !statusText) return;

    if (reading && reading.deviceOnline && reading.sensorConnected) {
      statusDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-dot';
      statusText.innerText = 'Device Online';
      statusText.className = 'text-xs font-semibold text-emerald-700';
    } else if (reading && !reading.deviceOnline) {
      statusDot.className = 'w-2.5 h-2.5 rounded-full bg-rose-500';
      statusText.innerText = 'Device Offline';
      statusText.className = 'text-xs font-semibold text-rose-700';
    } else {
      statusDot.className = 'w-2.5 h-2.5 rounded-full bg-amber-500';
      statusText.innerText = 'Sensor Fault';
      statusText.className = 'text-xs font-semibold text-amber-700';
    }
  }

  // Bind Demo Control Buttons & Sliders
  const demoToggle = document.getElementById('demo-mode-toggle');
  const scenarioSelect = document.getElementById('demo-scenario-select');
  const manualSlider = document.getElementById('demo-manual-slider');
  const manualSliderVal = document.getElementById('demo-slider-value');
  const resetDemoBtn = document.getElementById('demo-reset-btn');
  const simSpeedSelect = document.getElementById('demo-speed-select');
  const btnSettings = document.getElementById('btn-open-settings');
  const navTabSettings = document.getElementById('nav-tab-settings');

  if (demoToggle) {
    demoToggle.onchange = (e) => {
      mockProvider.setDemoActive(e.target.checked);
      const banner = document.getElementById('demo-mode-banner');
      if (banner) {
        banner.style.display = e.target.checked ? 'flex' : 'none';
      }
    };
  }

  if (scenarioSelect) {
    scenarioSelect.onchange = (e) => {
      mockProvider.setScenario(e.target.value);
    };
  }

  if (manualSlider) {
    manualSlider.oninput = (e) => {
      const val = parseFloat(e.target.value);
      if (manualSliderVal) manualSliderVal.innerText = val.toFixed(2) + ' m';
      mockProvider.setManualLevel(val);
    };
  }

  if (resetDemoBtn) {
    resetDemoBtn.onclick = () => {
      mockProvider.resetToBaseline();
      if (manualSlider) {
        manualSlider.value = 1.42;
        if (manualSliderVal) manualSliderVal.innerText = '1.42 m';
      }
      if (scenarioSelect) {
        scenarioSelect.value = 'surge';
      }
    };
  }

  if (simSpeedSelect) {
    simSpeedSelect.onchange = (e) => {
      const intervalMs = parseInt(e.target.value, 10);
      mockProvider.setUpdateInterval(intervalMs);
    };
  }

  if (btnSettings) {
    btnSettings.onclick = () => thresholdModal.open();
  }
  if (navTabSettings) {
    navTabSettings.onclick = (e) => {
      e.preventDefault();
      thresholdModal.open();
    };
  }

  // Data Source Provider Selector (Mock vs REST API)
  const dataSourceSelect = document.getElementById('data-source-select');
  if (dataSourceSelect) {
    dataSourceSelect.onchange = (e) => {
      if (e.target.value === 'rest') {
        window.dataService.setProvider(restProvider);
      } else {
        window.dataService.setProvider(mockProvider);
      }
    };
  }

  // Copy Arduino Code to Clipboard Helper
  const copyCodeBtn = document.getElementById('copy-arduino-code-btn');
  if (copyCodeBtn) {
    copyCodeBtn.onclick = () => {
      const codeBlock = document.getElementById('arduino-code-block');
      if (codeBlock) {
        navigator.clipboard.writeText(codeBlock.innerText).then(() => {
          copyCodeBtn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5"></i> Copied!';
          if (window.lucide) window.lucide.createIcons();
          setTimeout(() => {
            copyCodeBtn.innerHTML = '<i data-lucide="copy" class="w-3.5 h-3.5"></i> Copy Arduino Sketch';
            if (window.lucide) window.lucide.createIcons();
          }, 2000);
        });
      }
    };
  }

  // Initial trigger
  mockProvider.tick();
});
