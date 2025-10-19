import React, {useEffect, useState} from 'react';
import AIReasoningPanel from './AIReasoningPanel';

export default function AstroEventTable(){
  const [events,setEvents]=useState([]);
  const [preds,setPreds]=useState([]);
  const [filter,setFilter]=useState('All');
  const [search,setSearch]=useState('');

  useEffect(()=>{fetch('/astro/events').then(r=>r.json()).then(setEvents)},[]);
  useEffect(()=>{fetch('/astro/predictions').then(r=>r.json()).then(setPreds)},[]);

  const filtered = events.filter(e=>{
    if(filter==='All') return true;
    if(filter==='Retrograde') return e.planet1.retrograde || e.planet2.retrograde;
    return e.type===filter;
  }).filter(e=> JSON.stringify(e).toLowerCase().includes(search.toLowerCase()));

  function exportCSV(){
    const rows = ['datetime,type,planet1,planet2,deg_diff,planet1_sign,planet2_sign,nak1,nak2'];
    filtered.forEach(e=>{
      rows.push([e.datetime,e.type,e.planet1_en,e.planet2_en,e.degree_diff,e.planet1.sign_en,e.planet2.sign_en,e.planet1.nakshatra_en,e.planet2.nakshatra_en].join(','));
    });
    const blob = new Blob([rows.join('\n')],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='astro_events.csv'; a.click();
  }

  return (
    <div className='astro-event-container'>
      <h2>Astro Event Table — English + తెలుగు + Vedic</h2>
      <div className='controls'>
        <select value={filter} onChange={e=>setFilter(e.target.value)}>
          <option>All</option>
          <option>Conjunction</option>
          <option>Opposition</option>
          <option>Retrograde</option>
        </select>
        <input placeholder='Search...' value={search} onChange={e=>setSearch(e.target.value)} />
        <button onClick={exportCSV}>Export CSV</button>
      </div>

      <table className='astro-table'>
        <thead><tr><th>DateTime</th><th>Event</th><th>Planet1</th><th>Planet2</th><th>Vedic</th><th>Predicted</th></tr></thead>
        <tbody>
          {filtered.map((e,i)=>{
            const p = preds.find(x=>x.jd===e.jd);
            return (
              <tr key={i}>
                <td>{e.datetime}</td>
                <td>{e.type}</td>
                <td><strong>{e.planet1_en}</strong><br/><small className='telugu'>{e.planet1_te}</small></td>
                <td><strong>{e.planet2_en}</strong><br/><small className='telugu'>{e.planet2_te}</small></td>
                <td>
                  {e.planet1.sign_en}({e.planet1.deg_in_sign}°)<br/>
                  {e.planet1.nakshatra_en} p{e.planet1.nakshatra_pada}<br/>
                </td>
                <td>
                  {p ? p.matches.map((m,idx)=>(<div key={idx}>{m.bias} — {m.pairs.join(', ')} ({m.confidence})</div>)) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <AIReasoningPanel events={events} predictions={preds} />
    </div>
  )
}
