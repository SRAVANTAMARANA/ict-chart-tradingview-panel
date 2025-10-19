"""
backtest.py
- Simple skeleton to overlay predictions on OHLC CSV and compute hit-rate metrics
"""
import pandas as pd, json

ohlc = pd.read_csv('astroquant/data/ohlc_sample.csv', parse_dates=['timestamp'])
with open('astroquant/data/astro_predictions.json','r',encoding='utf-8') as f:
    preds = json.load(f)

results = []
for p in preds:
    for m in p['matches']:
        if 'EURUSD' in m['pairs'] and 'Bullish' in m['bias']:
            t = pd.to_datetime(p['datetime'])
            next_row = ohlc[ohlc['timestamp']>t].head(1)
            if next_row.empty: continue
            entry = next_row.iloc[0]['close']
            idx = next_row.index[0]
            exit_idx = min(idx+24, len(ohlc)-1)
            exit_price = ohlc.loc[exit_idx,'close']
            ret = (exit_price - entry)/entry
            results.append(ret)

import numpy as np
if results:
    print('N trades', len(results))
    print('mean return', np.mean(results))
    print('winrate', sum(1 for r in results if r>0)/len(results))
else:
    print('no trades found')
