// Small helper exposing applyFilters for node-based tests
function applyFilters(events, filters){
  let filtered = (events || []).slice();
  if (filters.planet) filtered = filtered.filter(ev => (ev.planets||[]).map(p=>String(p).toLowerCase()).includes(filters.planet.toLowerCase()) || String(ev.event||ev.type||'').toLowerCase().includes(filters.planet.toLowerCase()));
  if (filters.type) filtered = filtered.filter(ev => String(ev.type||ev.event||'').toLowerCase().includes(filters.type.toLowerCase()));
  if (filters.from) filtered = filtered.filter(ev => (ev.date||ev.datetime||'').slice(0,10) >= filters.from);
  if (filters.to) filtered = filtered.filter(ev => (ev.date||ev.datetime||'').slice(0,10) <= filters.to);
  return filtered;
}
module.exports = { applyFilters };
