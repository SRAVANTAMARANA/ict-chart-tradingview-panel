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
      if (!body) {
        console.warn('table body element not found');
        return;
      }
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
          tr.dataset.planet = name;
          tr.innerHTML = `<td>${icon}</td><td style="font-weight:600;color:${color}">${name}</td><td>${p.zodiac_en||''}</td>${hasTelugu?`<td>${tel}</td>`:''}<td>${degree}°</td><td>${(speed||0).toFixed(3)}°/day</td><td>${p.retrograde?'<span style="color:#ff6b6b">℞</span>':'<span style="color:#51cf66">•</span>'}</td>`;
          body.appendChild(tr);
      });

        // handle scrollTo parameter (openers may pass ?scrollTo=PlanetName&lon=...)
        try {
          const params = new URLSearchParams(window.location.search);
          const target = params.get('scrollTo');
          if (target) {
            const normalized = target.trim().toLowerCase();
            const rowsEls = Array.from(body.querySelectorAll('tr'));
            const match = rowsEls.find(r => r.dataset && r.dataset.planet && r.dataset.planet.toLowerCase() === normalized);
            if (match) {
              // Prefer scrollIntoView for consistent centering and smoother UX.
              try {
                // First try to scroll the container if present, otherwise use scrollIntoView
                const container = document.querySelector('.table-scroll');
                if (container && typeof container.scrollTo === 'function') {
                  // center the row inside the container
                  const top = match.offsetTop - container.clientHeight / 2 + match.clientHeight / 2;
                  container.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
                } else {
                  match.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              } catch (scErr) {
                // fallback
                try { match.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {}
              }

              // Add highlight after a short delay so it is visible after scroll completes
              setTimeout(() => {
                match.classList.add('astro-highlight');
                setTimeout(() => match.classList.remove('astro-highlight'), 2400);
              }, 160);
            }
            else {
              console.warn('scrollTo param provided but no matching planet row found for', target);
            }
          }
        } catch (err) {
          console.warn('scrollTo handling failed', err);
        }
    } catch (e){ console.error('load table failed',e); head.innerHTML=''; body.innerHTML='<tr><td colspan="6">Unable to load ephemeris.</td></tr>'; }
  }

  refreshBtn.addEventListener('click', ()=> load(dateInput.value));
  await load();
})();
