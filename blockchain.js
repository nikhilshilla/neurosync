/* blockchain.js — multi-page safe blockchain PoW demo
   Expects the HTML ids:
   blockHeight, miningDifficulty, networkHashrate,
   mineBlockButton, addTransactionButton, validateChainButton,
   transactionStatus, blockchainChart, blockchainVisual,
   miningProgress, currentNonce, currentHash
*/

'use strict';

// ----------------------
// Helpers (fallbacks if not present)
// ----------------------
const _has$ = typeof window.$ === 'function';
const $ = _has$ ? window.$ : (id) => document.getElementById(id);

const safeSetText = typeof window.safeSetText === 'function'
  ? window.safeSetText
  : (id, value) => { const el = $(id); if (el) el.textContent = value; };

const delay = typeof window.delay === 'function'
  ? window.delay
  : (ms) => new Promise((r) => setTimeout(r, ms));

function elExists(id) {
  return !!document.getElementById(id);
}

// ----------------------
// Chart init
// ----------------------
function initBlockchainChart() {
  const canvas = $('blockchainChart');
  if (!canvas) return;

  if (typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');

  if (window.blockchainChart) {
    try { window.blockchainChart.destroy(); } catch (_) {}
  }

  window.blockchainChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Block Height',
          data: [],
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37,99,235,0.10)',
          tension: 0.35,
          fill: true,
          pointRadius: 0,
          borderWidth: 2
        },
        {
          label: 'Hashrate (H/s)',
          data: [],
          borderColor: '#7C3AED',
          backgroundColor: 'rgba(124,58,237,0.08)',
          tension: 0.35,
          fill: false,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      plugins: {
        legend: {
          labels: { color: '#0F172A', font: { family: 'Inter' } }
        }
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
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          ticks: { color: '#64748B', font: { family: 'Inter' } },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

function pushChartPoint(height, hashrate) {
  if (!window.blockchainChart) return;

  const t = new Date();
  const label = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`;

  window.blockchainChart.data.labels.push(label);
  window.blockchainChart.data.datasets[0].data.push(height);
  window.blockchainChart.data.datasets[1].data.push(hashrate);

  // cap points
  if (window.blockchainChart.data.labels.length > 30) {
    window.blockchainChart.data.labels.shift();
    window.blockchainChart.data.datasets.forEach(ds => ds.data.shift());
  }

  window.blockchainChart.update();
}

// ----------------------
// Optional background effects (if you want)
// ----------------------
function createMatrixRain() {
  const rain = $('matrixRain');
  if (!rain || rain.dataset.ready === '1') return;
  rain.dataset.ready = '1';

  const cols = 30;
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
  if (!container || container.dataset.ready === '1') return;
  container.dataset.ready = '1';

  const count = 22;
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

function ensureBackgroundCSS() {
  if (document.getElementById('blockchain-bg-style')) return;

  const style = document.createElement('style');
  style.id = 'blockchain-bg-style';
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
// Working Blockchain with PoW
// ----------------------
class WorkingBlockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.difficulty = 4;
    this.isMining = false;

    safeSetText('miningDifficulty', this.difficulty);
    safeSetText('blockHeight', this.chain.length);
    safeSetText('networkHashrate', '0');

    this.updateVisualization();
    this._tickChartTimer();
  }

  createGenesisBlock() {
    const ts = Date.now();
    return {
      index: 0,
      timestamp: ts,
      data: 'Genesis Block',
      previousHash: '0',
      hash: this.calculateHash(0, ts, 'Genesis Block', '0', 0),
      nonce: 0
    };
  }

  calculateHash(index, timestamp, data, previousHash, nonce) {
    // demo hash (fast, deterministic, not cryptographically secure)
    const input = `${index}${timestamp}${data}${previousHash}${nonce}`;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  _powPrefix() {
    return '0'.repeat(this.difficulty);
  }

  _setMiningUI(isMining) {
    const btn = $('mineBlockButton');
    if (!btn) return;

    if (isMining) {
      btn.classList.add('working');
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mining...';
      btn.disabled = true;
    } else {
      btn.classList.remove('working');
      btn.innerHTML = '<i class="fas fa-hammer"></i> Mine Block';
      btn.disabled = false;
    }
  }

  _updateMiningProgress(nonce) {
    const progress = $('miningProgress');
    if (progress) progress.style.width = `${(nonce % 10000) / 100}%`;
  }

  async mineBlock() {
    if (this.isMining) return;

    this.isMining = true;
    this._setMiningUI(true);

    const prev = this.chain[this.chain.length - 1];
    const prefix = this._powPrefix();

    let nonce = 0;
    let hash = '';
    let hashesThisSecond = 0;
    let lastSecond = Date.now();

    const startTs = Date.now();

    // Mine in chunks so UI stays responsive
    const CHUNK = 4000;

    while (this.isMining) {
      const ts = Date.now();
      const dataStr = JSON.stringify(this.pendingTransactions);

      for (let i = 0; i < CHUNK; i++) {
        hash = this.calculateHash(this.chain.length, ts, dataStr, prev.hash, nonce);
        nonce++;
        hashesThisSecond++;

        // Update visible counters a bit, not on every hash (cheaper)
        if (nonce % 300 === 0) {
          safeSetText('currentNonce', nonce);
          safeSetText('currentHash', `${hash.substring(0, 16)}...`);
          this._updateMiningProgress(nonce);
        }

        if (hash.startsWith(prefix)) {
          const newBlock = {
            index: this.chain.length,
            timestamp: ts,
            data: dataStr,
            previousHash: prev.hash,
            hash,
            nonce
          };

          this.chain.push(newBlock);
          this.pendingTransactions = [];

          safeSetText('blockHeight', this.chain.length);
          safeSetText('currentNonce', nonce);
          safeSetText('currentHash', `${hash.substring(0, 16)}...`);

          const endTs = Date.now();
          const elapsed = Math.max(1, endTs - startTs);
          const approxHashrate = Math.round((nonce / elapsed) * 1000);
          safeSetText('networkHashrate', approxHashrate.toLocaleString());

          this.updateVisualization();
          this.showTransaction('Block Mined Successfully!', 'success');

          const progress2 = $('miningProgress');
          if (progress2) {
            progress2.style.width = '100%';
            setTimeout(() => (progress2.style.width = '0'), 1200);
          }

          pushChartPoint(this.chain.length, approxHashrate);

          this.isMining = false;
          this._setMiningUI(false);
          return;
        }

        const now = Date.now();
        if (now - lastSecond >= 1000) {
          safeSetText('networkHashrate', hashesThisSecond.toLocaleString());
          hashesThisSecond = 0;
          lastSecond = now;
        }
      }

      // Yield to the browser to keep UI smooth (per-frame scheduling) [page:1]
      await new Promise((r) => requestAnimationFrame(r));
    }

    this.isMining = false;
    this._setMiningUI(false);
  }

  addTransaction() {
    const btn = $('addTransactionButton');
    if (btn) btn.classList.add('working');

    const txTypes = [
      'AI Model Training Data',
      'Neural Network Weights',
      'Crypto Key Exchange',
      'Smart Contract Execution',
      'Data Processing Job'
    ];
    const randomTx = txTypes[Math.floor(Math.random() * txTypes.length)];

    const tx = {
      id: Math.random().toString(36).slice(2, 11),
      type: randomTx,
      timestamp: Date.now(),
      data: `Transaction #${this.pendingTransactions.length + 1}`
    };

    this.pendingTransactions.push(tx);
    this.showTransaction(`Added: ${randomTx}`, 'info');

    // small visual ping if present
    const visual = $('blockchainVisual');
    if (visual) {
      const anim = document.createElement('div');
      anim.className = 'transaction-animation';
      anim.style.cssText = `
        height: 6px;
        border-radius: 999px;
        background: linear-gradient(90deg, rgba(37,99,235,0.0), rgba(37,99,235,0.35), rgba(124,58,237,0.25), rgba(37,99,235,0.0));
        margin: 10px 0;
        animation: txPulse 0.9s ease;
      `;
      visual.prepend(anim);
      setTimeout(() => anim.remove(), 900);

      if (!document.getElementById('txPulseStyle')) {
        const s = document.createElement('style');
        s.id = 'txPulseStyle';
        s.textContent = `
          @keyframes txPulse{
            0%{ transform: scaleX(0.3); opacity: 0; }
            30%{ opacity: 1; }
            100%{ transform: scaleX(1); opacity: 0; }
          }
        `;
        document.head.appendChild(s);
      }
    }

    setTimeout(() => {
      if (btn) btn.classList.remove('working');
    }, 600);
  }

  validateChain() {
    const btn = $('validateChainButton');
    if (btn) {
      btn.classList.add('working');
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validating...';
    }

    setTimeout(() => {
      let valid = true;

      for (let i = 1; i < this.chain.length; i++) {
        const cur = this.chain[i];
        const prev = this.chain[i - 1];

        // verify linkage
        if (cur.previousHash !== prev.hash) {
          valid = false;
          break;
        }

        // verify stored hash matches recompute (basic integrity)
        const recomputed = this.calculateHash(cur.index, cur.timestamp, cur.data, cur.previousHash, cur.nonce);
        if (recomputed !== cur.hash) {
          valid = false;
          break;
        }
      }

      if (btn) {
        btn.classList.remove('working');
        btn.innerHTML = '<i class="fas fa-check"></i> Validate Chain';
      }

      this.showTransaction(valid ? 'Blockchain Valid!' : 'Blockchain Invalid!', valid ? 'success' : 'error');
    }, 900);
  }

  showTransaction(message, type) {
    const status = $('transactionStatus');
    if (!status) return;

    status.classList.remove('ok', 'warn', 'err');

    const palette = {
      success: { cls: 'ok', icon: 'fa-check', color: '#10B981' },
      error: { cls: 'err', icon: 'fa-times', color: '#EF4444' },
      info: { cls: 'warn', icon: 'fa-info-circle', color: '#2563EB' }
    };

    const p = palette[type] || palette.info;

    status.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <i class="fas ${p.icon}" style="color:${p.color}"></i>
        <span>${message}</span>
      </div>
    `;
    status.style.display = 'block';
    status.classList.add(p.cls);

    setTimeout(() => (status.style.display = 'none'), 2500);
  }

  updateVisualization() {
    const container = $('blockchainVisual');
    if (!container) return;

    container.innerHTML = '';

    this.chain.forEach((block) => {
      const blockDiv = document.createElement('div');
      blockDiv.className = 'block-3d';

      let txCount = 0;
      if (block.index !== 0) {
        try {
          txCount = JSON.parse(block.data)?.length || 0;
        } catch (_) {
          txCount = 0;
        }
      }

      // Keep it mostly consistent with your original structure,
      // but slightly more theme-friendly text colors.
      blockDiv.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="
              width:34px; height:34px;
              background: linear-gradient(135deg, #00dbde, #fc00ff);
              border-radius: 50%;
              display:flex; align-items:center; justify-content:center;
              font-weight: 800; color: #fff;
            ">
            ${block.index}
          </div>

          <div style="flex:1;">
            <div style="font-weight:800; color:#0F172A;">${block.index === 0 ? 'Genesis Block' : `Block ${block.index}`}</div>
            <div style="font-size:0.8rem; color:#64748B; word-break:break-all;">
              ${block.hash}
            </div>
            <div style="font-size:0.75rem; margin-top:6px; color:#475569;">
              Nonce: ${block.nonce} • Transactions: ${txCount}
            </div>
          </div>
        </div>
      `;

      container.appendChild(blockDiv);
    });

    container.scrollTop = container.scrollHeight;
  }

  _tickChartTimer() {
    // Add a periodic chart point even if not mining,
    // so UI doesn't feel "dead".
    setInterval(() => {
      const height = this.chain.length;
      const hStr = ($('networkHashrate') && $('networkHashrate').textContent) ? $('networkHashrate').textContent : '0';
      const hashrate = parseInt(String(hStr).replace(/,/g, ''), 10) || 0;
      pushChartPoint(height, hashrate);
    }, 5000);
  }
}

// ----------------------
// Boot (multi-page safe)
// ----------------------
function initBlockchainPageIfPresent() {
  if (!elExists('blockchainPage') && !elExists('blockchainVisual') && !elExists('blockchainChart')) return;

  ensureBackgroundCSS();
  createMatrixRain();
  createDataFlow();
  initBlockchainChart();

  // expose globally for inline onclick handlers
  window.blockchain = new WorkingBlockchain();
}

document.addEventListener('DOMContentLoaded', initBlockchainPageIfPresent);
