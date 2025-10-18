(() => {
  const params = new URLSearchParams(location.search);
  const planet = params.get('planet') || params.get('name') || 'Planet';
  const lonParam = params.get('lon') || params.get('longitude') || null;
  const dateParam = params.get('date') || null;

  const TELUGU = {
    Sun: 'సూర్య', Moon: 'చంద్ర', Mercury: 'బుధ', Venus: 'శుక్ర', Mars: 'మంగళ', Jupiter: 'గురు', Saturn: 'శని', Rahu: 'రాహు', Ketu: 'కేతు'
  };

  const RASHI = ['Meṣa (Aries)','Vṛṣabha (Taurus)','Mithuna (Gemini)','Karkaṭa (Cancer)','Siṃha (Leo)','Kanyā (Virgo)','Tula (Libra)','Vṛścika (Scorpio)','Dhanus (Sagittarius)','Makar (Capricorn)','Kumbha (Aquarius)','Mīna (Pisces)'];
  const NAK = [
    'Aśvini','Bharani','Kṛttikā','Rohiṇī','Mṛgaśīrṣa','Ārdrā','Punarvasu','Puṣya','Aśleśā','Maghā','Pūrva Phālguni','Uttara Phālguni','Hasta','Citra','Svāti','Viśākhā','Anurādhā','Jyeṣṭhā','Mūla','Pūrva Āṣāḍhā','Uttara Āṣāḍhā','Śravaṇa','Dhanisthā','Śatabhiṣaj','Pūrva Bhādrapad','Uttara Bhādrapad','Revatī'
  ];

  function mod(x,n){return ((x % n) + n) % n}

  function renderFromLon(lon){
    const lon360 = mod(parseFloat(lon),360);
    const rashiIndex = Math.floor(lon360 / 30) % 12;
    const degInSign = (lon360 % 30).toFixed(4);
    const nakIndex = Math.floor(lon360 / (360/27));
    const degInNak = lon360 - nakIndex * (360/27);
    const pada = Math.floor((degInNak / (360/27)) * 4) + 1; // 1..4

    document.getElementById('planetName').textContent = planet;
    document.getElementById('rashi').textContent = `${RASHI[rashiIndex]} — sign #${rashiIndex+1}`;
    document.getElementById('degRemainder').textContent = `${degInSign}° into sign`;
    document.getElementById('nak').textContent = `${NAK[nakIndex]} — nakshatra ${nakIndex+1}/27`;
    document.getElementById('pada').textContent = `Pada: ${pada}`;
    document.getElementById('notes').textContent = `Longitude (geocentric): ${lon360}°`;
    const tel = TELUGU[planet] || '';
    if (tel) { document.getElementById('teluguName').textContent = tel; document.getElementById('teluguName').style.display = 'inline-block'; }
  }

  async function fetchEphemeris(date) {
    try {
      const apiBase = (typeof window.API_BASE === 'string' && window.API_BASE) ? window.API_BASE.replace(/\/$/, '') : 'http://localhost:8081';
      const d = date ? `?date=${encodeURIComponent(date)}` : '';
      const r = await fetch(`${apiBase}/astro/ephemeris${d}`);
      if (!r.ok) return null;
      const j = await r.json();
      return j;
    } catch (e) { return null; }
  }

  async function init(){
    let lon = lonParam;
    // If longitude not provided, try to fetch from ephemeris for given date and planet
    if (!lon) {
      const ep = await fetchEphemeris(dateParam);
      if (ep && Array.isArray(ep.ephemeris) && ep.ephemeris.length > 0) {
        const pos = ep.ephemeris[0].positions || ep.positions || ep.planets || {};
        const key = Object.keys(pos).find(k => k.toLowerCase() === planet.toLowerCase());
        if (key) lon = pos[key].longitude_geocentric ?? pos[key].longitude ?? pos[key];
        // AI note
        // Prefer per_planet notes but also support top-level ai_mentor.note
        const el = document.getElementById('aiNote');
        if (ep.ai_mentor) {
          if (ep.ai_mentor.per_planet && ep.ai_mentor.per_planet[planet]) {
            el.textContent = ep.ai_mentor.per_planet[planet];
            document.getElementById('aiWrap').style.display = 'block';
          } else if (ep.ai_mentor.note) {
            el.textContent = ep.ai_mentor.note;
            document.getElementById('aiWrap').style.display = 'block';
          }
        }
      }
    } else {
      // If we have lon param, also try to fetch ai_mentor for same-date if present
      const ep = await fetchEphemeris(dateParam);
      const el = document.getElementById('aiNote');
      if (ep && ep.ai_mentor) {
        if (ep.ai_mentor.per_planet && ep.ai_mentor.per_planet[planet]) {
          el.textContent = ep.ai_mentor.per_planet[planet]; document.getElementById('aiWrap').style.display = 'block';
        } else if (ep.ai_mentor.note) {
          el.textContent = ep.ai_mentor.note; document.getElementById('aiWrap').style.display = 'block';
        }
      }
    }

    if (lon !== null && lon !== undefined) {
      renderFromLon(lon);
    }

    // glyph (simple mapping)
    const glyphs = { Sun: '☉', Moon: '☾', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Rahu: '☊', Ketu: '☋' };
    try { document.getElementById('planetGlyph').textContent = glyphs[planet] || planet.charAt(0); } catch(_){}

    // share button
    // populate permalink input
    const permin = document.getElementById('permalink');
    try { permin.value = window.location.href; } catch(e) { /* ignore */ }

    document.getElementById('shareBtn').addEventListener('click', async ()=>{
      const url = permin && permin.value ? permin.value : window.location.href;
      // try clipboard API first
      try {
        await navigator.clipboard.writeText(url);
        const b = document.getElementById('shareBtn'); b.textContent = 'Copied'; setTimeout(()=>{ b.textContent = 'Copy'; },1500);
        return;
      } catch (e) {
        // fallback: select input and execCommand
        try {
          permin.select(); permin.setSelectionRange(0, 99999);
          document.execCommand('copy');
          const b = document.getElementById('shareBtn'); b.textContent = 'Copied'; setTimeout(()=>{ b.textContent = 'Copy'; },1500);
          return;
        } catch (ex) {
          alert('Copy failed: ' + (ex && ex.message ? ex.message : e.message));
        }
      }
    });

    document.getElementById('backBtn').addEventListener('click', ()=>{ window.history.back(); });
  }

  init();
})();
