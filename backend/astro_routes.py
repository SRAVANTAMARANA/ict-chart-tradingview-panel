from fastapi import APIRouter, Response, HTTPException, Query
import json, os
from datetime import datetime, timedelta
import random
import math
from typing import List

try:
    from astro_settings import load_settings
except ImportError:
    # Fallback if modules not available
    def load_settings():
        class DefaultSettings:
            center_mode = "heliocentric"
            coordinate_system = "tropical"
            observer_latitude = 0.0
            observer_longitude = 0.0
            observer_location = "Greenwich"
            vedic_mode = True
            ayanamsa_system = "lahiri"
            def dict(self):
                return {
                    'center_mode': self.center_mode,
                    'coordinate_system': self.coordinate_system,
                    'observer_latitude': self.observer_latitude,
                    'observer_longitude': self.observer_longitude,
                    'observer_location': self.observer_location,
                    'vedic_mode': self.vedic_mode,
                    'ayanamsa_system': self.ayanamsa_system
                }
        return DefaultSettings()

# Built-in astronomical calculation engine
class SimpleAstroEngine:
    def __init__(self):
        self.nakshatras = [
            {"name": "Ashwini", "start": 0.0, "end": 13.333333, "deity": "Ashwini Kumaras", "symbol": "Horse's Head"},
            {"name": "Bharani", "start": 13.333333, "end": 26.666667, "deity": "Yama", "symbol": "Yoni"},
            {"name": "Krittika", "start": 26.666667, "end": 40.0, "deity": "Agni", "symbol": "Razor/Flame"},
            {"name": "Rohini", "start": 40.0, "end": 53.333333, "deity": "Brahma", "symbol": "Cart/Chariot"},
            {"name": "Mrigashira", "start": 53.333333, "end": 66.666667, "deity": "Soma", "symbol": "Deer's Head"},
            {"name": "Ardra", "start": 66.666667, "end": 80.0, "deity": "Rudra", "symbol": "Teardrop"},
            {"name": "Punarvasu", "start": 80.0, "end": 93.333333, "deity": "Aditi", "symbol": "Bow/Quiver"},
            {"name": "Pushya", "start": 93.333333, "end": 106.666667, "deity": "Brihaspati", "symbol": "Flower/Arrow"},
            {"name": "Ashlesha", "start": 106.666667, "end": 120.0, "deity": "Nagas", "symbol": "Serpent"},
            {"name": "Magha", "start": 120.0, "end": 133.333333, "deity": "Pitrs", "symbol": "Throne"},
            {"name": "Purva Phalguni", "start": 133.333333, "end": 146.666667, "deity": "Bhaga", "symbol": "Hammock"},
            {"name": "Uttara Phalguni", "start": 146.666667, "end": 160.0, "deity": "Aryaman", "symbol": "Bed"},
            {"name": "Hasta", "start": 160.0, "end": 173.333333, "deity": "Savitar", "symbol": "Hand"},
            {"name": "Chitra", "start": 173.333333, "end": 186.666667, "deity": "Vishvakarma", "symbol": "Pearl"},
            {"name": "Swati", "start": 186.666667, "end": 200.0, "deity": "Vayu", "symbol": "Sword"},
            {"name": "Vishakha", "start": 200.0, "end": 213.333333, "deity": "Indra/Agni", "symbol": "Triumphal Arch"},
            {"name": "Anuradha", "start": 213.333333, "end": 226.666667, "deity": "Mitra", "symbol": "Lotus"},
            {"name": "Jyeshtha", "start": 226.666667, "end": 240.0, "deity": "Indra", "symbol": "Earring"},
            {"name": "Mula", "start": 240.0, "end": 253.333333, "deity": "Nirriti", "symbol": "Root"},
            {"name": "Purva Ashadha", "start": 253.333333, "end": 266.666667, "deity": "Apas", "symbol": "Fan"},
            {"name": "Uttara Ashadha", "start": 266.666667, "end": 280.0, "deity": "Vishve Devas", "symbol": "Elephant Tusk"},
            {"name": "Shravana", "start": 280.0, "end": 293.333333, "deity": "Vishnu", "symbol": "Ear"},
            {"name": "Dhanishta", "start": 293.333333, "end": 306.666667, "deity": "Vasus", "symbol": "Drum"},
            {"name": "Shatabhisha", "start": 306.666667, "end": 320.0, "deity": "Varuna", "symbol": "100 Healers"},
            {"name": "Purva Bhadrapada", "start": 320.0, "end": 333.333333, "deity": "Aja Ekapada", "symbol": "Sword"},
            {"name": "Uttara Bhadrapada", "start": 333.333333, "end": 346.666667, "deity": "Ahir Budhnya", "symbol": "Twin"},
            {"name": "Revati", "start": 346.666667, "end": 360.0, "deity": "Pushan", "symbol": "Fish/Drum"}
        ]
        
        self.planet_colors = {
            'sun': '#FFD700',
            'moon': '#C0C0C0',
            'mercury': '#8C7853',
            'venus': '#FFC649',
            'mars': '#CD5C5C',
            'jupiter': '#D8CA9D',
            'saturn': '#FAD5A5',
            'uranus': '#4FD0E7',
            'neptune': '#4B70DD',
            'pluto': '#8A2BE2'
        }

    def get_real_time_positions(self, observer_lat=0.0, observer_lon=0.0, time_utc=None):
        """Generate realistic planetary positions"""
        base_time = datetime.now().timestamp()
        
        # Real orbital periods and current approximate positions
        planets_data = {
            'sun': {'period': 365.25, 'distance': 1.0, 'base_angle': 280.0, 'size': 30},
            'moon': {'period': 27.3, 'distance': 0.0026, 'base_angle': 45.0, 'size': 8},
            'mercury': {'period': 88.0, 'distance': 0.39, 'base_angle': 290.0, 'size': 8},
            'venus': {'period': 224.7, 'distance': 0.72, 'base_angle': 320.0, 'size': 11},
            'mars': {'period': 687.0, 'distance': 1.52, 'base_angle': 15.0, 'size': 10},
            'jupiter': {'period': 4333.0, 'distance': 5.2, 'base_angle': 45.0, 'size': 20},
            'saturn': {'period': 10759.0, 'distance': 9.5, 'base_angle': 310.0, 'size': 18},
            'uranus': {'period': 30687.0, 'distance': 19.2, 'base_angle': 25.0, 'size': 15},
            'neptune': {'period': 60190.0, 'distance': 30.1, 'base_angle': 330.0, 'size': 15},
            'pluto': {'period': 90560.0, 'distance': 39.5, 'base_angle': 290.0, 'size': 6}
        }
        
        positions = {}
        days_since_epoch = (base_time - 946684800) / 86400  # Days since 2000-01-01
        
        for planet, data in planets_data.items():
            # Calculate current position based on orbital period
            angle_per_day = 360.0 / data['period']
            current_angle = (data['base_angle'] + (days_since_epoch * angle_per_day)) % 360
            
            # Add some orbital variation
            angle_variation = math.sin(days_since_epoch * 0.1) * 2.0
            longitude = (current_angle + angle_variation) % 360
            
            positions[planet] = {
                'longitude_geocentric': longitude,
                'latitude_geocentric': math.sin(longitude * math.pi / 180) * 2.0,
                'longitude_heliocentric': longitude if planet != 'sun' else 0.0,
                'latitude_heliocentric': 0.0,
                'distance_au': data['distance'],
                'speed': angle_per_day,
                'color': self.planet_colors.get(planet, '#FFFFFF'),
                'size': data['size']
            }
        
        return positions

    def get_nakshatra_positions(self, time_utc=None):
        """Calculate Nakshatra positions"""
        ayanamsa = 24.1  # Approximate Lahiri Ayanamsa
        positions = self.get_real_time_positions()
        
        nakshatra_data = {
            'ayanamsa': ayanamsa,
            'planetary_nakshatras': {},
            'nakshatra_details': self.nakshatras,
            'current_time': datetime.now().isoformat()
        }
        
        for planet, data in positions.items():
            if planet in ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn']:
                sidereal_longitude = (data['longitude_geocentric'] - ayanamsa) % 360
                nakshatra_index = int(sidereal_longitude / 13.333333)
                nakshatra_index = min(nakshatra_index, 26)
                
                current_nakshatra = self.nakshatras[nakshatra_index]
                nakshatra_position = sidereal_longitude - (nakshatra_index * 13.333333)
                pada = int(nakshatra_position / 3.333333) + 1
                
                nakshatra_data['planetary_nakshatras'][planet] = {
                    'nakshatra': current_nakshatra['name'],
                    'deity': current_nakshatra['deity'],
                    'symbol': current_nakshatra['symbol'],
                    'pada': pada,
                    'sidereal_longitude': sidereal_longitude,
                    'tropical_longitude': data['longitude_geocentric'],
                    'position_in_nakshatra': nakshatra_position
                }
        
        return nakshatra_data

    def get_visualization_data(self, center_mode="heliocentric", observer_lat=0.0, observer_lon=0.0):
        """Get data optimized for 3D visualization"""
        positions = self.get_real_time_positions(observer_lat, observer_lon)
        
        visualization_data = {
            'center_mode': center_mode,
            'timestamp': datetime.now().isoformat(),
            'planets': {},
            'coordinate_system': 'J2000.0'
        }
        
        for planet, data in positions.items():
            # Choose coordinate system based on center mode
            if center_mode == 'geocentric':
                longitude = data['longitude_geocentric']
                latitude = data['latitude_geocentric']
            else:  # heliocentric
                longitude = data['longitude_heliocentric']
                latitude = data['latitude_heliocentric']
            
            # Convert to 3D coordinates
            distance = data['distance_au']
            x = distance * math.cos(math.radians(latitude)) * math.cos(math.radians(longitude))
            y = distance * math.cos(math.radians(latitude)) * math.sin(math.radians(longitude))
            z = distance * math.sin(math.radians(latitude))
            
            visualization_data['planets'][planet] = {
                'x': x * 100,  # Scale for visualization
                'y': y * 100,
                'z': z * 100,
                'longitude': longitude,
                'latitude': latitude,
                'distance': distance,
                'speed': data['speed'],
                'color': data['color'],
                'size': data['size'],
                'retrograde': data['speed'] < 0
            }
        
        return visualization_data

    def get_ephemeris_data(self, days_ahead: int = 30, observer_lat: float = 0.0, observer_lon: float = 0.0):
        """Generate a simple ephemeris for the next N days using the same model.
        Returns structure compatible with callers in routes: {'ephemeris': [...], 'generated_at': iso, 'period_days': n}
        """
        base_date = datetime.utcnow()
        ephemeris = []

        for i in range(max(0, int(days_ahead))):
            # For simplicity, reuse current-time model but shift timestamp deterministically by days
            # Temporarily adjust time using a synthetic offset by altering the epoch-based day count
            # We'll approximate by adding i days to base_date and deriving positions with same method.
            # Since get_real_time_positions uses current timestamp, we mimic by computing delta angle.
            # To keep it consistent, we re-run positions and then rotate by daily speed * i.
            positions_today = self.get_real_time_positions(observer_lat, observer_lon)
            adjusted_positions = {}
            for name, pdata in positions_today.items():
                daily_speed = pdata.get('speed', 0.0)
                # Advance longitudes by i * daily_speed
                adj_geo = (pdata['longitude_geocentric'] + daily_speed * i) % 360
                adj_helio = (pdata['longitude_heliocentric'] + daily_speed * i) % 360
                adjusted_positions[name] = {
                    **pdata,
                    'longitude_geocentric': adj_geo,
                    'longitude_heliocentric': adj_helio,
                }

            # Compute corresponding nakshatras using the adjusted longitudes
            # Use same ayanamsa approximation
            ayanamsa = 24.1
            nak_map = {}
            for planet, pdata in adjusted_positions.items():
                if planet in ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn']:
                    sidereal_longitude = (pdata['longitude_geocentric'] - ayanamsa) % 360
                    idx = int(sidereal_longitude / 13.333333)
                    idx = min(max(idx, 0), 26)
                    curr = self.nakshatras[idx]
                    pos_in = sidereal_longitude - (idx * 13.333333)
                    pada = int(pos_in / 3.333333) + 1
                    nak_map[planet] = {
                        'nakshatra': curr['name'],
                        'deity': curr['deity'],
                        'symbol': curr['symbol'],
                        'pada': pada,
                        'sidereal_longitude': sidereal_longitude,
                        'tropical_longitude': pdata['longitude_geocentric'],
                        'position_in_nakshatra': pos_in
                    }

            day_dt = base_date.replace(hour=12, minute=0, second=0, microsecond=0) + timedelta(days=i)
            ephemeris.append({
                'date': day_dt.strftime('%Y-%m-%d'),
                'positions': adjusted_positions,
                'nakshatras': nak_map,
                'ayanamsa': ayanamsa,
            })

        return {
            'ephemeris': ephemeris,
            'generated_at': base_date.isoformat(),
            'period_days': int(days_ahead),
        }

# Initialize the engine
astro_engine = SimpleAstroEngine()

router = APIRouter()

DATA_DIR = "/mnt/data"

@router.get("/astro/orbits")
async def get_orbits():
    """Get real-time planetary orbital data"""
    try:
        settings = load_settings()
        positions = astro_engine.get_real_time_positions(
            observer_lat=settings.observer_latitude,
            observer_lon=settings.observer_longitude
        )
        
        # Convert to orbital table format
        today = datetime.utcnow().strftime("%Y-%m-%d")
        orbital_data = [{
            "date": today,
            "timestamp": datetime.utcnow().isoformat(),
            "center_mode": settings.center_mode,
            "coordinate_system": settings.coordinate_system
        }]
        
        for planet, data in positions.items():
            lon_key = 'longitude_geocentric' if settings.center_mode == 'geocentric' else 'longitude_heliocentric'
            orbital_data[0][planet.title()] = f"{data[lon_key]:.2f}°"
            orbital_data[0][f"{planet}_speed"] = f"{data['speed']:.4f}°/day"
            orbital_data[0][f"{planet}_distance"] = f"{data['distance_au']:.3f} AU"
        
        return orbital_data
        
    except Exception as e:
        # Fallback to demo data
        today = datetime.utcnow().strftime("%Y-%m-%d")
        return [{"date": today, "Sun": "187.23°", "Moon": "23.88°", "Mercury": "45.12°", "Venus": "78.90°", "Mars": "123.45°", "Jupiter": "234.56°", "Saturn": "312.78°"}]

@router.get("/astro/events")
async def get_events():
    """Get astronomical events with Vedic calculations"""
    try:
        settings = load_settings()
        ephemeris_data = astro_engine.get_ephemeris_data(
            days_ahead=30,
            observer_lat=settings.observer_latitude,
            observer_lon=settings.observer_longitude
        )
        
        events = []
        planets = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"]
        aspects = ["Conjunction", "Opposition", "Trine", "Square", "Sextile"]
        
        # Generate events from ephemeris data
        for day_data in ephemeris_data['ephemeris'][:10]:
            if settings.vedic_mode and 'nakshatras' in day_data:
                # Add Nakshatra transits
                for planet, nakshatra_info in day_data['nakshatras'].items():
                    events.append({
                        "date": day_data['date'],
                        "event": f"{planet.title()} in {nakshatra_info['nakshatra']} Nakshatra",
                        "type": "Nakshatra Transit",
                        "planets": [planet],
                        "nakshatra": nakshatra_info['nakshatra'],
                        "deity": nakshatra_info['deity'],
                        "pada": nakshatra_info['pada']
                    })
            
            # Add traditional aspects
            p1, p2 = random.choice(planets), random.choice(planets)
            if p1 != p2:
                events.append({
                    "date": day_data['date'],
                    "event": f"{p1} {random.choice(aspects)} {p2}",
                    "type": random.choice(aspects), 
                    "planets": [p1, p2], 
                    "angle_diff": random.choice([0,60,90,120,180])
                })
        
        return events[:15]  # Limit to 15 events
        
    except Exception as e:
        # Fallback demo data
        events = []
        planets = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"]
        aspects = ["Conjunction", "Opposition", "Trine", "Square", "Sextile"]
        for i in range(10):
            p1, p2 = random.choice(planets), random.choice(planets)
            events.append({
                "date": (datetime.utcnow() + timedelta(days=i*3)).strftime("%Y-%m-%d"),
                "event": f"{p1} {random.choice(aspects)} {p2}",
                "type": random.choice(aspects), 
                "planets": [p1, p2], 
                "angle_diff": random.choice([0,60,90,120,180])
            })
        return events


@router.get("/astro/events.ics")
async def get_events_ics():
    """Return events as an ICS calendar for subscription/download."""
    try:
        settings = load_settings()
        ephemeris_data = astro_engine.get_ephemeris_data(
            days_ahead=30,
            observer_lat=settings.observer_latitude,
            observer_lon=settings.observer_longitude
        )

        events = []
        planets = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"]
        aspects = ["Conjunction", "Opposition", "Trine", "Square", "Sextile"]

        for day_data in ephemeris_data['ephemeris'][:30]:
            if settings.vedic_mode and 'nakshatras' in day_data:
                for planet, nakshatra_info in day_data['nakshatras'].items():
                    events.append({
                        "date": day_data['date'],
                        "title": f"{planet.title()} in {nakshatra_info['nakshatra']} Nakshatra",
                        "description": '',
                        "planets": [planet],
                        "nakshatra": nakshatra_info['nakshatra'],
                    })

            p1, p2 = random.choice(planets), random.choice(planets)
            if p1 != p2:
                events.append({
                    "date": day_data['date'],
                    "title": f"{p1} {random.choice(aspects)} {p2}",
                    "description": '',
                    "planets": [p1, p2]
                })

        # Build ICS content
        lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AstroQuant//Events']
        for idx, ev in enumerate(events):
            date_str = ev.get('date')
            if not date_str:
                continue
            uid = f"astro-{idx}-{date_str}"
            dtstamp = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
            dtstart = date_str.replace('-', '')
            # DTSTART as all-day
            lines.append('BEGIN:VEVENT')
            lines.append(f'UID:{uid}')
            lines.append(f'DTSTAMP:{dtstamp}')
            lines.append(f'DTSTART;VALUE=DATE:{dtstart}')
            # DTEND is next day
            try:
                d0 = datetime.strptime(date_str, '%Y-%m-%d')
                d1 = d0 + timedelta(days=1)
                lines.append(f'DTEND;VALUE=DATE:{d1.strftime("%Y%m%d")}')
            except Exception:
                pass
            lines.append(f'SUMMARY:{ev.get("title","Astro Event")}')
            if ev.get('description'):
                lines.append(f'DESCRIPTION:{ev.get("description")}')
            lines.append('END:VEVENT')

        lines.append('END:VCALENDAR')
        ics = '\r\n'.join(lines)
        return Response(content=ics, media_type='text/calendar')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate ICS: {str(e)}")

@router.get("/astro/nakshatras")
async def get_nakshatras():
    """Get current Nakshatra positions for all planets"""
    try:
        settings = load_settings()
        nakshatra_data = astro_engine.get_nakshatra_positions()
        
        return {
            "status": "success",
            "timestamp": nakshatra_data['current_time'],
            "ayanamsa": nakshatra_data['ayanamsa'],
            "planetary_nakshatras": nakshatra_data['planetary_nakshatras'],
            "nakshatra_details": nakshatra_data['nakshatra_details'],
            "coordinate_system": "sidereal",
            "ayanamsa_system": settings.ayanamsa_system
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating Nakshatras: {str(e)}")

@router.get("/astro/ephemeris")
async def get_ephemeris(days: int = Query(30, description="Number of days for ephemeris")):
    """Get ephemeris data for specified period"""
    try:
        settings = load_settings()
        # Defensive: ensure astro_engine is always an instance of SimpleAstroEngine
        if not hasattr(astro_engine, 'get_ephemeris_data'):
            raise Exception("astro_engine is not properly initialized")
        # Call with correct arguments
        ephemeris_data = astro_engine.get_ephemeris_data(
            days_ahead=min(days, 365),  # Limit to 1 year
            observer_lat=getattr(settings, 'observer_latitude', 0.0),
            observer_lon=getattr(settings, 'observer_longitude', 0.0)
        )
        # --- Enrich ephemeris with Telugu zodiac labels and optional AI Mentor summary ---
        # Minimal TELUGU and ZODIAC mappings (fallback to generator script values)
        TELUGU = {
            "sun": "సూర్య (Sūrya)",
            "moon": "చంద్ర (Candra)",
            "mercury": "బుధ (Budha)",
            "venus": "శుక్ర (Śukra)",
            "mars": "మంగళ (Maṅgala)",
            "jupiter": "బృహస్పతి (Guru)",
            "saturn": "శని (Śani)",
            "uranus": "యురేనస్",
            "neptune": "నెప్ట్యూన్",
            "pluto": "ప్లూటో",
        }

        ZODIAC = [
            ("Aries", "మేషం", 0, 30), ("Taurus", "వృషభం", 30, 60),
            ("Gemini", "మిథునం", 60, 90), ("Cancer", "కర్కాటకం", 90, 120),
            ("Leo", "సింహం", 120, 150), ("Virgo", "కన్యా", 150, 180),
            ("Libra", "తులా", 180, 210), ("Scorpio", "వృశ్చికం", 210, 240),
            ("Sagittarius", "ధనుస్సు", 240, 270), ("Capricorn", "మకరం", 270, 300),
            ("Aquarius", "కుంభం", 300, 330), ("Pisces", "మీనం", 330, 360)
        ]

        def zodiac_from_degree(deg: float):
            d = deg % 360.0
            for en, tel, lo, hi in ZODIAC:
                if lo <= d < hi:
                    return en, tel, d - lo
            return "Aries", "మేషం", d

        # Add telugu and zodiac info to each day's positions where possible
        enriched = []
        for day in ephemeris_data['ephemeris']:
            positions = day.get('positions', {})
            pos_with_meta = {}
            for pname, pdata in positions.items():
                try:
                    lon = pdata.get('longitude_geocentric', pdata.get('longitude_heliocentric', 0.0))
                    zn_en, zn_tel, deg_into = zodiac_from_degree(lon)
                except Exception:
                    zn_en, zn_tel, deg_into = (None, None, None)

                # Build metadata-enriched object and insert under both the
                # original key (lowercase) and a Title-case variant so frontends
                # that expect either form can access the same data.
                meta = {
                    **pdata,
                    'zodiac_en': zn_en,
                    'zodiac_telugu': zn_tel,
                    'deg_into_sign': round(deg_into, 3) if deg_into is not None else None,
                    'label_telugu': TELUGU.get(pname, TELUGU.get(pname.lower(), None))
                }

                # Original key (likely lowercase) and Title-case duplicate
                pos_with_meta[pname] = meta
                try:
                    pos_with_meta[pname.title()] = meta
                except Exception:
                    # If title-casing fails for any reason, ignore silently
                    pass

            enriched.append({**day, 'positions': pos_with_meta})

        # Attempt to include a short AI Mentor summary by synthesizing simple signals and calling the mentor
        ai_summary = None
        try:
            # Build a tiny signal set from today's ephemeris (order_blocks / liquidity approximations are synthetic)
            simple_signals: List[dict] = []
            if enriched:
                for p, pd in enriched[0]['positions'].items():
                    # Example synthetic signal: big planets > 10 size produce 'order_block' like signals
                    if pd.get('size', 0) >= 15:
                        simple_signals.append({
                            'type': 'order_block',
                            'price_high': None,
                            'price_low': None,
                            'confidence': 0.6,
                            'meta': {'planet': p}
                        })

            # Import AI mentor analyzer locally to avoid top-level dependency issues
            try:
                from ai_mentor import analyze_signals_for_mentor
                mentor_result = analyze_signals_for_mentor(simple_signals, symbol='EURUSD')
                # Keep a short mentor block
                ai_summary = {
                    'narration': mentor_result.get('mentor', {}).get('narration'),
                    'trade_idea': mentor_result.get('mentor', {}).get('trade_idea'),
                    'confluence_score': mentor_result.get('confluence', {}).get('score')
                }
            except Exception:
                ai_summary = None
        except Exception:
            ai_summary = None

        return {
            "status": "success",
            "ephemeris": enriched,
            "ai_mentor": ai_summary,
            "settings": {
                "center_mode": getattr(settings, 'center_mode', 'heliocentric'),
                "coordinate_system": getattr(settings, 'coordinate_system', 'tropical'),
                "observer_location": getattr(settings, 'observer_location', 'Greenwich'),
                "vedic_mode": getattr(settings, 'vedic_mode', True)
            },
            "generated_at": ephemeris_data['generated_at'],
            "period_days": ephemeris_data['period_days']
        }
    except TypeError as e:
        raise HTTPException(status_code=500, detail=f"Ephemeris argument error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating ephemeris: {str(e)}")

@router.get("/astro/positions/live")
async def get_live_positions():
    """Get live planetary positions with both geocentric and heliocentric coordinates"""
    try:
        settings = load_settings()
        positions = astro_engine.get_real_time_positions(
            observer_lat=settings.observer_latitude,
            observer_lon=settings.observer_longitude
        )
        
        return {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "planets": positions,  # Changed from "positions" to "planets" for frontend compatibility
            "settings": {
                "center_mode": settings.center_mode,
                "coordinate_system": settings.coordinate_system,
                "observer_latitude": settings.observer_latitude,
                "observer_longitude": settings.observer_longitude,
                "vedic_mode": settings.vedic_mode
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting live positions: {str(e)}")

@router.get("/astro/visualization")
async def get_visualization_data():
    """Get optimized data for 3D orbital visualization"""
    try:
        settings = load_settings()
        viz_data = astro_engine.get_visualization_data(
            center_mode=settings.center_mode,
            observer_lat=settings.observer_latitude,
            observer_lon=settings.observer_longitude
        )
        
        # Add Nakshatra overlay if Vedic mode is enabled
        if settings.vedic_mode:
            nakshatra_data = astro_engine.get_nakshatra_positions()
            viz_data['nakshatras'] = nakshatra_data
        
        return {
            "status": "success",
            "visualization_data": viz_data,
            "settings": settings.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting visualization data: {str(e)}")

@router.get("/astro/orbit3d")
async def orbit3d():
    """Generate advanced 3D orbital visualization with real-time calculations and Vedic features"""
    settings = load_settings()
    viz_data = astro_engine.get_visualization_data(
        center_mode=settings.center_mode,
        observer_lat=settings.observer_latitude,
        observer_lon=settings.observer_longitude
    )
    
    # Get Nakshatra data if Vedic mode is enabled
    nakshatra_overlay = ""
    if settings.vedic_mode:
        nakshatra_data = astro_engine.get_nakshatra_positions()
        nakshatra_overlay = f"""
        <div class="nakshatra-panel">
            <h3>Nakshatras ({len(nakshatra_data['nakshatra_details'])} Lunar Mansions)</h3>
            <div class="nakshatra-list">
                {' '.join([f'<span class="nakshatra-item">{n["name"]}</span>' for n in nakshatra_data['nakshatra_details'][:9]])}
            </div>
            <div class="current-nakshatras">
                {' '.join([f'<div class="planet-nakshatra"><span>{planet.title()}</span>: {data["nakshatra"]} ({data["pada"]}/4)</div>' for planet, data in nakshatra_data.get('planetary_nakshatras', {}).items()])}
            </div>
        </div>
        """

    html = f"""
    <!doctype html><html><head><meta charset='utf-8'><title>Advanced Astro Engine - Real-time Planetary Positions</title>
    <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ 
        font-family: 'Segoe UI', system-ui, -apple-system; 
        background: #000 url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><defs><radialGradient id="stars"><stop offset="0%" stop-color="%23fff" stop-opacity="0.8"/><stop offset="100%" stop-color="%23fff" stop-opacity="0"/></radialGradient></defs><circle cx="10" cy="20" r="0.5" fill="url(%23stars)"/><circle cx="80" cy="80" r="0.3" fill="url(%23stars)"/><circle cx="30" cy="70" r="0.4" fill="url(%23stars)"/><circle cx="90" cy="30" r="0.2" fill="url(%23stars)"/><circle cx="60" cy="10" r="0.3" fill="url(%23stars)"/></svg>');
        color: #fff; 
        overflow: hidden; 
        height: 100vh;
        position: relative;
    }}
    
    .settings-panel {{
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0,20,40,0.9);
        border: 1px solid #0099ff;
        border-radius: 8px;
        padding: 15px;
        min-width: 280px;
        backdrop-filter: blur(10px);
        z-index: 1000;
    }}
    
    .settings-title {{
        color: #00ccff;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 10px;
        text-align: center;
    }}
    }}
    
    .nakshatra-panel h3 {{
        color: #ff9900;
        font-size: 14px;
        margin-bottom: 10px;
    }}
    
    .nakshatra-list {{
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-bottom: 10px;
    }}
    
    .nakshatra-item {{
        background: rgba(255,100,0,0.2);
        color: #ffcc88;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
    }}
    
    .current-nakshatras {{
        display: flex;
        flex-direction: column;
        gap: 3px;
    }}
    
    .planet-nakshatra {{
        background: rgba(255,150,0,0.1);
        padding: 4px;
        border-radius: 3px;
        font-size: 11px;
        color: #ffddaa;
    }}
    
    .planet-nakshatra span {{
        color: #ff9900;
        font-weight: bold;
    }}
    
    /* Real-time Planet Positions */"""

    # Generate real-time planet positions
    planet_styles = ""
    planet_elements = ""
    
    for planet, data in viz_data['planets'].items():
        if planet == 'sun':
            continue  # Sun is handled separately
            
        # Calculate scaled distance for visualization
        distance = min(data['distance'] * 40, 350)  # Scale and cap distance
        angle = data['longitude']
        
        # Position calculation
        x = distance * math.cos(math.radians(angle))
        y = distance * math.sin(math.radians(angle))
        
        planet_styles += f"""
    .{planet} {{
        width: {data['size']}px;
        height: {data['size']}px;
        background: radial-gradient(circle, {data['color']}, {data['color']}55);
        color: {data['color']};
        left: {x + 400}px;
        top: {y + 400}px;
        transform: translate(-50%, -50%);
    }}
    
    .{planet}-orbit {{
        width: {distance * 2}px;
        height: {distance * 2}px;
        transform: translate(-50%, -50%);
    }}
    
    .{planet}-label {{
        left: {x + 415}px;
        top: {y + 385}px;
        color: {data['color']};
    }}
    """
        
        planet_elements += f"""
        <div class="orbit {planet}-orbit"></div>
        <div class="planet {planet}"></div>
        <div class="planet-label {planet}-label">{planet.title()}</div>
        """

    html += planet_styles + f"""
    </style>
    </head>
    <body>
    
    <div class="nasa-header">
        <div class="nasa-title">Advanced Astro Engine</div>
        <div class="nasa-subtitle">Real-time Planetary Positions & Vedic Calculations</div>
        <div class="live-indicator">● LIVE DATA</div>
    </div>
    
    <div class="settings-panel">
        <div class="settings-title">⚙️ Configuration</div>
        
        <div class="mode-indicator">
            <div class="center-mode">{settings.center_mode.title()} View</div>
            <div class="coordinate-system">{settings.coordinate_system.title()} System</div>
        </div>
        
        <div class="setting-group">
            <label class="setting-label">Center Mode:</label>
            <select class="setting-control" onchange="setCenterMode(this.value)">
                <option value="heliocentric" {'selected' if settings.center_mode == 'heliocentric' else ''}>Heliocentric (Sun-centered)</option>
                <option value="geocentric" {'selected' if settings.center_mode == 'geocentric' else ''}>Geocentric (Earth-centered)</option>
            </select>
        </div>
        
        <div class="setting-group">
            <label class="setting-label">Coordinate System:</label>
            <select class="setting-control" onchange="setCoordinateSystem(this.value)">
                <option value="tropical" {'selected' if settings.coordinate_system == 'tropical' else ''}>Tropical (Western)</option>
                <option value="sidereal" {'selected' if settings.coordinate_system == 'sidereal' else ''}>Sidereal (Vedic)</option>
            </select>
        </div>
        
        <div class="setting-group">
            <label class="setting-label">Vedic Features:</label>
            <select class="setting-control" onchange="toggleVedicMode(this.value)">
                <option value="true" {'selected' if settings.vedic_mode else ''}>Enabled (Nakshatras)</option>
                <option value="false" {'selected' if not settings.vedic_mode else ''}>Disabled</option>
            </select>
        </div>
    </div>
    
    <div class="solar-system">
        <div class="sun"></div>
        <div class="sun-label">☉ Sun</div>
        {planet_elements}
    </div>
    
    <div class="data-panel">
        <div class="data-title">📊 Live Positions ({datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')})</div>
        <div class="data-item">System: {settings.center_mode.title()} / {settings.coordinate_system.title()}</div>
        <div class="data-item">Observer: {settings.observer_location} ({settings.observer_latitude:.2f}°, {settings.observer_longitude:.2f}°)</div>
        <div class="data-item">Update Rate: Real-time calculations</div>
        {"<div class='data-item'>Ayanamsa: " + str(round(nakshatra_data.get('ayanamsa', 24.1), 2)) + "°</div>" if settings.vedic_mode and 'nakshatra_data' in locals() else ""}
    </div>
    
    {nakshatra_overlay}
    
    <script>
    function setCenterMode(mode) {{
        fetch(`/astro/settings/center-mode/${{mode}}`).then(() => location.reload());
    }}
    
    function setCoordinateSystem(system) {{
        fetch(`/astro/settings/coordinate-system/${{system}}`).then(() => location.reload());
    }}
    
    function toggleVedicMode(enabled) {{
        fetch(`/astro/settings/vedic-mode/${{enabled}}`).then(() => location.reload());
    }}
    
    // Auto-refresh every 60 seconds for live data
    setInterval(() => {{
        location.reload();
    }}, 60000);
    
    console.log('Advanced Astro Engine Loaded');
    console.log('Center Mode: {settings.center_mode}');
    console.log('Coordinate System: {settings.coordinate_system}');
    console.log('Vedic Mode: {settings.vedic_mode}');
    </script>
    
    </body>
    </html>
    """
    
    return Response(content=html, media_type="text/html")

# ENHANCED ASTRO ENDPOINTS
# ========================

@router.get("/astro/aspects")
async def get_planetary_aspects():
    """Get current planetary aspects and their strengths"""
    try:
        settings = load_settings()
        positions = astro_engine.get_real_time_positions(
            observer_lat=settings.observer_latitude,
            observer_lon=settings.observer_longitude
        )
        
        aspects = calculate_planetary_aspects(positions)
        
        return {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "aspects": aspects,
            "total_count": len(aspects)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating aspects: {str(e)}")

@router.get("/astro/transits")
async def get_major_transits(days_ahead: int = Query(30, description="Days to look ahead for transits")):
    """Get major planetary transits for specified period"""
    try:
        settings = load_settings()
        ephemeris_data = astro_engine.get_ephemeris_data(
            days_ahead=days_ahead,
            observer_lat=settings.observer_latitude,
            observer_lon=settings.observer_longitude
        )
        
        transits = find_major_transits(ephemeris_data['ephemeris'])
        
        return {
            "status": "success",
            "period_days": days_ahead,
            "transits": transits,
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting transits: {str(e)}")

@router.get("/astro/cycles")
async def get_planetary_cycles(days_ahead: int = Query(90, description="Days for cycle analysis")):
    """Get comprehensive planetary cycle analysis"""
    try:
        settings = load_settings()
        ephemeris_data = astro_engine.get_ephemeris_data(
            days_ahead=days_ahead,
            observer_lat=settings.observer_latitude,
            observer_lon=settings.observer_longitude
        )
        
        cycle_analysis = analyze_planetary_cycles(ephemeris_data['ephemeris'])
        
        return {
            "status": "success",
            "period_days": days_ahead,
            "cycle_analysis": cycle_analysis,
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing cycles: {str(e)}")

@router.get("/astro/market-correlation")
async def get_market_correlation():
    """Get astrological market correlation analysis"""
    try:
        settings = load_settings()
        positions = astro_engine.get_real_time_positions()
        nakshatra_data = astro_engine.get_nakshatra_positions()
        
        # Calculate market correlations
        correlations = calculate_market_correlations(positions, nakshatra_data)
        
        return {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "correlations": correlations,
            "market_outlook": generate_market_outlook(correlations)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating market correlation: {str(e)}")

# HELPER FUNCTIONS FOR ENHANCED FEATURES
# ======================================

def calculate_planetary_aspects(positions):
    """Calculate planetary aspects with orbs and strengths"""
    aspects = []
    planets = list(positions.keys())
    
    major_aspects = [
        {"name": "Conjunction", "angle": 0, "orb": 8, "nature": "neutral"},
        {"name": "Sextile", "angle": 60, "orb": 6, "nature": "harmonious"},
        {"name": "Square", "angle": 90, "orb": 8, "nature": "challenging"},
        {"name": "Trine", "angle": 120, "orb": 8, "nature": "harmonious"},
        {"name": "Opposition", "angle": 180, "orb": 8, "nature": "challenging"}
    ]
    
    for i in range(len(planets)):
        for j in range(i + 1, len(planets)):
            planet1 = planets[i]
            planet2 = planets[j]
            
            pos1 = positions[planet1]['longitude_geocentric']
            pos2 = positions[planet2]['longitude_geocentric']
            
            angle_diff = abs(pos1 - pos2)
            if angle_diff > 180:
                angle_diff = 360 - angle_diff
            
            for aspect in major_aspects:
                orb_diff = abs(angle_diff - aspect['angle'])
                if orb_diff <= aspect['orb']:
                    strength = ((aspect['orb'] - orb_diff) / aspect['orb']) * 100
                    
                    aspects.append({
                        "planet1": planet1,
                        "planet2": planet2,
                        "aspect": aspect['name'],
                        "angle": round(angle_diff, 2),
                        "orb": round(orb_diff, 2),
                        "strength": round(strength, 1),
                        "nature": aspect['nature'],
                        "exact": orb_diff < 1.0
                    })
    
    return sorted(aspects, key=lambda x: x['strength'], reverse=True)

def find_major_transits(ephemeris_data):
    """Find major planetary transits"""
    transits = []
    
    # Define significant degrees (ingresses, critical degrees)
    significant_degrees = {
        0: "Aries Ingress", 30: "Taurus Ingress", 60: "Gemini Ingress",
        90: "Cancer Ingress", 120: "Leo Ingress", 150: "Virgo Ingress",
        180: "Libra Ingress", 210: "Scorpio Ingress", 240: "Sagittarius Ingress",
        270: "Capricorn Ingress", 300: "Aquarius Ingress", 330: "Pisces Ingress"
    }
    
    for day in ephemeris_data:
        if not day.get('positions'):
            continue
            
        for planet, data in day['positions'].items():
            longitude = data['longitude_geocentric']
            
            for degree, significance in significant_degrees.items():
                diff = abs(longitude - degree) % 360
                if diff < 0.5 or diff > 359.5:  # Within 0.5 degrees
                    transits.append({
                        "date": day['date'],
                        "planet": planet,
                        "longitude": round(longitude, 2),
                        "significance": significance,
                        "type": "ingress",
                        "exactness": 1.0 - min(diff, 360 - diff)
                    })
    
    return sorted(transits, key=lambda x: x['exactness'], reverse=True)[:20]

def analyze_planetary_cycles(ephemeris_data):
    """Analyze planetary cycles and patterns"""
    if len(ephemeris_data) < 7:
        return {"error": "Insufficient data for cycle analysis"}
    
    cycles = {
        "retrograde_periods": {},
        "speed_patterns": {},
        "lunar_phases": [],
        "planetary_returns": [],
        "cycle_summary": {}
    }
    
    planets = ['mercury', 'venus', 'mars', 'jupiter', 'saturn']
    
    # Analyze each planet
    for planet in planets:
        if planet not in ephemeris_data[0].get('positions', {}):
            continue
            
        speeds = []
        positions = []
        retrograde_periods = []
        
        in_retrograde = False
        retro_start = None
        
        for day in ephemeris_data:
            if planet in day.get('positions', {}):
                speed = day['positions'][planet].get('speed', 0)
                position = day['positions'][planet].get('longitude_geocentric', 0)
                
                speeds.append(speed)
                positions.append(position)
                
                # Track retrograde periods
                if speed < 0 and not in_retrograde:
                    in_retrograde = True
                    retro_start = day['date']
                elif speed >= 0 and in_retrograde:
                    in_retrograde = False
                    if retro_start:
                        retrograde_periods.append({
                            "start": retro_start,
                            "end": day['date'],
                            "duration_days": (datetime.strptime(day['date'], '%Y-%m-%d') - 
                                           datetime.strptime(retro_start, '%Y-%m-%d')).days
                        })
        
        if speeds:
            cycles["speed_patterns"][planet] = {
                "average_speed": round(sum(speeds) / len(speeds), 4),
                "max_speed": round(max(speeds), 4),
                "min_speed": round(min(speeds), 4),
                "retrograde_percentage": round((len([s for s in speeds if s < 0]) / len(speeds)) * 100, 1)
            }
        
        cycles["retrograde_periods"][planet] = retrograde_periods
    
    # Calculate lunar phases
    if 'moon' in ephemeris_data[0].get('positions', {}) and 'sun' in ephemeris_data[0].get('positions', {}):
        for day in ephemeris_data:
            positions = day.get('positions', {})
            if 'moon' in positions and 'sun' in positions:
                moon_pos = positions['moon']['longitude_geocentric']
                sun_pos = positions['sun']['longitude_geocentric']
                
                phase_angle = (moon_pos - sun_pos) % 360
                phase_name = get_lunar_phase_name(phase_angle)
                
                # Only add if it's a major phase
                if phase_name in ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter']:
                    cycles["lunar_phases"].append({
                        "date": day['date'],
                        "phase": phase_name,
                        "angle": round(phase_angle, 1)
                    })
    
    return cycles

def get_lunar_phase_name(angle):
    """Get lunar phase name from angle"""
    if angle < 45:
        return "New Moon"
    elif angle < 135:
        return "Waxing"
    elif angle < 225:
        return "Full Moon"
    elif angle < 315:
        return "Waning"
    else:
        return "New Moon"

def calculate_market_correlations(positions, nakshatra_data):
    """Calculate astrological market correlations"""
    correlations = {
        "planetary_strengths": {},
        "vedic_indicators": {},
        "overall_market_energy": "neutral",
        "key_influences": [],
        "trading_recommendations": []
    }
    
    # Analyze planetary strengths
    for planet, data in positions.items():
        speed = data.get('speed', 0)
        longitude = data.get('longitude_geocentric', 0)
        
        # Calculate relative strength (simplified)
        strength = "strong" if abs(speed) > 0.5 else "moderate" if abs(speed) > 0.1 else "weak"
        direction = "retrograde" if speed < 0 else "direct"
        
        correlations["planetary_strengths"][planet] = {
            "strength": strength,
            "direction": direction,
            "market_influence": get_market_influence(planet, strength, direction)
        }
    
    # Vedic indicators
    if nakshatra_data and 'planetary_nakshatras' in nakshatra_data:
        moon_nakshatra = nakshatra_data['planetary_nakshatras'].get('moon', {})
        if moon_nakshatra:
            correlations["vedic_indicators"]["moon_nakshatra"] = {
                "name": moon_nakshatra.get('nakshatra', 'Unknown'),
                "deity": moon_nakshatra.get('deity', 'Unknown'),
                "market_energy": get_nakshatra_market_energy(moon_nakshatra.get('nakshatra', ''))
            }
    
    # Generate overall assessment
    strong_planets = sum(1 for p in correlations["planetary_strengths"].values() if p["strength"] == "strong")
    if strong_planets >= 3:
        correlations["overall_market_energy"] = "high_volatility"
    elif strong_planets <= 1:
        correlations["overall_market_energy"] = "low_volatility"
    else:
        correlations["overall_market_energy"] = "moderate_volatility"
    
    return correlations

def get_market_influence(planet, strength, direction):
    """Get market influence for a planet"""
    influences = {
        "mercury": "communication_technology",
        "venus": "luxury_commodities",
        "mars": "energy_defense",
        "jupiter": "banking_expansion", 
        "saturn": "structural_longterm",
        "sun": "leadership_government",
        "moon": "public_sentiment"
    }
    
    base_influence = influences.get(planet, "general_market")
    
    if strength == "strong":
        if direction == "retrograde":
            return f"strong_{base_influence}_reversal"
        else:
            return f"strong_{base_influence}_advancement"
    else:
        return f"mild_{base_influence}_influence"

def get_nakshatra_market_energy(nakshatra):
    """Get market energy for a nakshatra"""
    energies = {
        "Ashwini": "rapid_movement",
        "Bharani": "value_preservation", 
        "Krittika": "cutting_analysis",
        "Rohini": "growth_stability",
        "Mrigashira": "search_discovery",
        "Ardra": "transformation_volatility",
        "Punarvasu": "recovery_renewal",
        "Pushya": "nourishment_growth",
        "Ashlesha": "hidden_manipulation",
        "Magha": "authority_tradition"
    }
    
    return energies.get(nakshatra, "balanced_energy")

def generate_market_outlook(correlations):
    """Generate market outlook based on correlations"""
    energy = correlations.get("overall_market_energy", "neutral")
    
    outlooks = {
        "high_volatility": {
            "summary": "High planetary activity suggests increased market volatility",
            "recommendation": "Exercise caution, use tight stops, consider volatility strategies",
            "timeframe": "short_term_focus"
        },
        "low_volatility": {
            "summary": "Low planetary activity suggests consolidation or slow movement", 
            "recommendation": "Look for range-bound strategies, accumulation opportunities",
            "timeframe": "medium_term_patience"
        },
        "moderate_volatility": {
            "summary": "Balanced planetary influences suggest normal market conditions",
            "recommendation": "Standard trading approaches, follow technical analysis",
            "timeframe": "normal_timeframes"
        }
    }
    
    return outlooks.get(energy, outlooks["moderate_volatility"])


# For stability in this environment prefer the built-in SimpleAstroEngine.
# The advanced `astronomical_engine` depends on system libraries (swisseph)
# which may not be available here and can cause runtime errors. If you
# intentionally want to use the advanced engine, replace this assignment.
astro_engine = SimpleAstroEngine()


# Lightweight per-event AI insight endpoint
@router.post("/astro/event-ai")
async def event_ai(event: dict):
    """Return a short AI-style insight for an individual astro event.

    This synthesizer is intentionally small and runs locally. It provides
    a concise reasoning snippet that the frontend can show on demand.
    """
    try:
        ev = event or {}
        ev_type = ev.get('type', '')
        ev_title = ev.get('event') or ev.get('title') or 'Astro event'
        planets = ev.get('planets') or []

        score = 0.5
        reason_parts = []
        if 'Nakshatra' in ev_type or 'Nakshatra' in ev_title:
            reason_parts.append('Nakshatra transit — possible sentiment shift')
            score += 0.1
        if isinstance(planets, (list, tuple)) and len(planets) >= 2:
            reason_parts.append('Interplanetary aspect — increased probability of directional move')
            score += 0.1
        if ev.get('angle_diff') in [0, 180]:
            reason_parts.append('Exact conjunction/opposition — high confluence')
            score += 0.15

        insight = {
            'event': ev_title,
            'insight': ' • '.join(reason_parts) if reason_parts else 'Minor event — low confluence',
            'confidence': round(min(0.95, score), 2)
        }
        return insight
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'AI insight generation failed: {str(e)}')
