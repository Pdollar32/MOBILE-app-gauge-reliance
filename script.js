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
          .map(
            ([key, item]) => `
              <button class="metric-card" data-view="${key}">
                <div class="metric-top">
                  <div>
                    <p class="eyebrow">Atlas • ${item.subtitle}</p>
                    <h3>${item.name}</h3>
                    <p class="device-subtitle">${item.subtitle}</p>
                  </div>
                  <div class="icon-chip">${item.icon}</div>
                </div>
                <div class="metric-value">${item.reading}</div>
                <div class="metric-meta">${item.status}</div>
                <div class="status-row">
                  <span class="status-badge">Online</span>
                  <span>Tap to inspect</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width:70%; background:${item.accent}"></div>
                </div>
              </button>
            `
          )
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
  const ringPercent = Math.min(100, Math.max(6, (metric.value / metric.max) * 100));

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
          <div class="gauge-ring" style="--pct:${ringPercent}; --accent:${device.accent}">
            <div class="gauge-inner">
              <p class="gauge-label">${metric.label}</p>
              <div class="gauge-value">${metric.value}<span>${metric.unit}</span></div>
              <p class="gauge-subtext">${metric.summary}</p>
            </div>
          </div>
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
                <strong>${item.value}${item.unit}</strong>
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
