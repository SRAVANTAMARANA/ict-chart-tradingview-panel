(async function(){
  // Render planetary table in its own page; reuses logic from astro-full
  const head = document.getElementById('tableHead');
  const body = document.getElementById('tableBody');
  const dateInput = document.getElementById('tableDate');
  const refreshBtn = document.getElementById('tableRefresh');

  try { dateInput.value = new Date().toISOString().slice(0,10); } catch(_) {}

  const apiBase = (typeof window.API_BASE === 'string' && window.API_BASE) ? window.API_BASE.replace(/\/$/, '') : 'http://localhost:8081';

  function normalizeName(s){ return (typeof s === 'string' && s.length) ? (s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()) : s }

  async function load(date){
    try {
      const dstr = date || dateInput.value || new Date().toISOString().slice(0,10);
      const r = await fetch(`${apiBase}/astro/ephemeris?date=${encodeURIComponent(dstr)}`);
      if (!r.ok) throw new Error('no ephemeris');
      const j = await r.json();
      let positions = null;
      if (j && Array.isArray(j.ephemeris) && j.ephemeris.length>0 && j.ephemeris[0].positions) positions = j.ephemeris[0].positions;
      else if (j.positions) positions = j.positions;
      else if (j.planets) positions = j.planets;

      const teluguMap = {};
      let epList = [];
      if (positions && typeof positions === 'object'){
        epList = Object.entries(positions).map(([k,v])=>({name:normalizeName(k),_raw:k,...v}));
        Object.keys(positions).forEach(k=>{ const p=positions[k]; if (!p) return; const name=normalizeName(k); const z = p.zodiac_telugu||p.label_telugu||p.zodiacTelugu; if (z) teluguMap[name]=z })
      } else if (Array.isArray(j)){
        epList = j.map(p=>({name:normalizeName(p.name||p.planet||p.label),...p}))
      }

      const hasTelugu = Object.keys(teluguMap).length>0;
      head.innerHTML = `<tr><th>Icon</th><th>Planet</th><th>Sign</th>${hasTelugu?'<th>Telugu</th>':''}<th>Degree</th><th>Speed</th><th>Status</th></tr>`;
      body.innerHTML = '';
      epList.forEach((p,idx)=>{
        const name = p.name||p.planet||p._raw||'';
        const lon = (p.longitude_geocentric!==undefined)?p.longitude_geocentric:(p.longitude||'');
        const degree = (typeof lon==='number')? (lon%30).toFixed(2) : (p.deg_into_sign||'');
        const speed = (p.speed!==undefined)?p.speed:(p.speed_deg_per_day||0);
        const color = p.color||['#FFD700','#C0C0C0','#FFA500','#FFC649','#CD5C5C','#D8CA9D','#FAD5A5','#4FD0E7','#4B70DD','#8A2BE2'][idx%10];
        const tel = teluguMap[name]||'';
        const safeLon = (typeof lon==='number')?lon.toFixed(4):'';
        const icon = `<a href="/astro-planet.html?planet=${encodeURIComponent(name)}&lon=${encodeURIComponent(safeLon)}" target="_blank" title="Open ${name}"><div style="width:14px;height:14px;border-radius:50%;background:${color};display:inline-block;border:1px solid rgba(255,255,255,0.06)"></div></a>`;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${icon}</td><td style="font-weight:600;color:${color}">${name}</td><td>${p.zodiac_en||''}</td>${hasTelugu?`<td>${tel}</td>`:''}<td>${degree}°</td><td>${(speed||0).toFixed(3)}°/day</td><td>${p.retrograde?'<span style="color:#ff6b6b">℞</span>':'<span style="color:#51cf66">•</span>'}</td>`;
        body.appendChild(tr);
      });
    } catch (e){ console.error('load table failed',e); head.innerHTML=''; body.innerHTML='<tr><td colspan="6">Unable to load ephemeris.</td></tr>'; }
  }

  refreshBtn.addEventListener('click', ()=> load(dateInput.value));
  await load();
})();
