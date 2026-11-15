/**
 * ThresholdModal Component
 * Interactive settings modal to display and adjust water level thresholds.
 */

class ThresholdModal {
  constructor(modalId) {
    this.modal = document.getElementById(modalId);
    this.onSaveCallback = null;
  }

  init(onSave) {
    this.onSaveCallback = onSave;
    this.bindEvents();
  }

  bindEvents() {
    const closeBtn = document.getElementById('close-threshold-modal-btn');
    const cancelBtn = document.getElementById('cancel-threshold-modal-btn');
    const saveBtn = document.getElementById('save-threshold-modal-btn');
    const resetBtn = document.getElementById('reset-threshold-modal-btn');

    if (closeBtn) closeBtn.onclick = () => this.close();
    if (cancelBtn) cancelBtn.onclick = () => this.close();
    
    if (resetBtn) {
      resetBtn.onclick = () => {
        window.appConfig.resetThresholds();
        this.populateFields();
        if (this.onSaveCallback) this.onSaveCallback();
      };
    }

    if (saveBtn) {
      saveBtn.onclick = () => {
        const normal = parseFloat(document.getElementById('input-threshold-normal').value);
        const warning = parseFloat(document.getElementById('input-threshold-warning').value);
        const danger = parseFloat(document.getElementById('input-threshold-danger').value);
        const critical = parseFloat(document.getElementById('input-threshold-critical').value);

        if (isNaN(normal) || isNaN(warning) || isNaN(danger) || isNaN(critical)) {
          alert("Please provide valid numeric thresholds.");
          return;
        }

        if (!(normal < warning && warning < danger && danger < critical)) {
          alert("Thresholds must be strictly in ascending order: Normal < Warning < Danger < Critical");
          return;
        }

        window.appConfig.saveThresholds({ normal, warning, danger, critical });

        const apiInput = document.getElementById('input-api-base-url');
        if (apiInput && window.restApiProvider) {
          const customUrl = apiInput.value.trim();
          if (customUrl) {
            window.restApiProvider.setBaseUrl(customUrl);
          }
        }

        if (this.onSaveCallback) this.onSaveCallback();
        this.close();
      };
    }
  }

  populateFields() {
    const t = window.appConfig.getThresholds();
    const normInput = document.getElementById('input-threshold-normal');
    const warnInput = document.getElementById('input-threshold-warning');
    const dangInput = document.getElementById('input-threshold-danger');
    const critInput = document.getElementById('input-threshold-critical');
    const apiInput = document.getElementById('input-api-base-url');

    if (normInput) normInput.value = t.normal;
    if (warnInput) warnInput.value = t.warning;
    if (dangInput) dangInput.value = t.danger;
    if (critInput) critInput.value = t.critical;
    if (apiInput && window.restApiProvider) {
      apiInput.value = window.restApiProvider.getBaseUrl();
    }
  }

  open() {
    this.populateFields();
    if (this.modal) {
      this.modal.classList.remove('hidden');
      this.modal.classList.add('flex');
    }
  }

  close() {
    if (this.modal) {
      this.modal.classList.add('hidden');
      this.modal.classList.remove('flex');
    }
  }
}

window.ThresholdModal = ThresholdModal;
