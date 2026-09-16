/**
 * IoTPipelineModal Component
 * Visualizes the IoT Hardware Pipeline and provides production-ready Arduino C++ code for NodeMCU ESP8266 + JSN-SR04T.
 */

class IoTPipelineModal {
  constructor(modalId) {
    this.modal = document.getElementById(modalId);
  }

  init() {
    const closeBtn = document.getElementById('close-pipeline-modal-btn');
    const openBtn = document.getElementById('open-pipeline-modal-btn');
    const tabArchBtn = document.getElementById('nav-tab-arch');

    if (closeBtn) closeBtn.onclick = () => this.close();
    if (openBtn) openBtn.onclick = () => this.open();
    if (tabArchBtn) tabArchBtn.onclick = () => this.open();
  }

  open() {
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

window.IoTPipelineModal = IoTPipelineModal;
