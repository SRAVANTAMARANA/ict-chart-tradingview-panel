// Minimal standalone Astro Events page script (non-React fallback)
(function(){
  // Permanent API base (override with window.API_BASE if needed)
  const apiBase = (typeof window.API_BASE === 'string' && window.API_BASE) ? window.API_BASE.replace(/\/$/, '') : 'http://127.0.0.1:8081';
  async function fetchEvents(){
    try{
      console.debug('astro-events: fetching events from', apiBase + '/astro/events');
      const r = await fetch(apiBase + '/astro/events');
      if (!r.ok) throw new Error('events fetch failed: '+r.status + ' ' + await r.text());
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
    return `\n      <article class="astro-event-item" role="listitem" aria-labelledby="evt-title-${idx}">\n        <div class="evt-head">\n          <h3 id="evt-title-${idx}">${escapeHtml(title)}</h3>\n          <time datetime="${escapeHtml(date)}">${escapeHtml(date)}</time>\n        </div>\n        <p class="evt-desc">${escapeHtml(desc)}</p>\n        <div class="evt-meta">Planets: <strong>${escapeHtml(planets)}</strong></div>\n        ${nak ? `<div class="evt-meta">Nakshatra: <strong>${escapeHtml(nak)}</strong> ${pada ? `— Pada: ${escapeHtml(pada)}` : ''} ${deity ? `— Deity: ${escapeHtml(deity)}` : ''}</div>` : ''}\n        ${tel ? `<div class="evt-telugu telugu">Telugu: ${escapeHtml(tel)}</div>` : ''}\n        <div class="evt-actions">\n          <button class="ai-btn" data-idx="${idx}" aria-controls="ai-${idx}" aria-expanded="false" aria-label="Show AI insight for ${escapeHtml(title)}">Show AI</button>\n          <div class="ai-output" id="ai-${idx}" role="region" aria-live="polite"></div>\n        </div>\n      </article>`;
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
          const r = await fetch(apiBase + '/astro/event-ai', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(events[idx]||{}) });
          if (!r.ok) { target.textContent = 'AI unavailable'; console.warn('AI endpoint returned', r.status); return; }
          const j = await r.json();
          const insightText = (j.insight||j.insight_text||'No insight') + (j.confidence ? ` (conf:${Number(j.confidence).toFixed(2)})` : '');
          target.textContent = insightText;
          btn.setAttribute('aria-expanded','true');
        }catch(err){ target.textContent = 'AI request failed'; console.warn('AI request error', err); }
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

  // expose helpers for other scripts/tests
  try{ window.astroEvents = window.astroEvents || {}; window.astroEvents.applyFilters = applyFilters; window.astroEvents.eventsToCSV = eventsToCSV; window.astroEvents.eventsToICS = eventsToICS; window.applyFilters = applyFilters; }catch(e){}

  // Export helpers
  function eventsToCSV(events){
    const cols = ['date','title','description','planets','nakshatra','pada','deity','telugu_label'];
    const rows = (events||[]).map(ev=>{
      const d = ev.date||ev.datetime||'';
      const title = ev.event||ev.type||ev.name||'';
      const desc = (ev.description||ev.note||'').replace(/\r?\n/g,' ');
      const planets = Array.isArray(ev.planets)?ev.planets.join('|'):(ev.planets||'');
      const nak = ev.nakshatra || ev.nakshatra_name || '';
      const pada = ev.pada || '';
      const deity = ev.deity || '';
      const tel = ev.label_telugu || '';
      return [d,title,desc,planets,nak,pada,deity,tel].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',');
    });
    return cols.join(',') + '\n' + rows.join('\n');
  }

  function eventsToICS(events){
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//AstroQuant//EN'];
    (events||[]).forEach((ev, i)=>{
      const dt = (ev.date||ev.datetime||'');
      const uid = `astro-event-${i}@astroquant`;
      const title = (ev.event||ev.type||ev.name||'').replace(/\n/g,' ');
      const desc = (ev.description||ev.note||'').replace(/\n/g,'\\n');
      lines.push('BEGIN:VEVENT');
      lines.push('UID:'+uid);
      lines.push('SUMMARY:'+title);
      lines.push('DESCRIPTION:'+desc);
      if (dt && dt.length>=10){
        const datePart = dt.slice(0,10).replace(/-/g,'');
        lines.push('DTSTART;VALUE=DATE:'+datePart);
      }
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  async function init(){
    const events = await fetchEvents();
    const filters = readQueryParams();
    const controlsHolder = document.getElementById('astroEventsControlsPlaceholder');
    if (controlsHolder){
      // build enhanced controls: planet/type/from/to + CSV/ICS/subscribe
      controlsHolder.innerHTML = '';
  const planetSelect = document.createElement('select'); planetSelect.id='filterPlanet';
  planetSelect.setAttribute('aria-label','Filter by planet');
  planetSelect.title = 'Filter by planet';
      const allOpt = document.createElement('option'); allOpt.value=''; allOpt.textContent='All Planets'; planetSelect.appendChild(allOpt);
      ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune'].forEach(p=>{ const o=document.createElement('option'); o.value=p; o.textContent=p; planetSelect.appendChild(o); });
      planetSelect.value = filters.planet || '';

  const typeSelect = document.createElement('select'); typeSelect.id='filterType';
  typeSelect.setAttribute('aria-label','Filter by event type');
  typeSelect.title = 'Filter by event type';
  const tAll = document.createElement('option'); tAll.value=''; tAll.textContent='All Types'; typeSelect.appendChild(tAll);
      ['Nakshatra Transit','Conjunction','Opposition','Trine','Square','Sextile'].forEach(t=>{ const o=document.createElement('option'); o.value=t; o.textContent=t; typeSelect.appendChild(o); });
      typeSelect.value = filters.type || '';

  const fromInp = document.createElement('input'); fromInp.type='date'; fromInp.id='filterFrom'; fromInp.value = filters.from || ''; fromInp.setAttribute('aria-label','Filter from date'); fromInp.title='From date';
  const toInp = document.createElement('input'); toInp.type='date'; toInp.id='filterTo'; toInp.value = filters.to || ''; toInp.setAttribute('aria-label','Filter to date'); toInp.title='To date';

  const csvBtn = document.createElement('button'); csvBtn.textContent='Export CSV'; csvBtn.addEventListener('click', ()=>{ const csv = eventsToCSV(currentViewEvents); const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='astro-events.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),2000); });
  const icsBtn = document.createElement('button'); icsBtn.textContent='Export ICS'; icsBtn.addEventListener('click', ()=>{ const ics = eventsToICS(currentViewEvents); const blob=new Blob([ics],{type:'text/calendar'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='astro-events.ics'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),2000); });
  const sub = document.createElement('a'); sub.href=apiBase + '/astro/events.ics'; sub.textContent='Subscribe Calendar'; sub.style.marginLeft='8px';

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

    // add a floating single-click toolbar for easy access
    (function addToolbar(){
      try{
        const toolbar = document.createElement('div'); toolbar.className='fab-toolbar'; toolbar.setAttribute('role','toolbar'); toolbar.setAttribute('aria-label','Quick actions');
        const todayBtn = document.createElement('button'); todayBtn.className='fab-btn'; todayBtn.textContent='Today\'s Events'; todayBtn.title="Show today's events"; todayBtn.setAttribute('aria-label','Show today\'s events');
        const exportBtn = document.createElement('button'); exportBtn.className='fab-btn fab-btn--secondary'; exportBtn.textContent='Export All'; exportBtn.title='Export all events as CSV and ICS'; exportBtn.setAttribute('aria-label','Export all events');
        const aiAllBtn = document.createElement('button'); aiAllBtn.className='fab-btn'; aiAllBtn.textContent='Show AI for All'; aiAllBtn.title='Request AI insights for all visible events'; aiAllBtn.setAttribute('aria-label','Show AI for all events');

        toolbar.appendChild(todayBtn); toolbar.appendChild(exportBtn); toolbar.appendChild(aiAllBtn);
        document.body.appendChild(toolbar);

        todayBtn.addEventListener('click', ()=>{
          const today = new Date().toISOString().slice(0,10);
          // set filters to today
          if (document.getElementById('filterFrom')) document.getElementById('filterFrom').value = today;
          if (document.getElementById('filterTo')) document.getElementById('filterTo').value = today;
          // trigger re-render
          const ev = new Event('change'); document.getElementById('filterFrom')?.dispatchEvent(ev); document.getElementById('filterTo')?.dispatchEvent(ev);
          announce('Filtered to today');
        });

        exportBtn.addEventListener('click', async ()=>{
          const eventsData = window.currentViewEvents || [];
          const csv = eventsToCSV(eventsData);
          const ics = eventsToICS(eventsData);
          announce('Preparing export...');
          // try to load JSZip from CDN and make a single ZIP download
          try{
            if (typeof window.JSZip === 'undefined'){
              await new Promise((resolve,reject)=>{
                const s = document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'; s.onload=resolve; s.onerror=reject; document.head.appendChild(s);
              });
            }
            if (typeof window.JSZip !== 'undefined'){
              const zip = new window.JSZip();
              zip.file('astro-events-all.csv', csv);
              zip.file('astro-events-all.ics', ics);
              const content = await zip.generateAsync({type:'blob'});
              const url = URL.createObjectURL(content);
              const a = document.createElement('a'); a.href=url; a.download='astro-events-all.zip'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),2000);
              announce('Exported ZIP with CSV and ICS');
              return;
            }
          }catch(e){ console.warn('JSZip load/generate failed', e); }
          // fallback: trigger two downloads
          try{
            const blob1 = new Blob([csv],{type:'text/csv'}); const a1 = document.createElement('a'); a1.href=URL.createObjectURL(blob1); a1.download='astro-events-all.csv'; a1.click(); setTimeout(()=>URL.revokeObjectURL(a1.href),2000);
            const blob2 = new Blob([ics],{type:'text/calendar'}); const a2 = document.createElement('a'); a2.href=URL.createObjectURL(blob2); a2.download='astro-events-all.ics'; a2.click(); setTimeout(()=>URL.revokeObjectURL(a2.href),2000);
            announce('Exported CSV and ICS');
          }catch(e){ announce('Export failed'); console.warn(e); }
        });

        aiAllBtn.addEventListener('click', async ()=>{
          const items = Array.from(document.querySelectorAll('.ai-btn'));
          if (!items.length){ announce('No AI buttons found'); return; }
          announce('Requesting AI for all events. This may take a moment.');
          // concurrency-controlled parallel execution
          const concurrency = 6;
          let index = 0;
          async function worker(){
            while(true){
              let i;
              // grab next index atomically
              if (index >= items.length) return;
              i = index; index++;
              const btn = items[i];
              try{
                btn.focus();
                // trigger click handler which performs fetch to AI endpoint
                btn.click();
                // allow a short delay for server to accept request
                await new Promise(r=>setTimeout(r, 200));
              }catch(e){ console.warn('ai all item failed', e); }
            }
          }
          // start workers
          const workers = [];
          for (let w=0; w<concurrency; w++) workers.push(worker());
          await Promise.all(workers);
          announce('Requested AI for all events');
        });

      }catch(e){ console.warn('toolbar attach failed', e); }
    })();

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

  // Kick off: run init immediately if DOM already parsed, otherwise wait for DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already ready
    try { init(); } catch (e) { console.error('astro-events init failed', e); }
  }
})();
