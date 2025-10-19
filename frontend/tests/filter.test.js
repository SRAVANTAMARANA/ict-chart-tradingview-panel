// Minimal tests for filtering logic in astro-events.js
const { applyFilters } = require('../astro-events-filter-test-helper');

function assert(cond, msg){ if(!cond) { console.error('FAIL:', msg); process.exit(2); }}

(function(){
  const events = [
    { date: '2025-10-18', event:'A', planets:['Mars'], type:'Conjunction' },
    { date: '2025-10-19', event:'B', planets:['Venus'], type:'Nakshatra Transit' },
    { date: '2025-10-20', event:'C', planets:['Mars','Jupiter'], type:'Conjunction' }
  ];

  let res = applyFilters(events, { planet: 'Mars' });
  assert(res.length === 2, 'planet filter failed');

  res = applyFilters(events, { type: 'Conjunction' });
  assert(res.length === 2, 'type filter failed');

  res = applyFilters(events, { from: '2025-10-19', to: '2025-10-20' });
  assert(res.length === 2, 'date range filter failed');

  console.log('All filter tests passed');
})();
