const state = {
  currentView: 'overview',
  viewHistory: [],
  metricIndex: {
    triton: 0,
    ignis: 0,
    lumen: 0
  },
  shutdownActive: false
};

const devices = {
  triton: {
    name: 'Triton',
    subtitle: 'Water gauge app',
    icon: '💧',
    accent: 'var(--water)',
    reading: '142 L',
    status: 'Healthy flow',
    description: 'Triton watches water pressure, consumption, and leak risk in real time.',
    summary: 'No pressure fluctuation detected.',
    gauges: [
      {
        label: 'Pressure',
        value: 3.4,
        unit: 'bar',
        max: 5,
        summary: 'Pressure is holding firm',
        detail: 'No fluctuation detected in the main feed.'
      },
      {
        label: 'Usage',
        value: 142,
        unit: 'L',
        max: 220,
        summary: 'Daily water draw',
        detail: 'Running below your household target by 14%.'
      },
      {
        label: 'Flow',
        value: 0.78,
        unit: 'L/s',
        max: 1.4,
        summary: 'Current flow rate',
        detail: 'Shower and irrigation are both in a safe range.'
      }
    ]
  },
  ignis: {
    name: 'Ignis',
    subtitle: 'Gas gauge app',
    icon: '🔥',
    accent: 'var(--gas)',
    reading: '7.2 m³',
    status: 'Normal usage',
    description: 'Ignis tracks gas flow patterns and warns about unusual activity.',
    summary: 'Slight increase during evening cooking.',
    gauges: [
      {
        label: 'Flow',
        value: 1.8,
        unit: 'm³/hr',
        max: 3,
        summary: 'Current gas flow',
        detail: 'Burner demand is steady and within normal levels.'
      },
      {
        label: 'Usage',
        value: 7.2,
        unit: 'm³',
        max: 10,
        summary: 'Weekly gas usage',
        detail: 'Usage is pacing below the expected weekly average.'
      },
      {
        label: 'Efficiency',
        value: 94,
        unit: '%',
        max: 100,
        summary: 'Combustion efficiency',
        detail: 'Heat transfer remains efficient across the system.'
      }
    ]
  },
  lumen: {
    name: 'Lumen',
    subtitle: 'Electric gauge app',
    icon: '⚡',
    accent: 'var(--electric)',
    reading: '16.8 kWh',
    status: 'Eco mode',
    description: 'Lumen measures power draw and automatically adjusts energy usage.',
    summary: 'Energy usage is trending below target.',
    gauges: [
      {
        label: 'Load',
        value: 3.4,
        unit: 'kW',
        max: 5,
        summary: 'Live power draw',
        detail: 'The home is drawing a modest load during the current hour.'
      },
      {
        label: 'Usage',
        value: 16.8,
        unit: 'kWh',
        max: 24,
        summary: 'Daily energy usage',
        detail: 'Consumption is trending below the target for the day.'
      },
      {
        label: 'Efficiency',
        value: 92,
        unit: '%',
        max: 100,
        summary: 'System efficiency',
        detail: 'Eco mode is balancing output with comfort and savings.'
      }
    ]
  }
};

const alerts = [
  { device: 'Triton', title: 'Pressure dip detected', severity: 'critical', detail: 'Water pressure dipped below the safe operating envelope in the west corridor.', impact: 'High', action: 'Inspect valve and leak sensors' },
  { device: 'Triton', title: 'Hidden leak risk', severity: 'warning', detail: 'Moisture signature increased along the kitchen manifold.', impact: 'Medium', action: 'Check under-sink lines' },
  { device: 'Ignis', title: 'Unusual burner pattern', severity: 'warning', detail: 'Gas flow spiked during a short interval after midnight.', impact: 'Medium', action: 'Review appliance activity' },
  { device: 'Ignis', title: 'Sensor drift noted', severity: 'info', detail: 'One gas detector reported a brief offset before reconnecting.', impact: 'Low', action: 'Recalibrate detector' },
  { device: 'Lumen', title: 'Power surge window', severity: 'warning', detail: 'A short load spike appeared while HVAC restarted.', impact: 'Medium', action: 'Check HVAC startup current' },
  { device: 'Lumen', title: 'Efficiency drift', severity: 'info', detail: 'Charging loads are slightly above the expected baseline.', impact: 'Low', action: 'Shift non-urgent loads' },
  { device: 'Atlas', title: 'Backup battery reserve down', severity: 'warning', detail: 'Reserve capacity is below the preferred threshold for extended outages.', impact: 'Medium', action: 'Prioritize charging schedule' },
  { device: 'Atlas', title: 'Weather alert overlap', severity: 'info', detail: 'Storm conditions may increase peak demand across the home.', impact: 'Low', action: 'Prepare contingency plan' },
  { device: 'Atlas', title: 'Router handoff delay', severity: 'warning', detail: 'A brief mesh handoff delay affected one sensor heartbeat.', impact: 'Low', action: 'Inspect mesh node health' },
  { device: 'Triton', title: 'Filter saturation nearing limit', severity: 'warning', detail: 'Filtration pressure suggests the cartridge may need replacement soon.', impact: 'Medium', action: 'Schedule maintenance' }
];

const appView = document.getElementById('app-view');

// =============================================================
// SMART MONITOR TUNING
// Edit this block only if you want to change how the ring state
// is interpreted. Keep the underlying sensor data and range logic intact.
// =============================================================
const smartMonitorThresholds = {
  default: { minSafe: 0, maxSafe: 0.8, warningMin: 0.55, warningMax: 0.92, criticalMax: 1 },
  pressure: { minSafe: 1.4, maxSafe: 4.5, warningMin: 0.9, warningMax: 4.8, criticalMax: 5 },
  flow: { minSafe: 0.35, maxSafe: 1.05, warningMin: 0.2, warningMax: 1.2, criticalMax: 1.4 },
  usage: { minSafe: 0.2, maxSafe: 0.85, warningMin: 0.1, warningMax: 0.95, criticalMax: 1 },
  efficiency: { minSafe: 0.55, maxSafe: 1, warningMin: 0.45, warningMax: 0.98, criticalMax: 1 }
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// =============================================================
// RING FILL CALCULATION
// This converts the current reading into a percentage for the SVG ring.
// Keep the same min/max source values from the live sensor data.
// =============================================================
function getRingFillPercent(value, min, max) {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max === min) {
    return 0;
  }

  const ratio = (value - min) / (max - min);
  return Math.round(clamp(ratio, 0, 1) * 100);
}

// =============================================================
// STATUS CLASSIFICATION
// Maps the live reading into normal / warning / critical / offline states.
// The existing application text labels are still preserved.
// =============================================================
function getStatusClass(value, max, statusLabel) {
  const normalized = value / max;
  if (statusLabel && statusLabel.toLowerCase().includes('critical')) {
    return 'critical';
  }

  if (statusLabel && statusLabel.toLowerCase().includes('warning')) {
    return 'warning';
  }

  if (statusLabel && statusLabel.toLowerCase().includes('offline')) {
    return 'offline';
  }

  if (normalized >= 0.9) {
    return 'critical';
  }

  if (normalized >= 0.72) {
    return 'warning';
  }

  return 'normal';
}

// =============================================================
// RING COLOR PALETTE
// Controls the LED ring colors for each condition.
// Edit these accent and label values if you want a cleaner look.
// =============================================================
function getRingPalette(statusClass) {
  const palette = {
    normal: {
      accent: '#4fdcff',
      inactive: 'rgba(126, 151, 183, 0.26)',
      label: 'NORMAL',
      glow: 'rgba(79, 220, 255, 0.32)'
    },
    warning: {
      accent: '#ffb454',
      inactive: 'rgba(136, 149, 175, 0.26)',
      label: 'WARNING',
      glow: 'rgba(255, 180, 84, 0.32)'
    },
    critical: {
      accent: '#ff5d6c',
      inactive: 'rgba(136, 149, 175, 0.26)',
      label: 'CRITICAL',
      glow: 'rgba(255, 93, 108, 0.32)'
    },
    offline: {
      accent: '#7d8899',
      inactive: 'rgba(94, 106, 128, 0.28)',
      label: 'OFFLINE',
      glow: 'rgba(125, 136, 153, 0.3)'
    },
    unknown: {
      accent: '#6f7d96',
      inactive: 'rgba(111, 125, 150, 0.28)',
      label: 'UNKNOWN',
      glow: 'rgba(111, 125, 150, 0.24)'
    }
  };

  return palette[statusClass] || palette.unknown;
}

// =============================================================
// TOP STATUS ICON
// This controls the small top-center connectivity symbol.
// Change the SVG mappings here if you want a different icon set.
// =============================================================
function getConnectionIcon(connectionStatus = 'connected') {
  const iconMap = {
    connected: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12a14 14 0 0 1 14 0"/><path d="M8.5 15.5a8.5 8.5 0 0 1 7 0"/><path d="M12 19v0"/></svg>',
    weak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5a18 18 0 0 1 18 0"/><path d="M6.5 13a12 12 0 0 1 11 0"/><path d="M10.5 16.5a6 6 0 0 1 3 0"/></svg>',
    offline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M7 12a10 10 0 0 1 10 0"/><path d="M10 15.5a4 4 0 0 1 4 0"/></svg>',
    bluetooth: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7l10 10-5 5V2l5 5L7 17"/></svg>',
    cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18h9a4 4 0 0 0 .5-7.98A6 6 0 0 0 6.4 9.5 4.4 4.4 0 0 0 7 18z"/></svg>',
    sensor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M4 10h16"/><path d="M4 14h16"/><circle cx="12" cy="12" r="2"/></svg>'
  };

  return iconMap[connectionStatus] || iconMap.connected;
}

function polarToCartesian(cx, cy, radius, angle) {
  const radians = (angle - 90) * (Math.PI / 180);
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians)
  };
}

function pathArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

// =============================================================
// SVG SEGMENTED RING
// This is the live circular LED ring rendered with SVG paths.
// Increase or decrease the segment count to make the ring feel tighter
// or more dense while keeping the same data-driven behavior.
// =============================================================
function buildSegmentedRingMarkup(fillPercent, statusClass) {
  const palette = getRingPalette(statusClass);
  const segmentCount = 56;
  const activeSegments = Math.round((fillPercent / 100) * segmentCount);
  const segmentGap = 360 / segmentCount;
  const radius = 90;

  const segments = Array.from({ length: segmentCount }, (_, index) => {
    const start = index * segmentGap;
    const end = start + segmentGap - 2;
    const isActive = index < activeSegments;
    return `<path d="${pathArc(110, 110, radius, start, end)}" stroke="${isActive ? palette.accent : palette.inactive}" stroke-width="10" fill="none" stroke-linecap="round" />`;
  }).join('');

  return `
    <svg class="smart-monitor-ring" viewBox="0 0 220 220" aria-hidden="true">
      <defs>
        <filter id="smart-glow-${statusClass}">
          <feGaussianBlur stdDeviation="3.6" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#smart-glow-${statusClass})">${segments}</g>
    </svg>
  `;
}

function formatValue(value, unit) {
  if (typeof value === 'number') {
    if (unit === '%' || unit === 'kWh' || unit === 'm³' || unit === 'L') {
      return Number.isInteger(value) ? value : value.toFixed(1);
    }

    return value.toFixed(value < 10 && !Number.isInteger(value) ? 1 : 0);
  }

  return value;
}

// =============================================================
// SMART MONITOR CARD BUILDER
// This is the reusable card template for the new futuristic monitor.
// Pass in the existing value, unit, status, and icon and it will render
// the circular smart-home widget without changing the data source.
// =============================================================
function createSmartMonitorMarkup({
  title,
  value,
  unit,
  min,
  max,
  statusLabel,
  connectionStatus = 'connected',
  icon = '●',
  dataView,
  cardClass = '',
  compact = false,
  detailMode = false
}) {
  const fillPercent = getRingFillPercent(value, min, max);
  const statusClass = getStatusClass(value, max, statusLabel);
  const palette = getRingPalette(statusClass);
  const safeValue = detailMode ? value : formatValue(value, unit);
  const safeUnit = detailMode ? unit : unit;

  return `
    <button class="smart-monitor-card ${cardClass}" data-view="${dataView}">
      <div class="smart-monitor-shell">
        <div class="smart-monitor-outer-housing">
          <div class="smart-monitor-outer-shadow"></div>
          <div class="smart-monitor-bridge"></div>
          <div class="smart-monitor-display">
            ${buildSegmentedRingMarkup(fillPercent, statusClass)}
            <div class="smart-monitor-center-screen">
              <div class="smart-monitor-sensor-icon">${icon}</div>
              <div class="smart-monitor-reading-line">
                <span class="smart-monitor-value">${safeValue}</span>
                <span class="smart-monitor-unit">${safeUnit}</span>
              </div>
              <div class="smart-monitor-measurement-label">${title.toUpperCase()}</div>
              <div class="smart-monitor-state-label">${palette.label}</div>
            </div>
          </div>
        </div>
      </div>
    </button>
  `;
}

function cycleMetric(direction) {
  if (!['triton', 'ignis', 'lumen'].includes(state.currentView)) {
    return;
  }

  const device = devices[state.currentView];
  const currentIndex = state.metricIndex[state.currentView] ?? 0;
  const nextIndex = (currentIndex + direction + device.gauges.length) % device.gauges.length;
  state.metricIndex[state.currentView] = nextIndex;
  render();
}

function navigateToView(view, shouldPushHistory = true) {
  if (view === state.currentView) {
    return;
  }

  if (view === 'overview') {
    state.viewHistory = [];
  } else if (shouldPushHistory) {
    state.viewHistory.push(state.currentView);
  }

  state.currentView = view;
  render();
}

function goBack() {
  if (state.viewHistory.length > 0) {
    state.currentView = state.viewHistory.pop();
  } else {
    state.currentView = 'overview';
  }

  render();
}

// =============================================================
// PAGE RENDERER
// The main HTML output is assembled here, including the overview and
// the per-device detail view. This is where the new monitor cards are
// injected into the existing dashboard flow.
// =============================================================
function render() {
  const shutdownBtn = document.getElementById('shutdown-btn');
  if (shutdownBtn) {
    shutdownBtn.textContent = state.shutdownActive ? 'Shutoff enabled' : 'Shutoff';
    shutdownBtn.classList.toggle('active', state.shutdownActive);
  }

  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.view === state.currentView);
  });

  if (state.currentView === 'overview') {
    appView.innerHTML = `
      <section class="hero-card">
        <div class="hero-copy">
          <p class="eyebrow">Central monitoring system</p>
          <h2>Your connected home is monitored in real time.</h2>
          <p class="hero-text">
            Atlas brings water, gas, and electrical health together into one clear view so you can spot issues early and act with confidence.
          </p>
          <div class="hero-actions">
            <button class="primary-btn" data-view="overview">View home status</button>
            <button class="secondary-btn" data-view="alerts">Review alerts</button>
          </div>
          <div class="hero-badges">
            <span class="pill ${state.shutdownActive ? 'warn' : 'positive'}">${state.shutdownActive ? 'Emergency shutoff active' : 'Healthy & responsive'}</span>
            <span class="pill neutral">Monitoring confidence high</span>
          </div>
        </div>

        <div class="hero-metric">
          <div class="hero-ring" style="--ring-percent: 100; --ring-color: var(--positive);">
            <div class="hero-ring-inner">
              <span>3/3</span>
              <small>systems online</small>
            </div>
          </div>
          <ul>
            <li><strong>Triton</strong> water gauge active</li>
            <li><strong>Ignis</strong> gas gauge synced</li>
            <li><strong>Lumen</strong> electric gauge reporting</li>
          </ul>
        </div>
      </section>

      <section class="section-heading">
        <h3>Connected systems</h3>
        <p>Each terminal reports live data to Atlas so your home stays visible at a glance.</p>
      </section>

      <section class="metrics-grid">
        ${Object.entries(devices)
          .map(([key, item]) => {
            const primaryMetric = item.gauges[0];
            return createSmartMonitorMarkup({
              title: item.name,
              value: primaryMetric.value,
              unit: primaryMetric.unit,
              min: 0,
              max: primaryMetric.max,
              statusLabel: item.status,
              connectionStatus: 'connected',
              icon: item.icon,
              dataView: key,
              cardClass: 'overview-monitor'
            });
          })
          .join('')}
      </section>

      <section class="dashboard-grid">
        <article class="panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Atlas overview</p>
              <h3>Home health snapshot</h3>
            </div>
            <span class="pill positive">Healthy</span>
          </div>
          <div class="status-grid">
            <div class="status-card">
              <h4>Water pressure</h4>
              <p>Stable at 3.4 bar</p>
            </div>
            <div class="status-card">
              <h4>Gas balance</h4>
              <p>Low-risk, normal flow</p>
            </div>
            <div class="status-card">
              <h4>Power draw</h4>
              <p>Efficient and under target</p>
            </div>
          </div>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Atlas alerts</p>
              <h3>Priority alerts</h3>
            </div>
            <button class="secondary-btn compact" data-view="alerts">See all</button>
          </div>
          <ul class="alert-list">
            ${alerts
              .slice(0, 5)
              .map(
                (alert) => `
                  <li>
                    <span class="dot ${alert.severity === 'critical' ? 'green' : alert.severity === 'warning' ? 'amber' : 'blue'}"></span>
                    <div>
                      <strong>${alert.device}: ${alert.title}</strong>
                      <p>${alert.detail}</p>
                    </div>
                  </li>
                `
              )
              .join('')}
          </ul>
        </article>
      </section>
    `;
    return;
  }

  if (state.currentView === 'alerts') {
    appView.innerHTML = `
      <section class="detail-card">
        <button class="back-btn" data-action="go-back">← Back</button>
        <div class="detail-hero">
          <div>
            <p class="eyebrow">Atlas alerts</p>
            <h2>Home health analytical dive</h2>
            <p class="hero-text">A deeper review of possible risks, warning patterns, and recommended actions for the full home.</p>
          </div>
          <div class="detail-icon">📡</div>
        </div>
        <div class="alert-grid">
          ${alerts
            .map(
              (alert) => `
                <article class="alert-card ${alert.severity}">
                  <div class="alert-top">
                    <div>
                      <p class="eyebrow">${alert.device}</p>
                      <h3>${alert.title}</h3>
                    </div>
                    <span class="severity-pill ${alert.severity}">${alert.severity}</span>
                  </div>
                  <p class="hero-text">${alert.detail}</p>
                  <div class="alert-meta">
                    <span>Impact: ${alert.impact}</span>
                    <span>Action: ${alert.action}</span>
                  </div>
                </article>
              `
            )
            .join('')}
        </div>
      </section>
    `;
    return;
  }

  const device = devices[state.currentView];
  const activeIndex = state.metricIndex[state.currentView] ?? 0;
  const metric = device.gauges[activeIndex];
  const statusLabel = device.status || 'normal';
  const smartMonitor = createSmartMonitorMarkup({
    title: metric.label,
    value: metric.value,
    unit: metric.unit,
    min: 0,
    max: metric.max,
    statusLabel,
    connectionStatus: 'connected',
    icon: device.icon,
    dataView: state.currentView,
    cardClass: 'detail-monitor',
    detailMode: true
  });

  appView.innerHTML = `
    <section class="detail-card">
      <button class="back-btn" data-action="go-back">← Back</button>
      <div class="detail-hero">
        <div>
          <p class="eyebrow">Atlas • ${device.subtitle}</p>
          <h2>${device.name}</h2>
          <p class="hero-text">${device.description}</p>
        </div>
        <div class="detail-icon">${device.icon}</div>
      </div>

      <div class="gauge-panel">
        <div class="gauge-shell">
          <div class="smart-monitor-detail-wrap">${smartMonitor}</div>
          <div class="gauge-copy">
            <p class="eyebrow">Live display ${activeIndex + 1}/${device.gauges.length}</p>
            <h3>${metric.summary}</h3>
            <p class="hero-text">${metric.detail}</p>
            <div class="gauge-actions">
              <button class="secondary-btn metric-cycle-btn" data-action="cycle-metric" data-direction="prev">← Prev</button>
              <button class="primary-btn metric-cycle-btn" data-action="cycle-metric" data-direction="next">Next →</button>
            </div>
          </div>
        </div>
      </div>

      <div class="mini-metric-list">
        ${device.gauges
          .map(
            (item, index) => `
              <button
                class="mini-metric ${index === activeIndex ? 'active' : ''}"
                data-action="jump-metric"
                data-index="${index}"
                ${index === activeIndex ? `style="border-color:${device.accent}; box-shadow: inset 0 0 0 1px ${device.accent};"` : ''}
              >
                <span>${item.label}</span>
                <strong>${formatValue(item.value, item.unit)}${item.unit}</strong>
              </button>
            `
          )
          .join('')}
      </div>

      <div class="detail-metrics">
        <div class="info-card">
          <h4>Current reading</h4>
          <p>${device.reading}</p>
        </div>
        <div class="info-card">
          <h4>Status</h4>
          <p>${device.status}</p>
        </div>
        <div class="info-card">
          <h4>Atlas note</h4>
          <p>${device.summary}</p>
        </div>
      </div>
      <div class="detail-actions">
        <button class="primary-btn" data-view="alerts">Open alerts</button>
        <button class="secondary-btn" data-view="overview">Return home</button>
      </div>
    </section>
  `;
}

document.addEventListener('click', (event) => {
  const shutdownButton = event.target.closest('#shutdown-btn');
  if (shutdownButton) {
    event.preventDefault();
    state.shutdownActive = !state.shutdownActive;
    render();
    return;
  }

  const goBackButton = event.target.closest('[data-action="go-back"]');
  if (goBackButton) {
    event.preventDefault();
    goBack();
    return;
  }

  const metricCycle = event.target.closest('[data-action="cycle-metric"]');
  if (metricCycle) {
    event.preventDefault();
    cycleMetric(metricCycle.dataset.direction === 'next' ? 1 : -1);
    return;
  }

  const metricJump = event.target.closest('[data-action="jump-metric"]');
  if (metricJump) {
    event.preventDefault();
    state.metricIndex[state.currentView] = Number(metricJump.dataset.index);
    render();
    return;
  }

  const trigger = event.target.closest('[data-view]');
  if (!trigger) {
    return;
  }

  event.preventDefault();
  navigateToView(trigger.dataset.view, trigger.dataset.view !== 'overview');
});

render();
