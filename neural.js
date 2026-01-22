/* neural.js — multi-page safe
   Makes the Neural Network Laboratory page functional:
   - Chart.js training loss chart
   - Live network visualization nodes
   - Weights visualization
   - Export model JSON
   - Optional background effects
*/

'use strict';

// ----------------------
// Helpers
// ----------------------
function $(id) {
  return document.getElementById(id);
}

function elExists(id) {
  return !!document.getElementById(id);
}

function safeSetText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function safeSetHTML(id, value) {
  const el = $(id);
  if (el) el.innerHTML = value;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ----------------------
// Background Effects (optional)
// ----------------------
function createMatrixRain() {
  const rain = $('matrixRain');
  if (!rain) return;

  // If you already generate columns elsewhere, skip duplicates.
  if (rain.dataset.ready === '1') return;
  rain.dataset.ready = '1';

  const cols = 32;
  for (let i = 0; i < cols; i++) {
    const col = document.createElement('div');
    col.className = 'matrix-column';
    col.style.left = `${(i / cols) * 100}%`;
    col.style.animationDuration = `${1.2 + Math.random() * 2.8}s`;
    col.style.animationDelay = `${Math.random() * 2}s`;
    rain.appendChild(col);
  }
}

function createDataFlow() {
  const container = $('dataFlowContainer');
  if (!container) return;

  if (container.dataset.ready === '1') return;
  container.dataset.ready = '1';

  const count = 24;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'data-packet';
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 3}s`;
    p.style.animationDuration = `${2.5 + Math.random() * 3.5}s`;
    container.appendChild(p);
  }
}

// Inject minimal CSS for the optional backgrounds if your CSS doesn't have it
function ensureBackgroundCSS() {
  if (document.getElementById('neural-bg-style')) return;

  const style = document.createElement('style');
  style.id = 'neural-bg-style';
  style.textContent = `
    .matrix-column{
      position:absolute;
      top:-120px;
      width:2px;
      height:240px;
      background: linear-gradient(transparent, rgba(6,182,212,0.8), transparent);
      animation: matrixFall linear infinite;
      opacity: 0.35;
    }
    @keyframes matrixFall{
      0%{ transform: translateY(-120px); opacity: 0; }
      10%{ opacity: 0.7; }
      90%{ opacity: 0.7; }
      100%{ transform: translateY(calc(100vh + 120px)); opacity: 0; }
    }

    .data-packet{
      position:absolute;
      width:6px;
      height:6px;
      border-radius:50%;
      background: rgba(37,99,235,0.55);
      box-shadow: 0 0 0 6px rgba(37,99,235,0.10);
      animation: dataDrift linear infinite;
      opacity: 0.35;
    }
    @keyframes dataDrift{
      0%{ transform: translate(0,0) scale(0.9); opacity: 0.1; }
      20%{ opacity: 0.45; }
      100%{ transform: translate(120px,-80px) scale(1.15); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ----------------------
// Chart.js initialization
// ----------------------
function initNNTrainingChart() {
  const canvas = $('nnTrainingChart');
  if (!canvas) return;

  // Chart.js must be loaded for this page
  if (typeof Chart === 'undefined') {
    safeSetText('cryptoOutput', 'Chart.js not loaded');
    return;
  }

  const ctx = canvas.getContext('2d');

  // Avoid re-init on hot reload
  if (window.nnTrainingChart) {
    try { window.nnTrainingChart.destroy(); } catch (_) {}
  }

  window.nnTrainingChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Loss',
        data: [],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
        borderWidth: 2,
        tension: 0.35,
        fill: true,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      plugins: {
        legend: {
          display: true,
          labels: { color: '#0F172A', font: { family: 'Inter' } }
        },
        tooltip: { enabled: true }
      },
      scales: {
        x: {
          ticks: { color: '#64748B', font: { family: 'Inter' } },
          grid: { color: '#E2E8F0' }
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#64748B', font: { family: 'Inter' } },
          grid: { color: '#E2E8F0' }
        }
      }
    }
  });
}

// ----------------------
// 1) Live Neural Network Training
// ----------------------
class LiveNeuralNetwork {
  constructor() {
    this.layers = [4, 8, 6, 2];
    this.weights = [];
    this.activations = [];
    this.trainingData = [];
    this.isTraining = false;

    this.initNetwork();
  }

  initNetwork() {
    this.weights = [];
    for (let i = 0; i < this.layers.length - 1; i++) {
      this.weights.push(this.randomWeights(this.layers[i], this.layers[i + 1]));
    }
    this.updateVisualization();
  }

  randomWeights(rows, cols) {
    return Array(rows).fill(0).map(() =>
      Array(cols).fill(0).map(() => (Math.random() - 0.5) * 2)
    );
  }

  generateTrainingData() {
    this.trainingData = Array(60).fill(0).map(() => ({
      input: Array(this.layers[0]).fill(0).map(() => Math.random() * 2 - 1),
      target: Array(this.layers[this.layers.length - 1]).fill(0).map(() => Math.random())
    }));
  }

  matrixMultiply(vector, matrix) {
    const out = Array(matrix[0].length).fill(0);
    for (let j = 0; j < matrix[0].length; j++) {
      let sum = 0;
      for (let i = 0; i < vector.length; i++) sum += vector[i] * matrix[i][j];
      out[j] = sum;
    }
    return out;
  }

  forwardPass(input) {
    this.activations = [input];
    let current = input;
    this.weights.forEach((w) => {
      current = this.matrixMultiply(current, w).map((x) => Math.tanh(x));
      this.activations.push(current);
    });
    return current;
  }

  calculateLoss(output, target) {
    let loss = 0;
    for (let i = 0; i < output.length; i++) {
      loss += (output[i] - target[i]) ** 2;
    }
    return loss / output.length;
  }

  backwardPass() {
    // Demo-only "learning": small random nudge
    for (let l = 0; l < this.weights.length; l++) {
      for (let i = 0; i < this.weights[l].length; i++) {
        for (let j = 0; j < this.weights[l][i].length; j++) {
          this.weights[l][i][j] += (Math.random() - 0.5) * 0.02;
        }
      }
    }
  }

  trainEpoch() {
    let totalLoss = 0;
    this.trainingData.forEach((d) => {
      const out = this.forwardPass(d.input);
      totalLoss += this.calculateLoss(out, d.target);
      this.backwardPass();
    });
    return totalLoss / this.trainingData.length;
  }

  updateMetrics(epoch, loss) {
    safeSetText('nnEpoch', epoch);
    safeSetText('nnLoss', loss.toFixed(2));
    safeSetText('nnAccuracy', Math.min(100, Math.max(0, Math.round(100 - loss * 20))));
  }

  updateTrainingChart(epoch, loss) {
    if (!window.nnTrainingChart) return;

    window.nnTrainingChart.data.labels.push(epoch);
    window.nnTrainingChart.data.datasets[0].data.push(loss);

    // Keep chart readable
    if (window.nnTrainingChart.data.labels.length > 60) {
      window.nnTrainingChart.data.labels.shift();
      window.nnTrainingChart.data.datasets[0].data.shift();
    }

    window.nnTrainingChart.update();
  }

  async startTraining() {
    if (this.isTraining) return;

    const btn = $('trainNNButton');
    if (btn) {
      btn.classList.add('working');
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Training...';
      btn.disabled = true;
    }

    // Reset chart each run
    if (window.nnTrainingChart) {
      window.nnTrainingChart.data.labels = [];
      window.nnTrainingChart.data.datasets[0].data = [];
      window.nnTrainingChart.update();
    }

    this.isTraining = true;
    this.generateTrainingData();

    for (let epoch = 0; epoch <= 50 && this.isTraining; epoch++) {
      const loss = this.trainEpoch();
      this.updateMetrics(epoch, loss);
      this.updateTrainingChart(epoch, loss);
      this.updateVisualization();
      await delay(200);
    }

    this.isTraining = false;

    if (btn) {
      btn.classList.remove('working');
      btn.innerHTML = '<i class="fas fa-play"></i> Train Network';
      btn.disabled = false;
    }

    this.showSuccess('Training Complete!');
  }

  visualizeWeights() {
    const container = $('weightsVisualization');
    const matrix = $('weightMatrix');
    if (!container || !matrix) return;

    container.style.display = 'block';
    matrix.innerHTML = '';

    this.weights.forEach((layerWeights, layerIndex) => {
      const layerDiv = document.createElement('div');
      layerDiv.className = 'weight-layer';

      const title = document.createElement('h5');
      title.textContent = `Layer ${layerIndex + 1} Weights`;
      title.style.margin = '0 0 10px';
      title.style.fontFamily = 'Poppins, Inter, sans-serif';
      title.style.color = '#0F172A';
      layerDiv.appendChild(title);

      const weightGrid = document.createElement('div');
      weightGrid.className = 'weight-matrix';
      // Use actual number of cols
      weightGrid.style.gridTemplateColumns = `repeat(${layerWeights[0].length}, 18px)`;

      layerWeights.forEach((row) => {
        row.forEach((w) => {
          const cell = document.createElement('div');
          cell.className = 'weight-cell';

          // Map weight to intensity
          const intensity = Math.min(1, Math.max(0.15, Math.abs(w)));
          cell.style.opacity = String(intensity);

          // Positive vs negative colors
          cell.style.background = w >= 0
            ? 'linear-gradient(135deg, rgba(37,99,235,0.25), rgba(124,58,237,0.20))'
            : 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(245,158,11,0.14))';

          weightGrid.appendChild(cell);
        });
      });

      layerDiv.appendChild(weightGrid);
      matrix.appendChild(layerDiv);
    });

    this.showSuccess('Weights Visualized!');
  }

  async exportNetwork() {
    const btn = $('saveModelButton');
    if (btn) {
      btn.classList.add('working');
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      btn.disabled = true;
    }

    await delay(900);

    const modelData = {
      architecture: this.layers,
      weights: this.weights,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(modelData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `neural-network-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    if (btn) {
      btn.classList.remove('working');
      btn.innerHTML = '<i class="fas fa-save"></i> Save Model';
      btn.disabled = false;
    }

    this.showSuccess('Model Exported Successfully!');
  }

  updateVisualization() {
    const container = $('neuralVisualization');
    if (!container) return;

    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.justifyContent = 'space-around';
    container.style.alignItems = 'center';
    container.style.gap = '16px';

    this.layers.forEach((layerSize, layerIdx) => {
      const layerDiv = document.createElement('div');
      layerDiv.className = 'neural-layer';
      layerDiv.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:10px;';

      for (let i = 0; i < layerSize; i++) {
        const node = document.createElement('div');
        node.className = 'neural-node';

        // Use activation to tint nodes (when available)
        const act = (this.activations[layerIdx] && this.activations[layerIdx][i] != null)
          ? this.activations[layerIdx][i]
          : 0;

        const glow = Math.min(1, Math.max(0, (Math.abs(act) * 0.9)));
        node.style.width = '16px';
        node.style.height = '16px';
        node.style.borderRadius = '50%';
        node.style.border = '1px solid rgba(37,99,235,0.25)';
        node.style.background = `rgba(37,99,235,${0.10 + glow * 0.25})`;
        node.style.boxShadow = `0 0 ${6 + glow * 10}px rgba(37,99,235,${0.15 + glow * 0.35})`;

        layerDiv.appendChild(node);
      }

      container.appendChild(layerDiv);
    });
  }

  showSuccess(message) {
    const target = document.querySelector('.explanation');
    if (!target) return;

    const div = document.createElement('div');
    div.innerHTML = `<i class="fas fa-check" style="color:#10B981; margin-right:10px"></i>${message}`;
    div.style.cssText = `
      padding:10px 12px;
      background: rgba(16, 185, 129, 0.10);
      border-radius: 10px;
      margin: 12px 1.5rem 0;
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #0F172A;
      box-shadow: 0 6px 18px rgba(0,0,0,0.06);
    `;
    target.appendChild(div);
    setTimeout(() => div.remove(), 2500);
  }
}

// ----------------------
// Boot (multi-page safe)
// ----------------------
function initNeuralPageIfPresent() {
  // If this page doesn't have neural elements, do nothing
  if (!elExists('neuralPage') && !elExists('nnTrainingChart') && !elExists('neuralVisualization')) return;

  ensureBackgroundCSS();
  createMatrixRain();
  createDataFlow();
  initNNTrainingChart();

  // Create global instance for inline onclick handlers in HTML
  window.neuralNetwork = new LiveNeuralNetwork();

  // Seed metrics
  safeSetText('nnLoss', '0.00');
  safeSetText('nnEpoch', '0');
  safeSetText('nnAccuracy', '0');
}

document.addEventListener('DOMContentLoaded', initNeuralPageIfPresent);
