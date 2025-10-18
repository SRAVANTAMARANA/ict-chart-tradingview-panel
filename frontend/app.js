// Enhanced Trading Controls functionality - SIMPLIFIED WORKING VERSION

// Show chart error message in the UI
function showChartError(message) {
  console.error('Chart Error:', message);
  // Try to find a chart error container, or create one
  let errorDiv = document.getElementById('chart-error-message');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.id = 'chart-error-message';
    errorDiv.style.color = 'red';
    errorDiv.style.fontWeight = 'bold';
    errorDiv.style.margin = '1em';
    // Try to append to chart container or body
    const chartContainer = document.getElementById('chart-container') || document.body;
    chartContainer.appendChild(errorDiv);
  }
  errorDiv.textContent = 'Chart Error: ' + message;
}
document.addEventListener('DOMContentLoaded', function() {
  // FINAL STARTUP GUARD: Always show dashboard and hide chartView on load
    // Removed auto-load chart on page ready. Chart will only load on user action via dashboard tile.
  }, 10);
  // --- ASTRO MODULE: Home button and initialization logic ---
  function initAstroModule() {
    // Wire home button to return to dashboard
    const astroHomeBtn = document.getElementById('astroHomeBtn');
    if (astroHomeBtn) {
      astroHomeBtn.onclick = function(e) {
        e.preventDefault();
        const dashboard = document.getElementById('dashboardHome');
        if (dashboard) safeShowSection(dashboard);
      };
    }
    // Optionally: refresh planetary data, update iframe, etc.
    const orbitFrame = document.getElementById('astroOrbitFrame');
    if (orbitFrame) {
      // Optionally reload or update src
      // orbitFrame.src = orbitFrame.src;
    }
    // TODO: Add more astro module initialization as needed
    console.log('🔭 Astro module initialized');
  }

  // Patch safeShowSection to call initAstroModule when astroView is shown
  const origSafeShowSection = window.safeShowSection;
  window.safeShowSection = function(sectionEl) {
    origSafeShowSection(sectionEl);
    if (sectionEl && sectionEl.id === 'astroView') {
      initAstroModule();
    }
  };
  // --- Enhanced Trading Controls functionality - SIMPLIFIED WORKING VERSION ---
  let enhancedWebSocket = null;
  let enhancedDataCount = 0;
  let enhancedChart = null;
  let enhancedCandlestickSeries = null;

  // Global test function for debugging
  window.testLoadChart = function() {
    console.log('🚀 SIMPLIFIED: Test load chart function called!');
    loadEnhancedChart();
  };

  function updateEnhancedStatus(message, color = '#666') {
    const indicator = document.getElementById('enhancedStatusIndicator');
    if (indicator) {
      indicator.textContent = message;
      indicator.style.color = color;
    }
  }

  // --- Lock API host and expose safe getters (immutable) ---
  if (typeof window.getApiBase !== 'function') {
  const FIXED_API_BASE = 'http://localhost:8081';
  const FIXED_WS_BASE = 'ws://localhost:8081';
    try {
      Object.defineProperty(window, 'API_BASE', { value: FIXED_API_BASE, writable: false, configurable: false });
      Object.defineProperty(window, 'API_WS_BASE', { value: FIXED_WS_BASE, writable: false, configurable: false });
    } catch (_) {}
    window.getApiBase = () => FIXED_API_BASE;
    window.getApiWsBase = () => FIXED_WS_BASE;
  }

  // Event listeners for enhanced controls - with error handling
  setTimeout(() => {
    try {
      console.log('🔧 Setting up enhanced controls...');
      const loadBtn = document.getElementById('enhancedLoadBtn');
      const refreshBtn = document.getElementById('enhancedRefreshBtn');
      const webSocketBtn = document.getElementById('enhancedWebSocketBtn');
      const symbolSelect = document.getElementById('enhancedSymbolSelect');
      const timeframeSelect = document.getElementById('enhancedTimeframeSelect');
      console.log('🔧 Enhanced controls found:', {
        loadBtn: !!loadBtn,
        refreshBtn: !!refreshBtn,
        webSocketBtn: !!webSocketBtn,
        symbolSelect: !!symbolSelect,
        timeframeSelect: !!timeframeSelect
      });
      if (loadBtn) {
        loadBtn.addEventListener('click', () => {
          console.log('📊 Load button clicked!');
          loadEnhancedChart();
        });
        console.log('✅ Enhanced load button connected');
      } else {
        console.warn('❌ Enhanced load button not found');
      }
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          console.log('🔄 Refresh button clicked!');
          refreshEnhancedChart();
        });
        console.log('✅ Enhanced refresh button connected');
      } else {
        console.warn('❌ Enhanced refresh button not found');
      }
      if (webSocketBtn) {
        webSocketBtn.addEventListener('click', () => {
          console.log('📡 WebSocket button clicked!');
          connectEnhancedWebSocket();
        });
        console.log('✅ Enhanced WebSocket button connected');
      } else {
        console.warn('❌ Enhanced WebSocket button not found');
      }
      if (symbolSelect) {
        symbolSelect.addEventListener('change', () => {
          console.log('🔄 Symbol changed!');
          refreshEnhancedChart();
        });
        console.log('✅ Enhanced symbol selector connected');
      } else {
        console.warn('❌ Enhanced symbol selector not found');
      }
      if (timeframeSelect) {
        timeframeSelect.addEventListener('change', () => {
          console.log('🔄 Timeframe changed!');
          refreshEnhancedChart();
        });
        console.log('✅ Enhanced timeframe selector connected');
      } else {
        console.warn('❌ Enhanced timeframe selector not found');
      }
      // Check if all controls are present
      const controlsPresent = loadBtn && refreshBtn && webSocketBtn && symbolSelect && timeframeSelect;
      if (controlsPresent) {
        console.log('✅ All enhanced trading controls initialized successfully');
      } else {
        console.warn('⚠️ Some enhanced controls not found - missing elements detected');
      }
    } catch (error) {
      console.error('❌ Enhanced controls initialization failed:', error);
    }
  }, 3000); // Increased delay to ensure elements are loaded

  // ...existing code for other DOMContentLoaded logic...

// ...end of DOMContentLoaded handler...

// Make showChartError globally accessible
window.showChartError = function(message) {
  const errorDisplay = document.getElementById('chartErrorDisplay');
  const errorMessage = document.getElementById('chartErrorMessage');
  if (errorDisplay && errorMessage) {
    errorMessage.textContent = message;
    errorDisplay.style.display = 'block';
  }
  console.error('Chart Error:', message);
  if (typeof updateEnhancedStatus === 'function') {
    updateEnhancedStatus('Error', '#f23645');
  }
};

window.hideChartError = function() {
  const errorDisplay = document.getElementById('chartErrorDisplay');
  if (errorDisplay) {
    errorDisplay.style.display = 'none';
  }
};
  
  function loadEnhancedChart() {
    console.log('� SIMPLIFIED: Loading chart with proven working method...');
    hideChartError();
    updateEnhancedStatus('Loading...', '#ff9800');
    
    try {
      // Check if LightweightCharts is available
      if (typeof LightweightCharts === 'undefined') {
        throw new Error('LightweightCharts library not loaded');
      }
      
      // Find chart container (try multiple possible containers)
      let chartContainer = document.getElementById('lwchart') || 
                          document.getElementById('chartView') || 
                          document.getElementById('chartContainer');
      
      if (!chartContainer) {
        throw new Error('Chart container not found');
      }
      
      console.log('✅ SIMPLIFIED: Found chart container:', chartContainer.id);
      
      // Only show chartView if this was triggered by a user action (not on page load)
      // This function should only be called from a dashboard tile click or explicit user event
      const chartView = document.getElementById('chartView');
      if (chartView && chartView.classList.contains('hidden')) {
        // Check if this call is from a user event (e.g., click)
        if (window._chartUserTriggered) {
          chartView.classList.remove('hidden');
        } else {
          console.warn('Prevented auto-show of chartView (not user-triggered)');
          return;
        }
      }
      
      // Clear existing chart
      chartContainer.innerHTML = '';
      
      // Create chart with exact same config as working test
      enhancedChart = LightweightCharts.createChart(chartContainer, {
        width: chartContainer.clientWidth || 800,
        height: chartContainer.clientHeight || 600,
        layout: {
          background: { color: '#FFFFFF' },
          textColor: '#333333',
        },
        grid: {
          vertLines: { color: '#E0E0E0' },
          horzLines: { color: '#E0E0E0' },
        },
        crosshair: {
          mode: LightweightCharts.CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: '#CCCCCC',
        },
        timeScale: {
          borderColor: '#CCCCCC',
          timeVisible: true,
          secondsVisible: false,
        },
      });
      
      // Add candlestick series
      enhancedCandlestickSeries = enhancedChart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });
      
      console.log('✅ SIMPLIFIED: Chart created successfully');
      updateEnhancedStatus('Loaded', '#089981');
      
      // Load historical data
      loadEnhancedHistoricalData();
      
    } catch (error) {
      console.error('❌ SIMPLIFIED: Chart loading failed:', error);
      showChartError(`Failed to load chart: ${error.message}`);
    }
  }
  
  function loadEnhancedHistoricalData() {
    // Always load XAUUSD 5min candles from backend (Twelve Data)
    const apiBase = (typeof getApiBase === 'function' ? getApiBase() : (window.API_BASE || 'http://localhost:8000'));
    const url = `${apiBase.replace(/\/$/, '')}/ict/candles?symbol=XAUUSD&interval=5m&limit=100`;
    console.log('🔄 Loading XAUUSD candles from backend:', url);
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        const candles = data.candles || data;
        console.log(`✅ Received ${candles.length} candles from backend`);
        const candleData = candles.map(candle => ({
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close
        }));
        if (enhancedCandlestickSeries) {
          enhancedCandlestickSeries.setData(candleData);
          enhancedChart.timeScale().fitContent();
          console.log('✅ Chart data loaded from backend');
        }
      })
      .catch(error => {
        console.error('❌ Data loading error (backend):', error);
        showChartError(`Data loading failed: ${error.message}`);
      });
  }
  
  function connectEnhancedWebSocket() {
    const symbolSelect = document.getElementById('enhancedSymbolSelect');
    const timeframeSelect = document.getElementById('enhancedTimeframeSelect');
    
    if (!symbolSelect || !timeframeSelect) {
      console.log('⚠️ Enhanced controls not found, skipping WebSocket connection');
      return;
    }
    
    const symbol = symbolSelect.value.toLowerCase();
    const timeframe = timeframeSelect.value;
    
    // Close existing connection
    if (enhancedWebSocket) {
      enhancedWebSocket.close();
    }
    
    updateEnhancedStatus('Connecting...', '#ff9800');
    
    // Use backend WebSocket for live updates
    const wsBase = (typeof getApiWsBase === 'function' ? getApiWsBase() : (window.API_WS_BASE || 'ws://localhost:8000'));
    const wsUrl = `${wsBase.replace(/\/$/, '')}/ict/ws?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(timeframe)}&limit=100`;
    console.log(`🌐 Connecting to backend WebSocket: ${wsUrl}`);
    try {
      enhancedWebSocket = new WebSocket(wsUrl);
      enhancedWebSocket.onopen = function() {
        console.log('✅ Backend WebSocket connected');
        updateEnhancedStatus('Live Data', '#089981');
      };
      enhancedWebSocket.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);
          if (data.candles && Array.isArray(data.candles)) {
            // Initial batch
            const candles = data.candles;
            const candleData = candles.map(k => ({
              time: k.time,
              open: k.open,
              high: k.high,
              low: k.low,
              close: k.close
            }));
            if (enhancedCandlestickSeries) {
              enhancedCandlestickSeries.setData(candleData);
              enhancedChart.timeScale().fitContent();
            }
            enhancedDataCount += candleData.length;
            updateEnhancedStatus(`Live: ${enhancedDataCount}`, '#089981');
          } else if (data.bar) {
            // Live update
            const bar = data.bar;
            const candleData = {
              time: bar.time,
              open: bar.open,
              high: bar.high,
              low: bar.low,
              close: bar.close
            };
            if (enhancedCandlestickSeries) {
              enhancedCandlestickSeries.update(candleData);
            }
            enhancedDataCount++;
            updateEnhancedStatus(`Live: ${enhancedDataCount}`, '#089981');
          }
        } catch (error) {
          console.error('❌ Backend WebSocket data error:', error);
        }
      };
      enhancedWebSocket.onerror = function(error) {
        console.error('❌ Backend WebSocket error:', error);
        updateEnhancedStatus('Connection Error', '#f44336');
      };
      enhancedWebSocket.onclose = function() {
        console.log('📡 Backend WebSocket disconnected');
        updateEnhancedStatus('Disconnected', '#666');
      };
    } catch (error) {
      console.error('❌ Backend WebSocket creation error:', error);
      updateEnhancedStatus('Connection Failed', '#f44336');
    }
  }

  
  function refreshEnhancedChart() {
    console.log('🔄 Refreshing enhanced chart...');
    enhancedDataCount = 0;
    
    // Disconnect WebSocket
    if (enhancedWebSocket) {
      enhancedWebSocket.close();
    }
    
    // Wait a moment then reconnect
    setTimeout(() => {
      connectEnhancedWebSocket();
    }, 500);
  }
  
  // Event listeners for enhanced controls - with error handling
  setTimeout(() => {
    try {
      console.log('🔧 Setting up enhanced controls...');
      
      const loadBtn = document.getElementById('enhancedLoadBtn');
      const refreshBtn = document.getElementById('enhancedRefreshBtn');
      const webSocketBtn = document.getElementById('enhancedWebSocketBtn');
      const symbolSelect = document.getElementById('enhancedSymbolSelect');
      const timeframeSelect = document.getElementById('enhancedTimeframeSelect');
      
      console.log('🔧 Enhanced controls found:', {
        loadBtn: !!loadBtn,
        refreshBtn: !!refreshBtn,
        webSocketBtn: !!webSocketBtn,
        symbolSelect: !!symbolSelect,
        timeframeSelect: !!timeframeSelect
      });
      
      if (loadBtn) {
        loadBtn.addEventListener('click', () => {
          console.log('📊 Load button clicked!');
          loadEnhancedChart();
        });
        console.log('✅ Enhanced load button connected');
      } else {
        console.warn('❌ Enhanced load button not found');
      }
      
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          console.log('🔄 Refresh button clicked!');
          refreshEnhancedChart();
        });
        console.log('✅ Enhanced refresh button connected');
      } else {
        console.warn('❌ Enhanced refresh button not found');
      }
      
      if (webSocketBtn) {
        webSocketBtn.addEventListener('click', () => {
          console.log('📡 WebSocket button clicked!');
          connectEnhancedWebSocket();
        });
        console.log('✅ Enhanced WebSocket button connected');
      } else {
        console.warn('❌ Enhanced WebSocket button not found');
      }
      
      if (symbolSelect) {
        symbolSelect.addEventListener('change', () => {
          console.log('🔄 Symbol changed!');
          refreshEnhancedChart();
        });
        console.log('✅ Enhanced symbol selector connected');
      } else {
        console.warn('❌ Enhanced symbol selector not found');
      }
      
      if (timeframeSelect) {
        timeframeSelect.addEventListener('change', () => {
          console.log('🔄 Timeframe changed!');
          refreshEnhancedChart();
        });
        console.log('✅ Enhanced timeframe selector connected');
      } else {
        console.warn('❌ Enhanced timeframe selector not found');
      }
      
      // Check if all controls are present
      const controlsPresent = loadBtn && refreshBtn && webSocketBtn && symbolSelect && timeframeSelect;
      if (controlsPresent) {
        console.log('✅ All enhanced trading controls initialized successfully');
      } else {
        console.warn('⚠️ Some enhanced controls not found - missing elements detected');
      }
      
    } catch (error) {
      console.error('❌ Enhanced controls initialization failed:', error);
    }
  }, 3000); // Increased delay to ensure elements are loaded
// (Removed duplicate/invalid DOMContentLoaded handler. All logic is now in the first handler.)


  // --- Responsive chart container style ---
  function ensureChartContainerFit() {
    // Handle both ICT and GANN chart containers
    const chartEl = document.getElementById('lwchart');
    const gannChartEl = document.getElementById('gannLwchart');
    
    [chartEl, gannChartEl].forEach(el => {
      if (el) {
        el.style.width = '100%';
        el.style.height = '100vh';
        el.style.maxWidth = '100vw';
        el.style.maxHeight = '100vh';
        el.style.boxSizing = 'border-box';
      }
    });
  }

  // --- Chart variables ---
  let chart = null;
  let candleSeries = null;
  let lastCandles = [];

  // --- Helper functions for GANN module ---
  function getGannSymbol() {
    return document.getElementById('gannSymbolInput')?.value || 'EURUSD';
  }

  function getGannInterval() {
    return document.getElementById('gannIntervalSelect')?.value || '5m';
  }

  // --- Safe navigation wrapper so calls to showSection never throw ---
  function safeShowSection(sectionEl) {
    console.log('🔄 safeShowSection called with:', sectionEl ? sectionEl.id : 'null');
    try {
      const fn = (typeof window.showSection === 'function') ? window.showSection : (typeof showSectionBasic === 'function' ? showSectionBasic : null);
      if (fn && sectionEl) {
        fn(sectionEl);
      } else {
        showSectionBasic(sectionEl);
      }
    } catch (e) {
      console.warn('showSection failed, falling back:', e);
      try { 
        if (typeof showSectionBasic === 'function' && sectionEl) {
          showSectionBasic(sectionEl); 
        }
      } catch(_) {}
    }
  }
  
  // Make safeShowSection globally available
  window.safeShowSection = safeShowSection;

  // --- Robust view switching and event wiring ---
  function showSectionBasic(section) {
    console.log('📱 showSectionBasic called with:', section ? section.id : 'null');
    // Hide all main views
    const views = [
      document.getElementById('dashboardHome'), 
      document.getElementById('chartView'),
      document.getElementById('gannChartView'),
      document.getElementById('astroView'),
      document.getElementById('newsView'),
      document.getElementById('researchView'),
      document.getElementById('newsAnalyzerView')
    ];
    
    console.log('🔄 Views found:', views.map(v => v ? v.id : 'null'));
    
    views.forEach(v => {
      if (v) {
        v.classList.add('hidden');
        console.log(`Hidden: ${v.id}`);
      }
    });
    
    if (section) {
      section.classList.remove('hidden');
      console.log(`Shown: ${section.id}`);
      
      // Verify section is actually visible
      const isVisible = !section.classList.contains('hidden');
      console.log(`Section ${section.id} visible: ${isVisible}`);
    } else {
      console.error('❌ No section provided to showSectionBasic');
    }
    
    // Re-wire all buttons after view switch
    wireAllButtons();
  }

  // Wire all essential buttons
  function wireAllButtons() {
    console.log('🔌 Wiring buttons...');
    
    // Home button (back to dashboard)
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
      homeBtn.onclick = () => {
        console.log('🏠 Home button clicked');
        const dashboardHome = document.getElementById('dashboardHome');
        console.log('🏠 Dashboard element found:', dashboardHome ? 'yes' : 'no');
        if (dashboardHome) {
          console.log('🏠 Dashboard current classes:', dashboardHome.className);
          safeShowSection(dashboardHome);
        } else {
          console.error('❌ Dashboard home section not found!');
        }
      };
      console.log('✅ Home button wired');
    } else {
      console.warn('⚠️ Home button not found');
    }

    // Load button (show chart view and load chart)
    const loadBtn = document.getElementById('loadBtn');
    if (loadBtn) {
      loadBtn.onclick = async () => {
        console.log('📊 Load button clicked');
        const chartView = document.getElementById('chartView');
        if (chartView) {
          safeShowSection(chartView);
          ensureChartContainerFit();
          
          // Initialize chart if LightweightCharts is available
          await (window.lightweightChartsReady || Promise.resolve());
          if (typeof createLWChart === 'function') {
            createLWChart();
          } else {
            console.log('📈 Creating basic chart placeholder');
            createBasicChart();
          }
        }
      };
      console.log('✅ Load button wired');
    }

    // Inline ICT Panel open button
    const openIctModuleBtn = document.getElementById('openIctModuleBtn');
    if (openIctModuleBtn) {
      openIctModuleBtn.onclick = () => {
        console.log('🧭 Inline ICT Open button clicked');
        const status = document.getElementById('ictInlineStatus');
        if (status) status.textContent = 'Opening...';
        if (status) status.textContent = 'Opening...';
        // Simulate user clicking the ICT tile
        window._chartUserTriggered = true;
        const ictTile = document.querySelector('.tile[data-module="ict"]');
        if (ictTile) {
          ictTile.click();
        } else {
          // Fallback: directly open chartView and call loader
          const chartView = document.getElementById('chartView');
          if (chartView) safeShowSection(chartView);
          if (typeof createDirectChart === 'function') createDirectChart();
        }
        if (status) setTimeout(() => { status.textContent = 'Opened'; }, 1500);
      };
      console.log('✅ Inline ICT open button wired');
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.onclick = () => {
        console.log('🎨 Theme toggle clicked');
        document.body.classList.toggle('theme-dark');
        document.body.classList.toggle('theme-light');
      };
    }

    // GANN Home button
    const gannHomeBtn = document.getElementById('gannHomeBtn');
    if (gannHomeBtn) {
      gannHomeBtn.onclick = () => {
        console.log('🏠 GANN Home button clicked');
        safeShowSection(document.getElementById('dashboardHome'));
      };
      console.log('✅ GANN Home button wired');
    }

    // GANN Load button
    const gannLoadBtn = document.getElementById('gannLoadBtn');
    if (gannLoadBtn) {
      gannLoadBtn.onclick = async () => {
        console.log('📊 GANN Load button clicked');
        const symbol = getGannSymbol();
        const interval = getGannInterval();
        
        // First ensure we're in the GANN chart view
        const gannChartView = document.getElementById('gannChartView');
        if (gannChartView) {
          safeShowSection(gannChartView);
          ensureChartContainerFit();
          
          // Create the chart first
          await (window.lightweightChartsReady || Promise.resolve());
          if (typeof createLWChart === 'function') {
            createLWChart();
          }
          
          // Then execute GANN analysis
          await executeGannAnalysis('all');
          if (typeof createPremiumNotification !== 'undefined') {
            createPremiumNotification('GANN Analysis', `Chart and signals loaded for ${symbol} ${interval}`, 'gann');
          } else {
            showIctNotification(`GANN chart and data loaded for ${symbol} ${interval}`);
          }
        } else {
          console.error('GANN chart view not found');
        }
      };
      console.log('✅ GANN Load button wired');
    }

    // Auto-signals toggle (if present)
    const autoToggle = document.getElementById('autoSignalsToggle');
    if (autoToggle && !autoToggle._wired) {
      autoToggle._wired = true;
      autoToggle.onchange = () => {
        autoSignalsEnabled = !!autoToggle.checked;
        if (autoSignalsEnabled) debouncedRefresh();
      };
    }

  }

  function createLWChart() {
      try {
        console.log('📊 Starting chart creation...');
        
        // Check if LightweightCharts is available
        if (typeof LightweightCharts === 'undefined') {
          throw new Error('LightweightCharts library not loaded');
        }
        
        // Determine which chart container to use based on current view
        let chartContainer = document.getElementById('lwchart');
        const gannChartView = document.getElementById('gannChartView');
        const ictChartView = document.getElementById('chartView');
        
        // If we're in GANN view, use the GANN chart container
        if (gannChartView && !gannChartView.classList.contains('hidden')) {
          chartContainer = document.getElementById('gannLwchart');
        }
        // If we're in ICT view, use the ICT chart container
        else if (ictChartView && !ictChartView.classList.contains('hidden')) {
          chartContainer = document.getElementById('lwchart');
        }
        
        if (!chartContainer) {
          throw new Error('Chart container not found for current view');
        }
        
        chartContainer.innerHTML = '';
        ensureChartContainerFit();
        
        console.log('📊 Chart container ready, creating chart...');

      // Detect symbol and interval from enhanced dropdowns (before chart for watermark)
      let interval = '5m';
      let symbol = 'BTCUSDT';
      const enhancedTimeframeSelect = document.getElementById('enhancedTimeframeSelect');
      const enhancedSymbolSelect = document.getElementById('enhancedSymbolSelect');
      if (enhancedTimeframeSelect && enhancedTimeframeSelect.value) interval = enhancedTimeframeSelect.value;
      if (enhancedSymbolSelect && enhancedSymbolSelect.value) {
        symbol = enhancedSymbolSelect.value;
      }

      // Enhanced TradingView-style chart options with professional settings
      window.chart = LightweightCharts.createChart(chartContainer, {
        autoSize: true,
        layout: { 
          background: { color: '#FFFFFF' }, 
          textColor: '#333333', 
          fontSize: 12 
        },
        grid: { 
          vertLines: { color: '#f0f0f0' }, 
          horzLines: { color: '#f0f0f0' } 
        },
        rightPriceScale: { 
          borderColor: '#d1d4dc', 
          scaleMargins: { top: 0.05, bottom: 0.05 }
        },
        timeScale: { 
          borderColor: '#d1d4dc', 
          rightOffset: 12, 
          timeVisible: true, 
          secondsVisible: false, 
          barSpacing: 8, 
          minBarSpacing: 0.5,
          fixLeftEdge: false,
          lockVisibleTimeRangeOnResize: true,
          rightBarStaysOnScroll: true
        },
        crosshair: {
          mode: LightweightCharts.CrosshairMode.Normal,
          vertLine: {
            width: 1,
            color: '#758696',
            style: LightweightCharts.LineStyle.Dashed
          },
          horzLine: {
            width: 1,
            color: '#758696',
            style: LightweightCharts.LineStyle.Dashed
          }
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true
        },
        localization: {
          timeFormatter: (time) => {
            const date = new Date(time * 1000);
            return date.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });
          },
          priceFormatter: (price) => {
            return price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 8
            });
          }
        },
        crosshair: { mode: (window.LightweightCharts?.CrosshairMode?.Normal) ?? 1 },
        handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
        kineticScroll: { mouse: true, touch: true },
        watermark: {
          color: 'rgba(25, 25, 25, 0.1)',
          visible: true,
          text: symbol + ' - ' + interval,
          fontSize: 36,
          horzAlign: 'center',
          vertAlign: 'center'
        }
      });

      // Responsive chart resize handling
      window.addEventListener('resize', () => {
        if (window.chart) {
          window.chart.applyOptions({
            width: chartContainer.clientWidth,
            height: Math.max(600, window.innerHeight * 0.7)
          });
        }
      });

  // Enhanced candlestick style with professional TradingView colors
      window.candleSeries = window.chart.addCandlestickSeries({
        upColor: '#089981',
        downColor: '#f23645',
        borderUpColor: '#089981',
        borderDownColor: '#f23645',
        wickUpColor: '#089981',
        wickDownColor: '#f23645',
        borderVisible: true,
        wickVisible: true,
        priceLineVisible: true,
        priceFormat: { 
          type: 'price',
          precision: 6,
          minMove: 0.000001
        }
      });

      // Expose globals for other modules
      window.__directSeries__ = window.candleSeries;
      window._chartRef = window.chart;


      // Always load candles from backend for all symbols
      let backendInterval = interval;
      if (interval === '1m') backendInterval = '1min';
      if (interval === '15m') backendInterval = '15min';
      if (interval === '30m') backendInterval = '30min';
      if (interval === '1h') backendInterval = '1h';
      if (![ '1min', '5min', '15min', '30min', '1h' ].includes(backendInterval)) backendInterval = '5min';
      const apiBase = (typeof getApiBase === 'function' ? getApiBase() : (window.API_BASE || 'http://localhost:8000'));
      const url = `${apiBase.replace(/\/$/, '')}/ict/candles?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(backendInterval)}&limit=500`;
      console.log(`🔄 Loading data for ${symbol} ${backendInterval} from backend:`, url);
      fetch(url)
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then(arr => {
          let data = arr;
          if (arr.candles && Array.isArray(arr.candles)) data = arr.candles;
          if (!Array.isArray(data) || data.length === 0) throw new Error('No candle data received from backend');
          data = data.map(k => ({
            time: k.time !== undefined ? k.time : k[0],
            open: k.open !== undefined ? k.open : k[1],
            high: k.high !== undefined ? k.high : k[2],
            low: k.low !== undefined ? k.low : k[3],
            close: k.close !== undefined ? k.close : k[4],
          }));
          window.candleSeries.setData(data);
          candleSeries = window.candleSeries;
          lastCandles = data;
          console.log(`✅ Successfully loaded ${data.length} candles for ${symbol} ${backendInterval} from backend`);
        })
        .catch(e => {
          console.error('❌ Failed to load backend data:', e);
          if (typeof window.showChartError === 'function') {
            window.showChartError('Failed to load chart data from backend: ' + e.message);
          } else if (typeof showChartError === 'function') {
            showChartError('Failed to load chart data from backend: ' + e.message);
          }
        });

      // Close any existing WebSocket connection
      if (window.__pairWs) {
        try { 
          window.__pairWs.close(); 
          console.log('🔄 Closed previous WebSocket connection');
        } catch(e) { 
          console.log('⚠️ Error closing previous WebSocket:', e.message);
        }
      }

  // WebSocket for real-time updates for selected symbol/interval (from backend)
  const wsBase = (typeof getApiWsBase === 'function' ? getApiWsBase() : (window.API_WS_BASE || 'ws://localhost:8000'));
  const wsUrl = `${wsBase.replace(/\/$/, '')}/ict/ws?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=500`;
  console.log(`🌐 Connecting to backend WebSocket for ${symbol} ${interval}: ${wsUrl}`);
  window.__pairWs = new WebSocket(wsUrl);
      window.__pairWs.onopen = () => {
        console.log(`✅ Backend WebSocket connected for ${symbol} ${interval}`);
        const statusEl = document.getElementById('chartStatus');
        if (statusEl) {
          statusEl.textContent = `🟢 Live: ${symbol} ${interval}`;
          statusEl.style.display = 'block';
        }
      };
      window.__pairWs.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.candles && Array.isArray(msg.candles)) {
            // Initial batch
            const data = msg.candles.map(k => ({
              time: k.time,
              open: k.open,
              high: k.high,
              low: k.low,
              close: k.close
            }));
            window.candleSeries.setData(data);
            candleSeries = window.candleSeries;
            lastCandles = data;
            console.log(`✅ Loaded initial ${data.length} candles from backend WS`);
          } else if (msg.bar) {
            // Live update
            const bar = msg.bar;
            if (window.candleSeries) {
              window.candleSeries.update({
                time: bar.time,
                open: bar.open,
                high: bar.high,
                low: bar.low,
                close: bar.close
              });
              // Update price info display
              const priceInfoEl = document.getElementById('priceInfo');
              if (priceInfoEl) {
                const change = bar.close - bar.open;
                const changePercent = ((change / bar.open) * 100).toFixed(2);
                const color = change >= 0 ? '#089981' : '#f23645';
                priceInfoEl.innerHTML = `
                  <span style="color: ${color}; font-weight: bold;">
                    ${symbol}: $${bar.close.toFixed(4)}
                    (${change >= 0 ? '+' : ''}${change.toFixed(4)} | ${changePercent}%)
                  </span>
                `;
              }
              console.log(`📊 Real-time update: ${symbol} - $${bar.close}`);
            }
          }
        } catch (e) {
          console.warn('❌ WebSocket message error:', e);
        }
      };
      
      window.__pairWs.onerror = (e) => {
        console.error('❌ WebSocket connection error:', e);
        const statusEl = document.getElementById('chartStatus');
        if (statusEl) {
          statusEl.textContent = `🔴 Connection Error`;
          statusEl.style.display = 'block';
        }
      };
      
      window.__pairWs.onclose = () => {
        console.log('🔌 WebSocket connection closed');
        const statusEl = document.getElementById('chartStatus');
        if (statusEl) {
          statusEl.textContent = `🟡 Disconnected`;
          statusEl.style.display = 'block';
        }
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (!window.__pairWs || window.__pairWs.readyState === WebSocket.CLOSED) {
            console.log('🔄 Attempting to reconnect WebSocket...');
            createLWChart(); // This will restart the connection
          }
        }, 5000);
      };

      // Auto-reload chart when symbol or interval changes
      const intervalSelect = document.getElementById('intervalSelect') || enhancedTimeframeSelect;
      const symbolInput = document.getElementById('symbolInput') || enhancedSymbolSelect;
      if (intervalSelect && !intervalSelect._pairWired) {
        intervalSelect._pairWired = true;
        intervalSelect.addEventListener('change', () => {
          console.log(`🔄 Interval changed to: ${intervalSelect.value}`);
          setTimeout(() => createLWChart(), 100); // Small delay to avoid conflicts
        });
      }
      
      if (symbolInput && !symbolInput._pairWired) {
        symbolInput._pairWired = true;
        symbolInput.addEventListener('change', () => {
          console.log(`🔄 Symbol changed to: ${symbolInput.value}`);
          setTimeout(() => createLWChart(), 100); // Small delay to avoid conflicts
        });
      }

      // Add manual refresh button functionality
      const loadBtn = document.getElementById('loadBtn');
      if (loadBtn && !loadBtn._pairWired) {
        loadBtn._pairWired = true;
        loadBtn.addEventListener('click', () => {
          console.log('🔄 Manual refresh triggered');
          createLWChart();
        });
      }

      console.log(`🎉 Real-time chart initialized for ${symbol} ${interval} with WebSocket streaming!`);
      if (symbolInput && !symbolInput._pairWired) {
        symbolInput._pairWired = true;
        symbolInput.addEventListener('change', () => {
          createLWChart();
        });
      }

        // Prepare overlay layer for shaded zones (OB/FVG/OTE/Range)
        ensureOverlayLayer();
        subscribeOverlayUpdates();

      // Optional: auto draw signals for simple-browser testing if ?auto_draw=1
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('auto_draw') === '1') {
          setTimeout(async () => {
            try {
              if (typeof fetchDetectors === 'function' && typeof drawDetectors === 'function') {
                const sym = (document.getElementById('symbolInput')?.value) || 'EURUSD';
                const iv = (document.getElementById('intervalSelect')?.value) || '5m';
                const data = await fetchDetectors(sym, iv);
                drawDetectors(data.signals || []);
              } else {
                document.getElementById('ictDrawAllBtn')?.click();
              }
            } catch (_) {}
          }, 900);
        }
      } catch (_) {}

  window._chartInitialized = true;
  window._chartRef = window.chart;
      
      } catch (error) {
        console.error('❌ Chart creation failed:', error);
        
        // Show error in enhanced controls if available
        const errorDisplay = document.getElementById('chartErrorDisplay');
        const errorMessage = document.getElementById('chartErrorMessage');
        if (errorDisplay && errorMessage) {
          errorMessage.textContent = `Chart creation failed: ${error.message}`;
          errorDisplay.style.display = 'block';
        }
        
        // Update status indicator if available
        const statusIndicator = document.getElementById('enhancedStatusIndicator');
        if (statusIndicator) {
          statusIndicator.textContent = 'Error';
          statusIndicator.style.color = '#f23645';
        }
        
        // Fallback to basic chart
        createBasicChart();
      }
    }

    // Minimal chart loader for post-load init from index.html
    window.minimalChartLoader = function() {
      const chartView = document.getElementById('chartView');
      if (chartView && !chartView.classList.contains('hidden')) {
        createLWChart();
      }
    };

    // Auto-load chart when page loads
    // (Removed duplicate window load event handler. All chart initialization is handled in DOMContentLoaded.)

    // Make createLWChart available globally
    window.createLWChart = createLWChart;

    // Watcher to update inline ICT status when chart becomes ready
    (function(){
      let checked = 0;
      const iv = setInterval(() => {
        checked++;
        if (window._chartInitialized) {
          if (typeof window.setIctInlineStatus === 'function') window.setIctInlineStatus('Loaded');
          try { const t = document.querySelector('.tile[data-module="ict"]'); if (t) t.classList.remove('active'); } catch(_){}
          clearInterval(iv);
        }
        if (checked > 40) { // stop after ~20s
          clearInterval(iv);
        }
      }, 500);
    })();

    // Reset ICT inline status when Home/ dashboard is shown
    document.addEventListener('click', (e) => {
      const homeBtn = e.target.closest && e.target.closest('#homeBtn');
      if (homeBtn) {
        try { if (typeof window.setIctInlineStatus === 'function') window.setIctInlineStatus('Idle'); } catch(_){}
        try { const t = document.querySelector('.tile[data-module="ict"]'); if (t) t.classList.remove('active'); } catch(_){}
      }
    });

  // Show notification helper
  function showIctNotification(message, duration = 3000) {
    console.log(`[ICT] ${message}`);
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2196F3;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, duration);
  }

  // Make notification available globally
  window.showIctNotification = showIctNotification;

  // Expose a small helper for other modules to update the inline ICT status
  window.setIctInlineStatus = function(txt) {
    try { const el = document.getElementById('ictInlineStatus'); if (el) el.textContent = txt; } catch(_){}
  };

  function normalizeInterval(iv) {
    if (!iv) return '1H';
    const v = String(iv);
    if (v.toLowerCase() === '1h') return '1H';
    if (v.toLowerCase() === '4h') return '4H';
    if (v.toLowerCase() === '1d') return '1D';
    return v; // pass-through for 1m,5m,15m
  }

  // Load candles data
  async function loadCandles(symbol, interval) {
    try {
      const apiBase = (typeof getApiBase === 'function' ? getApiBase() : (window.API_BASE || 'http://localhost:8000'));
      const response = await fetch(`${apiBase.replace(/\/$/, '')}/candles?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(normalizeInterval(interval))}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Loaded ${data.candles?.length || 0} candles for ${symbol}`);
        return data.candles || [];
      }
    } catch (e) {
      console.log('📊 Chart data not available, using placeholder');
    }
    return [];
  }

  // --- Detectors integration ---
  let ictOverlays = [];
  let overlayRects = [];
  let overlayLayer = null;
  let overlayHidden = false;
  let autoSignalsEnabled = false;
  function ensureOverlayLayer() {
    const container = document.getElementById('lwchart');
    if (!container) return;
    if (!overlayLayer) {
      overlayLayer = document.createElement('div');
      overlayLayer.style.position = 'absolute';
      overlayLayer.style.left = '0';
      overlayLayer.style.top = '0';
      overlayLayer.style.right = '0';
      overlayLayer.style.bottom = '0';
      overlayLayer.style.zIndex = '5';
      overlayLayer.style.pointerEvents = 'none';
      container.style.position = 'relative';
      container.appendChild(overlayLayer);
    }
  }
  function subscribeOverlayUpdates() {
    if (!window._chartRef) return;
    const c = window._chartRef;
    const schedule = () => window.requestAnimationFrame(() => { updateAllOverlayRects(); updateConfluencePanel(); if (typeof renderAiMentorQuick === 'function' && isAiMentorOpen && isAiMentorOpen()) renderAiMentorQuick(); });
    try { c.timeScale().subscribeVisibleTimeRangeChange(schedule); } catch(_) {}
    try { c.subscribeSizeChanged(schedule); } catch(_) {}
    window.addEventListener('resize', schedule);
  }
  function addZoneRect({ topPrice, bottomPrice, startTs, endTs, color = 'rgba(139,92,246,0.15)', border = 'rgba(139,92,246,0.6)', dynamicWidth = false, title = '' }) {
    ensureOverlayLayer();
    if (!overlayLayer) return null;
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.background = color;
    el.style.border = `1px dashed ${border}`;
    el.style.borderRadius = '2px';
    el.title = title;
    overlayLayer.appendChild(el);
    const obj = { el, topPrice, bottomPrice, startTs, endTs, color, border, dynamicWidth, title };
    obj.remove = () => { try { el.remove(); } catch(_){} overlayRects = overlayRects.filter(r => r !== obj); };
    overlayRects.push(obj);
    updateOverlayRect(obj);
    return obj;
  }
  function yFor(price) {
    try { return candleSeries && candleSeries.priceToCoordinate ? candleSeries.priceToCoordinate(price) : null; } catch(_) { return null; }
  }
  function xFor(ts) {
    try { return window._chartRef && window._chartRef.timeScale ? window._chartRef.timeScale().timeToCoordinate(ts) : null; } catch(_) { return null; }
  }
  function updateOverlayRect(obj) {
    if (!obj || !obj.el || !window._chartRef) return;
    const range = window._chartRef.timeScale().getVisibleRange && window._chartRef.timeScale().getVisibleRange();
    if (!range) { obj.el.style.display = 'none'; return; }
    let from = obj.startTs, to = obj.endTs;
    if (obj.dynamicWidth) { from = range.from; to = range.to; }
    const x1 = xFor(from); const x2 = xFor(to);
    const y1 = yFor(obj.topPrice); const y2 = yFor(obj.bottomPrice);
    if (x1 == null || x2 == null || y1 == null || y2 == null) { obj.el.style.display = 'none'; return; }
    const left = Math.min(x1, x2); const width = Math.abs(x2 - x1);
    const top = Math.min(y1, y2); const height = Math.abs(y2 - y1);
    obj.el.style.display = 'block';
    obj.el.style.left = `${left}px`;
    obj.el.style.top = `${top}px`;
    obj.el.style.width = `${Math.max(0, width)}px`;
    obj.el.style.height = `${Math.max(0, height)}px`;
  }
  function updateAllOverlayRects() { overlayRects.forEach(updateOverlayRect); }
  function toggleShadedZones() {
    ensureOverlayLayer();
    if (!overlayLayer) return;
    overlayHidden = !overlayHidden;
    overlayLayer.style.display = overlayHidden ? 'none' : 'block';
    showIctNotification(overlayHidden ? 'Shaded zones hidden' : 'Shaded zones visible');
  }
  function clearIctOverlays() {
    if (!window._chartRef) return;
    ictOverlays.forEach(o => { try { if (o && o.remove) o.remove(); } catch(_){} });
    overlayRects.forEach(o => { try { o.remove(); } catch(_){} });
    ictOverlays = [];
    overlayRects = [];
    showIctNotification('Cleared ICT overlays');
  }
  async function fetchDetectors(symbol, interval) {
    const base = (typeof getApiBase === 'function' ? getApiBase() : (window.API_BASE || 'http://localhost:8000'));
    const tz = new Date().getTimezoneOffset(); // minutes offset from UTC
    const dayInput = document.getElementById('ictDayInput');
    const todayToggle = document.getElementById('ictTodayOnly');
    const dayParam = (todayToggle?.checked ? (dayInput?.value || 'today') : (dayInput?.value || ''));
    const qp = new URLSearchParams({ symbol, interval });
    if (dayParam) qp.set('day', dayParam);
    qp.set('tz_offset', String(tz));
    const url = `${base.replace(/\/$/, '')}/api/detectors?${qp.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`detectors ${res.status}`);
    return await res.json();
  }
  let lastDetectorSignals = [];
  function isTodayRangeOverlap(stIso, etIso) {
    try {
      const tzMin = new Date().getTimezoneOffset();
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const st = stIso ? new Date(stIso) : null;
      const et = etIso ? new Date(etIso) : null;
      if (st && et) return (st <= end && et >= start);
      if (st && !et) return (st >= start && st <= end);
      if (!st && et) return (et >= start && et <= end);
      return false;
    } catch(_) { return false; }
  }
  function isSignalOnToday(sig) {
    if (!sig || typeof sig !== 'object') return false;
    if (sig.start_time || sig.end_time) {
      return isTodayRangeOverlap(sig.start_time, sig.end_time);
    }
    if (sig.time) {
      try {
        const t = new Date(sig.time);
        const now = new Date();
        return t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth() && t.getDate() === now.getDate();
      } catch(_) { return false; }
    }
    // Signals without time metadata: include only if chart's visible range is within today
    try {
      const vr = window._chartRef?.timeScale?.().getVisibleRange?.();
      if (!vr) return false;
      const from = new Date(vr.from * 1000), to = new Date(vr.to * 1000);
      const now = new Date();
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return (from <= dayEnd && to >= dayStart);
    } catch(_) { return false; }
  }
  // Parse ISO string as UTC seconds (append Z if missing)
  function secUTC(x){
    try {
      if (!x) return null;
      const s = (typeof x === 'string' && !x.endsWith('Z')) ? (x + 'Z') : x;
      return Math.floor(new Date(s).getTime()/1000);
    } catch(_) { return null; }
  }
  function drawDetectors(signals) {
    if (!window._chartRef || !candleSeries) return;
    const dayInput = document.getElementById('ictDayInput');
    const todayToggle = document.getElementById('ictTodayOnly');
    let filtered = Array.isArray(signals) ? signals : [];
    if ((todayToggle && todayToggle.checked) || (dayInput && dayInput.value)) {
      filtered = filtered.filter(isSignalOnToday);
    }
    lastDetectorSignals = filtered;
    const counts = { order_block: 0, fvg: 0, liquidity: 0, range: 0, ote: 0, mitigation: 0, choch: 0 };
    const markers = [];
    const lastTime = (() => {
      const data = window.__chartData__ || lastCandles || [];
      return data.length ? data[data.length - 1].time : null;
    })();

    // Clear heavy price lines previously added
    clearIctOverlays();

    filtered.forEach(sig => {
      try {
        const pushMarker = (time, position, color, shape, text) => {
          if (!time) return;
          markers.push({ time, position, color, shape, text });
        };

        if (sig.type === 'liquidity') {
          const t = secUTC(sig.time) || lastTime;
          const isHigh = (sig.label || '').toLowerCase().includes('high');
          pushMarker(t, isHigh ? 'aboveBar' : 'belowBar', isHigh ? '#f43f5e' : '#10b981', isHigh ? 'arrowDown' : 'arrowUp', isHigh ? 'SH' : 'SL');
          counts.liquidity++;
        } else if (sig.type === 'order_block') {
          const t = secUTC(sig.start_time) || secUTC(sig.time) || lastTime;
          const bullish = (sig.side || '').toLowerCase().includes('bull');
          pushMarker(t, bullish ? 'belowBar' : 'aboveBar', '#8b5cf6', 'square', 'OB');
          const st = secUTC(sig.start_time), et = secUTC(sig.end_time);
          if (st && et && typeof sig.high === 'number' && typeof sig.low === 'number') {
            addZoneRect({ topPrice: sig.high, bottomPrice: sig.low, startTs: st, endTs: et, color: 'rgba(139,92,246,0.06)', border: 'rgba(139,92,246,0.25)', title: `${sig.side||''} OB` });
          }
          counts.order_block++;
        } else if (sig.type === 'fvg') {
          const t = secUTC(sig.start_time) || secUTC(sig.time) || lastTime;
          pushMarker(t, 'inBar', '#f59e0b', 'square', 'FVG');
          const st = secUTC(sig.start_time), et = secUTC(sig.end_time);
          if (st && et && typeof sig.high === 'number' && typeof sig.low === 'number') {
            addZoneRect({ topPrice: sig.high, bottomPrice: sig.low, startTs: st, endTs: et, color: 'rgba(245,158,11,0.05)', border: 'rgba(245,158,11,0.25)', title: 'FVG' });
          }
          counts.fvg++;
        } else if (sig.type === 'ote') {
          const t = lastTime;
          pushMarker(t, 'inBar', '#0ea5e9', 'circle', 'OTE');
          counts.ote++;
        } else if (sig.type === 'range') {
          const t = lastTime;
          pushMarker(t, 'inBar', '#64748b', 'circle', 'RANGE');
          counts.range++;
        } else if (sig.type === 'mitigation') {
          const t = secUTC(sig.time) || lastTime;
          pushMarker(t, 'inBar', '#22c55e', 'circle', 'MIT');
          counts.mitigation++;
        } else if (sig.type === 'choch') {
          const t = secUTC(sig.time) || lastTime;
          pushMarker(t, 'aboveBar', '#06b6d4', 'arrowDown', 'CHOCH');
          counts.choch++;
        }
      } catch(_) {}
    });

    try { candleSeries.setMarkers(markers); } catch(_) {}
    updateAllOverlayRects();
    if (!filtered.length) console.log('[ICT] No signals matched current-day filter');
    updateStatusCounts(filtered?.length || 0, counts);
    updateConfluencePanel();
    if (typeof renderAiMentorQuick === 'function' && isAiMentorOpen && isAiMentorOpen()) renderAiMentorQuick();
    return counts;
  }

  // Status panel helpers
  function updateStatusCounts(last = null, counts = null) {
    const el = document.getElementById('chartStatus');
    if (!el) return;
    const lines = ictOverlays.length;
    const rects = overlayRects.length;
    const parts = [`Lines: ${lines}`, `Zones: ${rects}`];
    if (counts) {
      const compact = [];
      const order = ['order_block','fvg','liquidity','range','ote','mitigation','choch'];
      order.forEach(k => { if (counts[k]) compact.push(`${k.replace('_',' ').toUpperCase()}: ${counts[k]}`); });
      if (compact.length) parts.push(compact.join(' • '));
    }
    if (last !== null) parts.push(`Last draw: ${last}`);
    el.textContent = parts.join(' • ');
    if (el.style.display === '') el.style.display = 'block';
  }

  // --- Confluence Panel ---
  function getActiveConfluenceFilters() {
    const ob = document.getElementById('trayFilterOb');
    const fvg = document.getElementById('trayFilterFvg');
    const choch = document.getElementById('trayFilterChoch');
    return {
      order_block: ob ? !!ob.checked : true,
      fvg: fvg ? !!fvg.checked : true,
      choch: choch ? !!choch.checked : true,
      liquidity: true,
      range: true,
      ote: true,
      mitigation: true,
    };
  }

  function updateConfluencePanel() {
    const body = document.getElementById('ictConfluenceBody');
    const overall = document.getElementById('ictConfluenceOverall');
    if (!body || !overall) return;
    const filters = getActiveConfluenceFilters();
    const vr = (window._chartRef && window._chartRef.timeScale && window._chartRef.timeScale().getVisibleRange) ? window._chartRef.timeScale().getVisibleRange() : null;
    const from = vr ? vr.from : null;
    const to = vr ? vr.to : null;
    const counts = { order_block: 0, fvg: 0, liquidity: 0, range: 0, ote: 0, mitigation: 0, choch: 0 };
    function isoToSec(s) { try { return Math.floor(new Date(s).getTime()/1000); } catch(_) { return null; } }
    (lastDetectorSignals || []).forEach(sig => {
      if (!filters[sig.type]) return;
      let inRange = true;
      if (from != null && to != null) {
        if (sig.start_time && sig.end_time) {
          const st = isoToSec(sig.start_time); const et = isoToSec(sig.end_time);
          if (st != null && et != null) inRange = (st <= to && et >= from);
        } else if (sig.time) {
          const t = isoToSec(sig.time); if (t != null) inRange = (t >= from && t <= to);
        }
      }
      if (!inRange) return;
      if (sig.type in counts) counts[sig.type]++;
    });
    const total = Object.values(counts).reduce((a,b) => a + (b||0), 0) || 0;
    if (!total) {
      body.innerHTML = '<div style="font-size:12px; color:var(--text-secondary);">No signals yet. Click Draw All to analyze.</div>';
      overall.textContent = 'Overall: 0%';
      return;
    }
    const order = [
      ['order_block','Order Blocks','#8b5cf6'],
      ['fvg','FVG','#f59e0b'],
      ['liquidity','Liquidity','#10b981'],
      ['range','Range','#64748b'],
      ['ote','OTE','#0ea5e9'],
      ['mitigation','Mitigation','#06b6d4'],
      ['choch','CHoCH','#ef4444']
    ];
    const rows = [];
    let weighted = 0; let weightTotal = 0;
    order.forEach(([key, label, color]) => {
      const c = counts[key] || 0;
      const pct = Math.round((c / total) * 100);
      // weights emphasize structural signals slightly
      const w = key === 'order_block' || key === 'fvg' ? 1.2 : key === 'liquidity' ? 1.0 : 0.8;
      weighted += pct * w; weightTotal += w;
      rows.push(`
        <div style="display:flex; align-items:center; gap:8px; font-size:12px;">
          <div style="width:10px; height:10px; border-radius:2px; background:${color}"></div>
          <div style="flex:0 0 90px; color:var(--text-secondary);">${label}</div>
          <div style="flex:1; background:var(--bg-primary); border:1px solid var(--border-color); height:10px; border-radius:4px; overflow:hidden;">
            <div style="width:${pct}%; height:100%; background:${color}; opacity:0.6"></div>
          </div>
          <div style="width:40px; text-align:right; color:var(--text-secondary);">${pct}%</div>
          <div style="width:36px; text-align:right; color:var(--text-secondary);">(${c})</div>
        </div>
      `);
    });
    body.innerHTML = rows.join('');
    const overallPct = Math.round(weighted / Math.max(1, weightTotal));
    overall.textContent = `Overall: ${overallPct}%`;
  }

  // --- AI Mentor Panel & Analysis ---
  function getAiPane() { return document.getElementById('aiMentorPane'); }
  function getAiBody() { return document.getElementById('aiMentorBody'); }
  function isAiMentorOpen() { const p = getAiPane(); return !!p && !p.classList.contains('hidden'); }
  function openAiMentorPane() { const p = getAiPane(); if (!p) return; p.classList.remove('hidden'); if (!p.style.height) p.style.height = '260px'; }
  function closeAiMentorPane() { const p = getAiPane(); if (p) p.classList.add('hidden'); }
  function toggleAiMentorPane() { isAiMentorOpen() ? closeAiMentorPane() : openAiMentorPane(); }

  function wireAiMentorPane() {
    const aiToggle = document.getElementById('aiToggle');
    if (aiToggle && !aiToggle._wired) { aiToggle._wired = true; aiToggle.onclick = () => toggleAiMentorPane(); }

    const aiClose = document.getElementById('aiClose');
    if (aiClose && !aiClose._wired) { aiClose._wired = true; aiClose.onclick = () => closeAiMentorPane(); }

    const aiCollapse = document.getElementById('aiCollapse');
    if (aiCollapse && !aiCollapse._wired) {
      aiCollapse._wired = true;
      aiCollapse.onclick = () => {
        const body = getAiBody(); if (!body) return;
        const collapsed = body.style.display === 'none';
        body.style.display = collapsed ? 'block' : 'none';
        aiCollapse.textContent = collapsed ? '▾' : '▸';
      };
    }

    // Resizable from top handle
    const pane = getAiPane();
    const handle = pane ? pane.querySelector('.pane-resize-handle.handle-top') : null;
    if (pane && handle && !handle._wired) {
      handle._wired = true;
      let startY = 0; let startH = 0; let dragging = false;
      handle.addEventListener('mousedown', (e) => {
        dragging = true; startY = e.clientY; startH = parseInt(window.getComputedStyle(pane).height, 10) || 240;
        document.body.style.userSelect = 'none';
      });
      window.addEventListener('mousemove', (e) => {
        if (!dragging) return; const dy = startY - e.clientY; const newH = Math.max(120, startH + dy);
        pane.style.height = newH + 'px';
      });
      window.addEventListener('mouseup', () => { if (dragging) { dragging = false; document.body.style.userSelect = ''; } });
    }

    // ICT tray buttons
    const mentorBtn = document.getElementById('ictMentorBtn');
    if (mentorBtn && !mentorBtn._wired) { mentorBtn._wired = true; mentorBtn.onclick = () => { openAiMentorPane(); renderAiMentorFromSignals(); }; }
    const candleBtn = document.getElementById('ictCandleBtn');
    if (candleBtn && !candleBtn._wired) { candleBtn._wired = true; candleBtn.onclick = () => { openAiMentorPane(); renderAiMentorCandle(); }; }
  }

  function computeConfluenceFromSignals(signals) {
    const filters = getActiveConfluenceFilters();
    const vr = (window._chartRef && window._chartRef.timeScale && window._chartRef.timeScale().getVisibleRange) ? window._chartRef.timeScale().getVisibleRange() : null;
    const from = vr ? vr.from : null; const to = vr ? vr.to : null;
    function isoToSec(s){ try { return Math.floor(new Date(s).getTime()/1000); } catch(_) { return null; } }
    const use = (signals||[]).filter(sig => {
      if (!filters[sig.type]) return false;
      if (from!=null && to!=null) {
        if (sig.start_time && sig.end_time) { const st=isoToSec(sig.start_time), et=isoToSec(sig.end_time); if (st!=null && et!=null) return st<=to && et>=from; }
        if (sig.time) { const t=isoToSec(sig.time); if (t!=null) return t>=from && t<=to; }
      }
      return true;
    });
    const weights = { order_block:0.9, fvg:0.8, liquidity:0.7, breaker:0.8, choch:0.95, ote:0.7, mitigation:0.75, killzone:0.6, range:0.5 };
    let totalW = 0, total = 0, bull = 0, bear = 0;
    use.forEach(sig => {
      const w = weights[sig.type] || 0.5; totalW += w; const conf = Math.min(1, Math.max(0.4, sig.confidence || 0.6)); total += w*conf;
      if (sig.type === 'liquidity') { if (sig.label === 'swing-low') bull += 1; if (sig.label === 'swing-high') bear += 1; }
      if (sig.type === 'order_block') { if (sig.side === 'bullish') bull += 1; if (sig.side === 'bearish') bear += 1; }
      if (sig.type === 'choch') { bull += 0.5; bear += 0.5; }
      if (sig.type === 'mitigation') { bear += 0.4; }
    });
    const score = totalW ? Math.min(1, total/totalW) : 0;
    const biasScore = bull - bear;
    const bias = biasScore > 0.5 ? 'bullish' : biasScore < -0.5 ? 'bearish' : 'neutral';
    const strength = score>=0.8?'very_strong':score>=0.6?'strong':score>=0.4?'moderate':'weak';
    return { score, bias, strength, signal_count: use.length };
  }

  function generateMentorMessage(conf, symbol) {
    const { score=0, bias='neutral', strength='weak', signal_count=0 } = conf || {};
    const pct = Math.round(score*100);
    let narration = '', idea = '';
    if (score>=0.7 && bias!=='neutral') {
      if (bias==='bullish') {
        narration = `🟢 Strong BULLISH confluence on ${symbol}. ${signal_count} signals align. ${strength==='very_strong'?'High-probability setup.':'Good R/R potential.'}`;
        idea = '💡 Long pullbacks to OB/FVG. Target highs/liquidity. Use OB lows for risk.';
      } else {
        narration = `🔴 Strong BEARISH confluence on ${symbol}. ${signal_count} signals align. ${strength==='very_strong'?'High-probability setup.':'Good R/R potential.'}`;
        idea = '💡 Short rallies into OB/FVG. Target lows/liquidity. Use OB highs for risk.';
      }
    } else if (score>=0.4) {
      narration = `🟡 Moderate confluence on ${symbol}. ${signal_count} signals with mixed bias. Wait for confirmation.`;
      idea = '⚠️ Consider breakout-confirmation or add confluence (time, liquidity).';
    } else {
      narration = `🔵 Low confluence on ${symbol}. Limited signals, likely ranging/consolidating.`;
      idea = '📊 Observe. Mark key highs/lows. Wait for sweep/CHOCH + OB/FVG reaction.';
    }
    return { pct, bias, strength, narration, idea };
  }

  function renderAiMentorFromSignals() {
    const body = getAiBody(); if (!body) return;
    const symbol = getCurrentSymbol();
    const conf = computeConfluenceFromSignals(lastDetectorSignals||[]);
    const m = generateMentorMessage(conf, symbol);
    body.innerHTML = `
      <div style="padding:10px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <div style="font-weight:700;">Confluence</div>
          <div style="padding:2px 6px;border:1px solid var(--border-color);border-radius:4px;">${m.pct}%</div>
          <div style="padding:2px 6px;border:1px solid var(--border-color);border-radius:4px;text-transform:capitalize;">${m.bias}</div>
          <div style="padding:2px 6px;border:1px solid var(--border-color);border-radius:4px;text-transform:capitalize;">${m.strength.replace('_',' ')}</div>
        </div>
        <div style="margin:8px 0;">${m.narration}</div>
        <div style="margin:8px 0;">${m.idea}</div>
        <div style="margin-top:10px;font-size:12px;color:var(--text-secondary);">Tips: refine with killzones, higher-timeframe bias and session liquidity.</div>
      </div>`;
  }

  function analyzeLastCandle() {
    const arr = lastCandles||[]; if (!arr.length) return null; const c = arr[arr.length-1];
    const body = Math.abs(c.close - c.open); const range = (c.high - c.low) || 1e-9;
    const upper = c.high - Math.max(c.close, c.open); const lower = Math.min(c.close, c.open) - c.low;
    const bull = c.close >= c.open;
    const bodyPct = Math.round((body/range)*100);
    const upperPct = Math.round((upper/range)*100); const lowerPct = Math.round((lower/range)*100);
    let summary = `${bull?'🟢 Bullish':'🔴 Bearish'} candle. Body ${bodyPct}% of range. Upper wick ${upperPct}%, Lower wick ${lowerPct}%.`;
    if (bodyPct < 25 && (upperPct>50 || lowerPct>50)) summary += ' Possible rejection wick at extremes.';
    if (bodyPct > 60) summary += ' Strong impulse body.';
    return { c, summary };
  }

  function renderAiMentorCandle() {
    const body = getAiBody(); if (!body) return;
    const res = analyzeLastCandle();
    if (!res) { body.innerHTML = '<div style="padding:10px;">No candle data available.</div>'; return; }
    const { c, summary } = res;
    body.innerHTML = `
      <div style="padding:10px;">
        <div style="font-weight:700;margin-bottom:6px;">Current Candle</div>
        <div style="margin-bottom:8px;">${summary}</div>
        <div style="font-size:12px;color:var(--text-secondary);">O:${c.open} H:${c.high} L:${c.low} C:${c.close}</div>
      </div>`;
  }

  function renderAiMentorQuick() { renderAiMentorFromSignals(); }

  // Auto refresh wiring
  function getCurrentSymbol() { return document.getElementById('symbolInput')?.value || 'EURUSD'; }
  function getCurrentInterval() { return document.getElementById('intervalSelect')?.value || '5m'; }
  function debounce(fn, wait) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  }
  const refreshDetectorsAndDraw = async () => {
    const spinner = document.getElementById('detectorsSpinner');
    const isManual = refreshDetectorsAndDraw._manual === true;
    if (!autoSignalsEnabled && !isManual) return;
    try {
      if (spinner) spinner.style.display = 'inline-block';
      const symbol = getCurrentSymbol();
      const interval = getCurrentInterval();
      clearIctOverlays();
      const data = await fetchDetectors(symbol, interval);
      drawDetectors(data.signals || []);
    } catch (e) {
      console.warn('auto refresh detectors failed', e);
      showIctNotification('Detectors fetch failed');
    }
    finally { if (spinner) spinner.style.display = 'none'; refreshDetectorsAndDraw._manual = false; }
  };
  const debouncedRefresh = debounce(refreshDetectorsAndDraw, 400);

  // Wire ICT tray drawing actions
  function wireIctTray() {
    const drawAll = document.getElementById('ictDrawAllBtn');
    if (drawAll && !drawAll._wired) {
      drawAll._wired = true;
      drawAll.onclick = async () => {
        const symbol = document.getElementById('symbolInput')?.value || 'EURUSD';
        const interval = document.getElementById('intervalSelect')?.value || '5m';
        try {
          const data = await fetchDetectors(symbol, interval);
          drawDetectors(data.signals || []);
          showIctNotification(`Drew ${data.signals?.length || 0} ICT signals`);
        } catch (e) {
          showIctNotification('Failed to load detectors');
          console.warn(e);
        }
      };
    }

    // Individual tool buttons delegate to drawAll for now (fetch+filter)
    const tools = document.querySelectorAll('#ictDrawingTools .ict-tool-btn');
    tools.forEach(btn => {
      if (btn._wired) return; btn._wired = true;
      btn.onclick = async () => {
        const tool = btn.getAttribute('data-tool');
        const symbol = document.getElementById('symbolInput')?.value || 'EURUSD';
        const interval = document.getElementById('intervalSelect')?.value || '5m';
        try {
          const data = await fetchDetectors(symbol, interval);
          const map = {
            bullish_ob: 'order_block', bearish_ob: 'order_block',
            breaker: 'order_block', mitigation: 'mitigation',
          };
          const type = map[tool] || tool.replace('choch', 'choch').replace('fvg', 'fvg');
          const filtered = (data.signals || []).filter(s => s.type === type);
          drawDetectors(filtered);
          showIctNotification(`Drew ${filtered.length} ${type.toUpperCase()} signals`);
        } catch (e) {
          showIctNotification('Failed to load detectors');
        }
      };
    });

    const clearBtn = document.getElementById('clearSignalsBtn');
    if (clearBtn) clearBtn.onclick = clearIctOverlays;

    // Date/today filter auto-redraw
    const dayInput = document.getElementById('ictDayInput');
    const todayToggle = document.getElementById('ictTodayOnly');
    const triggerRedraw = async () => {
      try {
        const data = await fetchDetectors(getCurrentSymbol(), getCurrentInterval());
        drawDetectors(data.signals || []);
      } catch(_) {}
    };
    if (dayInput && !dayInput._wired) { dayInput._wired = true; dayInput.onchange = triggerRedraw; }
    if (todayToggle && !todayToggle._wired) { todayToggle._wired = true; todayToggle.onchange = triggerRedraw; }
  }

  // --- Wire all dashboard module tiles ---
  function wireDashboardTiles() {
    console.log('🎯 Wiring dashboard tiles...');
    const tileButtons = document.querySelectorAll('.tile[data-module]');
    console.log(`Found ${tileButtons.length} tiles`);
    
    tileButtons.forEach(btn => {
      const mod = btn.getAttribute('data-module');
      btn.onclick = async () => {
        // Mark that this is a user-triggered chart load
        window._chartUserTriggered = true;
        console.log(`Tile clicked: ${mod}`);
        showIctNotification(`Loading ${mod.toUpperCase()} module...`);
  if (mod === 'ict') {
          // User explicitly opened ICT module — allow chart loaders to proceed
          window._chartUserTriggered = true;
          safeShowSection(document.getElementById('chartView'));
          ensureChartContainerFit();
          try {
            // Prefer the direct ICT loader which integrates with backend signals
            if (typeof createDirectChart === 'function') {
              console.log('✅ Calling createDirectChart for ICT module');
              createDirectChart();
            } else {
              // Fallback to LightweightCharts loader if available
              await (window.lightweightChartsReady || Promise.resolve());
              if (typeof createLWChart === 'function') {
                createLWChart();
              } else {
                createBasicChart();
              }
            }
          } catch (e) {
            console.warn('ICT chart load fallback triggered:', e);
            try { createBasicChart(); } catch (_) {}
          }
          // after chart ready, wire tray
          wireIctTray();
  } else if (mod === 'gann') {
          safeShowSection(document.getElementById('gannChartView'));
          // Wire GANN-specific controls after switching to GANN view
          setTimeout(() => {
            wireGannTray();
            wireGannAiMentorPane();
          }, 100);
  } else {
          // Map data-module values to section IDs
          const map = {
            astro: 'astroView',
            news: 'newsView',
            research: 'researchView',
            'strategy-builder': 'strategyBuilderView',
            math: 'mathModelsView'
          };
          const targetId = btn.getAttribute('data-target') || map[mod];
          if (targetId) {
            const target = document.getElementById(targetId);
            if (target) {
                safeShowSection(target);
                // If it's the Astro module, ensure the floating planetary table is shown
                if (mod === 'astro') {
                  setTimeout(() => {
                    try {
                      if (window.astroCyclesModule && typeof window.astroCyclesModule.showFloatingTable === 'function') {
                        window.astroCyclesModule.showFloatingTable();
                      }
                    } catch (e) {
                      console.warn('Failed to auto-open Astro floating table:', e);
                    }
                  }, 120);
                }
              } else {
              showIctNotification(`${mod.toUpperCase()} module view not found`);
            }
          } else {
            showIctNotification(`${mod.toUpperCase()} module not implemented yet`);
          }
        }
        // Reset the user-triggered flag after a short delay
        setTimeout(() => { window._chartUserTriggered = false; }, 500);
      };
      console.log(`✅ Wired tile: ${mod}`);
    });
  }

  // Global safety net: ensure dashboard tiles and Home always navigate
  document.addEventListener('click', (e) => {
    // Home button anywhere
    const homeBtn = e.target.closest && e.target.closest('#homeBtn');
    if (homeBtn) {
      e.preventDefault();
      console.log('🏠 Global home clicked');
      const home = document.getElementById('dashboardHome');
      if (home) safeShowSection(home);
      return;
    }

    // Any dashboard tile
    const tile = e.target.closest && e.target.closest('.tile[data-module]');
    if (tile) {
      e.preventDefault();
      const mod = tile.getAttribute('data-module');
      console.log(`🎯 Global tile clicked: ${mod}`);
      showIctNotification(`Loading ${mod.toUpperCase()} module...`);

      if (mod === 'ict') {
        // Only ICT triggers chart auto-load
        const chartView = document.getElementById('chartView');
        if (chartView) {
          // Update inline status/UI
          try { const st = document.getElementById('ictInlineStatus'); if (st) st.textContent = 'Opening...'; tile.classList.add('active'); } catch(_){}
          safeShowSection(chartView);
          console.log('🎯 ICT module activated - loading DIRECT chart...');
          ensureChartContainerFit();
          setTimeout(() => {
            if (typeof createDirectChart === 'function') {
              console.log('✅ Calling createDirectChart for ICT module');
              createDirectChart();
            } else if (typeof loadEnhancedChart === 'function') {
              loadEnhancedChart();
            } else {
              console.log('❌ No chart functions available');
            }
          }, 500);
        }
      } else if (mod === 'gann') {
        // Only GANN triggers chart auto-load
        const gannChartView = document.getElementById('gannChartView');
        if (gannChartView) {
          safeShowSection(gannChartView);
          ensureChartContainerFit();
          (window.lightweightChartsReady || Promise.resolve()).then(() => {
            if (typeof createLWChart === 'function') createLWChart(); else createBasicChart();
          }).catch(() => createBasicChart());
        }
      } else {
        // All other modules: just show the view, do not auto-load chart
        const map = {
          astro: 'astroView',
          news: 'newsView',
          research: 'researchView',
          'strategy-builder': 'strategyBuilderView',
          math: 'mathModelsView'
        };
        const targetId = tile.getAttribute('data-target') || map[mod];
        if (targetId) {
          const target = document.getElementById(targetId);
          if (target) {
            safeShowSection(target);
          } else {
            showIctNotification(`${mod.toUpperCase()} module view not found`);
          }
        } else {
          showIctNotification(`${mod.toUpperCase()} module not implemented yet`);
        }
      }
    }
  }, true);

    // Initial setup
    // Initial setup
    wireDashboardTiles();
    wireAllButtons();

    // Ensure dashboard is visible on startup (run after DOM ready to be safe)
    document.addEventListener('DOMContentLoaded', () => {
      try {
        const dashboard = document.getElementById('dashboardHome');
        const views = [
          document.getElementById('chartView'),
          document.getElementById('gannChartView'),
          document.getElementById('astroView'),
          document.getElementById('newsView'),
          document.getElementById('researchView'),
        ];

        if (dashboard) {
          // Show dashboard and hide others
          dashboard.classList.remove('hidden');
          views.forEach(v => { if (v) v.classList.add('hidden'); });
          console.log('🏠 Dashboard forced visible on DOMContentLoaded');
        } else {
          console.warn('⚠️ dashboardHome element not found on startup');
        }

        // mark homepage check for diagnostics
        window.__homepage_checked = true;
      } catch (e) {
        console.error('Error while enforcing dashboard visibility:', e);
      }
    });
  
  // --- GANN Signal Tray & Auto Identification ---
  let gannSignalsEnabled = false;
  let lastGannSignals = [];
  let gannOverlays = [];

  function wireGannTray() {
    // GANN tray show/hide via click and controls (not hover to prevent accidental opening)
    const gannTray = document.getElementById('gannTray');
    const gannTrayTrigger = gannTray ? gannTray.querySelector('.gann-trigger') : null;
    const gannHandle = document.getElementById('gannHandle'); // Global GANN handle
    
    if (gannTray && gannTrayTrigger) {
      // Ensure tray starts hidden
      gannTray.style.left = '-302px';
      
      if (!gannTray._wired) {
        gannTray._wired = true;
        const showGannTray = () => { gannTray.style.left = '0px'; };
        const hideGannTray = () => { gannTray.style.left = '-302px'; };
        
        // Use click instead of mouseenter to prevent accidental opening
        gannTrayTrigger.onclick = showGannTray;
        
        // Wire the global GANN handle as well
        if (gannHandle && !gannHandle._wired) {
          gannHandle._wired = true;
          gannHandle.onclick = showGannTray;
        }
        
        // Only hide on mouseleave if tray is open
        gannTray.onmouseleave = (e) => {
          // Check if we're not moving to a child element
          if (!gannTray.contains(e.relatedTarget)) {
            hideGannTray();
          }
        };
        
        const btnHide = document.getElementById('gannTrayHide');
        const btnCollapse = document.getElementById('gannTrayCollapse');
        if (btnHide) btnHide.onclick = hideGannTray;
        if (btnCollapse) btnCollapse.onclick = () => gannTray.style.left = '-250px';
      }
    }
    
    // Hide the global GANN handle when not in GANN view
    const currentView = document.getElementById('gannChartView');
    if (gannHandle) {
      if (currentView && !currentView.classList.contains('hidden')) {
        gannHandle.style.display = 'flex'; // Show handle in GANN view
      } else {
        gannHandle.style.display = 'none'; // Hide handle in other views
      }
    }

    // GANN auto signals toggle
    const gannAutoToggle = document.getElementById('gannAutoSignalsToggle');
    if (gannAutoToggle && !gannAutoToggle._wired) {
      gannAutoToggle._wired = true;
      gannAutoToggle.onchange = () => {
        gannSignalsEnabled = !!gannAutoToggle.checked;
        showIctNotification(gannSignalsEnabled ? 'GANN Auto signals ON' : 'GANN Auto signals OFF');
        if (gannSignalsEnabled) debouncedGannRefresh();
      };
    }

    // GANN symbol/interval change should trigger debounced refresh when auto is on
    const gannSymbolInput = document.getElementById('gannSymbolInput');
    const gannIntervalSelect = document.getElementById('gannIntervalSelect');
    if (gannSymbolInput && !gannSymbolInput._wired) { 
      gannSymbolInput._wired = true; 
      gannSymbolInput.onchange = debouncedGannRefresh; 
    }
    if (gannIntervalSelect && !gannIntervalSelect._wired) { 
      gannIntervalSelect._wired = true; 
      gannIntervalSelect.onchange = debouncedGannRefresh; 
    }

    // Wire GANN tool buttons
    wireGannToolButtons();
  }

  function wireGannToolButtons() {
    // Main unified analysis buttons
    const unifiedScanBtn = document.querySelector('[data-tool="unified-scan"]');
    const unifiedConfluenceBtn = document.querySelector('[data-tool="unified-confluence"]');
    const unifiedSignalsBtn = document.querySelector('[data-tool="unified-signals"]');
    const unifiedClearBtn = document.querySelector('[data-tool="unified-clear"]');

    if (unifiedScanBtn && !unifiedScanBtn._wired) {
      unifiedScanBtn._wired = true;
      unifiedScanBtn.onclick = async () => {
        await executeGannAnalysis('all');
        showIctNotification('GANN: Full analysis complete');
      };
    }

    if (unifiedConfluenceBtn && !unifiedConfluenceBtn._wired) {
      unifiedConfluenceBtn._wired = true;
      unifiedConfluenceBtn.onclick = async () => {
        await executeGannAnalysis('confluence');
        showIctNotification('GANN: Confluence analysis complete');
      };
    }

    if (unifiedSignalsBtn && !unifiedSignalsBtn._wired) {
      unifiedSignalsBtn._wired = true;
      unifiedSignalsBtn.onclick = async () => {
        await executeGannAnalysis('signals');
        showIctNotification('GANN: Live signals updated');
      };
    }

    if (unifiedClearBtn && !unifiedClearBtn._wired) {
      unifiedClearBtn._wired = true;
      unifiedClearBtn.onclick = () => {
        clearGannOverlays();
        showIctNotification('GANN: All overlays cleared');
      };
    }

    // Wire individual GANN tool buttons
    const gannToolBtns = document.querySelectorAll('.gann-tool-btn');
    gannToolBtns.forEach(btn => {
      if (btn._wired) return;
      btn._wired = true;
      btn.onclick = async () => {
        const tool = btn.getAttribute('data-tool');
        if (tool && !tool.startsWith('unified-')) {
          await executeGannTool(tool);
          showIctNotification(`GANN: ${tool.replace('-', ' ').toUpperCase()} analysis complete`);
        }
      };
    });
  }

  async function executeGannAnalysis(type = 'all') {
    const symbol = getGannSymbol();
    const interval = getGannInterval();
    
    try {
      // Show spinner if available
      const spinner = document.getElementById('gannSpinner');
      if (spinner) spinner.style.display = 'inline-block';

      // Clear existing overlays
      clearGannOverlays();

      // Fetch GANN signals from backend
      const data = await fetchGannSignals(symbol, interval, type);
      
      // Draw GANN signals on chart
      drawGannSignals(data.signals || []);
      
      // Update analysis results
      updateGannAnalysisResults(data);
      
      // Update AI mentor if open
      if (isGannAiMentorOpen()) {
        renderGannAiMentorAnalysis();
      }

    } catch (e) {
      console.warn('GANN analysis failed', e);
      showIctNotification('GANN analysis failed');
    } finally {
      const spinner = document.getElementById('gannSpinner');
      if (spinner) spinner.style.display = 'none';
    }
  }

  async function executeGannTool(tool) {
    const symbol = getGannSymbol();
    const interval = getGannInterval();
    
    try {
      const data = await fetchGannTool(symbol, interval, tool);
      drawGannToolResults(tool, data);
      updateGannAnalysisResults(data, tool);
    } catch (e) {
      console.warn(`GANN tool ${tool} failed`, e);
      showIctNotification(`GANN ${tool} failed`);
    }
  }

  async function fetchGannSignals(symbol, interval, type = 'all') {
    const base = (typeof getApiBase === 'function' ? getApiBase() : (window.API_BASE || 'http://localhost:8000'));
    const url = `${base.replace(/\/$/, '')}/api/gann?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&type=${encodeURIComponent(type)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GANN signals ${res.status}`);
    return await res.json();
  }

  async function fetchGannTool(symbol, interval, tool) {
    const base = (typeof getApiBase === 'function' ? getApiBase() : (window.API_BASE || 'http://localhost:8000'));
    const url = `${base.replace(/\/$/, '')}/api/gann/tool?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&tool=${encodeURIComponent(tool)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GANN tool ${res.status}`);
    return await res.json();
  }

  function drawGannSignals(signals) {
    if (!window._chartRef || !candleSeries) return;
    
    lastGannSignals = Array.isArray(signals) ? signals : [];
    const counts = { 
      square_of_9: 0, 
      square_of_144: 0, 
      gann_angles: 0, 
      time_cycles: 0, 
      price_projections: 0,
      natural_resistance: 0,
      cardinal_squares: 0
    };

    signals.forEach(signal => {
      try {
        if (signal.type === 'gann_angle' && signal.price && signal.angle) {
          // Draw GANN angle lines
          const line = candleSeries.createPriceLine({
            price: signal.price,
            color: getGannAngleColor(signal.angle),
            lineWidth: 2,
            lineStyle: signal.angle === '1x1' ? 0 : 1, // solid for 1x1, dashed for others
            title: `GANN ${signal.angle} (${signal.price})`,
          });
          gannOverlays.push(line);
          counts.gann_angles++;
        } else if (signal.type === 'square_of_9' && signal.levels) {
          // Draw Square of 9 levels
          signal.levels.forEach(level => {
            const line = candleSeries.createPriceLine({
              price: level.price,
              color: '#FFD700',
              lineWidth: 1,
              lineStyle: 2,
              title: `Square of 9: ${level.price} (${level.position})`,
            });
            gannOverlays.push(line);
          });
          counts.square_of_9++;
        } else if (signal.type === 'time_cycle' && signal.time) {
          // Draw time cycle vertical lines (placeholder - would need time scale integration)
          counts.time_cycles++;
        } else if (signal.type === 'natural_resistance' && signal.high && signal.low) {
          // Draw natural resistance zones
          const topLine = candleSeries.createPriceLine({
            price: signal.high,
            color: '#FF6B35',
            lineWidth: 1,
            lineStyle: 1,
            title: `Natural Resistance Top: ${signal.high}`,
          });
          const botLine = candleSeries.createPriceLine({
            price: signal.low,
            color: '#FF6B35',
            lineWidth: 1,
            lineStyle: 1,
            title: `Natural Resistance Bottom: ${signal.low}`,
          });
          gannOverlays.push(topLine, botLine);
          
          // Add shaded zone
          const st = signal.start_time ? Math.floor(new Date(signal.start_time).getTime()/1000) : null;
          const et = signal.end_time ? Math.floor(new Date(signal.end_time).getTime()/1000) : null;
          if (st && et) {
            addZoneRect({ 
              topPrice: signal.high, 
              bottomPrice: signal.low, 
              startTs: st, 
              endTs: et, 
              color: 'rgba(255,107,53,0.1)', 
              border: 'rgba(255,107,53,0.4)', 
              title: 'Natural Resistance Zone' 
            });
          }
          counts.natural_resistance++;
        }
      } catch (e) {
        console.warn('Error drawing GANN signal:', e);
      }
    });

    updateAllOverlayRects();
    updateGannCounts(signals?.length || 0, counts);
    
    return counts;
  }

  function drawGannToolResults(tool, data) {
    if (!data || !data.results) return;
    
    // Tool-specific drawing logic
    switch (tool) {
      case 'square9-price':
        drawSquareOf9Prices(data.results);
        break;
      case 'angle-1x1':
      case 'angle-2x1':
      case 'angle-1x2':
        drawGannAngle(data.results);
        break;
      case 'cycle-seasonal':
      case 'cycle-fibonacci':
        drawTimeCycles(data.results);
        break;
      default:
        console.log(`GANN tool ${tool} results:`, data.results);
    }
  }

  function drawSquareOf9Prices(results) {
    if (!results.levels) return;
    results.levels.forEach(level => {
      const line = candleSeries.createPriceLine({
        price: level.price,
        color: '#FFD700',
        lineWidth: 1,
        lineStyle: 2,
        title: `Square of 9: ${level.price}`,
      });
      gannOverlays.push(line);
    });
  }

  function drawGannAngle(results) {
    if (!results.angle_lines) return;
    results.angle_lines.forEach(angle => {
      const line = candleSeries.createPriceLine({
        price: angle.price,
        color: getGannAngleColor(angle.type),
        lineWidth: 2,
        lineStyle: angle.type === '1x1' ? 0 : 1,
        title: `GANN ${angle.type}: ${angle.price}`,
      });
      gannOverlays.push(line);
    });
  }

  function drawTimeCycles(results) {
    // Time cycle implementation would require chart time scale integration
    console.log('Time cycles detected:', results);
  }

  function getGannAngleColor(angle) {
    const colors = {
      '1x1': '#FFD700',    // Gold for main 45° line
      '2x1': '#00D4FF',    // Cyan
      '1x2': '#FF6B35',    // Orange
      '4x1': '#10B981',    // Green
      '1x4': '#8B5CF6',    // Purple
      '8x1': '#F59E0B',    // Amber
      '1x8': '#EF4444'     // Red
    };
    return colors[angle] || '#6B7280';
  }

  function clearGannOverlays() {
    if (!window._chartRef) return;
    gannOverlays.forEach(overlay => {
      try {
        if (overlay && overlay.remove) overlay.remove();
      } catch (e) {
        console.warn('Error removing GANN overlay:', e);
      }
    });
    gannOverlays = [];
    
    // Clear GANN zones from overlay rects
    overlayRects = overlayRects.filter(rect => {
      if (rect.title && rect.title.includes('Natural Resistance')) {
        rect.remove();
        return false;
      }
      return true;
    });
    
    showIctNotification('Cleared GANN overlays');
  }

  function updateGannCounts(total = null, counts = null) {
    const el = document.getElementById('gannCounts');
    if (!el) return;
    
    const parts = [`GANN Overlays: ${gannOverlays.length}`];
    if (counts) {
      const compact = [];
      Object.entries(counts).forEach(([key, value]) => {
        if (value) compact.push(`${key.replace('_', ' ').toUpperCase()}: ${value}`);
      });
      if (compact.length) parts.push(compact.join(' • '));
    }
    if (total !== null) parts.push(`Last analysis: ${total}`);
    el.textContent = parts.join(' • ');
  }

  function updateGannAnalysisResults(data, tool = null) {
    const resultsEl = document.getElementById('gannResultsList');
    if (!resultsEl) return;
    
    let html = '';
    if (tool) {
      html = `<div style="margin-bottom:6px;"><strong>${tool.replace('-', ' ').toUpperCase()}</strong></div>`;
    }
    
    if (data.confluence) {
      html += `<div style="margin-bottom:4px;">Confluence: ${Math.round(data.confluence * 100)}%</div>`;
    }
    
    if (data.key_levels) {
      html += `<div style="margin-bottom:4px;">Key Levels: ${data.key_levels.length}</div>`;
    }
    
    if (data.time_windows) {
      html += `<div style="margin-bottom:4px;">Time Windows: ${data.time_windows.length}</div>`;
    }
    
    if (data.price_targets) {
      html += `<div style="margin-bottom:4px;">Price Targets: ${data.price_targets.length}</div>`;
    }
    
    if (!html) {
      html = 'Analysis complete. Check chart for overlays.';
    }
    
    resultsEl.innerHTML = html;
  }

  // Auto refresh for GANN signals
  const refreshGannSignals = async () => {
    if (!gannSignalsEnabled && !refreshGannSignals._manual) return;
    
    try {
      const symbol = getGannSymbol();
      const interval = getGannInterval();
      clearGannOverlays();
      await executeGannAnalysis('signals');
    } catch (e) {
      console.warn('GANN auto refresh failed', e);
      showIctNotification('GANN signals refresh failed');
    } finally {
      refreshGannSignals._manual = false;
    }
  };

  const debouncedGannRefresh = debounce(refreshGannSignals, 400);

  // Enhanced GANN AI Mentor analysis
  function renderGannAiMentorAnalysis() {
    const body = getGannAiBody(); 
    if (!body) return;
    
    const symbol = getGannSymbol();
    const gannConf = computeGannConfluence(lastGannSignals || []);
    const gannMessage = generateGannMentorMessage(gannConf, symbol);
    
    body.innerHTML = `
      <div style="padding:10px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <div style="font-weight:700;">GANN Analysis</div>
          <div style="padding:2px 6px;border:1px solid var(--border-color);border-radius:4px;">${gannMessage.pct}%</div>
          <div style="padding:2px 6px;border:1px solid var(--border-color);border-radius:4px;text-transform:capitalize;">${gannMessage.bias}</div>
          <div style="padding:2px 6px;border:1px solid var(--border-color);border-radius:4px;text-transform:capitalize;">${gannMessage.strength}</div>
        </div>
        <div style="margin:8px 0;">${gannMessage.narration}</div>
        <div style="margin:8px 0;">${gannMessage.idea}</div>
        <div style="margin-top:10px;font-size:12px;color:var(--text-secondary);">Focus: Square of 9 levels, natural angles, and time cycle confluences.</div>
      </div>`;
  }

  function computeGannConfluence(signals) {
    const weights = { 
      gann_angle: 0.9, 
      square_of_9: 0.95, 
      square_of_144: 0.8, 
      time_cycle: 0.85, 
      natural_resistance: 0.75,
      cardinal_square: 0.7
    };
    
    let totalW = 0, total = 0, bullish = 0, bearish = 0;
    
    (signals || []).forEach(signal => {
      const w = weights[signal.type] || 0.5;
      totalW += w;
      const conf = Math.min(1, Math.max(0.4, signal.confidence || 0.7));
      total += w * conf;
      
      if (signal.bias === 'bullish' || signal.direction === 'up') bullish += 1;
      if (signal.bias === 'bearish' || signal.direction === 'down') bearish += 1;
    });
    
    const score = totalW ? Math.min(1, total / totalW) : 0;
    const biasScore = bullish - bearish;
    const bias = biasScore > 0.5 ? 'bullish' : biasScore < -0.5 ? 'bearish' : 'neutral';
    const strength = score >= 0.8 ? 'very_strong' : score >= 0.6 ? 'strong' : score >= 0.4 ? 'moderate' : 'weak';
    
    return { score, bias, strength, signal_count: signals.length };
  }

  function generateGannMentorMessage(conf, symbol) {
    const { score = 0, bias = 'neutral', strength = 'weak', signal_count = 0 } = conf || {};
    const pct = Math.round(score * 100);
    
    let narration = '', idea = '';
    
    if (score >= 0.7 && bias !== 'neutral') {
      if (bias === 'bullish') {
        narration = `🟢 Strong GANN bullish confluence on ${symbol}. ${signal_count} signals align with natural angles and time cycles.`;
        idea = '💡 Watch for Square of 9 support levels and 1x1 angle bounces. Target cardinal resistance levels.';
      } else {
        narration = `🔴 Strong GANN bearish confluence on ${symbol}. ${signal_count} signals show downward pressure via natural resistance.`;
        idea = '💡 Monitor Square of 9 resistance and angle breakdowns. Target harmonic projections downward.';
      }
    } else if (score >= 0.4) {
      narration = `🟡 Moderate GANN confluence on ${symbol}. ${signal_count} mixed signals suggest consolidation around key levels.`;
      idea = '⚠️ Wait for time cycle confirmation and Square of 9 level tests before entry.';
    } else {
      narration = `🔵 Low GANN confluence on ${symbol}. Limited geometric signals detected.`;
      idea = '📊 Monitor for Square of 9 price arrival and seasonal time window openings.';
    }
    
    return { pct, bias, strength, narration, idea };
  }

  console.log('🎉 Navigation system ready!');
  
  // Auto-load chart on page ready
  setTimeout(async () => {
    console.log('🚀 Auto-initializing chart on page load...');
    const chartView = document.getElementById('chartView');
    if (chartView) {
      safeShowSection(chartView);
      ensureChartContainerFit();
      
      // Initialize chart if LightweightCharts is available
      await (window.lightweightChartsReady || Promise.resolve());
      if (typeof createLWChart === 'function') {
        createLWChart();
      } else {
        console.log('📈 Creating basic chart placeholder');
        createBasicChart();
      }
    }
  }, 1000); // 1 second delay to ensure all resources are loaded
// (Removed extra closing brace from duplicate event handler.)
