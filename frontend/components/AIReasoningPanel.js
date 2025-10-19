import React from 'react';

export default function AIReasoningPanel({events,predictions}){
  function explain(pred){
    const lines = [];
    pred.matches.forEach(m=>{
      lines.push(`Astro rule: ${m.bias} applies to ${m.pairs.join(', ')} (confidence ${m.confidence})`);
      if(m.bias.includes('Bullish')) lines.push('Why: Venus/Jupiter influence -> risk-on flows; this historically favours commodity and commodity-currency strength.');
      if(m.bias.includes('Bearish')) lines.push('Why: Saturn/Mars influence -> risk-off flows; may strengthen safe-haven USD/JPY, XAUUSD reaction.' );
      if(m.bias.includes('Reversal')) lines.push('Why: Retrograde suggests price chop and possible trend reversals; expect lower confidence signals and wider stop distances.');
    });
    return lines.join('\n');
  }

  return (
    <div className='ai-reasoning-panel'>
      <h3>AI Reasoning Panel — Astro → Market</h3>
      <div className='explain-list'>
        {predictions.slice(0,30).map((p,i)=>(
          <div key={i} className='explain-item'>
            <strong>{p.datetime}</strong> — {p.event_desc}
            <pre style={{whiteSpace:'pre-wrap'}}>{explain(p)}</pre>
          </div>
        ))}
      </div>
    </div>
  )
}
