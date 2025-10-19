// Minimal standalone Astro Events page script (non-React fallback)
(function(){
  async function fetchEvents(){
    try{
      const r = await fetch('/astro/events');
      if (!r.ok) throw new Error('events fetch failed: '+r.status);
      const j = await r.json();
      return Array.isArray(j) ? j : (j.events || []);
    }catch(e){ console.warn('fetchEvents error', e); return []; }
  }

  function escapeHtml(s){ if (!s && s!==0) return ''; return String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  function renderEventItem(ev, idx){
    const date = ev.date || ev.datetime || '';
    const title = ev.event || ev.type || ev.name || '';
    const desc = ev.description || ev.note || '';
    const planets = (ev.planets && Array.isArray(ev.planets)) ? ev.planets.join(', ') : (ev.planets || '');
    const nak = ev.nakshatra || ev.nakshatra_name || '';
    const pada = ev.pada || '';
    const deity = ev.deity || '';
    const tel = ev.label_telugu || '';
    const color = ev.color || '#4FD0E7';
    return `\n      <article class="astro-event-item" role="listitem" aria-labelledby="evt-title-${idx}">\n        <div class="evt-head">\n          <h3 id="evt-title-${idx}">${escapeHtml(title)}</h3>\n          <time datetime="${escapeHtml(date)}">${escapeHtml(date)}</time>\n        </div>\n        <p class="evt-desc">${escapeHtml(desc)}</p>\n        <div class="evt-meta">Planets: <strong>${escapeHtml(planets)}</strong></div>\n        ${nak ? `<div class="evt-meta">Nakshatra: <strong>${escapeHtml(nak)}</strong> ${pada ? `— Pada: ${escapeHtml(pada)}` : ''} ${deity ? `— Deity: ${escapeHtml(deity)}` : ''}</div>` : ''}\n        ${tel ? `<div class="evt-telugu telugu">Telugu: ${escapeHtml(tel)}</div>` : ''}\n        <div class="evt-actions">\n          <button class="ai-btn" data-idx="${idx}">Show AI</button>\n          <div class="ai-output" id="ai-${idx}"></div>\n        </div>\n      </article>`;
  }

  async function attachAIButtons(events){
    document.querySelectorAll('.ai-btn').forEach(btn=>{
      btn.addEventListener('click', async (e)=>{
        const idx = Number(btn.dataset.idx);
        const target = document.getElementById('ai-'+idx);
        if (!target) return;
        target.textContent = 'Loading...';
        btn.setAttribute('aria-busy','true');
        try{
          const r = await fetch('/astro/event-ai', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(events[idx]||{}) });
          if (!r.ok) { target.textContent = 'AI unavailable'; return; }
          const j = await r.json();
          const insightText = (j.insight||j.insight_text||'No insight') + (j.confidence ? ` (conf:${Number(j.confidence).toFixed(2)})` : '');
          target.textContent = insightText;
          btn.setAttribute('aria-expanded','true');
        }catch(err){ target.textContent = 'AI request failed'; }
        btn.removeAttribute('aria-busy');
      });
    });
  }

  function readQueryParams(){
    const qs = new URLSearchParams(window.location.search);
    return {
      date: qs.get('date') || '',
      planet: qs.get('planet') || '',
      type: qs.get('type') || '',
      from: qs.get('from') || '',
      to: qs.get('to') || ''
    };
  }

  function debounce(fn, wait=200){
    let t = null;
    return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), wait); };
  }

  function announce(text){
    const regionId = 'astro-events-live';
    let r = document.getElementById(regionId);
    if (!r){ r = document.createElement('div'); r.id = regionId; r.setAttribute('aria-live','polite'); r.setAttribute('aria-atomic','true'); r.style.position='absolute'; r.style.left='-9999px'; r.style.top='auto'; document.body.appendChild(r); }
    r.textContent = text;
  }

  function applyFilters(events, filters){
    let filtered = (events || []).slice();
    if (filters.planet) filtered = filtered.filter(ev => (ev.planets||[]).map(p=>String(p).toLowerCase()).includes(filters.planet.toLowerCase()) || String(ev.event||ev.type||'').toLowerCase().includes(filters.planet.toLowerCase()));
    if (filters.type) filtered = filtered.filter(ev => String(ev.type||ev.event||'').toLowerCase().includes(filters.type.toLowerCase()));
    if (filters.from) filtered = filtered.filter(ev => (ev.date||ev.datetime||'').slice(0,10) >= filters.from);
    if (filters.to) filtered = filtered.filter(ev => (ev.date||ev.datetime||'').slice(0,10) <= filters.to);
    return filtered;
  }

  async function init(){
    const events = await fetchEvents();
    const filters = readQueryParams();
    const controlsHolder = document.getElementById('astroEventsControlsPlaceholder');
    if (controlsHolder){
      // build enhanced controls: planet/type/from/to + CSV/ICS/subscribe
      controlsHolder.innerHTML = '';
      const planetSelect = document.createElement('select'); planetSelect.id='filterPlanet';
      const allOpt = document.createElement('option'); allOpt.value=''; allOpt.textContent='All Planets'; planetSelect.appendChild(allOpt);
      ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune'].forEach(p=>{ const o=document.createElement('option'); o.value=p; o.textContent=p; planetSelect.appendChild(o); });
      planetSelect.value = filters.planet || '';

      const typeSelect = document.createElement('select'); typeSelect.id='filterType'; const tAll = document.createElement('option'); tAll.value=''; tAll.textContent='All Types'; typeSelect.appendChild(tAll);
      ['Nakshatra Transit','Conjunction','Opposition','Trine','Square','Sextile'].forEach(t=>{ const o=document.createElement('option'); o.value=t; o.textContent=t; typeSelect.appendChild(o); });
      typeSelect.value = filters.type || '';

      const fromInp = document.createElement('input'); fromInp.type='date'; fromInp.id='filterFrom'; fromInp.value = filters.from || '';
      const toInp = document.createElement('input'); toInp.type='date'; toInp.id='filterTo'; toInp.value = filters.to || '';

      const csvBtn = document.createElement('button'); csvBtn.textContent='Export CSV'; csvBtn.addEventListener('click', ()=>{ const csv = window.astroCyclesModule ? window.astroCyclesModule.eventsToCSV(currentViewEvents) : ''; const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='astro-events.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),2000); });
      const icsBtn = document.createElement('button'); icsBtn.textContent='Export ICS'; icsBtn.addEventListener('click', ()=>{ const ics = window.astroCyclesModule ? window.astroCyclesModule.eventsToICS(currentViewEvents) : ''; const blob=new Blob([ics],{type:'text/calendar'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='astro-events.ics'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),2000); });
      const sub = document.createElement('a'); sub.href='/astro/events.ics'; sub.textContent='Subscribe Calendar'; sub.style.marginLeft='8px';

      controlsHolder.appendChild(planetSelect);
      controlsHolder.appendChild(typeSelect);
      controlsHolder.appendChild(document.createTextNode('From:'));
      controlsHolder.appendChild(fromInp);
      controlsHolder.appendChild(document.createTextNode('To:'));
      controlsHolder.appendChild(toInp);
      controlsHolder.appendChild(csvBtn);
      controlsHolder.appendChild(icsBtn);
      controlsHolder.appendChild(sub);

      // wire events
      function reRender(){
        const f = { planet: planetSelect.value, type: typeSelect.value, from: fromInp.value, to: toInp.value };
        const filtered = applyFilters(events, f);
        currentViewEvents = filtered;
        renderList(filtered);
        announce(`${filtered.length} events shown`);
      }
      const debouncedRe = debounce(reRender, 180);
      planetSelect.addEventListener('change', debouncedRe);
      typeSelect.addEventListener('change', debouncedRe);
      fromInp.addEventListener('change', debouncedRe);
      toInp.addEventListener('change', debouncedRe);
    }

    const list = document.getElementById('astroEventsList');
    if (!list){ console.warn('No events list container'); return; }
    if (!events || events.length===0) { list.innerHTML = '<div class="empty">No events available</div>'; return; }

    // initial render with query filters applied
    window.currentViewEvents = applyFilters(events, filters);
    renderList(window.currentViewEvents);
    attachAIButtons(window.currentViewEvents);
  }

  function renderList(events){
    const list = document.getElementById('astroEventsList'); if (!list) return;
    list.innerHTML = (events || []).map((ev,idx)=>{
      // make each item focusable for keyboard users
      return renderEventItem(ev, idx).replace('<article','<article tabindex="0"');
    }).join('\n');
    attachAIButtons(events);
    // keyboard support: Enter on article focuses first AI button
    document.querySelectorAll('.astro-event-item[tabindex]').forEach((art, i)=>{
      art.addEventListener('keydown', (ev)=>{
        if (ev.key === 'Enter' || ev.key === ' '){
          const btn = art.querySelector('.ai-btn'); if (btn) btn.focus();
          ev.preventDefault();
        }
      });
    });
  }

  // Kick off
  document.addEventListener('DOMContentLoaded', init);
})();
