// CHART ENHANCEMENTS - ADDITIONAL FEATURES
console.log('🚀 Loading chart enhancements...');

// Mobile responsiveness and additional UI functions
function toggleAlertPanel() {
    const panel = document.getElementById('alertPanel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

function toggleMultiSymbolPanel() {
    const panel = document.getElementById('multiSymbolPanel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

function toggleDrawingPanel() {
    const panel = document.getElementById('drawingPanel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

function setAlert() {
    const priceInput = document.getElementById('alertPrice');
    const directionSelect = document.getElementById('alertDirection');
    
    if (priceInput && directionSelect) {
        const price = parseFloat(priceInput.value);
        const direction = directionSelect.value;
        
        if (price && !isNaN(price)) {
            if (typeof window.addPriceAlert === 'function') {
                window.addPriceAlert(price, direction);
                priceInput.value = '';
                
                // Show confirmation
                const confirmation = document.createElement('div');
                confirmation.style.position = 'fixed';
                confirmation.style.top = '20px';
                confirmation.style.left = '50%';
                confirmation.style.transform = 'translateX(-50%)';
                confirmation.style.background = '#4CAF50';
                confirmation.style.color = 'white';
                confirmation.style.padding = '8px 16px';
                confirmation.style.borderRadius = '6px';
                confirmation.style.zIndex = '9999';
                confirmation.textContent = `✅ Alert set: ${direction} ${price}`;
                document.body.appendChild(confirmation);
                
                setTimeout(() => confirmation.remove(), 3000);
            }
        }
    }
}

// Multi-symbol chart support
let additionalCharts = {};

function addSymbolChart(symbol) {
    const chartContainer = document.getElementById('lwchart');
    if (!chartContainer) return;
    
    // Create side-by-side layout
    if (Object.keys(additionalCharts).length === 0) {
        chartContainer.style.display = 'flex';
        chartContainer.style.gap = '10px';
        
        // Resize main chart
        const mainChart = chartContainer.querySelector('div');
        if (mainChart) {
            mainChart.style.flex = '1';
            mainChart.style.minWidth = '50%';
        }
    }
    
    // Create new chart container
    const newContainer = document.createElement('div');
    newContainer.id = `chart-${symbol}`;
    newContainer.style.flex = '1';
    newContainer.style.minWidth = '300px';
    newContainer.style.height = '100%';
    newContainer.style.border = '1px solid #ddd';
    newContainer.style.borderRadius = '6px';
    chartContainer.appendChild(newContainer);
    
    // Create chart for new symbol
    if (typeof LightweightCharts !== 'undefined') {
        const chart = LightweightCharts.createChart(newContainer, {
            width: newContainer.clientWidth || 300,
            height: 400,
            layout: {
                background: { color: '#FFFFFF' },
                textColor: '#333333',
            },
            grid: {
                vertLines: { color: '#E0E0E0' },
                horzLines: { color: '#E0E0E0' },
            },
        });
        
        const series = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });
        
        // Load data for new symbol from backend
        try {
            const apiBase = (typeof getApiBase === 'function' ? getApiBase() : (window.API_BASE || 'http://localhost:8081'));
            fetch(`${apiBase.replace(/\/$/, '')}/ict/candles?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(getCurrentInterval ? getCurrentInterval() : '5m')}&limit=500`)
                .then(response => response.json())
                .then(data => {
                    const candleData = data.map(candle => ({
                        time: candle[0] / 1000,
                        open: parseFloat(candle[1]),
                        high: parseFloat(candle[2]),
                        low: parseFloat(candle[3]),
                        close: parseFloat(candle[4])
                    }));

                    series.setData(candleData);
                    chart.timeScale().fitContent();
                })
                .catch(error => console.error(`❌ Failed to load ${symbol}:`, error));
        } catch (e) { console.warn(`Failed to fetch data for ${symbol}`, e); }
        
        // Add title
        const title = document.createElement('div');
        title.style.position = 'absolute';
        title.style.top = '10px';
        title.style.left = '10px';
        title.style.background = 'rgba(0,0,0,0.7)';
        title.style.color = 'white';
        title.style.padding = '4px 8px';
        title.style.borderRadius = '4px';
        title.style.fontSize = '12px';
        title.style.fontWeight = 'bold';
        title.textContent = symbol;
        newContainer.style.position = 'relative';
        newContainer.appendChild(title);
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '10px';
        closeBtn.style.right = '10px';
        closeBtn.style.background = '#FF5722';
        closeBtn.style.color = 'white';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '4px';
        closeBtn.style.padding = '4px 8px';
        closeBtn.style.fontSize = '12px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => removeSymbolChart(symbol);
        newContainer.appendChild(closeBtn);
        
        additionalCharts[symbol] = { chart, series, container: newContainer };
        
        console.log(`✅ Added chart for ${symbol}`);
    }
}

function removeSymbolChart(symbol) {
    if (additionalCharts[symbol]) {
        additionalCharts[symbol].container.remove();
        delete additionalCharts[symbol];
        
        // Reset layout if no additional charts
        if (Object.keys(additionalCharts).length === 0) {
            const chartContainer = document.getElementById('lwchart');
            if (chartContainer) {
                chartContainer.style.display = 'block';
                const mainChart = chartContainer.querySelector('div');
                if (mainChart) {
                    mainChart.style.flex = 'none';
                    mainChart.style.minWidth = 'auto';
                }
            }
        }
        
        console.log(`✅ Removed chart for ${symbol}`);
    }
}

// Drawing tools (enhanced implementation)
let isDrawing = false;
let drawingStartPoint = null;
let drawingOverlay = null;
let drawingMode = null;

function enableDrawingMode(mode) {
    drawingMode = mode;
    const chartContainer = document.getElementById('lwchart');
    if (chartContainer) {
        chartContainer.style.cursor = 'crosshair';
        
        // Create drawing overlay if it doesn't exist
        if (!drawingOverlay) {
            drawingOverlay = document.createElement('canvas');
            drawingOverlay.style.position = 'absolute';
            drawingOverlay.style.top = '0';
            drawingOverlay.style.left = '0';
            drawingOverlay.style.pointerEvents = 'auto'; // Changed from 'none' to 'auto'
            drawingOverlay.style.zIndex = '25';
            drawingOverlay.width = chartContainer.clientWidth;
            drawingOverlay.height = chartContainer.clientHeight;
            chartContainer.style.position = 'relative'; // Ensure container is positioned
            chartContainer.appendChild(drawingOverlay);
        }
        
        // Remove existing listeners to avoid duplicates
        drawingOverlay.removeEventListener('mousedown', startDrawing);
        drawingOverlay.removeEventListener('mousemove', updateDrawing);
        drawingOverlay.removeEventListener('mouseup', finishDrawing);
        
        // Add drawing event listeners to the overlay
        drawingOverlay.addEventListener('mousedown', startDrawing);
        drawingOverlay.addEventListener('mousemove', updateDrawing);
        drawingOverlay.addEventListener('mouseup', finishDrawing);
        
        console.log(`✅ Drawing mode enabled: ${mode}`);
    }
}

function startDrawing(event) {
    if (!drawingMode || !drawingOverlay) return;
    
    event.preventDefault();
    isDrawing = true;
    
    const rect = drawingOverlay.getBoundingClientRect();
    drawingStartPoint = { 
        x: event.clientX - rect.left, 
        y: event.clientY - rect.top 
    };
    
    console.log('Drawing started:', drawingStartPoint);
}

function updateDrawing(event) {
    if (!isDrawing || !drawingStartPoint || !drawingOverlay || !drawingMode) return;
    
    event.preventDefault();
    const rect = drawingOverlay.getBoundingClientRect();
    const currentPoint = { 
        x: event.clientX - rect.left, 
        y: event.clientY - rect.top 
    };
    
    const ctx = drawingOverlay.getContext('2d');
    
    // Clear previous preview
    ctx.clearRect(0, 0, drawingOverlay.width, drawingOverlay.height);
    
    // Redraw existing drawings first
    redrawExistingDrawings(ctx);
    
    // Draw preview based on mode
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Dashed line for preview
    
    switch (drawingMode) {
        case 'line':
            ctx.beginPath();
            ctx.moveTo(drawingStartPoint.x, drawingStartPoint.y);
            ctx.lineTo(currentPoint.x, currentPoint.y);
            ctx.stroke();
            break;
        case 'rectangle':
            const width = currentPoint.x - drawingStartPoint.x;
            const height = currentPoint.y - drawingStartPoint.y;
            ctx.strokeRect(drawingStartPoint.x, drawingStartPoint.y, width, height);
            break;
    }
}

function finishDrawing(event) {
    if (!isDrawing || !drawingStartPoint || !drawingOverlay || !drawingMode) return;
    
    event.preventDefault();
    const rect = drawingOverlay.getBoundingClientRect();
    const endPoint = { 
        x: event.clientX - rect.left, 
        y: event.clientY - rect.top 
    };
    
    const ctx = drawingOverlay.getContext('2d');
    
    // Clear preview
    ctx.clearRect(0, 0, drawingOverlay.width, drawingOverlay.height);
    
    // Redraw existing drawings
    redrawExistingDrawings(ctx);
    
    // Draw final shape
    ctx.strokeStyle = drawingMode === 'line' ? '#2196F3' : '#4CAF50';
    ctx.lineWidth = 2;
    ctx.setLineDash([]); // Solid line for final drawing
    
    let drawingData = {
        type: drawingMode,
        start: drawingStartPoint,
        end: endPoint,
        timestamp: Date.now()
    };
    
    switch (drawingMode) {
        case 'line':
            ctx.beginPath();
            ctx.moveTo(drawingStartPoint.x, drawingStartPoint.y);
            ctx.lineTo(endPoint.x, endPoint.y);
            ctx.stroke();
            break;
        case 'rectangle':
            const width = endPoint.x - drawingStartPoint.x;
            const height = endPoint.y - drawingStartPoint.y;
            ctx.strokeRect(drawingStartPoint.x, drawingStartPoint.y, width, height);
            break;
        case 'text':
            const text = prompt('Enter text:');
            if (text) {
                ctx.fillStyle = '#FF9800';
                ctx.font = '14px Arial';
                ctx.fillText(text, drawingStartPoint.x, drawingStartPoint.y);
                drawingData.text = text;
            }
            break;
    }
    
    // Store drawing
    if (!window.drawings) window.drawings = [];
    window.drawings.push(drawingData);
    
    console.log(`✅ Drawing completed: ${drawingMode}`, drawingData);
    
    // Reset drawing mode
    resetDrawingMode();
}

function resetDrawingMode() {
    isDrawing = false;
    drawingStartPoint = null;
    drawingMode = null;
    
    const chartContainer = document.getElementById('lwchart');
    if (chartContainer) {
        chartContainer.style.cursor = 'default';
    }
    
    if (drawingOverlay) {
        drawingOverlay.removeEventListener('mousedown', startDrawing);
        drawingOverlay.removeEventListener('mousemove', updateDrawing);
        drawingOverlay.removeEventListener('mouseup', finishDrawing);
        drawingOverlay.style.pointerEvents = 'none'; // Disable interactions after drawing
    }
}

function redrawExistingDrawings(ctx) {
    if (!window.drawings || !Array.isArray(window.drawings)) return;
    
    window.drawings.forEach(drawing => {
        ctx.setLineDash([]);
        
        switch (drawing.type) {
            case 'line':
                ctx.strokeStyle = '#2196F3';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(drawing.start.x, drawing.start.y);
                ctx.lineTo(drawing.end.x, drawing.end.y);
                ctx.stroke();
                break;
            case 'rectangle':
                ctx.strokeStyle = '#4CAF50';
                ctx.lineWidth = 2;
                const width = drawing.end.x - drawing.start.x;
                const height = drawing.end.y - drawing.start.y;
                ctx.strokeRect(drawing.start.x, drawing.start.y, width, height);
                break;
            case 'text':
                if (drawing.text) {
                    ctx.fillStyle = '#FF9800';
                    ctx.font = '14px Arial';
                    ctx.fillText(drawing.text, drawing.start.x, drawing.start.y);
                }
                break;
        }
    });
}

function clearAllDrawings() {
    if (drawingOverlay) {
        const ctx = drawingOverlay.getContext('2d');
        ctx.clearRect(0, 0, drawingOverlay.width, drawingOverlay.height);
    }
    
    window.drawings = [];
    
    console.log('✅ All drawings cleared');
}

// Mobile responsiveness
function handleMobileResize() {
    if (window.innerWidth <= 768) {
        // Mobile optimizations
        const enhancedControls = document.getElementById('enhancedTradingControls');
        if (enhancedControls) {
            enhancedControls.style.flexDirection = 'column';
            enhancedControls.style.gap = '4px';
            enhancedControls.style.padding = '6px';
        }
        
        // Hide some controls on mobile
        const advancedControls = document.querySelectorAll('[title="Export Chart"], [title="Save Layout"], [title="Load Layout"]');
        advancedControls.forEach(btn => btn.style.display = 'none');
    } else {
        // Desktop optimizations
        const enhancedControls = document.getElementById('enhancedTradingControls');
        if (enhancedControls) {
            enhancedControls.style.flexDirection = 'row';
            enhancedControls.style.gap = '8px';
            enhancedControls.style.padding = '8px';
        }
        
        // Show all controls on desktop
        const advancedControls = document.querySelectorAll('[title="Export Chart"], [title="Save Layout"], [title="Load Layout"]');
        advancedControls.forEach(btn => btn.style.display = 'block');
    }
}

// Initialize mobile responsiveness
window.addEventListener('resize', handleMobileResize);
window.addEventListener('load', handleMobileResize);

// Make functions globally available
window.toggleAlertPanel = toggleAlertPanel;
window.toggleMultiSymbolPanel = toggleMultiSymbolPanel;
window.toggleDrawingPanel = toggleDrawingPanel;
window.setAlert = setAlert;
window.addSymbolChart = addSymbolChart;
window.removeSymbolChart = removeSymbolChart;
window.enableDrawingMode = enableDrawingMode;
window.clearAllDrawings = clearAllDrawings;

console.log('✅ Chart enhancements loaded');