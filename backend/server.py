# --------------------
# ICT WebSocket endpoint for live candle updates (now correctly placed)
# --------------------
from fastapi import WebSocket, WebSocketDisconnect

# --------------------
# ICT candles endpoint (LightweightCharts compatible)
# --------------------

# Place endpoints after app = FastAPI(...), after middleware, after routers

# backend/server.py - Clean AstroQuant Backend
import os
import sys
import asyncio
import random
import time
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

# Ensure local imports work
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Helper to attempt module imports safely
def try_import_router(module_name: str, attr: str = "router"):
    try:
        mod = __import__(module_name, fromlist=[attr])
        if hasattr(mod, attr):
            return getattr(mod, attr)
    except Exception as e:
        print(f"Could not import {module_name}: {e}")
        pass
    return None

app = FastAPI(title="AstroQuant Backend", version="3.2.0")

# CORS: open during active development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional modular routers
try:
    from signals_api import router as signals_router
except ImportError:
    signals_router = None

try:
    from astro_routes import router as astro_router
except ImportError:
    astro_router = None

try:
    from astro_settings import router as settings_router
except ImportError:
    settings_router = None

try:
    from news_api import router as news_router, startup_news_api
except ImportError:
    news_router = None
    startup_news_api = None

if signals_router:
    app.include_router(signals_router)
if astro_router:
    app.include_router(astro_router)
if settings_router:
    app.include_router(settings_router, prefix="/astro")
if news_router:
    app.include_router(news_router)

# --------------------
# Startup Events
# --------------------
@app.on_event("startup")
async def startup_event():
    """Initialize application components"""
    if startup_news_api:
        await startup_news_api()

# --------------------
# Basic health & quotes
# --------------------
@app.get("/health")
async def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat(), "version": "3.2.0"}

QUOTES = [
    "Plan your trade, trade your plan.",
    "GANN geometry shows time and price harmony.",
    "Astro cycles align with major market turns.",
]

@app.get("/quotes/daily")
async def daily_quote():
    idx = (datetime.utcnow().toordinal()) % len(QUOTES)
    return {"date": datetime.utcnow().date().isoformat(), "quote": QUOTES[idx]}

# --------------------
# Astro fallbacks (used only if astro_routes not mounted)
# --------------------
@app.get("/astro/orbits")
async def astro_orbits_fallback():
    if astro_router:  # Real routes provided by astro_routes
        return {"note": "astro_routes mounted"}
    today = datetime.utcnow().strftime("%Y-%m-%d")
    return [{"date": today, "Sun": "187.23°", "Moon": "23.88°", "Mercury": "45.12°", "Venus": "78.90°", "Mars": "123.45°"}]

@app.get("/astro/events")
async def astro_events_fallback(limit: int = 10):
    if astro_router:
        return {"note": "astro_routes mounted"}
    events = []
    planets = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"]
    aspects = ["Conjunction", "Opposition", "Trine", "Square", "Sextile"]
    for i in range(limit):
        p1, p2 = random.choice(planets), random.choice(planets)
        events.append({
            "date": (datetime.utcnow() + timedelta(days=i*3)).strftime("%Y-%m-%d"),
            "event": f"{p1} {random.choice(aspects)} {p2}",
            "type": random.choice(aspects), 
            "planets": [p1, p2], 
            "angle_diff": random.choice([0,60,90,120,180])
        })
    return events

@app.get("/astro/orbit3d", response_class=HTMLResponse)
async def astro_orbit3d_fallback():
    if astro_router:
        return HTMLResponse("<html><body>Use astro_routes mounted HTML.</body></html>")
    return HTMLResponse(
        """
        <!doctype html><html><head><meta charset='utf-8'><title>Orbit 3D</title>
        <style>body{font-family:system-ui;padding:20px;background:#1a1a1a;color:#fff;text-align:center;}
        .orbit{display:inline-block;width:60px;height:60px;border:2px solid #444;border-radius:50%;margin:10px;position:relative;}
        .planet{width:8px;height:8px;background:orange;border-radius:50%;position:absolute;top:26px;left:26px;}
        </style></head>
        <body>
          <h3>🌌 Orbit 3D Visualization</h3>
          <div class="orbit"><div class="planet"></div></div>
          <div class="orbit"><div class="planet" style="background:blue;"></div></div>
          <div class="orbit"><div class="planet" style="background:red;"></div></div>
          <p>Planetary positions updating... Add astro_routes for full 3D visualization.</p>
          <script>
            const planets = document.querySelectorAll('.planet');
            let angle = 0;
            setInterval(() => {
              planets.forEach((p, i) => {
                const r = 26; const a = (angle + i * 60) * Math.PI / 180;
                p.style.left = (26 + r * Math.cos(a)) + 'px';
                p.style.top = (26 + r * Math.sin(a)) + 'px';
              });
              angle += 2;
            }, 100);
          </script>
        </body></html>
        """
    )

# --------------------
# ICT placeholder (keeps API stable)
# --------------------
@app.get("/ict/signals")
async def ict_signals(symbol: str = "EURUSD", timeframe: str = "5m", limit: int = 200):
    """Generate synthetic ICT-style signals for frontend testing.
    This keeps the /api/detectors endpoint useful without requiring full detectors.
    """
    # Pick a base price by symbol family (very rough)
    if symbol.upper() in ("EURUSD", "GBPUSD", "USDJPY", "AUDUSD"):
        base_price = 1.0875 if symbol.upper() != "USDJPY" else 150.25
    elif symbol.upper().endswith("USDT") or symbol.upper() in ("BTC", "BTCUSD", "BTCUSDT"):
        base_price = 65000.0
    else:
        base_price = 100.0

    # Scale of price increments relative to magnitude
    step = max(0.0005 * base_price if base_price < 1000 else base_price * 0.001, 0.0001)

    now = datetime.utcnow()
    def t(offset_min: int):
        return (now + timedelta(minutes=offset_min)).isoformat()

    signals = []

    # Liquidity highs/lows
    for i in range(3):
        signals.append({
            "type": "liquidity",
            "label": "swing-high",
            "price": round(base_price + (i + 1) * step, 6),
            "time": t(-120 + i * 10),
            "confidence": 0.7 + 0.05 * i,
        })
        signals.append({
            "type": "liquidity",
            "label": "swing-low",
            "price": round(base_price - (i + 1) * step, 6),
            "time": t(-110 + i * 10),
            "confidence": 0.7 + 0.05 * i,
        })

    # Order block (bullish)
    ob_high = base_price + 2.5 * step
    ob_low = base_price + 1.0 * step
    signals.append({
        "type": "order_block",
        "side": "bullish",
        "high": round(ob_high, 6),
        "low": round(ob_low, 6),
        "start_time": t(-90),
        "end_time": t(-45),
        "confidence": 0.82,
    })

    # FVG gap
    fvg_high = base_price - 0.5 * step
    fvg_low = base_price - 1.4 * step
    signals.append({
        "type": "fvg",
        "high": round(fvg_high, 6),
        "low": round(fvg_low, 6),
        "start_time": t(-40),
        "end_time": t(-25),
        "confidence": 0.76,
    })

    # OTE zone (61.8% - 78.6%)
    signals.append({
        "type": "ote",
        "top": round(base_price + 0.786 * step, 6),
        "bottom": round(base_price + 0.618 * step, 6),
        "confidence": 0.7,
    })

    # Range
    signals.append({
        "type": "range",
        "top": round(base_price + 3.2 * step, 6),
        "bottom": round(base_price - 3.0 * step, 6),
        "confidence": 0.65,
    })

    # Extra markers used by counts (not drawn)
    signals.append({"type": "mitigation", "confidence": 0.6, "time": t(-15)})
    signals.append({"type": "choch", "confidence": 0.62, "time": t(-12)})

    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "signals": signals[:limit],
        "confluence": {"score": 0.62, "bias": "bullish", "strength": "moderate"},
        "ai_mentor": {
            "narration": f"Synthetic confluence for {symbol} {timeframe}",
            "recommendation": "Use for UI validation",
        },
        "generated_at": now.isoformat(),
        "success": True,
    }

# --------------------
# GANN demo endpoints (lightweight)
# --------------------
@app.get("/gann/signals")
async def gann_signals(symbol: str = "EURUSD", timeframe: str = "1H", limit: int = 10, analysis_type: str = "all", specific_tool: str = None):
    """
    Enhanced GANN signals endpoint supporting unified analysis:
    - GANN: Square of 9, Angles, Time Cycles
    - Harmonic: Patterns, Ratios, Projections
    - Elliott: Wave counts, Fibonacci levels
    - Wyckoff: Phases, VSA, Accumulation/Distribution
    """
    signals = []
    base_price = 1.0875 if symbol == "EURUSD" else 1.2640
    
    # Generate unified analysis signals based on type and specific tool
    if analysis_type in ["all", "gann"]:
        # GANN Analysis Signals
        signal_count = limit // 4 if analysis_type == "all" else limit
        
        # Enhanced GANN signal generation based on specific tool
        if specific_tool and specific_tool.startswith('square9'):
            # Square of 9 specific analysis
            for i in range(signal_count):
                square_position = random.randint(1, 361)
                natural_number = int((square_position ** 0.5))
                signals.append({
                    "id": f"gann_square9_{i + 1}",
                    "type": "gann",
                    "subtype": "square_of_9",
                    "symbol": symbol,
                    "square_position": square_position,
                    "natural_number": natural_number,
                    "price_level": round(base_price + (natural_number * 0.001), 4),
                    "time_target": (datetime.utcnow() + timedelta(hours=random.randint(1, 24))).strftime("%Y-%m-%d %H:%M"),
                    "strength": random.randint(80, 98),
                    "description": f"Square of 9 - Position {square_position} (Natural {natural_number})",
                    "confidence": random.randint(85, 99),
                    "action": random.choice(["BUY", "SELL", "WATCH"])
                })
                
        elif specific_tool and specific_tool.startswith('square144'):
            # Square of 144 specific analysis
            for i in range(signal_count):
                square144_level = random.choice([144, 288, 432, 576, 720, 864])
                cycle_number = square144_level // 144
                signals.append({
                    "id": f"gann_square144_{i + 1}",
                    "type": "gann", 
                    "subtype": "square_of_144",
                    "symbol": symbol,
                    "square144_level": square144_level,
                    "cycle_number": cycle_number,
                    "price_level": round(base_price + (cycle_number * 0.0025), 4),
                    "time_target": (datetime.utcnow() + timedelta(days=cycle_number)).strftime("%Y-%m-%d %H:%M"),
                    "strength": random.randint(85, 97),
                    "description": f"Square of 144 - Level {square144_level} (Cycle {cycle_number})",
                    "confidence": random.randint(88, 98),
                    "action": random.choice(["BUY", "SELL", "WATCH"])
                })
                
        elif specific_tool and specific_tool.startswith('angle'):
            # GANN Angles specific analysis
            angles = {"1x1": 45, "2x1": 63.75, "1x2": 26.25, "4x1": 75, "1x4": 15, "8x1": 82.5, "1x8": 7.5}
            angle_type = specific_tool.split('-')[1] if '-' in specific_tool else "1x1"
            angle_value = angles.get(angle_type, 45)
            
            for i in range(signal_count):
                signals.append({
                    "id": f"gann_angle_{i + 1}",
                    "type": "gann",
                    "subtype": "gann_angle",
                    "symbol": symbol,
                    "angle_type": angle_type,
                    "angle_degrees": angle_value,
                    "price_level": round(base_price + random.uniform(-0.01, 0.01), 4),
                    "time_target": (datetime.utcnow() + timedelta(hours=random.randint(1, 24))).strftime("%Y-%m-%d %H:%M"),
                    "strength": random.randint(78, 94),
                    "description": f"GANN {angle_type} Angle ({angle_value}°) - Natural support/resistance",
                    "confidence": random.randint(82, 96),
                    "action": random.choice(["BUY", "SELL", "WATCH"])
                })
        else:
            # General GANN analysis
            for i in range(signal_count):
                angle = random.choice([45, 90, 180, 270, 360])
                level_type = random.choice(["Square of 9", "Square of 144", "Spiral Level", "Time Cycle"])
                signals.append({
                    "id": f"gann_{i + 1}",
                    "type": "gann",
                    "symbol": symbol,
                    "level_type": level_type,
                    "angle": angle,
                    "price_level": round(base_price + random.uniform(-0.01, 0.01), 4),
                    "time_target": (datetime.utcnow() + timedelta(hours=random.randint(1, 24))).strftime("%Y-%m-%d %H:%M"),
                    "strength": random.randint(75, 95),
                    "description": f"{level_type} at {angle}° - Key resistance/support level",
                    "confidence": random.randint(80, 98),
                    "action": random.choice(["BUY", "SELL", "WATCH"])
                })

    if analysis_type in ["all", "harmonic"]:
        # Harmonic Pattern Signals
        patterns = ["Gartley", "Butterfly", "Bat", "Crab", "ABCD", "Cypher", "Shark"]
        signal_count = limit // 4 if analysis_type == "all" else limit
        
        # Enhanced harmonic pattern generation
        for i in range(signal_count):
            pattern = random.choice(patterns)
            completion = random.choice([0.786, 0.886, 1.13, 1.272, 1.414, 1.618])
            
            # Pattern-specific ratios
            if pattern == "Gartley":
                ratios = {"XA": 0.618, "AB": 0.618, "BC": 0.786, "CD": 1.272}
            elif pattern == "Butterfly":
                ratios = {"XA": 0.786, "AB": 0.786, "BC": 0.886, "CD": 1.618}
            elif pattern == "Bat":
                ratios = {"XA": 0.382, "AB": 0.500, "BC": 0.886, "CD": 1.618}
            else:
                ratios = {"XA": 0.618, "AB": 0.618, "BC": 0.786, "CD": 1.272}
            
            signals.append({
                "id": f"harmonic_{i + 1}",
                "type": "harmonic",
                "symbol": symbol,
                "pattern": pattern,
                "completion_ratio": completion,
                "price_level": round(base_price + random.uniform(-0.015, 0.015), 4),
                "time_target": (datetime.utcnow() + timedelta(hours=random.randint(2, 18))).strftime("%Y-%m-%d %H:%M"),
                "strength": random.randint(70, 92),
                "description": f"{pattern} pattern at {completion} completion - Reversal zone",
                "confidence": random.randint(75, 94),
                "action": random.choice(["BUY", "SELL", "WATCH"]),
                "fibonacci_ratios": ratios,
                "points": {
                    "X": round(base_price + random.uniform(-0.02, 0.02), 4),
                    "A": round(base_price + random.uniform(-0.015, 0.015), 4),
                    "B": round(base_price + random.uniform(-0.01, 0.01), 4),
                    "C": round(base_price + random.uniform(-0.008, 0.008), 4),
                    "D": round(base_price + random.uniform(-0.005, 0.005), 4)
                }
            })

    if analysis_type in ["all", "elliott"]:
        # Elliott Wave Signals
        waves = ["Wave 1", "Wave 2", "Wave 3", "Wave 4", "Wave 5", "Wave A", "Wave B", "Wave C"]
        signal_count = limit // 4 if analysis_type == "all" else limit
        
        for i in range(signal_count):
            wave = random.choice(waves)
            fib_level = random.choice([0.382, 0.5, 0.618, 0.786, 1.0, 1.272, 1.618])
            degree = random.choice(["Minor", "Intermediate", "Primary", "Cycle"])
            
            signals.append({
                "id": f"elliott_{i + 1}",
                "type": "elliott",
                "symbol": symbol,
                "wave": wave,
                "fibonacci_level": fib_level,
                "price_level": round(base_price + random.uniform(-0.012, 0.012), 4),
                "time_target": (datetime.utcnow() + timedelta(hours=random.randint(1, 36))).strftime("%Y-%m-%d %H:%M"),
                "strength": random.randint(78, 96),
                "description": f"{wave} projection at {fib_level} Fibonacci - Key turning point",
                "confidence": random.randint(82, 97),
                "action": random.choice(["BUY", "SELL", "WATCH"]),
                "wave_degree": degree,
                "wave_structure": {
                    "impulse": wave in ["Wave 1", "Wave 3", "Wave 5"],
                    "corrective": wave in ["Wave 2", "Wave 4", "Wave A", "Wave B", "Wave C"]
                },
                "fibonacci_projections": {
                    "0.382": round(base_price + random.uniform(-0.008, 0.008), 4),
                    "0.618": round(base_price + random.uniform(-0.010, 0.010), 4),
                    "1.618": round(base_price + random.uniform(-0.015, 0.015), 4)
                }
            })

    if analysis_type in ["all", "wyckoff"]:
        # Wyckoff Method Signals
        phases = ["Accumulation", "Markup", "Distribution", "Markdown"]
        events = ["PS", "SC", "AR", "ST", "SPRING", "SOS", "LPS", "LPSY", "UTAD", "SOW"]
        signal_count = limit // 4 if analysis_type == "all" else limit
        
        for i in range(signal_count):
            phase = random.choice(phases)
            event = random.choice(events)
            volume_analysis = random.choice(["High Volume", "Low Volume", "Climactic Volume", "No Demand"])
            
            signals.append({
                "id": f"wyckoff_{i + 1}",
                "type": "wyckoff",
                "symbol": symbol,
                "phase": phase,
                "event": event,
                "price_level": round(base_price + random.uniform(-0.008, 0.008), 4),
                "time_target": (datetime.utcnow() + timedelta(hours=random.randint(4, 48))).strftime("%Y-%m-%d %H:%M"),
                "strength": random.randint(72, 89),
                "description": f"{phase} phase - {event} event detected - {volume_analysis}",
                "confidence": random.randint(77, 91),
                "action": random.choice(["BUY", "SELL", "WATCH"]),
                "volume_confirmation": random.choice([True, False]),
                "volume_analysis": volume_analysis,
                "market_structure": {
                    "trend": random.choice(["Uptrend", "Downtrend", "Sideways"]),
                    "character": random.choice(["Strength", "Weakness", "Neutral"])
                },
                "key_levels": {
                    "support": round(base_price - random.uniform(0.005, 0.015), 4),
                    "resistance": round(base_price + random.uniform(0.005, 0.015), 4)
                }
            })

    # Sort signals by strength (highest first)
    signals.sort(key=lambda x: x["strength"], reverse=True)
    
    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "analysis_type": analysis_type,
        "specific_tool": specific_tool,
        "total_signals": len(signals),
        "signals": signals,
        "meta": {
            "generated_at": datetime.utcnow().isoformat(),
            "unified_analysis": True,
            "supported_types": ["gann", "harmonic", "elliott", "wyckoff"],
            "auto_refresh": True,
            "premium_features": True,
            "tool_specific": specific_tool is not None
        },
        "success": True
    }

# --------------------
# Dashboard sample
# --------------------
@app.get("/api/dashboard")
async def dashboard():
    return {
        "time": datetime.utcnow().isoformat(),
        "ict": {"ote": {"active": True}},
        "gann": {"square_144": {"support": [98.5, 99.25]}}
    }

# --------------------
# API GANN Endpoint for Frontend Integration
# --------------------
@app.get("/api/gann")
async def api_gann_signals(symbol: str = "EURUSD", interval: str = "5m", type: str = "all"):
    """GANN signals API endpoint for frontend integration"""
    return await gann_signals(symbol=symbol, timeframe=interval, analysis_type=type)

@app.get("/api/gann/tool") 
async def api_gann_tool(symbol: str = "EURUSD", interval: str = "5m", tool: str = "square9-price"):
    """GANN tool-specific analysis endpoint"""
    return await gann_signals(symbol=symbol, timeframe=interval, specific_tool=tool)

# --------------------
# API ICT Endpoint for Frontend Integration
# --------------------
@app.get("/api/detectors")
async def api_ict_detectors(symbol: str = "EURUSD", interval: str = "5m", day: str = None, tz_offset: int = 0):
    """ICT detectors API endpoint for frontend integration.
    Optional query params:
        - day=today to request only current-day signals
        - tz_offset=minutes offset from UTC (client timezone), negative for west of UTC
    """
    data = await ict_signals(symbol=symbol, timeframe=interval)
    try:
        if day:
            tz = int(tz_offset or 0)
            if day.lower() == 'today':
                # Today's local range
                now_utc = datetime.utcnow()
                local_now = now_utc - timedelta(minutes=tz)
                local_start = datetime(local_now.year, local_now.month, local_now.day, 0, 0, 0)
                local_end = datetime(local_now.year, local_now.month, local_now.day, 23, 59, 59, 999000)
            else:
                # Parse YYYY-MM-DD for local day
                try:
                    y, m, d = map(int, day.split('-'))
                    local_start = datetime(y, m, d, 0, 0, 0)
                    local_end = datetime(y, m, d, 23, 59, 59, 999000)
                except Exception:
                    local_start = local_end = None
            if local_start and local_end:
                start_utc = local_start + timedelta(minutes=tz)
                end_utc = local_end + timedelta(minutes=tz)

                def in_today(sig):
                    try:
                        st = sig.get('start_time'); et = sig.get('end_time'); tm = sig.get('time')
                        if st or et:
                            st_dt = datetime.fromisoformat(st.replace('Z','')) if st else None
                            et_dt = datetime.fromisoformat(et.replace('Z','')) if et else None
                            if st_dt and et_dt:
                                return (st_dt <= end_utc and et_dt >= start_utc)
                            if st_dt and not et_dt:
                                return (start_utc <= st_dt <= end_utc)
                            if et_dt and not st_dt:
                                return (start_utc <= et_dt <= end_utc)
                            return False
                        if tm:
                            tm_dt = datetime.fromisoformat(tm.replace('Z',''))
                            return (start_utc <= tm_dt <= end_utc)
                    except Exception:
                        return False
                    return False

                data['signals'] = [s for s in (data.get('signals') or []) if in_today(s)]
    except Exception:
        # On any parsing error, leave data as-is
        pass
    return data

# --------------------
# GANN Analysis Endpoints
# --------------------
@app.get("/gann/square_of_nine")
async def gann_square_of_nine(symbol: str = "EURUSD", timeframe: str = "1H"):
    """Square of 9 analysis"""
    base_price = 1.0875 if symbol == "EURUSD" else 1.2640
    position = random.randint(1, 361)
    natural_number = int(position ** 0.5)
    
    return {
        "success": True,
        "analysis": {
            "current_price": base_price,
            "position_in_square": position,
            "natural_number": natural_number,
            "next_level": base_price + (natural_number * 0.001),
            "previous_level": base_price - (natural_number * 0.001)
        },
        "levels": [
            base_price + (i * 0.001) for i in range(-5, 6)
        ]
    }

@app.get("/gann/angles")
async def gann_angles(symbol: str = "EURUSD", timeframe: str = "1H"):
    """GANN angles analysis"""
    base_price = 1.0875 if symbol == "EURUSD" else 1.2640
    
    return {
        "success": True,
        "analysis": {
            "current_price": base_price,
            "angle_1x1": base_price,
            "angle_2x1": base_price + 0.005,
            "angle_1x2": base_price - 0.005
        },
        "angles": [
            {"angle": "1x1", "degrees": 45, "price": base_price},
            {"angle": "2x1", "degrees": 63.75, "price": base_price + 0.005},
            {"angle": "1x2", "degrees": 26.25, "price": base_price - 0.005}
        ]
    }

@app.get("/gann/time_cycles")
async def gann_time_cycles(symbol: str = "EURUSD", timeframe: str = "1H"):
    """Time cycles analysis"""
    return {
        "success": True,
        "analysis": {
            "current_time": datetime.utcnow().isoformat(),
            "next_cycle": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "cycle_strength": random.randint(70, 95)
        },
        "cycles": [
            {"type": "seasonal", "date": (datetime.utcnow() + timedelta(days=i*30)).isoformat()}
            for i in range(1, 5)
        ]
    }

# --------------------
# WebSockets
# --------------------
@app.websocket("/ws/live")
async def websocket_live(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_json({"time": datetime.utcnow().isoformat(), "quote": random.choice(QUOTES)})
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        pass

@app.websocket("/ws/signals")
async def websocket_signals(websocket: WebSocket):
    await websocket.accept()
    try:
        # Try to import emitters if available
        try:
            from gann_angle_emitter import emit_fans  # type: ignore
        except Exception:
            emit_fans = None  # type: ignore
        try:
            from natural_resistance_emitter import emit_fractional_levels  # type: ignore
        except Exception:
            emit_fractional_levels = None  # type: ignore
        try:
            from time_cycle_emitter import emit_time_squares  # type: ignore
        except Exception:
            emit_time_squares = None  # type: ignore

        # Read query params for instrument awareness
        qp = websocket.query_params
        symbol = qp.get("symbol", "XAUUSD")
        interval = qp.get("interval", "5m")  # currently unused, reserved for future use
        # Seed demo pivot/range; could be wired to live candles later
        pivot_price = 2000.0
        pivot_time = datetime.utcnow().replace(microsecond=0).isoformat()
        low, high = 1980.0, 2020.0

        while True:
            sigs = []
            if emit_fans:
                sigs += emit_fans(symbol, pivot_price, pivot_time)
            if emit_fractional_levels:
                sigs += emit_fractional_levels(symbol, low, high, pivot_time)
            if emit_time_squares:
                sigs += emit_time_squares(symbol, pivot_time, pivot_price, abs(high - low))
            await websocket.send_json({"signals": sigs})
            await asyncio.sleep(8)
    except WebSocketDisconnect:
        pass

@app.websocket("/ws/confluence")
async def websocket_confluence(websocket: WebSocket):
    """Real-time ICT Signal Confluence Stream"""
    await websocket.accept()
    try:
        # Import ICT detectors for real-time confluence
        try:
            from ict_detectors.confluence import aggregate_confluence, get_realistic_confluence, analyze_market_structure
            from ict_detectors.orderblock import detect_order_blocks
            from ict_detectors.fvg import detect_fvg
            from ict_detectors.liquidity_pool import detect_liquidity_pools
            from ict_detectors.choch import detect_choch
            from ict_detectors.msb import detect_msb
            from ict_detectors.ote import detect_ote
            from ict_detectors.sweep import detect_sweeps
            from ict_detectors.killzone import detect_killzone
            from ict_detectors.breaker import detect_breaker_entry
            from ict_detectors.stop_hunt import detect_stop_hunt
            from ict_detectors.structure_fractal import detect_fractal_alignment
            from ict_detectors.orderflow_proxy import detect_orderflow_proxies
            from ict_detectors.vol_profile_spike import detect_volume_spikes
            from ict_detectors.fairness_gap import detect_mitigation_zones
            from ict_detectors.supply_demand import detect_supply_demand_zones
            from ict_detectors.range_detector import detect_range
            from ict_detectors.trap import detect_trap
            detectors_available = True
            print("✅ All ICT detectors loaded successfully (including extended ICT modules)")
        except Exception as e:
            print(f"Warning: Could not import ICT detectors: {e}")
            aggregate_confluence = None
            get_realistic_confluence = None
            detectors_available = False

        # Get parameters
        qp = websocket.query_params
        symbol = qp.get("symbol", "EURUSD")
        interval = qp.get("interval", "5m")
        
        print(f"Starting real-time confluence stream for {symbol} {interval}")
        
        # Function to get current market data (simulate or fetch real data)
        def get_current_market_data(symbol: str, limit: int = 200):
            """Get current market data for ICT analysis"""
            try:
                # Try to get real market data from existing candles endpoint
                import requests
                response = requests.get(f"http://localhost:8000/candles?symbol={symbol}&interval={interval}&limit={limit}")
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list) and len(data) > 0:
                        return data
            except:
                pass
            
            # Fallback: generate realistic candle data for testing
            base_price = 1.1000 if symbol == "EURUSD" else 2000.0
            candles = []
            current_time = datetime.utcnow()
            
            for i in range(limit):
                # Generate realistic OHLC data
                time_offset = timedelta(minutes=(limit - i) * 5)  # 5-minute intervals
                candle_time = current_time - time_offset
                
                # Price movement simulation
                price_change = random.uniform(-0.01, 0.01) * base_price
                open_price = base_price + price_change
                
                volatility = random.uniform(0.0005, 0.002) * base_price
                high_price = open_price + random.uniform(0, volatility)
                low_price = open_price - random.uniform(0, volatility)
                close_price = open_price + random.uniform(-volatility/2, volatility/2)
                
                candles.append({
                    "time": int(candle_time.timestamp()),
                    "open": round(open_price, 5),
                    "high": round(high_price, 5),
                    "low": round(low_price, 5),
                    "close": round(close_price, 5),
                    "volume": random.randint(1000, 5000)
                })
                
                base_price = close_price  # Update base for next candle
            
            return candles
        
        while True:
            current_time = datetime.utcnow()
            
            # Get current market data for ICT analysis
            market_data = get_current_market_data(symbol, 200)
            current_price = market_data[-1]["close"] if market_data else 1.1000
            
            # Initialize evidence and signals
            evidence = {}
            signals = []
            confluence_zones = []
            
            if detectors_available and market_data:
                print(f"Running ICT detectors on {len(market_data)} candles...")
                try:
                    # Order Block Detection
                    order_blocks = detect_order_blocks(market_data)
                    evidence["ob"] = len(order_blocks) > 0
                    for ob in order_blocks:
                        signals.append({
                            "type": "order_block",
                            "high": ob["high"],
                            "low": ob["low"],
                            "start_time": datetime.fromtimestamp(ob["time"]).isoformat(),
                            "end_time": (current_time + timedelta(hours=2)).isoformat(),
                            "side": "bullish" if ob["type"] == "bull_ob" else "bearish",
                            "confidence": 0.8
                        })

                    # Fair Value Gap Detection
                    fvgs = detect_fvg(market_data)
                    evidence["fvg"] = len(fvgs) > 0
                    for fvg in fvgs:
                        signals.append({
                            "type": "fvg",
                            "high": fvg["high"],
                            "low": fvg["low"],
                            "start_time": datetime.fromtimestamp(fvg["time"]).isoformat(),
                            "end_time": (current_time + timedelta(hours=1)).isoformat(),
                            "confidence": 0.7
                        })

                    # Liquidity Pool Detection
                    liquidity_pools = detect_liquidity_pools(market_data)
                    evidence["liquidity_pool"] = len(liquidity_pools) > 0
                    for pool in liquidity_pools[:3]:
                        pool_range = (market_data[-1]["high"] - market_data[-1]["low"]) * 0.001
                        signals.append({
                            "type": "liquidity",
                            "high": pool["price"] + pool_range,
                            "low": pool["price"] - pool_range,
                            "start_time": (current_time - timedelta(hours=1)).isoformat(),
                            "end_time": (current_time + timedelta(hours=2)).isoformat(),
                            "label": f"liquidity-pool-{pool['strength']}",
                            "confidence": min(0.9, 0.5 + (pool["strength"] * 0.1))
                        })

                    # Market Structure Break Detection
                    msb = detect_msb(market_data)
                    evidence["msb"] = msb is not None

                    # Change of Character Detection
                    choch = detect_choch(market_data)
                    evidence["choch"] = choch is not None

                    # OTE Detection
                    ote_zones = detect_ote(market_data)
                    evidence["ote"] = len(ote_zones) > 0
                    for ote in ote_zones:
                        signals.append({
                            "type": "ote",
                            "high": ote["max"],
                            "low": ote["min"],
                            "start_time": (current_time - timedelta(hours=1)).isoformat(),
                            "end_time": (current_time + timedelta(hours=2)).isoformat(),
                            "label": f"OTE-{ote['type']}",
                            "confidence": 0.75
                        })

                    # Sweep Detection
                    sweeps = detect_sweeps(market_data)
                    evidence["sweep"] = len(sweeps) > 0
                    for sweep in sweeps:
                        sweep_range = abs(sweep["sweep_high"] - sweep["level"]) if "sweep_high" in sweep else abs(sweep["level"] - current_price) * 0.001
                        signals.append({
                            "type": "sweep",
                            "high": sweep["level"] + sweep_range,
                            "low": sweep["level"] - sweep_range,
                            "start_time": datetime.fromtimestamp(sweep["sweep_time"]).isoformat(),
                            "end_time": (current_time + timedelta(hours=1)).isoformat(),
                            "label": f"Sweep-{sweep['type']}",
                            "confidence": 0.85
                        })

                    # Breaker Detection
                    breakers = detect_breaker_entry(market_data)
                    evidence["breaker"] = len(breakers) > 0
                    for breaker in breakers:
                        signals.append({
                            "type": "breaker",
                            "high": breaker["high"],
                            "low": breaker["low"],
                            "start_time": datetime.fromtimestamp(breaker["time"]).isoformat(),
                            "end_time": (current_time + timedelta(hours=3)).isoformat(),
                            "side": "bullish" if breaker["type"] == "bull_breaker" else "bearish",
                            "confidence": 0.8
                        })

                    # Killzone Detection
                    killzone_info = detect_killzone(int(current_time.timestamp()))
                    evidence["killzone"] = len(killzone_info["active_zones"]) > 0

                    # Stop Hunt Detection
                    stop_hunts = detect_stop_hunt(market_data)
                    evidence["stop_hunt"] = len(stop_hunts) > 0
                    for sh in stop_hunts:
                        signals.append({
                            "type": sh["type"],
                            "low": sh.get("sweep_low"),
                            "high": sh.get("sweep_high"),
                            "close": sh.get("close"),
                            "time": datetime.fromtimestamp(sh["time"]).isoformat(),
                            "confidence": 0.8
                        })

                    # Fractal Alignment Detection (HTF/LTF)
                    # For demo, use same market_data for both HTF/LTF
                    fractal_alignment = detect_fractal_alignment(market_data, market_data)
                    evidence["fractal_alignment"] = fractal_alignment.get("score", 0) > 50

                    # Orderflow Proxy Detection
                    orderflow_proxies = detect_orderflow_proxies(market_data)
                    evidence["orderflow_proxy"] = len(orderflow_proxies) > 0
                    for ofp in orderflow_proxies:
                        signals.append({
                            "type": "orderflow_proxy",
                            "dir": ofp["dir"],
                            "vol_ratio": ofp["vol_ratio"],
                            "body_ratio": ofp["body_ratio"],
                            "time": datetime.fromtimestamp(ofp["time"]).isoformat(),
                            "confidence": 0.8
                        })

                    # Volume Spike Detection
                    volume_spikes = detect_volume_spikes(market_data)
                    evidence["volume_spike"] = len(volume_spikes) > 0
                    for vs in volume_spikes:
                        signals.append({
                            "type": "volume_spike",
                            "vol": vs["vol"],
                            "vol_ratio": vs["vol_ratio"],
                            "price": vs["price"],
                            "time": datetime.fromtimestamp(vs["time"]).isoformat(),
                            "confidence": 0.8
                        })

                    # Mitigation Zone Detection
                    mitigation_zones = detect_mitigation_zones(market_data)
                    evidence["mitigation_zone"] = len(mitigation_zones) > 0
                    for mz in mitigation_zones:
                        signals.append({
                            "type": "mitigation_zone",
                            "low": mz["low"],
                            "high": mz["high"],
                            "note": mz["note"],
                            "time": datetime.fromtimestamp(mz["time"]).isoformat(),
                            "confidence": 0.7
                        })

                    # Supply/Demand Zone Detection
                    supply_demand_zones = detect_supply_demand_zones(market_data)
                    evidence["supply_demand_zone"] = len(supply_demand_zones) > 0
                    for sd in supply_demand_zones:
                        signals.append({
                            "type": sd["type"],
                            "price": sd["price"],
                            "count": sd["count"],
                            "confidence": 0.7
                        })

                    # Range Detection
                    range_zone = detect_range(market_data)
                    evidence["range_zone"] = range_zone is not None
                    if range_zone:
                        signals.append({
                            "type": "range_zone",
                            "high": range_zone["high"],
                            "low": range_zone["low"],
                            "mid": range_zone["mid"],
                            "premium": range_zone["premium"],
                            "discount": range_zone["discount"],
                            "time": datetime.fromtimestamp(range_zone["time"]).isoformat(),
                            "confidence": 0.7
                        })

                    # Trap Detection
                    traps = detect_trap(market_data)
                    evidence["trap"] = len(traps) > 0 if traps else False
                    if traps:
                        for trap_event in traps if isinstance(traps, list) else [traps]:
                            signals.append({
                                "type": "trap",
                                "details": trap_event,
                                "confidence": 0.7
                            })

                    # Add some additional evidence based on market conditions
                    evidence["orderflow"] = random.random() > 0.7  # Volume analysis (simplified)

                    print(f"ICT Evidence: {evidence}")
                except Exception as e:
                    print(f"Error running ICT detectors: {e}")
                    evidence = get_realistic_confluence(symbol, current_time)

                # Calculate confluence
                confluence = aggregate_confluence(evidence)

                # Analyze market structure
                market_structure = analyze_market_structure(symbol, market_data)
                
                # Adjust confluence based on market structure
                structure_multiplier = {
                    "strong": 1.2,
                    "weak": 0.8,
                    "neutral": 1.0
                }.get(market_structure.get("structure_quality", "neutral"), 1.0)
                
                confluence["score"] = min(100, int(confluence["score"] * structure_multiplier))
                confluence["market_structure"] = market_structure
                
                # Generate confluence zones based on detected signals
                if confluence["score"] > 30:  # High confluence threshold
                    zone_height = current_price * 0.002
                    confluence_zones.append({
                        "type": "confluence_zone",
                        "high": current_price + zone_height,
                        "low": current_price - zone_height,
                        "start_time": current_time.isoformat(),
                        "end_time": (current_time + timedelta(hours=2)).isoformat(),
                        "score": confluence["score"],
                        "tags": confluence["tags"],
                        "strength": "high" if confluence["score"] > 70 else "medium" if confluence["score"] > 50 else "low"
                    })
                
            else:
                # Fallback when ICT detectors not available
                if get_realistic_confluence:
                    evidence = get_realistic_confluence(symbol, current_time)
                    confluence = aggregate_confluence(evidence)
                    market_structure = analyze_market_structure(symbol)
                else:
                    evidence = {}
                    confluence = {"score": 0, "tags": []}
                    market_structure = {"trend": "neutral"}
            
            # Send real-time confluence data
            response = {
                "timestamp": current_time.isoformat(),
                "symbol": symbol,
                "interval": interval,
                "current_price": round(current_price, 5),
                "confluence": {
                    "score": confluence["score"],
                    "tags": confluence["tags"],
                    "bias": confluence.get("market_structure", {}).get("trend", "neutral") if hasattr(confluence, 'get') else "neutral",
                    "strength": "high" if confluence["score"] > 70 else "medium" if confluence["score"] > 50 else "low"
                },
                "evidence": evidence,
                "signals": signals,
                "confluence_zones": confluence_zones,
                "market_structure": market_structure if 'market_structure' in locals() else {},
                "real_time": True,
                "detectors_used": "ICT_MODULES" if detectors_available else "SIMULATED"
            }
            
            await websocket.send_json(response)
            await asyncio.sleep(5)  # Update every 5 seconds for real ICT analysis
            
    except WebSocketDisconnect:
        print(f"Client disconnected from confluence stream")
        pass
    except Exception as e:
        print(f"Error in confluence websocket: {e}")
        pass

# --------------------
# Static mounts
# --------------------
if os.path.exists(os.path.join(BACKEND_DIR, "static")):
    app.mount("/static", StaticFiles(directory=os.path.join(BACKEND_DIR, "static")), name="static")
# Allow container/VM bind mount
if os.path.exists("/mnt/data"):
    app.mount("/data", StaticFiles(directory="/mnt/data"), name="data")

# --------------------
# Simple demo data for charts
# --------------------

def generate_demo_data(symbol: str, interval: str, limit: int = 200):
    candles = []
    now = int(time.time())
    base = 100.0
    for i in range(limit):
        t = now - (limit - i) * 60
        o = base + random.uniform(-1, 1)
        h = o + random.uniform(0, 1)
        l = o - random.uniform(0, 1)
        c = l + (h - l) * random.random()
        candles.append({"time": t, "open": o, "high": h, "low": l, "close": c})
        base = c
    return {"symbol": symbol, "interval": interval, "candles": candles}

@app.get("/market/ohlc")
async def market_ohlc(symbol: str = "AAPL", interval: str = "1m", limit: int = 200):
    return generate_demo_data(symbol, interval, limit)

@app.get("/candles")
async def get_candles(symbol: str = "EURUSD", interval: str = "1H", limit: int = 200):
    """
    Enhanced candles endpoint for GANN chart loading
    Returns OHLCV data compatible with LightweightCharts
    """
    print(f"[DEBUG] /candles called with symbol={symbol}, interval={interval}, limit={limit}")
    candles = []
    now = int(time.time())
    
    # Set realistic base price based on symbol
    if "EURUSD" in symbol.upper():
        base = 1.0875
        volatility = 0.002
    elif "GBPUSD" in symbol.upper():
        base = 1.2640
        volatility = 0.003
    elif "XAUUSD" in symbol.upper() or "GOLD" in symbol.upper():
        base = 2000.0
        volatility = 10.0
    elif "BTC" in symbol.upper():
        base = 65000.0
        volatility = 500.0
    else:
        base = 100.0
        volatility = 1.0
    
    # Generate realistic OHLC data with proper time intervals
    interval_seconds = 3600  # 1 hour default
    if interval == "5m":
        interval_seconds = 300
    elif interval == "15m":
        interval_seconds = 900
    elif interval == "1H":
        interval_seconds = 3600
    elif interval == "4H":
        interval_seconds = 14400
    elif interval == "1D":
        interval_seconds = 86400
    
    for i in range(limit):
        t = now - (limit - i) * interval_seconds
        
        # Add some trend and realistic price movement
        trend_factor = random.uniform(-0.0001, 0.0001)
        o = base + random.uniform(-volatility, volatility)
        
        # Ensure realistic OHLC relationships
        high_range = random.uniform(0, volatility * 0.8)
        low_range = random.uniform(0, volatility * 0.8)
        
        h = o + high_range
        l = o - low_range
        c = l + (h - l) * random.uniform(0.2, 0.8)  # Close within HL range
        
        # Add volume (for completeness)
        volume = random.randint(1000, 10000)
        
        candles.append({
            "time": t,
            "open": round(o, 5),
            "high": round(h, 5),
            "low": round(l, 5),
            "close": round(c, 5),
            "volume": volume
        })
        
        base = c + trend_factor  # Slight trend continuation
    
    print(f"[DEBUG] /candles generated {len(candles)} candles")
    return {
        "success": True,
        "symbol": symbol,
        "interval": interval,
        "candles": candles,
        "total": len(candles),
        "generated_at": datetime.utcnow().isoformat()
    }

# --------------------
# ICT WebSocket endpoint for live candle updates (now correctly placed)
# --------------------
@app.websocket("/ict/ws")
async def ict_ws(websocket: WebSocket, symbol: str = "EURUSD", interval: str = "1H", limit: int = 200):
    """
    WebSocket endpoint that streams live candle updates for the given symbol/interval.
    Sends the same format as /ict/candles, one candle at a time (simulated live).
    """
    await websocket.accept()
    try:
        now = int(time.time())
        # Candle generation logic (same as /ict/candles)
        if "EURUSD" in symbol.upper():
            base = 1.0875
            volatility = 0.002
        elif "GBPUSD" in symbol.upper():
            base = 1.2640
            volatility = 0.003
        elif "XAUUSD" in symbol.upper() or "GOLD" in symbol.upper():
            base = 2000.0
            volatility = 10.0
        elif "BTC" in symbol.upper():
            base = 65000.0
            volatility = 500.0
        else:
            base = 100.0
            volatility = 1.0
        interval_seconds = 3600
        if interval == "5m":
            interval_seconds = 300
        elif interval == "15m":
            interval_seconds = 900
        elif interval == "1H":
            interval_seconds = 3600
        elif interval == "4H":
            interval_seconds = 14400
        elif interval == "1D":
            interval_seconds = 86400
        # Generate initial candles
        candles = []
        for i in range(limit):
            t = now - (limit - i) * interval_seconds
            trend_factor = random.uniform(-0.0001, 0.0001)
            o = base + random.uniform(-volatility, volatility)
            high_range = random.uniform(0, volatility * 0.8)
            low_range = random.uniform(0, volatility * 0.8)
            h = o + high_range
            l = o - low_range
            c = l + (h - l) * random.uniform(0.2, 0.8)
            volume = random.randint(1000, 10000)
            candles.append({
                "time": t,
                "open": round(o, 5),
                "high": round(h, 5),
                "low": round(l, 5),
                "close": round(c, 5),
                "volume": volume
            })
            base = c + trend_factor
        # Send initial candles as a batch
        await websocket.send_json({
            "success": True,
            "symbol": symbol,
            "interval": interval,
            "candles": candles,
            "total": len(candles),
            "generated_at": datetime.utcnow().isoformat()
        })
        # Simulate live updates every interval
        while True:
            await asyncio.sleep(interval_seconds)
            t = int(time.time())
            trend_factor = random.uniform(-0.0001, 0.0001)
            o = base + random.uniform(-volatility, volatility)
            high_range = random.uniform(0, volatility * 0.8)
            low_range = random.uniform(0, volatility * 0.8)
            h = o + high_range
            l = o - low_range
            c = l + (h - l) * random.uniform(0.2, 0.8)
            volume = random.randint(1000, 10000)
            bar = {
                "time": t,
                "open": round(o, 5),
                "high": round(h, 5),
                "low": round(l, 5),
                "close": round(c, 5),
                "volume": volume
            }
            await websocket.send_json({"bar": bar})
            base = c + trend_factor
    except WebSocketDisconnect:
        print(f"[INFO] WebSocket client disconnected: {symbol} {interval}")
    except Exception as e:
        print(f"[ERROR] WebSocket error: {e}")

# --------------------
# ICT candles endpoint (LightweightCharts compatible)
# --------------------
@app.get("/ict/candles")
async def ict_candles(symbol: str = "EURUSD", interval: str = "1H", limit: int = 200):
    """
    Returns OHLCV data compatible with LightweightCharts for ICT chart panel
    """
    print(f"[DEBUG] /ict/candles called with symbol={symbol}, interval={interval}, limit={limit}")
    candles = []
    now = int(time.time())
    # Set realistic base price based on symbol
    if "EURUSD" in symbol.upper():
        base = 1.0875
        volatility = 0.002
    elif "GBPUSD" in symbol.upper():
        base = 1.2640
        volatility = 0.003
    elif "XAUUSD" in symbol.upper() or "GOLD" in symbol.upper():
        base = 2000.0
        volatility = 10.0
    elif "BTC" in symbol.upper():
        base = 65000.0
        volatility = 500.0
    else:
        base = 100.0
        volatility = 1.0
    # Generate realistic OHLC data with proper time intervals
    interval_seconds = 3600  # 1 hour default
    if interval == "5m":
        interval_seconds = 300
    elif interval == "15m":
        interval_seconds = 900
    elif interval == "1H":
        interval_seconds = 3600
    elif interval == "4H":
        interval_seconds = 14400
    elif interval == "1D":
        interval_seconds = 86400
    for i in range(limit):
        t = now - (limit - i) * interval_seconds
        trend_factor = random.uniform(-0.0001, 0.0001)
        o = base + random.uniform(-volatility, volatility)
        high_range = random.uniform(0, volatility * 0.8)
        low_range = random.uniform(0, volatility * 0.8)
        h = o + high_range
        l = o - low_range
        c = l + (h - l) * random.uniform(0.2, 0.8)
        volume = random.randint(1000, 10000)
        candles.append({
            "time": t,
            "open": round(o, 5),
            "high": round(h, 5),
            "low": round(l, 5),
            "close": round(c, 5),
            "volume": volume
        })
        base = c + trend_factor
    print(f"[DEBUG] /ict/candles generated {len(candles)} candles")
    return {
        "success": True,
        "symbol": symbol,
        "interval": interval,
        "candles": candles,
        "total": len(candles),
        "generated_at": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    # Run with uvicorn directly
    try:
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8081, reload=False)
    except Exception as e:
        print(f"Failed to start server: {e}")
        sys.exit(1)
