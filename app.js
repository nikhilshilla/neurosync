// ========= Performance knobs =========
const CFG = {
    floatingDots: 40,
    dataFlowH: 6,
    dataFlowV: 8,
    neuralCell: 90,
    enable3DRotation: false,
    metricUpdateMs: 15000
};

let performanceChart, resourceChart;
let isMobileMenuOpen = false;

/* ===========================
   ENVIRONMENT CONFIGURATION
   =========================== */

// Detect environment (local vs Vercel)
const isVercel = window.location.hostname.includes('vercel.app');
const API_BASE_URL = isVercel ? '' : 'http://localhost:3001';
const API_ENDPOINT = `${API_BASE_URL}/api/chat`;

// Groq model
const GROQ_MODEL = "llama-3.1-8b-instant";

// Debug info
console.log(`🌍 Environment: ${isVercel ? 'Vercel Production' : 'Local Development'}`);
console.log(`📡 API Endpoint: ${API_ENDPOINT}`);

/* ===========================
   Mobile Navigation Functions
   =========================== */

function initializeMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    const headerActions = document.getElementById('headerActions');

    if (!menuToggle || !navLinks || !headerActions) {
        console.error('Mobile menu elements not found');
        return;
    }

    // Add click event to toggle button
    menuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleMobileMenu();
    });

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768 && isMobileMenuOpen) {
                toggleMobileMenu();
            }
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (isMobileMenuOpen &&
            !navLinks.contains(e.target) &&
            !menuToggle.contains(e.target)) {
            toggleMobileMenu();
        }
    });

    // Close mobile menu on window resize if switching to desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && isMobileMenuOpen) {
            toggleMobileMenu();
        }
    });
}

function toggleMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    const headerActions = document.getElementById('headerActions');

    isMobileMenuOpen = !isMobileMenuOpen;

    if (isMobileMenuOpen) {
        navLinks.classList.add('mobile-active');
        headerActions.classList.add('mobile-active');
        menuToggle.innerHTML = '<i class="fas fa-times"></i>';
        menuToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    } else {
        navLinks.classList.remove('mobile-active');
        headerActions.classList.remove('mobile-active');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }
}

/* ===========================
   Chart Functions
   =========================== */

function initializeCharts() {
    const perfCanvas = document.getElementById('performanceChart');
    const resCanvas = document.getElementById('resourceChart');
    if (!perfCanvas || !resCanvas) return;

    const perfCtx = perfCanvas.getContext('2d');
    const resCtx = resCanvas.getContext('2d');

    performanceChart = new Chart(perfCtx, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '00:00'],
            datasets: [{
                    label: 'CPU Usage',
                    data: [65, 70, 85, 82, 78, 88, 75],
                    borderColor: '#2563EB',
                    backgroundColor: 'rgba(37, 99, 235, 0.10)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                },
                {
                    label: 'Memory Usage',
                    data: [45, 52, 60, 58, 62, 70, 65],
                    borderColor: '#7C3AED',
                    backgroundColor: 'rgba(124, 58, 237, 0.10)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#0F172A',
                        font: {
                            family: 'Inter',
                            size: 12
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#E2E8F0',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748B',
                        font: {
                            family: 'Inter',
                            size: 11
                        }
                    }
                },
                x: {
                    grid: {
                        color: '#E2E8F0',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748B',
                        font: {
                            family: 'Inter',
                            size: 11
                        }
                    }
                }
            }
        }
    });

    resourceChart = new Chart(resCtx, {
        type: 'doughnut',
        data: {
            labels: ['AI Processing', 'Data Storage', 'Model Training', 'Security'],
            datasets: [{
                data: [45, 25, 20, 10],
                backgroundColor: ['#2563EB', '#7C3AED', '#06B6D4', '#10B981'],
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#0F172A',
                        font: {
                            family: 'Inter',
                            size: 12
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value}% (${percentage}% of total)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

/* ===========================
   Grid Creation Functions
   =========================== */

function createFloatingGrid() {
    const grid = document.getElementById('floatingGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < CFG.floatingDots; i++) {
        const el = document.createElement('div');
        el.className = 'grid-element';
        el.style.left = (Math.random() * 100) + '%';
        el.style.top = (Math.random() * 100) + '%';
        el.style.animationDelay = (Math.random() * 10) + 's';
        grid.appendChild(el);
    }
}

function createDataFlowGrid() {
    const grid = document.getElementById('dataFlowGrid');
    if (!grid) return;
    grid.innerHTML = '';

    for (let i = 0; i < CFG.dataFlowH; i++) {
        const line = document.createElement('div');
        line.className = 'grid-line horizontal';
        line.style.top = ((i + 1) * (100 / (CFG.dataFlowH + 1))) + '%';
        line.style.animationDelay = (i * 0.25) + 's';
        grid.appendChild(line);
    }
    for (let i = 0; i < CFG.dataFlowV; i++) {
        const line = document.createElement('div');
        line.className = 'grid-line vertical';
        line.style.left = ((i + 1) * (100 / (CFG.dataFlowV + 1))) + '%';
        line.style.animationDelay = (i * 0.18) + 's';
        grid.appendChild(line);
    }
}

function createNeuralGrid() {
    const grid = document.getElementById('neuralGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const container = document.body;
    const cols = Math.max(1, Math.floor(container.offsetWidth / CFG.neuralCell));
    const rows = Math.max(1, Math.floor(container.offsetHeight / CFG.neuralCell));

    const maxNodes = 120;
    let count = 0;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (count++ > maxNodes) return;
            const node = document.createElement('div');
            node.className = 'neural-node';

            const connection = document.createElement('div');
            connection.className = 'node-connection';
            connection.style.animationDelay = ((r + c) * 0.12) + 's';

            const core = document.createElement('div');
            core.className = 'node-core';
            core.style.animationDelay = ((r + c) * 0.08) + 's';

            node.appendChild(connection);
            node.appendChild(core);
            grid.appendChild(node);
        }
    }
}

function create3DNeuralNetwork() {
  const container = document.getElementById("neuralAnimation");
  if (!container) return;
  container.innerHTML = "";

  // Calculate responsive positions based on container width
  const containerWidth = container.offsetWidth;

  // Responsive layer positions
  const layers = [
    { neurons: 4, x: containerWidth * 0.1 },
    { neurons: 3, x: containerWidth * 0.3 },
    { neurons: 3, x: containerWidth * 0.5 },
    { neurons: 3, x: containerWidth * 0.7 },
    { neurons: 4, x: containerWidth * 0.9 },
  ];

  layers.forEach((layer, layerIndex) => {
    const layerDiv = document.createElement("div");
    layerDiv.className = "layer";
    layerDiv.style.width = "100%";
    layerDiv.style.height = "100%";
    layerDiv.style.left = `${layer.x}px`;

    const neuronPositions = [];
    const containerHeight = container.offsetHeight;
    const neuronSpacing = containerHeight / (layer.neurons + 1);

    for (let i = 0; i < layer.neurons; i++) {
      const neuron = document.createElement("div");
      neuron.className = "neuron-3d";
      neuron.style.animationDelay = layerIndex * 0.2 + i * 0.1 + "s";

      const yPos = neuronSpacing * (i + 1);
      neuron.style.transform = `translateY(${yPos}px)`;
      neuronPositions.push(yPos);

      layerDiv.appendChild(neuron);
    }

    if (layerIndex < layers.length - 1) {
      const nextLayer = layers[layerIndex + 1];
      for (let i = 0; i < layer.neurons; i++) {
        for (let j = 0; j < nextLayer.neurons; j++) {
          const connection = document.createElement("div");
          connection.className = "connection-3d";

          const dx = nextLayer.x - layer.x;
          const dy = neuronSpacing * (j + 1) - neuronPositions[i];
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);

          connection.style.width = length + "px";
          connection.style.transform = `rotate(${angle}deg)`;
          connection.style.left = "0px";
          connection.style.top = neuronPositions[i] + "px";
          connection.style.animationDelay = Math.random() * 2 + "s";

          layerDiv.appendChild(connection);
        }
      }
    }

    container.appendChild(layerDiv);
  });

  if (CFG.enable3DRotation) {
    let angle = 0;
    const tick = () => {
      angle = (angle + 0.08) % 360;
      container.style.transform = `perspective(1000px) rotateY(${angle}deg)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

/* ===========================
   Modal Functions
   =========================== */

function openDemo() {
    const modal = document.getElementById('demoModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeDemo() {
    const modal = document.getElementById('demoModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function startAIDemo() {
    closeDemo();
    const chatInput = document.getElementById('chatInput');
    if (chatInput) chatInput.focus();
    const aiChatSection = document.querySelector('.ai-chat-section');
    if (aiChatSection) aiChatSection.scrollIntoView({ behavior: 'smooth' });
}

function startNeuralTraining() {
    closeDemo();
    window.location.href = "neural.html";
}

function openCryptographyLab() {
    window.location.href = "./cryptography.html";
}

function openAIChat() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) chatInput.focus();
    const aiChatSection = document.querySelector('.ai-chat-section');
    if (aiChatSection) aiChatSection.scrollIntoView({ behavior: 'smooth' });
}

/* ===========================
   Notification Functions
   =========================== */

function showNotification(message, type = 'info') {
    const colors = {
        info: { bg: 'var(--primary)', border: '#2563EB' },
        success: { bg: '#10B981', border: '#059669' },
        warning: { bg: '#F59E0B', border: '#D97706' },
        error: { bg: '#EF4444', border: '#DC2626' }
    };

    const color = colors[type] || colors.info;

    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${color.bg};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        border-left: 4px solid ${color.border};
        z-index: 10000;
        transform: translateX(120%);
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        max-width: 300px;
        font-family: Inter, sans-serif;
        font-size: 0.95rem;
        font-weight: 500;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/* ===========================
   Chat UI Functions
   =========================== */

function addChatBubble(role, text, thinking = false) {
    const chat = document.getElementById('chatMessages');
    if (!chat) return null;

    const wrap = document.createElement('div');
    wrap.className = 'message ' + (role === 'ai' ? 'ai' : 'user');

    if (thinking) {
        wrap.classList.add('thinking');
    }

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = role === 'ai' ?
        '<i class="fas fa-robot"></i>' :
        '<i class="fas fa-user"></i>';

    const content = document.createElement('div');
    content.className = 'message-content';

    if (thinking) {
        // Create thinking animation
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'thinking-indicator';
        thinkingDiv.innerHTML = `
            <span class="thinking-dot"></span>
            <span class="thinking-dot"></span>
            <span class="thinking-dot"></span>
        `;
        content.appendChild(thinkingDiv);
    } else {
        content.textContent = text;

        // Add timestamp
        const time = document.createElement('span');
        time.className = 'message-time';
        time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        content.appendChild(time);
    }

    wrap.appendChild(avatar);
    wrap.appendChild(content);
    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;

    return wrap;
}

async function sendAIMessage() {
    const input = document.getElementById('chatInput');
    const chat = document.getElementById('chatMessages');
    if (!input || !chat) return;

    const text = input.value.trim();
    if (!text) return;

    // Add user message
    addChatBubble('user', text);
    input.value = '';

    // Add thinking indicator
    const thinkingBubble = addChatBubble('ai', '', true);

    try {
        console.log(`📤 Sending message to: ${API_ENDPOINT}`);

        // Prepare messages array matching your server.js format
        const messages = [{
                role: "system",
                content: `You are NEURALSYNC AI Assistant, an expert in:
                - Neural Networks and Deep Learning
                - Blockchain Technology and Cryptocurrencies
                - Cryptography and Cybersecurity
                - Machine Learning Algorithms
                - AI Ethics and Implementation
                - Data Science and Analytics
                
                Provide clear, technical explanations with practical examples when relevant.
                Format responses for readability with bullet points or numbered steps.
                Keep responses concise but informative (300-500 words max).
                Always maintain a helpful, professional tone.`
            },
            {
                role: "user",
                content: text
            }
        ];

        const response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                messages: messages,
                model: GROQ_MODEL
            })
        });

        console.log(`📥 Response status: ${response.status}`);

        // Remove thinking bubble
        if (thinkingBubble) thinkingBubble.remove();

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);

            let errorMessage;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || errorData.details || 'Unknown error';
            } catch {
                errorMessage = `HTTP ${response.status}: ${errorText}`;
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('✅ AI Response received:', data);

        // Extract AI response from Groq format
        let reply;
        if (data.choices && data.choices[0] && data.choices[0].message) {
            reply = data.choices[0].message.content;
        } else if (data.response) {
            reply = data.response;
        } else {
            reply = "I received an unexpected response format. Please try again.";
        }

        // Add AI response
        addChatBubble('ai', reply);

        // Show success notification
        showNotification('AI response received successfully!', 'success');

    } catch (error) {
        console.error('❌ Chat error:', error);

        if (thinkingBubble) thinkingBubble.remove();

        // User-friendly error messages
        let errorMessage;
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = isVercel ?
                'Unable to connect to AI service. Please check your internet connection.' :
                `⚠️ Local backend not running. Start it with: 
                1. Open terminal
                2. cd backend
                3. npm start`;
        } else if (error.message.includes('GROQ_API_KEY')) {
            errorMessage = 'API key configuration error. Please contact support.';
        } else {
            errorMessage = `Error: ${error.message}`;
        }

        addChatBubble('ai', errorMessage);

        // Show notification for local dev
        if (!isVercel) {
            showNotification('Start local backend: cd backend && npm start', 'warning');
        }
    }
}

/* ===========================
   Performance Functions
   =========================== */

// Throttled scroll
let lastScrollRun = 0;
window.addEventListener('scroll', () => {
    const now = performance.now();
    if (now - lastScrollRun < 60) return;
    lastScrollRun = now;

    const scrolled = window.pageYOffset || document.documentElement.scrollTop;
    const rate = scrolled * -0.25;

    document.querySelectorAll('.grid-background, .hero-grid-overlay').forEach(el => {
        el.style.transform = `translateY(${rate}px)`;
    });
}, { passive: true });

// Debounced resize
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    createNeuralGrid();
    create3DNeuralNetwork(); // Add this line
    if (performanceChart) performanceChart.resize();
    if (resourceChart) resourceChart.resize();
  }, 200);
});

// Demo updates slowed down
function startMetricSimulation() {
    setInterval(() => {
        if (document.hidden) return;

        document.querySelectorAll('.metric-value').forEach(el => {
            if (!el.textContent.includes('.') && !el.textContent.includes('TB') && !el.textContent.includes('ms')) return;

            const text = el.textContent;
            let current;

            if (text.includes('%')) {
                current = parseFloat(text);
                const change = (Math.random() - 0.5) * 0.4;
                const next = Math.min(100, Math.max(90, current + change));
                el.textContent = next.toFixed(1) + '%';
            } else if (text.includes('TB')) {
                current = parseFloat(text);
                const change = (Math.random() * 0.1) + 0.01;
                const next = Math.min(5, Math.max(1, current + change));
                el.textContent = next.toFixed(1) + 'TB';
            } else if (text.includes('ms')) {
                current = parseFloat(text);
                const change = (Math.random() - 0.5) * 5;
                const next = Math.min(200, Math.max(50, current + change));
                el.textContent = Math.round(next) + 'ms';
            } else {
                current = parseFloat(text.replace(/,/g, ''));
                const change = Math.floor(Math.random() * 50) - 25;
                const next = Math.max(1500, current + change);
                el.textContent = next.toLocaleString();
            }

            // Update progress bar
            const progressFill = el.closest('.metric-card');
            if (progressFill) {
                const fillElement = progressFill.querySelector('.progress-fill');
                if (fillElement) {
                    if (text.includes('%')) {
                        fillElement.style.width = parseFloat(el.textContent) + '%';
                    }
                }
            }
        });

        if (performanceChart && performanceChart.data && performanceChart.data.datasets) {
            performanceChart.data.datasets.forEach(ds => {
                ds.data = ds.data.map(() => Math.floor(Math.random() * 30 + 50));
            });
            performanceChart.update('none');
        }

        if (resourceChart && resourceChart.data && resourceChart.data.datasets[0]) {
            const newData = resourceChart.data.datasets[0].data.map(value => {
                const change = (Math.random() - 0.5) * 5;
                return Math.max(5, Math.min(60, value + change));
            });
            // Normalize to sum to 100
            const sum = newData.reduce((a, b) => a + b, 0);
            resourceChart.data.datasets[0].data = newData.map(value => (value / sum) * 100);
            resourceChart.update('none');
        }
    }, CFG.metricUpdateMs);
}

/* ===========================
   Initialize Chat Input
   =========================== */

function initializeChat() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        // Add enter key listener
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAIMessage();
            }
        });

        // Add paste handler for formatting
        chatInput.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        });
    }

    // Add environment indicator
    if (!isVercel) {
        const envIndicator = document.createElement('div');
        envIndicator.id = 'env-indicator';
        envIndicator.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: #F59E0B;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-family: monospace;
            z-index: 9999;
            opacity: 0.9;
        `;
        envIndicator.textContent = '🚧 Local Dev';
        document.body.appendChild(envIndicator);
    }
}

/* ===========================
   Event Listeners & Initialization
   =========================== */

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing NEURALSYNC AI Platform...');

    // Initialize mobile menu
    initializeMobileMenu();

    // Initialize charts
    initializeCharts();

    // Create visual effects
    createFloatingGrid();
    createDataFlowGrid();
    createNeuralGrid();
    create3DNeuralNetwork();

    // Initialize chat
    initializeChat();

    // Start metric simulation
    startMetricSimulation();

    // Welcome notification
    setTimeout(() => {
        showNotification(
            isVercel ?
            'NEURALSYNC deployed on Vercel! AI Assistant ready.' :
            'NEURALSYNC running locally! Start backend with: cd backend && npm start',
            isVercel ? 'success' : 'info'
        );
    }, 1000);

    // Time buttons event listeners
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Modal close on background click
    const modal = document.getElementById('demoModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeDemo();
            }
        });
    }

    console.log('✅ NEURALSYNC initialized successfully!');
    console.log(`📊 Charts: ${performanceChart && resourceChart ? 'Loaded' : 'Failed'}`);
    console.log(`🤖 Chat API: ${API_ENDPOINT}`);
    console.log(`🌐 Environment: ${isVercel ? 'Vercel' : 'Local'}`);
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('demoModal');
        if (modal && modal.classList.contains('active')) {
            closeDemo();
        }
    }
});

// Add CSS for thinking animation
const style = document.createElement('style');
style.textContent = `
    .thinking-indicator {
        display: flex;
        gap: 4px;
        align-items: center;
    }
    
    .thinking-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--primary);
        animation: pulse 1.5s infinite ease-in-out;
    }
    
    .thinking-dot:nth-child(2) {
        animation-delay: 0.2s;
    }
    
    .thinking-dot:nth-child(3) {
        animation-delay: 0.4s;
    }
    
    @keyframes pulse {
        0%, 100% {
            opacity: 0.4;
            transform: scale(0.8);
        }
        50% {
            opacity: 1;
            transform: scale(1);
        }
    }
    
    .message.thinking .message-content {
        min-height: 24px;
        display: flex;
        align-items: center;
    }
`;
document.head.appendChild(style);