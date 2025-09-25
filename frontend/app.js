const API_BASE = window.API_BASE || "http://localhost:8000";

const symbolInput = document.getElementById('symbolInput');
const intervalSelect = document.getElementById('intervalSelect');
const loadBtn = document.getElementById('loadBtn');
const tabTv = document.getElementById('tabTv');
const tabSignals = document.getElementById('tabSignals');

const tvSection = document.getElementById('tvSection');
const signalsSection = document.getElementById('signalsSection');
const logEl = document.getElementById('log');

function showTab(el){
  tvSection.classList.add('hidden');
  signalsSection.classList.add('hidden');
  el.classList.remove('hidden');
}

tabTv.onclick = ()=> showTab(tvSection);
tabSignals.onclick = ()=> showTab(signalsSection);

function log(msg){
  logEl.innerText = new Date().toLocaleTimeString() + ' - ' + msg + '\n' + logEl.innerText;
}

/* ---------------- TradingView embed (simple) ---------------- */
function loadTradingView(symbol, interval){
  // tradeview uses different interval codes; using simple widget with symbol
  try {
    // If TradingView script hasn't loaded yet, retry a few times instead of throwing
    if (typeof window.TradingView === 'undefined') {
      console.warn('TradingView script not loaded yet, scheduling retry');
      log('TradingView not ready, retrying...');
      // try again shortly
      setTimeout(() => loadTradingView(symbol, interval), 800);
      return;
    }
    // remove old widget if present
    const container = document.getElementById("tradingview");
    container.innerHTML = "";
    // TradingView expects interval codes like '1','5','15','60','D' (not '5m')
    const tvMapping = {"1m": "1", "5m": "5", "15m": "15", "1h": "60", "1d": "D"};
    const tvInterval = tvMapping[interval] || interval;
    new TradingView.widget({
      "width": container.clientWidth,
      "height": 600,
      "symbol": symbol,
      "interval": tvInterval,
      "timezone": "Etc/UTC",
      "theme": "light",
      "style": "1",
      "locale": "en",
      "toolbar_bg": "#f1f3f6",
      "hide_top_toolbar": false,
      "save_image": false,
      "container_id": "tradingview"
    });
    log("TradingView loaded: " + symbol + " / " + interval);
  } catch(e) {
    console.error(e);
    log("TradingView failed: " + e.message);
  }
}

/* ---------------- Lightweight Charts ---------------- */
let chart = null;
let candleSeries = null;
let refreshTimer = null;
let ws = null;
let lastLoadedCandles = [];
const showSignalsCheckbox = () => document.getElementById('showSignals');

// Simple candlestick pattern detectors. Each returns true/false for the
// candle at index i given the candles array (objects with time, open, high, low, close).
function isBullishEngulfing(candles, i){
  if (i <= 0) return false;
  const prev = candles[i-1];
  const cur = candles[i];
  return (cur.close > cur.open) && (prev.close < prev.open) && (cur.open <= prev.close) && (cur.close >= prev.open);
}
function isBearishEngulfing(candles, i){
  if (i <= 0) return false;
  const prev = candles[i-1];
  const cur = candles[i];
  return (cur.close < cur.open) && (prev.close > prev.open) && (cur.open >= prev.close) && (cur.close <= prev.open);
}
function isHammer(c, i){
  // hammer: small real body near high, long lower wick
  const body = Math.abs(c.close - c.open);
  const lower = Math.min(c.open, c.close) - c.low;
  const upper = c.high - Math.max(c.open, c.close);
  return (lower > body * 2) && (upper < body);
}
function isShootingStar(c, i){
  const body = Math.abs(c.close - c.open);
  const upper = c.high - Math.max(c.open, c.close);
  const lower = Math.min(c.open, c.close) - c.low;
  return (upper > body * 2) && (lower < body);
}
function isDoji(c){
  return Math.abs(c.close - c.open) <= ((c.high - c.low) * 0.1);
}

function renderSignals(candles){
  lastLoadedCandles = candles.slice();
  if (!candleSeries || !chart) return;
  if (!showSignalsCheckbox() || !showSignalsCheckbox().checked) {
    candleSeries.setMarkers([]);
    return;
  }
  const markers = [];
  for (let i = 0; i < candles.length; i++){
    const c = candles[i];
    if (isBullishEngulfing(candles, i)){
      markers.push({ time: c.time, position: 'belowBar', color: 'green', shape: 'arrowUp', text: 'Bull Engulf' });
    } else if (isBearishEngulfing(candles, i)){
      markers.push({ time: c.time, position: 'aboveBar', color: 'red', shape: 'arrowDown', text: 'Bear Engulf' });
    } else if (isHammer(c, i)){
      markers.push({ time: c.time, position: 'belowBar', color: 'blue', shape: 'circle', text: 'Hammer' });
    } else if (isShootingStar(c, i)){
      markers.push({ time: c.time, position: 'aboveBar', color: 'orange', shape: 'circle', text: 'ShootStar' });
    } else if (isDoji(c)){
      markers.push({ time: c.time, position: 'aboveBar', color: 'gray', shape: 'square', text: 'Doji' });
    }
  }
  try {
    if (markers.length && candleSeries && typeof candleSeries.setMarkers === 'function') {
      candleSeries.setMarkers(markers);
    } else if (candleSeries && typeof candleSeries.setMarkers === 'function') {
      candleSeries.setMarkers([]);
    } else {
      throw new Error('setMarkers not available');
    }
  } catch(e){
    // Fallback: populate the overlay box with textual signals
    console.error('setMarkers error', e);
    try {
      const el = document.getElementById('lwchart');
      const overlay = el.querySelector('.signals-overlay');
      if (overlay){
        overlay.innerHTML = '';
        markers.slice(-10).reverse().forEach(m => {
          const div = document.createElement('div');
          div.innerText = `${m.time} ${m.text}`;
          div.style.color = m.color || '#000';
          overlay.appendChild(div);
        });
      }
    } catch(err){ console.error('overlay render error', err); }
  }
}

function createLWChart(){
  const el = document.getElementById('lwchart');
  el.innerHTML = "";
  if (typeof window.LightweightCharts === 'undefined') {
    console.warn('LightweightCharts library not available yet');
    log('LightweightCharts not loaded');
    // try again later
    setTimeout(createLWChart, 800);
    return;
  }
  chart = LightweightCharts.createChart(el, { width: el.clientWidth, height: 600 });
  // v5 lightweight-charts exposes addSeries(type, options) on the chart instance.
  // Use the CandlestickSeries factory from the global LightweightCharts object.
  try {
    // Try older helper API first (some bundles expose this)
  
    if (typeof chart.addCandlestickSeries === 'function') {
      candleSeries = chart.addCandlestickSeries();
    } else if (typeof chart.addSeries === 'function' && window.LightweightCharts && window.LightweightCharts.CandlestickSeries) {
      candleSeries = chart.addSeries(window.LightweightCharts.CandlestickSeries, {});
    } else {
      console.error('LightweightCharts: no compatible add-series API found');
    }
  } catch (err) {
    console.error('createLWChart error while creating series:', err);
  }
  // create a small overlay for signal summaries (fallback if setMarkers unavailable)
  let overlay = el.querySelector('.signals-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'signals-overlay';
    overlay.style.position = 'absolute';
    overlay.style.right = '8px';
    overlay.style.top = '8px';
    overlay.style.background = 'rgba(255,255,255,0.9)';
    overlay.style.padding = '6px';
    overlay.style.border = '1px solid #ccc';
    overlay.style.maxHeight = '200px';
    overlay.style.overflow = 'auto';
    overlay.style.fontSize = '12px';
    overlay.style.zIndex = '10';
    el.style.position = 'relative';
    el.appendChild(overlay);
  }
}

function isoToTime(v){
  // Convert ISO or numeric time to UNIX seconds (LightweightCharts is happiest
  // with numeric epoch seconds in many bundles). If already numeric, return
  // as number. Otherwise try parsing ISO and fall back to original value.
  if (v === null || v === undefined) return v;
  // If it's already a number or numeric string, return as integer seconds
  if (typeof v === 'number') return Math.floor(v);
  if (typeof v === 'string' && /^\d+$/.test(v)) return parseInt(v, 10);
  const parsed = Date.parse(v);
  if (!isNaN(parsed)) return Math.floor(parsed / 1000);
  return v;
}

async function loadCandles(symbol, interval){
  try {
    const qInterval = (interval === "1m") ? "1m" : interval; // keep same
    const url = `${API_BASE}/ict/candles?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(qInterval)}&limit=200`;
    log("fetching " + url);
    const r = await fetch(url);
    if (!r.ok) throw new Error("bad status " + r.status);
    const data = await r.json();
    if (!Array.isArray(data.candles)) throw new Error("invalid payload");
    const lw = data.candles.map(c => ({
      time: isoToTime(c.time),
      open: +c.open,
      high: +c.high,
      low: +c.low,
      close: +c.close
    }));
    try {
      if (!candleSeries) {
        console.error('LightweightCharts: candleSeries is not available, skipping setData');
        log('LW chart error: no candle series available');
        return;
      }
  candleSeries.setData(lw);
  // render signals overlay if enabled
  renderSignals(lw);
    } catch (err) {
      console.error('Error while setting LW chart data:', err);
      log('LW chart setData error: ' + (err && err.message ? err.message : String(err)));
    }
    chart.timeScale().fitContent();
    log(`LW chart loaded (${data.source}) ${lw.length} candles`);
  } catch (err){
    console.error(err);
    log("loadCandles error: " + err.message);
  }
}

function connectWebSocket(sym, interval, limit=200){
  // close existing socket
  try { if (ws) ws.close(); } catch(e) {}
  const url = `ws://${location.hostname}:8000/ict/ws?symbol=${encodeURIComponent(sym)}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
  try {
    ws = new WebSocket(url);
  } catch (e){
    console.warn('WebSocket not available', e);
    ws = null;
    return;
  }
  ws.onopen = () => {
    log('WS connected');
  };
  ws.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      if (Array.isArray(data.candles)){
        const lw = data.candles.map(c => ({ time: isoToTime(c.time), open:+c.open, high:+c.high, low:+c.low, close:+c.close }));
        try {
          if (candleSeries) candleSeries.setData(lw);
          if (chart) chart.timeScale().fitContent();
          renderSignals(lw);
        } catch(err){ console.error('WS setData error', err); }
      }
    } catch(err){ console.error('WS parse error', err); }
  };
  ws.onclose = () => { log('WS closed, falling back to polling'); ws = null; };
  ws.onerror = (e) => { console.warn('WS error', e); };
}

/* ---------------- UI wiring ---------------- */
loadBtn.onclick = () => {
  const sym = symbolInput.value.trim();
  const interval = intervalSelect.value;
  loadTradingView(sym, interval);
  if (!chart) createLWChart();
  // Load immediately
  loadCandles(sym, interval);
  // Clear any previous auto-refresh timer
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  // Poll the backend periodically so charts appear "live". Use a short
  // default (30s) so demo updates are visible; in production you may want
  // to align this with the interval (e.g. fetch once per candle).
  const REFRESH_MS = 30 * 1000;
  refreshTimer = setInterval(() => {
    loadCandles(sym, interval);
  }, REFRESH_MS);
  // Try to connect websocket for live push updates; if it connects, it will
  // replace polling updates with push messages.
  connectWebSocket(sym, interval, 200);
};

// initial
showTab(tvSection);
window.addEventListener('resize', () => {
  if (chart) {
    const el = document.getElementById('lwchart');
    chart.applyOptions({ width: el.clientWidth, height: 600 });
  }
});

// auto-load default
document.addEventListener('DOMContentLoaded', () => {
  loadBtn.click();
});
