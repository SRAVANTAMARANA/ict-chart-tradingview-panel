import os
import time
from fastapi import FastAPI, HTTPException, Query
from typing import List, Optional
import httpx

TWELVE = os.getenv("TWELVEDATA_APIKEY", "")
FINNHUB = os.getenv("FINNHUB_KEY", "")
CACHE_TTL = int(os.getenv("API_CACHE_TTL", "30"))

app = FastAPI(title="ICT backend")

_cache = {}  # simple in-memory cache: key -> (ts, payload)

def cache_get(key):
    rec = _cache.get(key)
    if not rec: return None
    ts, val = rec
    if time.time() - ts > CACHE_TTL:
        _cache.pop(key, None)
        return None
    return val

def cache_set(key, val):
    _cache[key] = (time.time(), val)

@app.get("/ict/health")
async def health():
    return {"status": "ok", "time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}

async def fetch_twelvedata(symbol, interval, limit):
    if not TWELVE:
        return None
    url = "https://api.twelvedata.com/time_series"
    params = {"symbol": symbol, "interval": interval, "outputsize": limit, "format": "JSON", "apikey": TWELVE}
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            return None
        j = r.json()
        if "values" not in j:
            return None
        # TwelveData returns values in DESC order; convert to ascending time order
        vals = list(reversed(j["values"]))
        candles = []
        for v in vals:
            candles.append({
                "time": v.get("datetime") or v.get("timestamp") or v.get("datetime"),
                "open": v.get("open"),
                "high": v.get("high"),
                "low": v.get("low"),
                "close": v.get("close"),
                "volume": v.get("volume", 0)
            })
        return {"source": "twelvedata", "symbol": symbol, "candles": candles}

async def fetch_finnhub(symbol, interval, limit):
    if not FINNHUB:
        return None
    # finnHub expects resolution like 1,5,15,60,D; map interval param
    mapping = {"1m":"1", "5m":"5", "15m":"15", "1h":"60", "1d":"D"}
    res = mapping.get(interval, interval)
    end = int(time.time())
    # approximate start time based on limit * interval
    seconds_per = {"1":60,"5":300,"15":900,"60":3600,"D":86400}
    sec = seconds_per.get(res,60)
    start = end - sec * max(1, int(limit))
    url = "https://finnhub.io/api/v1/stock/candle"
    params = {"symbol": symbol, "resolution": res, "from": start, "to": end, "token": FINNHUB}
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            return None
        j = r.json()
        if j.get("s") != "ok":
            return None
        candles = []
        for t, o, h, l, c, v in zip(j["t"], j["o"], j["h"], j["l"], j["c"], j["v"]):
            # ISO time
            ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(t))
            candles.append({"time": ts,"open": o,"high": h,"low": l,"close": c,"volume": v})
        return {"source": "finnhub", "symbol": symbol, "candles": candles}

@app.get("/ict/candles")
async def get_candles(symbol: str = Query(...), interval: str = Query("1m"), limit: int = Query(200)):
    key = f"{symbol}:{interval}:{limit}"
    cached = cache_get(key)
    if cached:
        return cached

    # Try TwelveData first
    tw = await fetch_twelvedata(symbol, interval, limit)
    if tw and tw.get("candles"):
        cache_set(key, tw)
        return tw

    fh = await fetch_finnhub(symbol, interval, limit)
    if fh and fh.get("candles"):
        cache_set(key, fh)
        return fh

    raise HTTPException(status_code=502, detail="No data from upstream APIs. Check API keys.")
