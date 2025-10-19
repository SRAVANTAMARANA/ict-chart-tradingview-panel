
// --- DIRECT CHART: FOREX-ONLY, DEMO/LIVE, NO BINANCE ---
console.log('🚀 Loading direct chart implementation (forex-only, demo/live, no Binance)...');

let directChart = null;
let directCandlestickSeries = null;
let simLiveInterval = null;
let lastCandle = null;
let simLiveActive = false;

function getCurrentSymbol() {
    const el = document.getElementById('enhancedSymbolSelect');
    return el?.value || 'XAUUSD';
}
function getCurrentInterval() {
    const el = document.getElementById('enhancedTimeframeSelect');
    return el?.value || '5m';
}
function tfToSec(tf) {
    if (tf.endsWith('m')) return parseInt(tf) * 60;
    if (tf.endsWith('h')) return parseInt(tf) * 3600;
    if (tf.endsWith('d')) return parseInt(tf) * 86400;
    return 300;
}
function symbolDecimals(symbol) {
    if (symbol.endsWith('JPY')) return 3;
    if (symbol === 'XAUUSD') return 2;
    return 5;
}
function basePrice(symbol) {
    if (symbol === 'XAUUSD') return 2350;
    if (symbol === 'EURUSD') return 1.095;
    if (symbol === 'GBPUSD') return 1.27;
    if (symbol === 'USDJPY') return 149.5;
    return 1.0;
}
function vol(symbol) {
    if (symbol === 'XAUUSD') return 1.5;
    if (symbol.endsWith('JPY')) return 0.15;
    return 0.002;
}

function generateDemoData(interval, symbol) {
    const now = Math.floor(Date.now() / 1000);
    const tfsec = tfToSec(interval);
    const decimals = symbolDecimals(symbol);
    let price = basePrice(symbol);
    let candles = [];
    let t = now - tfsec * 120;
    for (let i = 0; i < 120; ++i) {
        let open = price;
        let close = +(open + (Math.random() - 0.5) * vol(symbol)).toFixed(decimals);
        let high = Math.max(open, close) + Math.random() * vol(symbol) * 0.5;
        let low = Math.min(open, close) - Math.random() * vol(symbol) * 0.5;
        high = +high.toFixed(decimals);
        low = +low.toFixed(decimals);
        candles.push({ time: t, open, high, low, close });
        price = close;
        t += tfsec;
    }
    return candles;
}

function createDirectChart() {
    // ...existing code for container, chart creation, etc...
    const container = document.getElementById('lwchart') || document.getElementById('chartView') || document.getElementById('chartContainer');
    if (!container) return false;
    container.innerHTML = '';
    if (container.clientWidth === 0 || container.clientHeight === 0) {
        container.style.width = '100%';
        container.style.height = '600px';
        container.style.minHeight = '400px';
    }
    directChart = LightweightCharts.createChart(container, {
        width: container.clientWidth || 800,
        height: container.clientHeight || 600,
        layout: { background: { color: '#fff' }, textColor: '#333' },
        grid: { vertLines: { color: '#E0E0E0' }, horzLines: { color: '#E0E0E0' } },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        rightPriceScale: { borderColor: '#CCCCCC' },
        timeScale: { borderColor: '#CCCCCC', timeVisible: true, secondsVisible: false },
    });
    directCandlestickSeries = directChart.addCandlestickSeries({
        upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350',
    });
    loadDirectChartData();
    return true;
}

function loadDirectChartData() {
    if (!directCandlestickSeries) return;
    const symbol = getCurrentSymbol();
    const interval = getCurrentInterval();
    // Try backend first
    const apiBase = (typeof getApiBase === 'function' ? getApiBase() : (window.API_BASE || 'http://localhost:8081'));
    fetch(`${apiBase.replace(/\/$/, '')}/ict/candles?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=120`).then(r => {
        if (!r.ok) throw new Error('backend fail');
        return r.json();
    }).then(data => {
        const candles = data.map(c => ({
            time: c[0], open: c[1], high: c[2], low: c[3], close: c[4]
        }));
        directCandlestickSeries.setData(candles);
        directChart.timeScale().fitContent();
        lastCandle = candles[candles.length - 1];
        window.__chartData__ = candles;
    }).catch(() => {
        // fallback to demo
        const candles = generateDemoData(interval, symbol);
        directCandlestickSeries.setData(candles);
        directChart.timeScale().fitContent();
        lastCandle = candles[candles.length - 1];
        window.__chartData__ = candles;
    });
}

function startSimLive() {
    if (simLiveInterval) clearInterval(simLiveInterval);
    simLiveActive = true;
    simLiveInterval = setInterval(() => {
        if (!directCandlestickSeries) return;
        const symbol = getCurrentSymbol();
        const interval = getCurrentInterval();
        const tfsec = tfToSec(interval);
        let candles = window.__chartData__ || [];
        if (!candles.length) return;
        let now = Math.floor(Date.now() / 1000);
        let bucket = Math.floor(now / tfsec) * tfsec;
        let last = candles[candles.length - 1];
        if (last.time < bucket) {
            // new candle
            let open = last.close;
            let close = +(open + (Math.random() - 0.5) * vol(symbol)).toFixed(symbolDecimals(symbol));
            let high = Math.max(open, close) + Math.random() * vol(symbol) * 0.5;
            let low = Math.min(open, close) - Math.random() * vol(symbol) * 0.5;
            high = +high.toFixed(symbolDecimals(symbol));
            low = +low.toFixed(symbolDecimals(symbol));
            let newCandle = { time: bucket, open, high, low, close };
            candles.push(newCandle);
            if (candles.length > 120) candles.shift();
            directCandlestickSeries.setData(candles);
            lastCandle = newCandle;
            window.__chartData__ = candles;
        } else {
            // update last candle
            let close = +(last.open + (Math.random() - 0.5) * vol(symbol)).toFixed(symbolDecimals(symbol));
            let high = Math.max(last.open, close) + Math.random() * vol(symbol) * 0.5;
            let low = Math.min(last.open, close) - Math.random() * vol(symbol) * 0.5;
            high = +high.toFixed(symbolDecimals(symbol));
            low = +low.toFixed(symbolDecimals(symbol));
            let update = { ...last, close, high, low };
            candles[candles.length - 1] = update;
            directCandlestickSeries.setData(candles);
            lastCandle = update;
            window.__chartData__ = candles;
        }
    }, 1000);
}

function stopSimLive() {
    if (simLiveInterval) clearInterval(simLiveInterval);
    simLiveActive = false;
}

function toggleSimulatedLive() {
    if (simLiveActive) { stopSimLive(); } else { startSimLive(); }
}

function reloadDirectChartData() {
    stopSimLive();
    loadDirectChartData();
}

window.createDirectChart = createDirectChart;
window.loadDirectChartData = loadDirectChartData;
window.toggleSimulatedLive = toggleSimulatedLive;
window.reloadDirectChartData = reloadDirectChartData;
// ...existing code for zoom, overlays, etc...

// 1. CROSSHAIR TOOLTIPS
function addCrosshairTooltip(chart) {
    if (!crosshairTooltip) {
        crosshairTooltip = document.createElement('div');
        crosshairTooltip.id = 'crosshairTooltip';
        crosshairTooltip.style.position = 'absolute';
        crosshairTooltip.style.pointerEvents = 'none';
        crosshairTooltip.style.background = 'rgba(0,0,0,0.85)';
        crosshairTooltip.style.color = '#fff';
        crosshairTooltip.style.padding = '8px 12px';
        crosshairTooltip.style.borderRadius = '8px';
        crosshairTooltip.style.fontSize = '13px';
        crosshairTooltip.style.zIndex = '40';
        crosshairTooltip.style.display = 'none';
        crosshairTooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        document.getElementById('lwchart').appendChild(crosshairTooltip);
    }
    
    chart.subscribeCrosshairMove(param => {
        if (param && param.point && param.seriesPrices && param.seriesPrices.size > 0) {
            const priceData = param.seriesPrices.get(directCandlestickSeries);
            const time = param.time;
            
            console.log('Crosshair data:', { priceData, time, param });
            
            if (priceData && time) {
                crosshairTooltip.style.left = (param.point.x + 20) + 'px';
                crosshairTooltip.style.top = (param.point.y - 60) + 'px';
                crosshairTooltip.innerHTML = `
                    <div style="font-weight:bold;">Price: ${priceData.close?.toFixed(2) || priceData || 'N/A'}</div>
                    <div>Time: ${new Date(time*1000).toLocaleString()}</div>
                `;
                crosshairTooltip.style.display = 'block';
                
                // Update OHLC display if enabled
                if (ohlcDisplayEnabled) {
                    updateOHLCDisplay(priceData);
                }
            } else {
                crosshairTooltip.style.display = 'none';
            }
        } else {
            crosshairTooltip.style.display = 'none';
            
            // Show current candle data when no crosshair
            if (ohlcDisplayEnabled && directCandlestickSeries) {
                // Get last candle data
                setTimeout(() => {
                    // Fetch latest single candle from backend for OHLC display
                    try {
                        const apiBase = (typeof getApiBase === 'function' ? getApiBase() : (window.API_BASE || 'http://localhost:8081'));
                        fetch(`${apiBase.replace(/\/$/, '')}/ict/candles?symbol=${encodeURIComponent(getCurrentSymbol())}&interval=${encodeURIComponent(getCurrentInterval())}&limit=1`)
                            .then(response => response.json())
                            .then(data => {
                                if (data && data.length > 0) {
                                    const candle = data[0];
                                    const currentData = {
                                        open: parseFloat(candle[1]),
                                        high: parseFloat(candle[2]),
                                        low: parseFloat(candle[3]),
                                        close: parseFloat(candle[4]),
                                        volume: parseFloat(candle[5])
                                    };
                                    updateOHLCDisplay(currentData);
                                }
                            })
                            .catch(error => console.error('Failed to fetch current OHLC:', error));
                    } catch (e) { console.warn('OHLC fetch failed', e); }
                }, 100);
            }
        }
    });
}

// 2. INDICATOR OVERLAYS
function addSMAOverlay(chart, period = 14) {
    if (!smaSeries) {
        smaSeries = chart.addLineSeries({
            color: '#2196F3',
            lineWidth: 2,
            priceLineVisible: false,
            title: `SMA(${period})`
        });
    }
    
    // Calculate SMA from current data
    // Fetch candles from backend and compute SMA
    try {
        const apiBase = (typeof getApiBase === 'function' ? getApiBase() : (window.API_BASE || 'http://localhost:8081'));
        fetch(`${apiBase.replace(/\/$/, '')}/ict/candles?symbol=${encodeURIComponent(getCurrentSymbol())}&interval=${encodeURIComponent(getCurrentInterval())}&limit=500`)
            .then(response => response.json())
            .then(data => {
                const candleData = data.map(candle => ({
                    time: (candle[0] && candle[0] > 9999999999 ? Math.floor(candle[0] / 1000) : candle[0]) ,
                    close: parseFloat(candle[4])
                }));

                const smaData = [];
                for (let i = period - 1; i < candleData.length; i++) {
                    let sum = 0;
                    for (let j = 0; j < period; j++) {
                        sum += candleData[i - j].close;
                    }
                    smaData.push({
                        time: candleData[i].time,
                        value: sum / period
                    });
                }

                smaSeries.setData(smaData);
                console.log('✅ SMA overlay added');
            })
            .catch(error => console.error('❌ SMA calculation failed:', error));
    } catch (e) { console.warn('SMA fetch failed', e); }
}

function toggleSMA() {
    if (!directChart) return;
    
    const smaBtn = document.getElementById('smaToggleBtn');
    
    if (smaEnabled) {
        // Disable SMA
        if (smaSeries) {
            directChart.removeSeries(smaSeries);
            smaSeries = null;
        }
        smaEnabled = false;
        if (smaBtn) {
            smaBtn.style.background = '#9E9E9E';
            smaBtn.textContent = '📈 SMA';
        }
        console.log('✅ SMA disabled');
    } else {
        // Enable SMA
        addSMAOverlay(directChart, 14);
        smaEnabled = true;
        if (smaBtn) {
            smaBtn.style.background = '#2196F3';
            smaBtn.textContent = '📈 SMA ON';
        }
        console.log('✅ SMA enabled');
    }
}

// 2.1 OHLC DISPLAY
function updateOHLCDisplay(priceData) {
    if (!ohlcDisplayEnabled) return;
    
    console.log('Updating OHLC with data:', priceData);
    
    const ohlcOpen = document.getElementById('ohlcOpen');
    const ohlcHigh = document.getElementById('ohlcHigh');
    const ohlcLow = document.getElementById('ohlcLow');
    const ohlcClose = document.getElementById('ohlcClose');
    const ohlcVolume = document.getElementById('ohlcVolume');
    
    if (priceData) {
        if (ohlcOpen) ohlcOpen.textContent = priceData.open ? priceData.open.toFixed(2) : (priceData.close ? priceData.close.toFixed(2) : '-');
        if (ohlcHigh) ohlcHigh.textContent = priceData.high ? priceData.high.toFixed(2) : (priceData.close ? priceData.close.toFixed(2) : '-');
        if (ohlcLow) ohlcLow.textContent = priceData.low ? priceData.low.toFixed(2) : (priceData.close ? priceData.close.toFixed(2) : '-');
        if (ohlcClose) ohlcClose.textContent = priceData.close ? priceData.close.toFixed(2) : '-';
        if (ohlcVolume) ohlcVolume.textContent = priceData.volume ? priceData.volume.toFixed(0) : '1.2K';
    } else {
        // Set default values
        if (ohlcOpen) ohlcOpen.textContent = '-';
        if (ohlcHigh) ohlcHigh.textContent = '-';
        if (ohlcLow) ohlcLow.textContent = '-';
        if (ohlcClose) ohlcClose.textContent = '-';
        if (ohlcVolume) ohlcVolume.textContent = '-';
    }
}

function toggleOHLCDisplay() {
    const ohlcDisplay = document.getElementById('ohlcDisplay');
    const ohlcBtn = document.getElementById('ohlcToggleBtn');
    
    if (ohlcDisplayEnabled) {
        // Disable OHLC
        if (ohlcDisplay) ohlcDisplay.style.display = 'none';
        ohlcDisplayEnabled = false;
        if (ohlcBtn) {
            ohlcBtn.style.background = '#9E9E9E';
            ohlcBtn.textContent = '📊 OHLC';
        }
        console.log('✅ OHLC display disabled');
    } else {
        // Enable OHLC
        if (ohlcDisplay) ohlcDisplay.style.display = 'block';
        ohlcDisplayEnabled = true;
        if (ohlcBtn) {
            ohlcBtn.style.background = '#4CAF50';
            ohlcBtn.textContent = '📊 OHLC ON';
        }
        
        // Load initial OHLC data from backend
        try {
            const apiBase = (typeof getApiBase === 'function' ? getApiBase() : (window.API_BASE || 'http://localhost:8081'));
            fetch(`${apiBase.replace(/\/$/, '')}/ict/candles?symbol=${encodeURIComponent(getCurrentSymbol())}&interval=${encodeURIComponent(getCurrentInterval())}&limit=1`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.length > 0) {
                        const candle = data[0];
                        const currentData = {
                            open: parseFloat(candle[1]),
                            high: parseFloat(candle[2]),
                            low: parseFloat(candle[3]),
                            close: parseFloat(candle[4]),
                            volume: parseFloat(candle[5])
                        };
                        updateOHLCDisplay(currentData);
                    }
                })
                .catch(error => console.error('Failed to load initial OHLC:', error));
        } catch (e) { console.warn('Initial OHLC fetch failed', e); }
        
        console.log('✅ OHLC display enabled');
    }
}

// 3. THEME TOGGLE
function toggleChartTheme() {
    if (!directChart) return;
    
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    const themes = {
        light: {
            layout: { background: { color: '#FFFFFF' }, textColor: '#333333' },
            grid: { vertLines: { color: '#E0E0E0' }, horzLines: { color: '#E0E0E0' } }
        },
        dark: {
            layout: { background: { color: '#1E1E1E' }, textColor: '#FFFFFF' },
            grid: { vertLines: { color: '#444444' }, horzLines: { color: '#444444' } }
        }
    };
    
    directChart.applyOptions(themes[currentTheme]);
    console.log(`✅ Theme switched to ${currentTheme}`);
}

// 4. FULLSCREEN MODE
function toggleFullscreen() {
    const chartContainer = document.getElementById('lwchart');
    if (!chartContainer) return;
    
    if (!document.fullscreenElement) {
        chartContainer.requestFullscreen().then(() => {
            setTimeout(() => {
                if (directChart) {
                    directChart.applyOptions({
                        width: window.innerWidth,
                        height: window.innerHeight
                    });
                }
            }, 100);
        });
    } else {
        document.exitFullscreen();
    }
}

// 5. EXPORT CHART
function exportChart() {
    if (!directChart) return;
    
    const canvas = document.querySelector('#lwchart canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.download = `chart-${new Date().toISOString().slice(0,10)}.png`;
        link.href = canvas.toDataURL();
        link.click();
        console.log('✅ Chart exported');
    }
}

// 6. CUSTOM ALERTS
function addPriceAlert(price, direction = 'above') {
    const alert = {
        id: Date.now(),
        price: parseFloat(price),
        direction: direction,
        active: true
    };
    alerts.push(alert);
    console.log(`✅ Alert added: ${direction} ${price}`);
    return alert.id;
}

function checkAlerts(currentPrice) {
    alerts.forEach(alert => {
        if (!alert.active) return;
        
        if ((alert.direction === 'above' && currentPrice >= alert.price) ||
            (alert.direction === 'below' && currentPrice <= alert.price)) {
            
            // Trigger alert
            console.log(`🚨 ALERT: Price ${alert.direction} ${alert.price}`);
            alert.active = false;
            
            // Visual notification
            const notification = document.createElement('div');
            notification.style.position = 'fixed';
            notification.style.top = '20px';
            notification.style.right = '20px';
            notification.style.background = '#FF5722';
            notification.style.color = 'white';
            notification.style.padding = '12px 16px';
            notification.style.borderRadius = '8px';
            notification.style.zIndex = '9999';
            notification.textContent = `🚨 Alert: Price ${alert.direction} ${alert.price}`;
            document.body.appendChild(notification);
            
            setTimeout(() => notification.remove(), 5000);
        }
    });
}

// 7. SAVE/LOAD LAYOUTS
function saveLayout() {
    const layout = {
        theme: currentTheme,
        alerts: alerts,
        drawings: drawings,
        timestamp: Date.now()
    };
    localStorage.setItem('chartLayout', JSON.stringify(layout));
    console.log('✅ Layout saved');
}

function loadLayout() {
    const saved = localStorage.getItem('chartLayout');
    if (saved) {
        const layout = JSON.parse(saved);
        currentTheme = layout.theme || 'light';
        alerts = layout.alerts || [];
        drawings = layout.drawings || [];
        
        // Apply theme
        toggleChartTheme();
        if (currentTheme !== layout.theme) {
            toggleChartTheme(); // Toggle again if needed
        }
        
        console.log('✅ Layout loaded');
    }
}

// Make new functions globally available
window.toggleChartTheme = toggleChartTheme;
window.toggleFullscreen = toggleFullscreen;
window.exportChart = exportChart;
window.addPriceAlert = addPriceAlert;
window.saveLayout = saveLayout;
window.loadLayout = loadLayout;
window.toggleSMA = toggleSMA;
window.toggleOHLCDisplay = toggleOHLCDisplay;