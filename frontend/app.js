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
    // remove old widget if present
    const container = document.getElementById("tradingview");
    container.innerHTML = "";
    new TradingView.widget({
      "width": container.clientWidth,
      "height": 600,
      "symbol": symbol,
      "interval": interval,
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

function createLWChart(){
  const el = document.getElementById('lwchart');
  el.innerHTML = "";
  chart = LightweightCharts.createChart(el, { width: el.clientWidth, height: 600 });
  candleSeries = chart.addCandlestickSeries();
}

function isoToTime(v){
  // lightweight-charts accepts ISO as string (it will parse)
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
    candleSeries.setData(lw);
    chart.timeScale().fitContent();
    log(`LW chart loaded (${data.source}) ${lw.length} candles`);
  } catch (err){
    console.error(err);
    log("loadCandles error: " + err.message);
  }
}

/* ---------------- UI wiring ---------------- */
loadBtn.onclick = () => {
  const sym = symbolInput.value.trim();
  const interval = intervalSelect.value;
  loadTradingView(sym, interval);
  if (!chart) createLWChart();
  loadCandles(sym, interval);
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
