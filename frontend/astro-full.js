(function(){
  // Full-page astro orbit + table
  const canvas = document.getElementById('orbitCanvas');
  const dateInput = document.getElementById('fullDateInput');
  const refreshBtn = document.getElementById('refreshBtn');
  const closeBtn = document.getElementById('closeBtn');
  const head = document.getElementById('fullPlanetHead');
  const body = document.getElementById('fullPlanetBody');
  const ephemTime = document.getElementById('ephemTime');
  const spinner = document.getElementById('spinner');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const aiMentorSummary = document.getElementById('aiMentorSummary');
  const aiMentorText = document.getElementById('aiMentorText');

  // parse date from querystring
  const params = new URLSearchParams(location.search);
  let dateStr = params.get('date') || new Date().toISOString().split('T')[0];
  dateInput.value = dateStr;

  // Three.js scene setup (NASA-like styling)
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(window.devicePixelRatio || 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / (window.innerHeight - 120), 0.1, 2000);
  camera.position.set(0, 30, 60);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  // Better dragging/panning behavior for users: allow rotate and pan, restrict zoom
  controls.enablePan = true;
  controls.enableRotate = true;
  controls.enableZoom = true;
  controls.screenSpacePanning = false; // pan orthogonal to world-space
  controls.minDistance = 10;
  controls.maxDistance = 1000;

  // Add subtle ambient glow and a directional light (mimic sunlight)
  scene.add(new THREE.AmbientLight(0x223344, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(100, 50, 100);
  scene.add(dir);

  // Starfield background
  function addStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starsMaterial = new THREE.PointsMaterial({color:0xaaaaaa, size:0.7, sizeAttenuation:true, opacity:0.8, transparent:true});
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
  }
  addStars();

  // Create orbit rings and planet markers container
  const orbitGroup = new THREE.Group();
  scene.add(orbitGroup);

  const planetMarkers = {};

  function makeOrbit(radius, color) {
    const geometry = new THREE.RingGeometry(radius - 0.02, radius + 0.02, 256);
    const material = new THREE.MeshBasicMaterial({color, side:THREE.DoubleSide, transparent:true, opacity:0.25});
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2 * 0.98; // slightly tilted
    return mesh;
  }

  function makePlanetMarker(name, color, size=1.5) {
    const geom = new THREE.SphereGeometry(size, 24, 16);
    const mat = new THREE.MeshStandardMaterial({color, metalness:0.2, roughness:0.7, emissive: color, emissiveIntensity: 0.06});
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    return mesh;
  }

  // Scale distances to visual radii
  const distanceScale = d => Math.max(4, d * 5);

  // Fetch ephemeris and render
  async function loadAndRender(dateValue) {
    try {
      // show spinner
      if (loadingOverlay) loadingOverlay.style.pointerEvents = 'auto';
      if (spinner) spinner.style.display = 'block';
      if (aiMentorSummary) { aiMentorSummary.style.display = 'none'; aiMentorText.textContent = 'Loading...'; }
  const apiBase = (typeof window.API_BASE === 'string' && window.API_BASE) ? window.API_BASE.replace(/\/$/, '') : 'http://localhost:8081';
  const resp = await fetch(`${apiBase}/astro/ephemeris?date=${encodeURIComponent(dateValue)}`);
      if (!resp.ok) throw new Error('No ephemeris');
      const json = await resp.json();

      // Clear previous orbits
      while (orbitGroup.children.length) orbitGroup.remove(orbitGroup.children[0]);

      // Map planets from response - prefer canonical ephemeris[0].positions
      const teluguMap = {};
      const normalize = (s) => (typeof s === 'string' && s.length) ? (s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()) : s;

      let positionsObj = null;
      if (json && Array.isArray(json.ephemeris) && json.ephemeris.length > 0 && json.ephemeris[0].positions) {
        positionsObj = json.ephemeris[0].positions;
      } else if (json.positions && typeof json.positions === 'object') {
        positionsObj = json.positions;
      } else if (json.planets && typeof json.planets === 'object') {
        positionsObj = json.planets;
      }

      let epList = [];
      if (positionsObj && typeof positionsObj === 'object') {
        epList = Object.entries(positionsObj).map(([k, v]) => ({ name: normalize(k), _rawName: k, ...v }));
        // Build telugu map from positions object
        Object.keys(positionsObj).forEach(k => {
          const p = positionsObj[k];
          if (!p) return;
          const name = normalize(k);
          const z = p.zodiac_telugu || p.zodiacTelugu || p.label_telugu || p[name + '_zodiac_telugu'] || (p.zodiac && p.zodiac.telugu);
          if (z) teluguMap[name] = z;
        });
      } else if (Array.isArray(json)) {
        epList = json.map(p => ({ name: normalize(p.name || p.planet || p.label), ...p }));
        epList.forEach(p => {
          const name = p.name;
          const z = p.zodiac_telugu || p.zodiacTelugu || p.label_telugu || (p.zodiac && p.zodiac.telugu);
          if (z) teluguMap[name] = z;
        });
      }

      const hasTelugu = Object.keys(teluguMap).length > 0;
      head.innerHTML = `<tr>
        <th style="width:36px;padding:6px">Icon</th>
        <th>Planet</th>
        <th>Sign</th>
        ${hasTelugu?'<th>Zodiac (Telugu)</th>':'<th style="display:none"></th>'}
        <th>Degree</th>
        <th>Speed</th>
        <th>Status</th>
      </tr>`;
      body.innerHTML = '';

      // Create orbits & markers
      epList.forEach((p, idx) => {
        const name = p.name || p.planet || Object.keys(p)[0];
        const lon = (p.longitude_geocentric !== undefined) ? p.longitude_geocentric : (p.longitude || p);
        const degree = (typeof lon === 'number') ? (lon % 30).toFixed(2) : (p.deg_into_sign || p.degree || '');
        const sign = p.zodiac_en || p.zodiac || (typeof lon === 'number' ? Math.floor(lon/30) : '') ;
        const tel = teluguMap[name] || '';
        const speed = (p.speed !== undefined) ? p.speed : (p.speed_deg_per_day || 0);
        const color = p.color || (['#FFD700','#C0C0C0','#FFA500','#FFC649','#CD5C5C','#D8CA9D','#FAD5A5','#4FD0E7','#4B70DD','#8A2BE2'][idx%10]) ;
        const dist = p.distance_au || (p.distance ? p.distance : (idx+1));
        const r = distanceScale(dist);

        // Orbit ring
        const orbit = makeOrbit(r, 0x00bcd4);
        orbitGroup.add(orbit);

        // Planet marker
        const marker = makePlanetMarker(name, color, Math.max(0.6, 1.0 - Math.log10(dist+1) * 0.2));
        const rad = (typeof lon === 'number') ? (lon * Math.PI / 180.0) : (Math.random() * Math.PI * 2);
        marker.position.set(Math.cos(rad) * r, Math.sin(rad) * r * 0.12, Math.sin(rad) * r * 0.02);
        orbitGroup.add(marker);
        planetMarkers[name] = marker;

        // Table row
        const row = document.createElement('tr');
  const safeLon = (typeof lon === 'number') ? lon.toFixed(4) : '';
  // main colored circle: open table in same tab; small info icon opens planet detail in new tab
  const iconHtml = `
    <a href="/astro-table.html?scrollTo=${encodeURIComponent(name)}&lon=${encodeURIComponent(safeLon)}" title="Open table and scroll to ${name}" style="display:inline-block;text-decoration:none">
      <div style="width:14px;height:14px;border-radius:50%;background:${color};display:inline-block;margin-right:6px;vertical-align:middle;border:1px solid rgba(255,255,255,0.06)"></div>
    </a>
    <a href="/astro-planet.html?planet=${encodeURIComponent(name)}&lon=${encodeURIComponent(safeLon)}" title="Open ${name} details" target="_blank" style="display:inline-block;text-decoration:none;margin-left:4px;color:rgba(255,255,255,0.7);font-size:12px;vertical-align:middle">ℹ️</a>
  `;
        row.innerHTML = `
          <td style="padding:6px;">${iconHtml}</td>
          <td style="color:${color};font-weight:600">${name}</td>
          <td>${p.zodiac_en || (typeof sign === 'number' ? sign : '')}</td>
          ${hasTelugu?`<td>${tel}</td>`:''}
          <td>${degree}°</td>
          <td>${(speed || 0).toFixed(3)}°/day</td>
          <td>${p.retrograde ? '<span style="color:#ff6b6b">℞</span>' : '<span style="color:#51cf66">•</span>'}</td>
        `;
        body.appendChild(row);
      });

      ephemTime.textContent = `(data ${dateValue})`;

      // AI Mentor summary (if present in payload)
      try {
        if (json.ai_mentor) {
          const txt = json.ai_mentor.narration || json.ai_mentor.summary || json.ai_mentor.note || '';
          if (txt && aiMentorSummary) {
            aiMentorText.textContent = txt.length > 160 ? (txt.slice(0,157) + '…') : txt;
            aiMentorSummary.style.display = 'block';
          }
        }
      } catch (e) { /* ignore */ }

      // hide spinner
      if (spinner) spinner.style.display = 'none';
      if (loadingOverlay) loadingOverlay.style.pointerEvents = 'none';

      } catch (err) {
      console.error('Failed to load ephemeris:', err);
      head.innerHTML = '';
      // table has up to 7 columns (Icon, Planet, Sign, Zodiac, Degree, Speed, Status)
      body.innerHTML = '<tr><td colspan="7">Unable to load ephemeris for this date.</td></tr>';
    }
  }

  // Resize handler
  function onResize(){
    // Simpler: header and table reserve fixed heights; canvas fills remaining vertical space
    const header = document.querySelector('.header');
    const tableWrap = document.querySelector('.table-wrap');
    const w = window.innerWidth;
    const headerH = header ? header.getBoundingClientRect().height : 64;
    const tableH = tableWrap ? tableWrap.querySelector('.table-scroll')?.getBoundingClientRect().height || tableWrap.getBoundingClientRect().height : 260;
    const padding = 36; // breathing room
    const targetH = Math.max(240, window.innerHeight - headerH - tableH - padding);
    renderer.setSize(w, Math.round(targetH));
    renderer.domElement.style.height = Math.round(targetH) + 'px';
    camera.aspect = w / Math.max(1, Math.round(targetH));
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  // Animation loop
  function animate(){
    requestAnimationFrame(animate);
    orbitGroup.rotation.y += 0.0008;
    controls.update();
    renderer.render(scene, camera);
  }

  // Wire buttons
  refreshBtn.addEventListener('click', ()=>{
    dateStr = dateInput.value || dateStr;
    loadAndRender(dateStr);
  });
  closeBtn.addEventListener('click', ()=>{ window.close(); });

  // Initial render
  onResize();
  loadAndRender(dateStr);
  animate();
})();
