/**
 * TelemetryChart Component
 * Line chart powered by Chart.js displaying 24-hour historical readings and visual threshold bands.
 */

class TelemetryChart {
  constructor(canvasId) {
    this.canvasId = canvasId;
    this.chart = null;
  }

  initChart() {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const thresholds = window.appConfig.getThresholds();

    // Create gradient fill for the line area
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(2, 132, 199, 0.35)');
    gradient.addColorStop(0.5, 'rgba(14, 165, 233, 0.15)');
    gradient.addColorStop(1, 'rgba(240, 249, 255, 0.0)');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Water Level (m)',
            data: [],
            borderColor: '#0284c7',
            backgroundColor: gradient,
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: '#0284c7',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
            bodyFont: { family: 'JetBrains Mono', size: 13, weight: '500' },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                const val = context.parsed.y;
                let statusTag = " (Safe)";
                if (val >= thresholds.critical) statusTag = " (Critical)";
                else if (val >= thresholds.danger) statusTag = " (Danger)";
                else if (val >= thresholds.warning) statusTag = " (Warning)";
                return `Water Level: ${val.toFixed(2)} m ${statusTag}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              font: { family: 'Plus Jakarta Sans', size: 11 },
              color: '#94a3b8',
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8
            }
          },
          y: {
            min: 0,
            max: thresholds.maxGauge || 2.5,
            grid: {
              color: '#f1f5f9',
              drawBorder: false
            },
            ticks: {
              font: { family: 'JetBrains Mono', size: 11 },
              color: '#64748b',
              stepSize: 0.5,
              callback: function (value) {
                return value.toFixed(1) + ' m';
              }
            }
          }
        }
      },
      plugins: [{
        id: 'thresholdLinesPlugin',
        afterDraw: (chart) => {
          const { ctx, chartArea: { left, right }, scales: { y } } = chart;
          const currentThresholds = window.appConfig.getThresholds();

          // Draw Danger Threshold Line (Dashed Red)
          const dangerY = y.getPixelForValue(currentThresholds.danger);
          if (dangerY >= chart.chartArea.top && dangerY <= chart.chartArea.bottom) {
            ctx.save();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.moveTo(left, dangerY);
            ctx.lineTo(right, dangerY);
            ctx.stroke();

            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 10px JetBrains Mono';
            ctx.fillText(`Danger Threshold (${currentThresholds.danger.toFixed(2)}m)`, right - 160, dangerY - 4);
            ctx.restore();
          }

          // Draw Warning Threshold Line (Dashed Amber)
          const warningY = y.getPixelForValue(currentThresholds.warning);
          if (warningY >= chart.chartArea.top && warningY <= chart.chartArea.bottom) {
            ctx.save();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.moveTo(left, warningY);
            ctx.lineTo(right, warningY);
            ctx.stroke();

            ctx.fillStyle = '#d97706';
            ctx.font = 'bold 10px JetBrains Mono';
            ctx.fillText(`Warning Threshold (${currentThresholds.warning.toFixed(2)}m)`, right - 165, warningY - 4);
            ctx.restore();
          }
        }
      }]
    });
  }

  update(history) {
    if (!this.chart) {
      this.initChart();
    }
    if (!this.chart || !history) return;

    const labels = history.map(item => item.timeLabel || new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const data = history.map(item => item.waterLevel);

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;

    // Dynamically update threshold limits
    const thresholds = window.appConfig.getThresholds();
    this.chart.options.scales.y.max = thresholds.maxGauge || 2.5;

    this.chart.update('none'); // Update smoothly without full reset
  }
}

window.TelemetryChart = TelemetryChart;
