/**
 * Enhanced Astro Cycles Module
 * Complete implementation with 3D planetary orbits, cycles analysis, and trading correlations
 */

class AstroCyclesModule {
  constructor() {
    this.currentDate = new Date();
    this.planetaryData = [];
    this.cycleAnalysis = {};
    this.orbitScene = null;
    this.isInitialized = false;
    this.updateInterval = null;
    this.tradingCorrelations = {};
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeDatePicker();
    this.loadPlanetaryData();
    this.startRealTimeUpdates();
    console.log('✅ Astro Cycles Module initialized');
  }

  setupEventListeners() {
    // Date picker changes
    document.addEventListener('change', (e) => {
      if (e.target.id === 'astroDateInput') {
        this.currentDate = new Date(e.target.value);
        this.updatePlanetaryData();
      }
    });

    // Floating table controls
    document.addEventListener('click', (e) => {
      if (e.target.id === 'showFloatingTableBtn') {
        // Open the standalone planetary table page (prefer same tab for quick view)
        try {
          const dateStr = this.currentDate.toISOString().split('T')[0];
          // open in same tab so user lands on the full table view
          window.location.href = `/astro-table.html?date=${encodeURIComponent(dateStr)}`;
        } catch (err) {
          // Fallback to the floating table if navigation fails
          this.showFloatingTable();
        }
      }
      if (e.target.id === 'toggleFloatingTableBtn') {
        this.hideFloatingTable();
      }
    });

    // Orbit frame load
    document.addEventListener('DOMContentLoaded', () => {
      const orbitFrame = document.getElementById('astroOrbitFrame');
      if (orbitFrame) {
        orbitFrame.onload = () => {
          this.initializeOrbitControls();
        };
      }
    });
  }

  initializeDatePicker() {
    const dateInput = document.getElementById('astroDateInput');
    if (dateInput) {
      // Set to current date
      dateInput.value = this.currentDate.toISOString().split('T')[0];
    }
  }

  async loadPlanetaryData() {
    try {
      // Generate realistic planetary data for the current date
      this.planetaryData = await this.calculatePlanetaryPositions(this.currentDate);
      await this.updatePlanetaryTable();
      await this.updateEventsList();
      // AI-based astro panel: show mentor summary and per-planet AI notes
      await this.updateAIPanel();
      this.performCycleAnalysis();
      
    } catch (error) {
      console.error('Failed to load planetary data:', error);
      this.showError('Unable to load planetary data');
    }
  }

  // --- AI Panel: Fetches AI Mentor summary and renders per-planet comments ---
  ensureAIPanelExists() {
    let container = document.getElementById('astroAIPanel');
    if (container) return container;

    // Try to insert the AI panel above the events list if available
    const eventsList = document.getElementById('astroEventsList');
    container = document.createElement('div');
    container.id = 'astroAIPanel';
    container.style.margin = '8px 0';
    container.style.padding = '10px';
    container.style.borderRadius = '8px';
    container.style.background = 'linear-gradient(90deg,#001219,#002b36)';
    container.style.borderLeft = '4px solid #00bcd4';
    container.innerHTML = `
      <div id="astroAiSummary" style="font-size:13px;color:#dbeafe;margin-bottom:8px">Loading AI Mentor...</div>
      <div id="astroAiPerPlanet" style="display:flex;flex-wrap:wrap;gap:8px"></div>
    `;

    if (eventsList && eventsList.parentNode) {
      eventsList.parentNode.insertBefore(container, eventsList);
    } else {
      // fallback: append to body
      document.body.appendChild(container);
    }

    return container;
  }

  async fetchAIMentor(dateStr) {
    // Try to fetch ai_mentor via ephemeris payload first, fall back to ai endpoint
    try {
  const apiBase = (typeof window.API_BASE === 'string' && window.API_BASE) ? window.API_BASE.replace(/\/$/, '') : 'http://localhost:8081';
  const ephResp = await fetch(`${apiBase}/astro/ephemeris?date=${encodeURIComponent(dateStr)}`);
      if (ephResp && ephResp.ok) {
        const ephJson = await ephResp.json();
        if (ephJson.ai_mentor) return { mentor: ephJson.ai_mentor, raw: ephJson };
      }
    } catch (e) {
      // continue to ai endpoint
    }

    try {
      const aiResp = await fetch('/api/ai-mentor/analyze?symbol=EURUSD&timeframe=1d');
      if (aiResp && aiResp.ok) {
        const aiJson = await aiResp.json();
        // Normalize: aiJson may already be mentor or have mentor key
        const mentor = aiJson.ai_mentor || aiJson.mentor || aiJson;
        return { mentor, raw: aiJson };
      }
    } catch (e) {
      console.debug('AI Mentor fetch failed', e);
    }

    return null;
  }

  buildPerPlanetComments(mentorRaw, ephemerisPositions) {
    // Attempt to extract per-planet comments from mentorRaw.signals (if available)
    // Fallback: generate rule-based notes (retrograde, sign, zodiac_telugu)
    const comments = {};
    const normalize = (s) => (typeof s === 'string' && s.length) ? (s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()) : s;

    // Map signals by planet if they include meta.planet
    if (mentorRaw && Array.isArray(mentorRaw.signals)) {
      mentorRaw.signals.forEach(sig => {
        const meta = sig.meta || {};
        const p = meta.planet || meta.planets || null;
        if (!p) return;
        const name = normalize(Array.isArray(p) ? p[0] : p);
        if (!comments[name]) comments[name] = [];
        comments[name].push(`${sig.type || 'signal'}${sig.confidence ? ` (${(sig.confidence*100).toFixed(0)}%)` : ''}`);
      });
    }

    // For each planet in ephemerisPositions, ensure we have a comment
    Object.keys(ephemerisPositions || {}).forEach(k => {
      const p = ephemerisPositions[k];
      const name = normalize(k);
      if (!comments[name] || comments[name].length === 0) {
        // Build fallback comment
        const parts = [];
        if (p && p.retrograde) parts.push('Retrograde — caution');
        if (p && (p.zodiac_telugu || p.label_telugu)) parts.push(`In ${p.zodiac_telugu || p.label_telugu}`);
        if (p && p.deg_into_sign !== undefined) parts.push(`${p.deg_into_sign.toFixed ? p.deg_into_sign.toFixed(2) : p.deg_into_sign}° into sign`);
        if (parts.length === 0) parts.push('No notable AI signals');
        comments[name] = [parts.join(' · ')];
      }
    });

    return comments;
  }

  async updateAIPanel() {
    try {
      const dateStr = this.currentDate.toISOString().split('T')[0];
      const container = this.ensureAIPanelExists();
      const summaryEl = container.querySelector('#astroAiSummary');
      const perPlanetEl = container.querySelector('#astroAiPerPlanet');

      summaryEl.textContent = 'Loading AI Mentor...';
      perPlanetEl.innerHTML = '';

      // Fetch ephemeris to get positions object
      let eph = null;
      try {
  const apiBase = (typeof window.API_BASE === 'string' && window.API_BASE) ? window.API_BASE.replace(/\/$/, '') : 'http://localhost:8081';
  const r = await fetch(`${apiBase}/astro/ephemeris?date=${encodeURIComponent(dateStr)}`);
        if (r && r.ok) eph = await r.json();
      } catch (e) {}

      const positions = (eph && Array.isArray(eph.ephemeris) && eph.ephemeris[0] && eph.ephemeris[0].positions) ? eph.ephemeris[0].positions : (eph && eph.positions ? eph.positions : {});

      // Fetch AI Mentor (ephemeris may already include ai_mentor)
      const ai = await this.fetchAIMentor(dateStr);
      const mentor = ai && ai.mentor ? ai.mentor : null;
      const mentorRaw = ai && ai.raw ? ai.raw : (eph || null);

      if (mentor && (mentor.narration || mentor.summary)) {
        summaryEl.innerHTML = `<div style="font-weight:700;color:#00e5ff;margin-bottom:6px">🤖 AI Mentor</div><div style="font-size:13px">${mentor.narration || mentor.summary}</div>`;
      } else if (mentorRaw && mentorRaw.mentor && mentorRaw.mentor.narration) {
        summaryEl.innerHTML = `<div style="font-weight:700;color:#00e5ff;margin-bottom:6px">🤖 AI Mentor</div><div style="font-size:13px">${mentorRaw.mentor.narration}</div>`;
      } else {
        summaryEl.innerHTML = `<div style="font-weight:700;color:#00e5ff;margin-bottom:6px">🤖 AI Mentor</div><div style="font-size:13px;color:#9fb3c8">No AI summary available for this date</div>`;
      }

      // Build per-planet comments
      const comments = this.buildPerPlanetComments(mentorRaw, positions || {});
      // Render small cards for each planet in order of planetaryData
      const order = (this.planetaryData && this.planetaryData.map(p => p.name)) || Object.keys(positions || {});
      const rendered = [];
      order.forEach(name => {
        const n = (typeof name === 'string') ? (name.charAt(0).toUpperCase() + name.slice(1)) : name;
        const noteArr = comments[n] || comments[n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()] || ['No data'];
        const note = Array.isArray(noteArr) ? noteArr.join('; ') : noteArr;
        rendered.push(`<div style="min-width:160px;flex:1 1 160px;background:linear-gradient(180deg,#00222b,#00121a);padding:8px;border-radius:6px;border:1px solid rgba(255,255,255,0.03)"><div style="font-weight:700;color:#00e5ff;margin-bottom:6px">${n}</div><div style="font-size:12px;color:#dbeafe">${note}</div></div>`);
      });

      perPlanetEl.innerHTML = rendered.join('');
    } catch (err) {
      console.error('Failed to update AI panel', err);
    }
  }

  async calculatePlanetaryPositions(date) {
    // Simulate realistic planetary position calculations
    const planets = [
      { name: 'Mercury', symbol: '☿', period: 88, distance: 0.39, color: '#FFA500' },
      { name: 'Venus', symbol: '♀', period: 225, distance: 0.72, color: '#FFD700' },
      { name: 'Earth', symbol: '⊕', period: 365, distance: 1.0, color: '#4169E1' },
      { name: 'Mars', symbol: '♂', period: 687, distance: 1.52, color: '#DC143C' },
      { name: 'Jupiter', symbol: '♃', period: 4333, distance: 5.2, color: '#DAA520' },
      { name: 'Saturn', symbol: '♄', period: 10759, distance: 9.54, color: '#B8860B' },
      { name: 'Uranus', symbol: '♅', period: 30687, distance: 19.2, color: '#4682B4' },
      { name: 'Neptune', symbol: '♆', period: 60190, distance: 30.1, color: '#483D8B' }
    ];

    const daysSinceEpoch = (date - new Date('2000-01-01')) / (1000 * 60 * 60 * 24);
    
    return planets.map(planet => {
      const angle = (daysSinceEpoch / planet.period * 360) % 360;
      const radians = angle * Math.PI / 180;
      
      // Calculate position
      const x = planet.distance * Math.cos(radians);
      const y = planet.distance * Math.sin(radians);
      
      // Calculate speed (degrees per day)
      const speed = 360 / planet.period;
      
      // Calculate astrological aspects
      const longitude = angle;
      const sign = this.getAstrologicalSign(longitude);
      const degree = longitude % 30;
      
      return {
        ...planet,
        angle: angle,
        longitude: longitude,
        x: x,
        y: y,
        speed: speed,
        sign: sign,
        degree: degree.toFixed(1),
        retrograde: this.isRetrograde(planet.name, date)
      };
    });
  }

  getAstrologicalSign(longitude) {
    const signs = [
      '♈ Aries', '♉ Taurus', '♊ Gemini', '♋ Cancer',
      '♌ Leo', '♍ Virgo', '♎ Libra', '♏ Scorpio',
      '♐ Sagittarius', '♑ Capricorn', '♒ Aquarius', '♓ Pisces'
    ];
    
    const signIndex = Math.floor(longitude / 30);
    return signs[signIndex] || signs[0];
  }

  isRetrograde(planetName, date) {
    // Simplified retrograde calculation (in reality this is much more complex)
    const retroPeriods = {
      'Mercury': [60, 20], // 60 days forward, 20 days retrograde
      'Venus': [150, 40],
      'Mars': [600, 70],
      'Jupiter': [300, 120],
      'Saturn': [320, 140],
      'Uranus': [330, 150],
      'Neptune': [340, 160]
    };
    
    if (!retroPeriods[planetName]) return false;
    
    const [forward, retro] = retroPeriods[planetName];
    const cycle = forward + retro;
    const daysSinceEpoch = (date - new Date('2000-01-01')) / (1000 * 60 * 60 * 24);
    const cyclePosition = daysSinceEpoch % cycle;
    
    return cyclePosition > forward;
  }

  async updatePlanetaryTable() {
    const floatingTable = document.getElementById('astroFloatingPositionsTable');
    if (!floatingTable) return;

    const head = document.getElementById('astroFloatingHeadRow');
    const body = document.getElementById('astroFloatingBody');
    
    if (head && body) {
      // Try to fetch optional Telugu zodiac labels from backend ephemeris
      let teluguMap = {};
      const normalize = (s) => (typeof s === 'string' && s.length) ? (s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()) : s;
      try {
        const dateStr = this.currentDate.toISOString().split('T')[0];
  const apiBase = (typeof window.API_BASE === 'string' && window.API_BASE) ? window.API_BASE.replace(/\/$/, '') : 'http://localhost:8081';
  const resp = await fetch(`${apiBase}/astro/ephemeris?date=${encodeURIComponent(dateStr)}`);
        if (resp && resp.ok) {
          const payload = await resp.json();

          // Prefer canonical payload.ephemeris[0].positions when available
          let positionsObj = null;
          if (payload && Array.isArray(payload.ephemeris) && payload.ephemeris.length > 0 && payload.ephemeris[0].positions) {
            positionsObj = payload.ephemeris[0].positions;
          } else if (payload.positions && typeof payload.positions === 'object') {
            positionsObj = payload.positions;
          } else if (payload.planets && typeof payload.planets === 'object') {
            positionsObj = payload.planets;
          } else if (Array.isArray(payload)) {
            // array of planet objects
            payload.forEach(p => {
              if (!p) return;
              const rawName = p.name || p.planet || p.label;
              if (!rawName) return;
              const name = normalize(rawName);
              let z = p.zodiac_telugu || p.zodiacTelugu || p.zodiac_telugu_name || p.label_telugu || p[name + '_zodiac_telugu'];
              if (!z && p.zodiac && typeof p.zodiac === 'object' && p.zodiac.telugu) z = p.zodiac.telugu;
              if (z) teluguMap[name] = z;
            });
          }

          // If we have an object mapping of positions, iterate its keys and normalize
          if (positionsObj && typeof positionsObj === 'object') {
            Object.keys(positionsObj).forEach(k => {
              const p = positionsObj[k];
              if (!p) return;
              const name = normalize(k);
              let z = p.zodiac_telugu || p.zodiacTelugu || p.label_telugu || p.zodiac_telugu_name || p[name + '_zodiac_telugu'];
              if (!z && p.zodiac && typeof p.zodiac === 'object' && p.zodiac.telugu) z = p.zodiac.telugu;
              if (z) teluguMap[name] = z;
            });
          }
        }
      } catch (fetchErr) {
        // non-fatal — silently continue with fallback
      }

      // Instead of building rows here, embed the standalone table page via an iframe so rendering is centralized
      try {
        const dateStr = this.currentDate.toISOString().split('T')[0];
        // Add a small toolbar above the iframe with quick links to open the standalone table
        head.innerHTML = '<th style="padding:4px 6px; border:1px solid var(--border-color); font-size:11px;">Planetary Table (embedded)</th>';

        // Build a small icon strip that allows quick open with scrollTo for each planet (same origin)
        const iconStripId = 'astroEmbeddedIconStrip';
        const stripHtml = `<div id="${iconStripId}" style="display:flex;gap:8px;padding:8px 12px;background:transparent;align-items:center;flex-wrap:wrap"></div>`;

        // cache-buster to avoid stale iframe content
        const v = Date.now();
        const iframeSrc = `/astro-table.html?date=${encodeURIComponent(dateStr)}&v=${v}`;
        body.innerHTML = `<tr><td style="padding:0;border:0">${stripHtml}<iframe id="astroEmbeddedTableIframe" src="${iframeSrc}" style="width:100%;height:360px;border:0;background:transparent"></iframe></td></tr>`;

        // Populate the icon strip asynchronously once we have planetaryData or teluguMap
        setTimeout(() => {
          try {
            const strip = document.getElementById(iconStripId);
            if (!strip) return;
            // Use this.planetaryData if available, otherwise fall back to a common list
            const list = (this.planetaryData && Array.isArray(this.planetaryData) && this.planetaryData.length>0)
              ? this.planetaryData.map(p=>p.name)
              : ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune'];

            strip.innerHTML = list.map(name => {
              const safe = encodeURIComponent(name);
              return `<a href="/astro-table.html?scrollTo=${safe}&date=${encodeURIComponent(dateStr)}&v=${v}" data-planet="${name}" class="astro-embed-icon" style="text-decoration:none;color:inherit"><div style="padding:6px 8px;border-radius:6px;background:rgba(255,255,255,0.02);font-size:12px">${name}</div></a>`;
            }).join('');

            // Make the icons open the iframe with scrollTo instead of navigating the whole page
            strip.querySelectorAll('a.astro-embed-icon').forEach(a => {
              a.addEventListener('click', (ev) => {
                ev.preventDefault();
                const planet = a.getAttribute('data-planet');
                const iframe = document.getElementById('astroEmbeddedTableIframe');
                if (!iframe) { window.location.href = a.href; return; }
                // set iframe src to include scrollTo and cache-buster
                const newSrc = `/astro-table.html?date=${encodeURIComponent(dateStr)}&scrollTo=${encodeURIComponent(planet)}&v=${Date.now()}`;
                iframe.src = newSrc;
              });
            });
          } catch (e) { console.warn('Failed to populate embedded icon strip', e); }
        }, 20);
      } catch (embedErr) {
        // fallback to previous row rendering if iframe fails
        console.warn('Embedding standalone table failed, fallback to inline rows', embedErr);
      }

      // Update timestamp
      const timeElement = document.getElementById('astroFloatingTime');
      if (timeElement) {
        timeElement.textContent = `(${this.currentDate.toLocaleDateString()})`;
      }
    }
  }

  async updateEventsList() {
    // Make this function async-friendly to fetch AI narration
    const eventsList = document.getElementById('astroEventsList');
    if (!eventsList) return;

    const events = this.generateAstrologicalEvents();

    // Try to fetch AI Mentor narration (non-blocking — if fails, render events normally)
    let aiNarration = null;
    try {
      const aiResp = await fetch('/api/ai-mentor/analyze?symbol=EURUSD&timeframe=5m');
      if (aiResp && aiResp.ok) {
        const aiJson = await aiResp.json();
        // aiJson may include ai_mentor at top-level or be the mentor object directly
        if (aiJson.ai_mentor) aiNarration = aiJson.ai_mentor.narration || aiJson.ai_mentor.summary || null;
        else if (aiJson.mentor) aiNarration = aiJson.mentor.narration || aiJson.mentor.summary || null;
        else aiNarration = aiJson.narration || aiJson.summary || null;
      }
    } catch (err) {
      // ignore — will render without AI block
    }

    // Build HTML for events
    const eventsHtml = events.map(event => `
      <div class="astro-event-item" style="
        background: var(--bg-secondary);
        border-radius: 8px;
        padding: 12px;
        border-left: 4px solid ${event.color};
        transition: all 0.2s ease;
        cursor: pointer;
      " onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='var(--bg-secondary)'>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-weight: 600; color: ${event.color}; font-size: 12px;">
            ${event.type}
          </span>
          <span style="font-size: 10px; color: var(--text-secondary);">
            ${event.impact}
          </span>
        </div>
        <div style="font-size: 11px; color: var(--text-primary); margin-bottom: 4px;">
          ${event.description}
        </div>
        <div style="font-size: 10px; color: var(--text-secondary);">
          <span>📅 ${event.date}</span>
          <span style="margin-left: 12px;">📈 ${event.marketImpact}</span>
        </div>
      </div>
    `).join('');

    // Prepend AI Narration if available
    if (aiNarration) {
      eventsList.innerHTML = `
        <div style="background: linear-gradient(90deg,#001219,#002b36); border-radius:8px; padding:12px; margin-bottom:8px; border-left:4px solid #00bcd4;">
          <div style="font-weight:700; color:#00e5ff; font-size:12px; margin-bottom:6px;">🤖 AI Mentor Summary</div>
          <div style="font-size:12px; color:#dbeafe;">${aiNarration}</div>
        </div>
        ${eventsHtml}
      `;
    } else {
      eventsList.innerHTML = eventsHtml;
    }
  }

  generateAstrologicalEvents() {
    const events = [];
    const currentDate = this.currentDate;
    
    // Generate various astrological events
    const eventTypes = [
      {
        type: 'Mercury Retrograde',
        color: '#FFA500',
        impact: 'High',
        marketImpact: 'Communication disruptions',
        description: 'Mercury enters retrograde motion, affecting communication and technology sectors.'
      },
      {
        type: 'New Moon',
        color: '#4682B4',
        impact: 'Medium',
        marketImpact: 'New beginnings',
        description: 'New Moon in current sign, favorable for new ventures and market entries.'
      },
      {
        type: 'Venus-Jupiter Trine',
        color: '#FFD700',
        impact: 'Positive',
        marketImpact: 'Luxury goods surge',
        description: 'Harmonious aspect between Venus and Jupiter, boosting luxury and financial sectors.'
      },
      {
        type: 'Mars Square Saturn',
        color: '#DC143C',
        impact: 'Challenging',
        marketImpact: 'Energy sector volatility',
        description: 'Tense aspect creating obstacles in energy and industrial sectors.'
      },
      {
        type: 'Solar Eclipse',
        color: '#FFD700',
        impact: 'Major',
        marketImpact: 'Market transformation',
        description: 'Powerful solar eclipse bringing major market shifts and new opportunities.'
      }
    ];

    // Generate events for the next 30 days
    for (let i = 0; i < 30; i++) {
      const eventDate = new Date(currentDate);
      eventDate.setDate(eventDate.getDate() + i);
      
      // Randomly select and generate events
      if (Math.random() < 0.3) { // 30% chance of event each day
        const eventTemplate = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        events.push({
          ...eventTemplate,
          date: eventDate.toLocaleDateString(),
          timestamp: eventDate.getTime()
        });
      }
    }

    return events.sort((a, b) => a.timestamp - b.timestamp).slice(0, 10);
  }

  performCycleAnalysis() {
    // Analyze planetary cycles and their market correlations
    this.cycleAnalysis = {
      mercuryCycle: this.analyzeMercuryCycle(),
      venusCycle: this.analyzeVenusCycle(),
      marsCycle: this.analyzeMarsCycle(),
      jupiterSaturnCycle: this.analyzeJupiterSaturnCycle(),
      lunarCycle: this.analyzeLunarCycle()
    };

    this.updateCycleAnalysisDisplay();
  }

  analyzeMercuryCycle() {
    const mercury = this.planetaryData.find(p => p.name === 'Mercury');
    if (!mercury) return null;

    return {
      phase: mercury.retrograde ? 'Retrograde' : 'Direct',
      impact: mercury.retrograde ? 'Communication and technology sectors may face disruptions' : 'Favorable for quick trades and communication',
      recommendation: mercury.retrograde ? 'Avoid new technology investments' : 'Good time for quick scalping strategies',
      strength: mercury.retrograde ? 'High' : 'Medium'
    };
  }

  analyzeVenusCycle() {
    const venus = this.planetaryData.find(p => p.name === 'Venus');
    if (!venus) return null;

    return {
      phase: venus.retrograde ? 'Retrograde' : 'Direct',
      impact: 'Influences luxury goods, beauty, and financial markets',
      recommendation: venus.retrograde ? 'Review luxury investments' : 'Favorable for beauty and luxury sectors',
      strength: 'Medium'
    };
  }

  analyzeMarsCycle() {
    const mars = this.planetaryData.find(p => p.name === 'Mars');
    if (!mars) return null;

    return {
      phase: mars.retrograde ? 'Retrograde' : 'Direct',
      impact: 'Affects energy, defense, and industrial sectors',
      recommendation: mars.retrograde ? 'Caution in energy trades' : 'Good for aggressive trading strategies',
      strength: mars.retrograde ? 'High' : 'Medium'
    };
  }

  analyzeJupiterSaturnCycle() {
    const jupiter = this.planetaryData.find(p => p.name === 'Jupiter');
    const saturn = this.planetaryData.find(p => p.name === 'Saturn');
    
    if (!jupiter || !saturn) return null;

    const angleDiff = Math.abs(jupiter.angle - saturn.angle);
    const aspect = this.calculateAspect(angleDiff);

    return {
      phase: `${aspect.name} (${angleDiff.toFixed(1)}°)`,
      impact: 'Major long-term market cycles and economic trends',
      recommendation: aspect.favorable ? 'Favorable for long-term investments' : 'Exercise caution with major positions',
      strength: 'High'
    };
  }

  analyzeLunarCycle() {
    // Simplified lunar cycle calculation
    const lunarMonth = 29.53;
    const daysSinceNewMoon = (this.currentDate.getTime() / (1000 * 60 * 60 * 24)) % lunarMonth;
    
    let phase;
    if (daysSinceNewMoon < 7.4) phase = 'New Moon to First Quarter';
    else if (daysSinceNewMoon < 14.8) phase = 'First Quarter to Full Moon';
    else if (daysSinceNewMoon < 22.1) phase = 'Full Moon to Last Quarter';
    else phase = 'Last Quarter to New Moon';

    return {
      phase: phase,
      impact: 'Influences market sentiment and volatility cycles',
      recommendation: phase.includes('New') ? 'Good for new positions' : 'Time for review and consolidation',
      strength: 'Medium'
    };
  }

  calculateAspect(angleDiff) {
    const aspects = [
      { name: 'Conjunction', angle: 0, orb: 8, favorable: true },
      { name: 'Sextile', angle: 60, orb: 6, favorable: true },
      { name: 'Square', angle: 90, orb: 8, favorable: false },
      { name: 'Trine', angle: 120, orb: 8, favorable: true },
      { name: 'Opposition', angle: 180, orb: 8, favorable: false }
    ];

    for (const aspect of aspects) {
      if (Math.abs(angleDiff - aspect.angle) <= aspect.orb || 
          Math.abs(angleDiff - (360 - aspect.angle)) <= aspect.orb) {
        return aspect;
      }
    }

    return { name: 'No major aspect', angle: angleDiff, favorable: null };
  }

  updateCycleAnalysisDisplay() {
    // This would update a cycle analysis panel (to be added to the UI)
    console.log('🔮 Cycle Analysis Updated:', this.cycleAnalysis);
  }

  showFloatingTable() {
    const table = document.getElementById('astroFloatingTable');
    const button = document.getElementById('showFloatingTableBtn');
    
    if (table && button) {
      table.style.display = 'block';
      button.style.display = 'none';
      
      // Animate in
      table.style.opacity = '0';
      table.style.transform = 'translateY(-10px)';
      
      setTimeout(() => {
        table.style.transition = 'all 0.3s ease';
        table.style.opacity = '1';
        table.style.transform = 'translateY(0)';
      }, 10);
    }
  }

  hideFloatingTable() {
    const table = document.getElementById('astroFloatingTable');
    const button = document.getElementById('showFloatingTableBtn');
    
    if (table && button) {
      table.style.transition = 'all 0.3s ease';
      table.style.opacity = '0';
      table.style.transform = 'translateY(-10px)';
      
      setTimeout(() => {
        table.style.display = 'none';
        button.style.display = 'block';
      }, 300);
    }
  }

  initializeOrbitControls() {
    // Initialize 3D orbit visualization controls
    try {
      const orbitFrame = document.getElementById('astroOrbitFrame');
      if (orbitFrame && orbitFrame.contentWindow) {
        // Send planetary data to the 3D orbit frame
        orbitFrame.contentWindow.postMessage({
          type: 'updatePlanets',
          data: this.planetaryData
        }, '*');
      }
    } catch (error) {
      console.error('Failed to initialize orbit controls:', error);
    }
  }

  startRealTimeUpdates() {
    // Update every minute to keep data fresh
    this.updateInterval = setInterval(() => {
      if (this.currentDate.toDateString() === new Date().toDateString()) {
        // Only auto-update if viewing current date
        this.loadPlanetaryData();
      }
    }, 60000);
  }

  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  updatePlanetaryData() {
    this.loadPlanetaryData();
    this.initializeOrbitControls();
  }

  showError(message) {
    console.error('Astro Module Error:', message);
    
    const eventsList = document.getElementById('astroEventsList');
    if (eventsList) {
      eventsList.innerHTML = `
        <div style="background: var(--bg-secondary); border-radius: 8px; padding: 16px; border-left: 4px solid #ef4444;">
          <div style="color: #ef4444; font-weight: 600; margin-bottom: 8px;">⚠️ Error</div>
          <div style="font-size: 12px; color: var(--text-secondary);">${message}</div>
        </div>
      `;
    }
  }

  // Public methods for external use
  getCurrentPlanetaryData() {
    return this.planetaryData;
  }

  getCycleAnalysis() {
    return this.cycleAnalysis;
  }

  setDate(date) {
    this.currentDate = new Date(date);
    const dateInput = document.getElementById('astroDateInput');
    if (dateInput) {
      dateInput.value = this.currentDate.toISOString().split('T')[0];
    }
    this.updatePlanetaryData();
  }
}

// Initialize Astro Cycles Module when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.astroCyclesModule = new AstroCyclesModule();
});

// Expose module for external use
window.AstroCyclesModule = AstroCyclesModule;