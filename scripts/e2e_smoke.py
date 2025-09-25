#!/usr/bin/env python3
"""E2E smoke test: fetch /ict/candles and validate payload shape.

Usage: python3 scripts/e2e_smoke.py

This script performs the same request the frontend performs and validates that
candles are parseable and convertible to numeric values expected by
LightweightCharts.
"""
import sys
import urllib.request
import json

API = "http://localhost:8000/ict/candles?symbol=AAPL&interval=5m&limit=100"

def fetch(api_url):
    req = urllib.request.Request(api_url, headers={"User-Agent": "e2e-smoke/1.0"})
    with urllib.request.urlopen(req, timeout=10) as r:
        body = r.read()
        return json.loads(body)


def is_number(x):
    try:
        float(x)
        return True
    except Exception:
        return False


def main():
    print(f"Fetching: {API}")
    try:
        j = fetch(API)
    except Exception as e:
        print("ERROR: request failed:", e)
        sys.exit(2)

    if not isinstance(j, dict):
        print("ERROR: response is not an object")
        sys.exit(2)

    source = j.get('source')
    symbol = j.get('symbol')
    candles = j.get('candles')

    print(f"source={source}, symbol={symbol}")
    if not isinstance(candles, list):
        print("ERROR: 'candles' is not an array")
        sys.exit(2)

    n = len(candles)
    print(f"candles_count={n}")
    if n == 0:
        print("WARN: zero candles returned")
        sys.exit(0)

    # Validate first/last 3 entries
    samples = [0, min(2, n-1), n-1]
    for idx in samples:
        c = candles[idx]
        t = c.get('time')
        o = c.get('open')
        h = c.get('high')
        l = c.get('low')
        cl = c.get('close')
        vol = c.get('volume')
        ok = True
        for name, val in [('open',o),('high',h),('low',l),('close',cl)]:
            if val is None or not is_number(val):
                print(f"ERROR: candle[{idx}] field {name} is not numeric: {val}")
                ok = False
        if vol is None:
            print(f"WARN: candle[{idx}] missing volume")
        print(f"candle[{idx}] time={t} open={o} high={h} low={l} close={cl} volume={vol} -> {'OK' if ok else 'BAD'}")
        if not ok:
            sys.exit(2)

    print("SUCCESS: payload looks valid for frontend consumption")
    # Exit 0

if __name__ == '__main__':
    main()
