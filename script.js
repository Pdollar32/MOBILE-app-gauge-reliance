const state = {
  currentView: 'overview'
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
    metrics: [
      ['Pressure', '3.4 bar'],
      ['Usage', '142 L today'],
      ['Leak risk', 'Low']
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
    metrics: [
      ['Flow', '1.8 m³/hr'],
      ['Usage', '7.2 m³ this week'],
      ['Risk', 'Low']
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
    metrics: [
      ['Load', '3.4 kW'],
      ['Usage', '16.8 kWh today'],
      ['Efficiency', '92%']
    ]
  }
};

const appView = document.getElementById('app-view');

function render() {
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.view === state.currentView);
  });

  if (state.currentView === 'overview') {
    appView.innerHTML = `
      <section class="hero-card">
        <div class="hero-copy">
          <p class="eyebrow">Central monitoring system</p>
          <h2>Atlas gathers live data from Triton, Ignis, and Lumen to protect the whole home.</h2>
          <p class="hero-text">
            Water, gas, and electricity each report to Atlas through their own intelligent gauge. Atlas turns those readings into one clear home health view.
          </p>
          <div class="hero-actions">
            <button class="primary-btn" data-view="overview">Open Atlas view</button>
            <button class="secondary-btn" data-view="alerts">Review alerts</button>
          </div>
        </div>

        <div class="hero-metric">
          <div class="hero-ring">
            <span>3/3</span>
            <small>systems online</small>
          </div>
          <ul>
            <li><strong>Triton</strong> water gauge active</li>
            <li><strong>Ignis</strong> gas gauge synced</li>
            <li><strong>Lumen</strong> electric gauge reporting</li>
          </ul>
        </div>
      </section>

      <section class="section-heading">
        <h3>Connected gauge apps</h3>
        <p>Each monitor reports to Atlas as a dedicated smart app.</p>
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
                  <span>Tap to open</span>
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
              <h3>Home status snapshot</h3>
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
              <h3>Latest system updates</h3>
            </div>
          </div>
          <ul class="alert-list">
            <li>
              <span class="dot green"></span>
              <div>
                <strong>Triton: steady flow</strong>
                <p>No pressure fluctuation detected.</p>
              </div>
            </li>
            <li>
              <span class="dot amber"></span>
              <div>
                <strong>Ignis: slight evening increase</strong>
                <p>Gas usage rose during dinner prep.</p>
              </div>
            </li>
            <li>
              <span class="dot blue"></span>
              <div>
                <strong>Lumen: eco mode engaged</strong>
                <p>Energy usage reduced automatically.</p>
              </div>
            </li>
          </ul>
        </article>
      </section>
    `;
    return;
  }

  if (state.currentView === 'alerts') {
    appView.innerHTML = `
      <section class="detail-card">
        <button class="back-btn" data-view="overview">← Back to Atlas</button>
        <div class="detail-hero">
          <div>
            <p class="eyebrow">Atlas alerts</p>
            <h2>Live updates from every connected gauge</h2>
            <p class="hero-text">Tap any item to return to the relevant monitor.</p>
          </div>
          <div class="detail-icon">📡</div>
        </div>
        <ul class="alert-list">
          <li>
            <span class="dot green"></span>
            <div>
              <strong><button class="back-btn" data-view="triton">Triton: steady flow</button></strong>
              <p>No pressure fluctuation detected.</p>
            </div>
          </li>
          <li>
            <span class="dot amber"></span>
            <div>
              <strong><button class="back-btn" data-view="ignis">Ignis: slight evening increase</button></strong>
              <p>Gas usage rose during dinner prep.</p>
            </div>
          </li>
          <li>
            <span class="dot blue"></span>
            <div>
              <strong><button class="back-btn" data-view="lumen">Lumen: eco mode engaged</button></strong>
              <p>Energy usage reduced automatically.</p>
            </div>
          </li>
        </ul>
      </section>
    `;
    return;
  }

  const device = devices[state.currentView];
  appView.innerHTML = `
    <section class="detail-card">
      <button class="back-btn" data-view="overview">← Back to Atlas</button>
      <div class="detail-hero">
        <div>
          <p class="eyebrow">Atlas • ${device.subtitle}</p>
          <h2>${device.name}</h2>
          <p class="hero-text">${device.description}</p>
        </div>
        <div class="detail-icon">${device.icon}</div>
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
  const trigger = event.target.closest('[data-view]');
  if (!trigger) {
    return;
  }

  event.preventDefault();
  state.currentView = trigger.dataset.view;
  render();
});

render();
