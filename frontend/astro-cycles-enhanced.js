/**
 * Astro Cycles Dashboard Module (cleaned)
 * Embeds `/astro-table.html` and provides a simple events and AI panel.
 */

class AstroCyclesModule {
  constructor() {
    this.currentDate = new Date();
    this.planetaryData = [];
    this.cycleAnalysis = {};
    this.updateInterval = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeDatePicker();
    this.loadPlanetaryData();
    this.startRealTimeUpdates();
  }

  setupEventListeners() {
    document.addEventListener('change', (e) => {
      if (e.target && e.target.id === 'astroDateInput') {
        this.currentDate = new Date(e.target.value);
        this.updatePlanetaryData();
      }
    });

    document.addEventListener('click', (e) => {
      const t = e.target;
      if (!t) return;
      if (t.id === 'showFloatingTableBtn') {
        const dateStr = this.currentDate.toISOString().split('T')[0];
        window.location.href = `/astro-table.html?date=${encodeURIComponent(dateStr)}`;
        return;
      }

      if (t.dataset && t.dataset.planet) {
        const planet = t.dataset.planet;
        const iframe = document.getElementById('astroTableIframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'astro-scroll', planet }, '*');
        } else {
          const dateStr = this.currentDate.toISOString().split('T')[0];
          window.open(`/astro-table.html?date=${encodeURIComponent(dateStr)}&scrollTo=${encodeURIComponent(planet)}`, '_blank');
        }
      }
    });
  }

  initializeDatePicker() {
    const dateInput = document.getElementById('astroDateInput'); if (dateInput) dateInput.value = this.currentDate.toISOString().split('T')[0];
  }

  async loadPlanetaryData() {
    try {
      this.planetaryData = await this.calculatePlanetaryPositions(this.currentDate);
      await this.updatePlanetaryTable();
      await this.updateEventsList();
      await this.updateAIPanel();
      this.performCycleAnalysis();
    } catch (e) { console.error('loadPlanetaryData failed', e); }
  }

  async updatePlanetaryTable() {
    const floatingTable = document.getElementById('astroFloatingPositionsTable'); if (!floatingTable) return;
    const dateStr = this.currentDate.toISOString().split('T')[0];
    const head = document.getElementById('astroFloatingHeadRow');
    const body = document.getElementById('astroFloatingBody');
    if (head) head.innerHTML = '<th>Planetary Table (embedded)</th>';
    if (body) body.innerHTML = `<tr><td><div id="astroPlanetChipsContainer" style="padding:6px 0 8px;display:flex;gap:6px;flex-wrap:wrap"></div><iframe id="astroTableIframe" src="/astro-table.html?date=${encodeURIComponent(dateStr)}" style="width:100%;height:360px;border:0;background:transparent"></iframe></td></tr>`;
    // Render planet chips for quick testing (if no chips exist elsewhere on the page)
    this.renderPlanetChips();
    const timeElement = document.getElementById('astroFloatingTime'); if (timeElement) timeElement.textContent = `(${this.currentDate.toLocaleDateString()})`;
  }

  renderPlanetChips() {
    try {
      const container = document.getElementById('astroPlanetChipsContainer');
      if (!container) return;
      // Use planetaryData if available, otherwise default set
      const planets = (this.planetaryData && this.planetaryData.length) ? this.planetaryData.map(p => p.name) : ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune'];
      container.innerHTML = '';
      planets.forEach((p) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.planet = p;
        btn.className = 'astro-planet-chip';
        btn.textContent = p;
        btn.style.border = '1px solid rgba(0,0,0,0.08)';
        btn.style.padding = '6px 8px';
        btn.style.borderRadius = '6px';
        btn.style.background = 'var(--panel-bg, #ffffff)';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '12px';
        btn.addEventListener('click', (e) => {
          const planet = e.currentTarget.dataset.planet;
          const iframe = document.getElementById('astroTableIframe');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'astro-scroll', planet }, '*');
          } else {
            const dateStr = this.currentDate.toISOString().split('T')[0];
            window.open(`/astro-table.html?date=${encodeURIComponent(dateStr)}&scrollTo=${encodeURIComponent(planet)}`, '_blank');
          }
        });
        container.appendChild(btn);
      });
    } catch (e) { console.warn('renderPlanetChips failed', e); }
  }

  async updateEventsList() {
    const eventsList = document.getElementById('astroEventsList'); if (!eventsList) return;
    let events = null;
    try {
      const resp = await fetch('/astro/events'); if (resp && resp.ok) events = await resp.json();
    } catch (e) { console.warn('Failed to fetch /astro/events', e); }
    if (!events || !Array.isArray(events) || events.length === 0) events = this.generateAstrologicalEvents();

    // Build controls: CSV / ICS export
    const controlsId = 'astroEventsControls';
    let controls = document.getElementById(controlsId);
    if (!controls) {
      controls = document.createElement('div');
      controls.id = controlsId;
      controls.style.display = 'flex';
      controls.style.gap = '8px';
      controls.style.marginBottom = '8px';
      const csvBtn = document.createElement('button');
      csvBtn.type = 'button';
      csvBtn.textContent = 'Export CSV';
      csvBtn.style.padding = '6px 10px';
      csvBtn.addEventListener('click', () => {
        const csv = this.eventsToCSV(events);
        this.downloadBlob(csv, 'text/csv;charset=utf-8;', `astro-events-${new Date().toISOString().slice(0,10)}.csv`);
      });

      const icsBtn = document.createElement('button');
      icsBtn.type = 'button';
      icsBtn.textContent = 'Export ICS';
      icsBtn.style.padding = '6px 10px';
      icsBtn.addEventListener('click', () => {
        const ics = this.eventsToICS(events);
        this.downloadBlob(ics, 'text/calendar;charset=utf-8;', `astro-events-${new Date().toISOString().slice(0,10)}.ics`);
      });

      controls.appendChild(csvBtn);
      controls.appendChild(icsBtn);
      eventsList.parentNode.insertBefore(controls, eventsList);
    }

    // Render events list with Vedic/Telugu fields when available
    const html = events.map(ev => {
      const date = ev.date || ev.datetime || ev.jd || '';
      const title = ev.event || ev.type || ev.name || '';
      const desc = ev.description || ev.event || ev.note || '';
      const planets = (ev.planets && Array.isArray(ev.planets)) ? ev.planets.join(', ') : (ev.planets || '');
      // Vedic fields
      const nak = ev.nakshatra || ev.nakshatra_name || ev.nakshatra_en || '';
      const pada = ev.pada || ev.nakshatra_pada || '';
      const deity = ev.deity || '';
      const teluguLabel = ev.label_telugu || ev.labelTelugu || '';

      const leftColor = ev.color || (ev.type && ev.type.toLowerCase().includes('retro') ? '#E57373' : '#4FD0E7');

      return (`<div class="astro-event-item" style="border-left:4px solid ${leftColor};padding:10px;margin-bottom:8px;display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:700">${this.escapeHtml(title)}</div>
          <div style="font-size:12px;color:var(--text-secondary)">${this.escapeHtml(date)}</div>
        </div>
        <div style="font-size:13px;margin-top:6px">${this.escapeHtml(desc)}</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:6px">Planets: ${this.escapeHtml(planets)}</div>
        ${nak ? `<div style="font-size:12px;margin-top:6px">Nakshatra: <strong>${this.escapeHtml(nak)}</strong> ${pada ? ` — Pada: ${this.escapeHtml(pada)}` : ''} ${deity ? ` — Deity: ${this.escapeHtml(deity)}` : ''}</div>` : ''}
        ${teluguLabel ? `<div style="font-size:12px;margin-top:6px">Telugu: ${this.escapeHtml(teluguLabel)}</div>` : ''}
      </div>`);
    }).join('');

    eventsList.innerHTML = html;
  }

  generateAstrologicalEvents() { const events = []; const types=['Mercury Retrograde','New Moon','Venus-Jupiter Trine','Mars Square Saturn']; for (let i=0;i<10;i++){ const d=new Date(this.currentDate); d.setDate(d.getDate()+i); if (Math.random()<0.3) events.push({ type: types[Math.floor(Math.random()*types.length)], description:'', date: d.toLocaleDateString(), color: '#FFD700' }); } return events; }

  async updateAIPanel() { try { const c=this.ensureAIPanelExists(); const s=c.querySelector('#astroAiSummary'); if (s) s.textContent='AI Mentor: (open table for full analysis)'; } catch(e){} }

  ensureAIPanelExists() { let c=document.getElementById('astroAIPanel'); if (c) return c; const eventsList=document.getElementById('astroEventsList'); c=document.createElement('div'); c.id='astroAIPanel'; c.style.margin='8px 0'; c.innerHTML=`<div id="astroAiSummary">Loading AI Mentor...</div><div id="astroAiPerPlanet"></div>`; if (eventsList && eventsList.parentNode) eventsList.parentNode.insertBefore(c, eventsList); else document.body.appendChild(c); return c; }

  async calculatePlanetaryPositions(date) { const planets=['Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune']; return planets.map((name,i)=>({name,angle:(i*45)%360})); }

  performCycleAnalysis(){ this.cycleAnalysis={}; }
  startRealTimeUpdates(){ this.updateInterval=setInterval(()=>{ if (this.currentDate.toDateString()===new Date().toDateString()) this.loadPlanetaryData(); },60000); }
  stopRealTimeUpdates(){ if(this.updateInterval){ clearInterval(this.updateInterval); this.updateInterval=null; } }
  updatePlanetaryData(){ this.loadPlanetaryData(); }
}

document.addEventListener('DOMContentLoaded', ()=>{ try{ window.astroCyclesModule=new AstroCyclesModule(); }catch(e){ console.error('AstroCyclesModule init failed', e); } });

// Utility helpers (exposed on prototype for ease of testing)
AstroCyclesModule.prototype.escapeHtml = function (s) {
  if (!s && s !== 0) return '';
  return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
};

AstroCyclesModule.prototype.eventsToCSV = function (events) {
  const headers = ['date','title','description','planets','nakshatra','pada','deity','telugu_label'];
  const rows = events.map(ev => {
    const date = ev.date || ev.datetime || '';
    const title = ev.event || ev.type || ev.name || '';
    const desc = ev.description || ev.note || '';
    const planets = (ev.planets && Array.isArray(ev.planets)) ? ev.planets.join(';') : (ev.planets || '');
    const nak = ev.nakshatra || ev.nakshatra_name || '';
    const pada = ev.pada || '';
    const deity = ev.deity || '';
    const tel = ev.label_telugu || ev.labelTelugu || '';
    return [date, title, desc, planets, nak, pada, deity, tel].map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
};

AstroCyclesModule.prototype.eventsToICS = function (events) {
  // Simple ICS generator: each event at 12:00 UTC on the date if date present, or skip if no date
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//AstroQuant//EN'];
  events.forEach((ev, idx) => {
    const dateStr = ev.date || ev.datetime || '';
    if (!dateStr) return;
    // Force date-only to DTSTART (all-day event)
    const dt = dateStr.split('T')[0] || dateStr;
    const uid = `astro-${idx}-${dt}-${Math.random().toString(36).slice(2,9)}`;
    const title = (ev.event || ev.type || ev.name || '').replace(/\r|\n/g,' ');
    const desc = (ev.description || ev.note || '').replace(/\r|\n/g,' ');
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').split('.')[0]}Z`);
    lines.push(`DTSTART;VALUE=DATE:${dt.replace(/-/g,'')}`);
    // Set end date as next day
    const endDate = new Date(dt + 'T00:00:00Z'); endDate.setUTCDate(endDate.getUTCDate()+1);
    lines.push(`DTEND;VALUE=DATE:${endDate.toISOString().slice(0,10).replace(/-/g,'')}`);
    lines.push(`SUMMARY:${title}`);
    if (desc) lines.push(`DESCRIPTION:${desc}`);
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

AstroCyclesModule.prototype.downloadBlob = function (text, mime, filename) {
  try {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  } catch (e) { console.error('Download failed', e); }
};