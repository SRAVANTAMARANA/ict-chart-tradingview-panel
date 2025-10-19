// LightweightCharts event overlay module
(function(){
  const apiBase = (typeof window.API_BASE === 'string' && window.API_BASE) ? window.API_BASE.replace(/\/$/, '') : 'http://127.0.0.1:8081';
  let state = { showPast:true, showNow:true, showFuture:true, lang:'en', nowWindowMinutes:5 };
  let markers = [];
  let eventsCache = [];

  function toTimestamp(dateStr){
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    return Math.floor(d.getTime()/1000);
  }

  async function fetchEvents(){
    try{
      const r = await fetch(apiBase + '/astro/events');
      if (!r.ok) throw new Error('events fetch failed');
      const j = await r.json();
      return Array.isArray(j) ? j : (j.events||[]);
    }catch(e){ console.warn('fetch events overlay', e); return []; }
  }

  function typeColor(type){
    if (!type) return '#00bcd4';
    const t = String(type).toLowerCase();
    if (t.includes('nakshatra') || t.includes('transit')) return '#00bcd4';
    if (t.includes('conjunction') || t.includes('conj')) return '#ff9800';
    if (t.includes('opposition') || t.includes('oppo')) return '#f44336';
    if (t.includes('trine')||t.includes('sextile')||t.includes('square')) return '#9c27b0';
    return '#00bcd4';
  }

  function buildMarker(ev, idx){
    const t = toTimestamp(ev.date||ev.datetime);
    if (!t) return null;
    const title = (state.lang === 'te' && ev.label_telugu) ? ev.label_telugu : (ev.event||ev.type||ev.name||'');
    const color = ev.color || typeColor(ev.type || ev.event);
    // choose shape by type for quick visual
    let shape = 'circle';
    const typ = String(ev.type||ev.event||'').toLowerCase();
    if (typ.includes('conjunction')) shape = 'arrowDown';
    if (typ.includes('opposition')) shape = 'arrowUp';
    return { time: t, position: 'belowBar', color, shape, text: title, id: 'evt-'+idx, dataIndex: idx };
  }

  function filterByTime(evTs){
    const now = Math.floor(Date.now()/1000);
    const windowSec = (state.nowWindowMinutes||5) * 60;
    const isNow = Math.abs(evTs - now) <= windowSec;
    if (evTs < now - windowSec && !state.showPast) return false;
    if (isNow && !state.showNow) return false;
    if (evTs > now + windowSec && !state.showFuture) return false;
    return true;
  }

  async function renderOverlay(){
    if (!window.chart || !window.candleSeries) return;
    const evs = await fetchEvents();
    eventsCache = evs || [];
    markers = [];
    evs.forEach((ev, i)=>{
      const t = toTimestamp(ev.date||ev.datetime);
      if (!t) return;
      if (!filterByTime(t)) return;
      const m = buildMarker(ev, i);
      if (m) markers.push(m);
    });
    try{ window.candleSeries.setMarkers(markers); }catch(e){ console.warn('setMarkers failed', e); }
  }

  function attachToolbar(){
    try{
      const container = document.getElementById('chartControls') || document.body;
      let toolbar = document.getElementById('evtOverlayToolbar');
      if (toolbar) return;
      toolbar = document.createElement('div'); toolbar.id='evtOverlayToolbar'; toolbar.style.margin='6px'; toolbar.style.display='flex'; toolbar.style.gap='6px';
  const pastBtn = document.createElement('button'); pastBtn.textContent='Past'; pastBtn.setAttribute('aria-pressed', state.showPast); pastBtn.onclick=()=>{ state.showPast=!state.showPast; pastBtn.setAttribute('aria-pressed', state.showPast); renderOverlay(); };
  const nowBtn = document.createElement('button'); nowBtn.textContent=`Now ±${state.nowWindowMinutes}m`; nowBtn.setAttribute('aria-pressed', state.showNow); nowBtn.onclick=()=>{ state.showNow=!state.showNow; nowBtn.setAttribute('aria-pressed', state.showNow); renderOverlay(); };
  const futureBtn = document.createElement('button'); futureBtn.textContent='Future'; futureBtn.setAttribute('aria-pressed', state.showFuture); futureBtn.onclick=()=>{ state.showFuture=!state.showFuture; futureBtn.setAttribute('aria-pressed', state.showFuture); renderOverlay(); };
  const langBtn = document.createElement('button'); langBtn.textContent='TE/EN'; langBtn.onclick=()=>{ state.lang = (state.lang==='en')?'te':'en'; renderOverlay(); };
      toolbar.appendChild(pastBtn); toolbar.appendChild(nowBtn); toolbar.appendChild(futureBtn); toolbar.appendChild(langBtn);
      container.insertBefore(toolbar, container.firstChild);
    }catch(e){ console.warn('attachToolbar failed', e); }
  }

  // Tooltip element for marker details
  function ensureTooltip(){
    let t = document.getElementById('evt-overlay-tooltip');
    if (t) return t;
    t = document.createElement('div'); t.id='evt-overlay-tooltip'; t.style.position='absolute'; t.style.pointerEvents='auto'; t.style.background='rgba(10,10,10,0.95)'; t.style.color='#fff'; t.style.padding='8px'; t.style.borderRadius='6px'; t.style.maxWidth='320px'; t.style.zIndex=2000; t.style.display='none'; document.body.appendChild(t);
    return t;
  }

  function showTooltipForTime(time, point){
    const tooltip = ensureTooltip();
    // find events at this time (within window)
    const windowSec = (state.nowWindowMinutes||5) * 60;
    const found = eventsCache.map((ev,i)=>({ev,i,ts:toTimestamp(ev.date||ev.datetime)})).filter(o=>o.ts && Math.abs(o.ts - time) <= windowSec);
    if (!found || found.length===0){ tooltip.style.display='none'; return; }
    // build content
    const parts = found.map(f=>{
      const ev = f.ev;
      const titleEn = ev.event||ev.type||ev.name||'';
      const titleTe = ev.label_telugu || '';
      const nak = ev.nakshatra || ev.nakshatra_name || '';
      const desc = ev.description || ev.note || '';
      const ai = ev.ai || ev.ai_insight || (ev.ai_mentor && ev.ai_mentor.narration) || '';
      return `<div style="margin-bottom:8px"><strong style="font-size:1rem">${titleEn}</strong>${titleTe?`<div style="font-weight:600;color:#b2f7e0">${titleTe}</div>`:''}<div style="font-size:0.9rem;color:#cfd8dc">${nak? 'Nakshatra: '+nak : ''}</div><div style="margin-top:6px;color:#e0e0e0">${desc}</div>${ai?`<div style="margin-top:6px;color:#ffd54f">AI: ${ai}</div>`:''}</div>`;
    }).join('\n<hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:6px 0">\n');
    tooltip.innerHTML = parts;
    tooltip.style.display='block';
    if (point && point.x !== undefined){
      tooltip.style.left = (point.x + 12) + 'px';
      tooltip.style.top = (point.y + 12) + 'px';
    }
  }

  function hideTooltip(){ const t = document.getElementById('evt-overlay-tooltip'); if (t) t.style.display='none'; }

  function wireChartClicks(){
    try{
      if (wireChartClicks._wired) return; // idempotent
      if (!window.chart) return;
      if (typeof window.chart.subscribeClick === 'function') {
        window.chart.subscribeClick((param) => {
          if (!param || !param.time) return; // time is in unix seconds
          const time = typeof param.time === 'number' ? param.time : (param.time?.timestamp || null);
          showTooltipForTime(time, param.point);
        });
      }
      if (typeof window.chart.subscribeCrosshairMove === 'function') {
        window.chart.subscribeCrosshairMove((param) => {
          if (!param || !param.time) { hideTooltip(); return; }
          const time = typeof param.time === 'number' ? param.time : (param.time?.timestamp || null);
          if (time) showTooltipForTime(time, param.point);
        });
      }
      wireChartClicks._wired = true;
    }catch(e){ console.warn('wireChartClicks failed', e); }
  }

  // public API
  window.chartEventOverlay = {
    init: function(){ attachToolbar(); renderOverlay(); setInterval(renderOverlay, 60*1000); },
    wireClicks: function(){ try{ wireChartClicks(); }catch(e){} }
  };

  // attempt to wire clicks shortly after load (overlay may be loaded before chart)
  try{ setTimeout(()=>{ wireChartClicks(); }, 1000); }catch(e){}

})();
