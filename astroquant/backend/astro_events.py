"""
astro_events.py
- Uses Swiss Ephemeris (pyswisseph) to compute precise aspect times using a root-finder around coarse hits.
- Computes Vedic elements (nakshatra, pada, tithi, yoga, karana), zodiac sign (Telugu + EN), element, modality.
- Writes data to data/astro_events.json (UTF-8, bilingual)
- Produces a simple predictions file data/astro_predictions.json using heuristic rules.

Note: requires pyswisseph (pip install pyswisseph)
"""

try:
    import swisseph as swe
    SWE_AVAILABLE = True
except Exception:
    swe = None
    SWE_AVAILABLE = False

import datetime, json, math, os

if SWE_AVAILABLE and hasattr(swe, 'set_ephe_path'):
    # set to where swe.wasm or ephemeris files live if needed
    swe.set_ephe_path('.')

PLANETS = [
    (swe.SUN, "Sun", "సూర్యుడు"),
    (swe.MOON, "Moon", "చంద్రుడు"),
    (swe.MERCURY, "Mercury", "బుధుడు"),
    (swe.VENUS, "Venus", "శుక్రుడు"),
    (swe.MARS, "Mars", "కుజుడు"),
    (swe.JUPITER, "Jupiter", "గురు"),
    (swe.SATURN, "Saturn", "శని"),
]

ZODIAC = [
    ("Aries", "మెషం"),("Taurus", "వృషభం"),("Gemini", "మిథునం"),("Cancer", "కర్కాటకం"),
    ("Leo", "సింహం"),("Virgo", "కన్యా"),("Libra", "తులా"),("Scorpio", "వ్రుశ్చికం"),
    ("Sagittarius", "ధనుస్సు"),("Capricorn", "మకరం"),("Aquarius", "కుంభం"),("Pisces", "మీనం"),
]

NAKSHATRAS = [
    ("Ashwini","అశ్విని"),("Bharani","భరణి"),("Krittika","కృతిక"),("Rohini","రోహిణి"),
    ("Mrigashira","మృగశిర"),("Ardra","ఆర్ద్ర"),("Punarvasu","పునర్వసు"),("Pushya","పుష్య"),
    ("Ashlesha","ఆశ్లేష"),("Magha","మాఘ"),("Purva Phalguni","పూర్వ ఫల్గుని"),("Uttara Phalguni","ఉత్తర ఫల్గుని"),
    ("Hasta","హస్త"),("Chitra","చిత్ర"),("Swati","స్వాతి"),("Vishakha","విశాఖ"),
    ("Anuradha","అనురాధ"),("Jyeshtha","జ్యేష్ఠ"),("Mula","మూల"),("Purva Ashadha","పూర్వాషాఢ"),
    ("Uttara Ashadha","ఉత్తరాషాఢ"),("Shravana","శ్రవణ"),("Dhanishta","ధనిష్ఠా"),("Shatabhisha","శతభిష"),
    ("Purva Bhadrapada","పూర్వ భాద్రపద"),("Uttara Bhadrapada","ఉత్తర భాద్రపద"),("Revati","రేవతి")
]

ELEMENTS = ["Fire","Earth","Air","Water","Fire","Earth","Air","Water","Fire","Earth","Air","Water"]
MODALITIES = ["Cardinal","Fixed","Mutable","Cardinal","Fixed","Mutable","Cardinal","Fixed","Mutable","Cardinal","Fixed","Mutable"]
EXALTATION = {"Sun":"Aries","Moon":"Taurus","Mercury":"Virgo","Venus":"Pisces","Mars":"Capricorn","Jupiter":"Cancer","Saturn":"Libra"}

def norm(x):
    return x % 360.0


def jd_to_datetime(jd):
    y, m, d, frac = swe.revjul(jd, swe.GREG_CAL)
    hours = frac * 24.0
    h = int(hours)
    minutes = int((hours - h) * 60)
    seconds = int((((hours - h) * 60) - minutes) * 60)
    return datetime.datetime(y, m, d, h, minutes, seconds)


def compute_vedic(jd):
    lon_sun = norm(swe.calc_ut(jd, swe.SUN)[0])
    lon_moon = norm(swe.calc_ut(jd, swe.MOON)[0])
    tithi_angle = norm(lon_moon - lon_sun)
    tithi_num = int(tithi_angle // 12) + 1
    yoga_angle = norm(lon_sun + lon_moon)
    yoga_index = int(yoga_angle // (360.0/27.0))
    deg_into_tithi = tithi_angle % 12.0
    half = 0 if deg_into_tithi < 6.0 else 1
    karana_index = ((tithi_num -1)*2 + half) % 11
    return {
        "tithi_num": tithi_num,
        "tithi_angle": round(tithi_angle,4),
        "yoga_index": yoga_index,
        "yoga_angle": round(yoga_angle,4),
        "karana_index": karana_index
    }


def planet_info_at_jd(jd, pconst):
    lon = norm(swe.calc_ut(jd, pconst)[0])
    lon_next = norm(swe.calc_ut(jd + 0.5/24.0, pconst)[0])
    speed = (lon_next - lon) * 24.0
    if speed > 180: speed -= 360
    if speed < -180: speed += 360
    retro = speed < 0
    sign_idx = int(lon // 30)
    sign_en, sign_te = ZODIAC[sign_idx]
    deg_in_sign = lon - sign_idx*30.0
    element = ELEMENTS[sign_idx]
    modality = MODALITIES[sign_idx]
    nak_width = 360.0/27.0
    nak_idx = int(lon // nak_width)
    nak_en, nak_te = NAKSHATRAS[nak_idx]
    deg_into_nak = lon - nak_idx*nak_width
    pada = int(deg_into_nak // (nak_width/4.0)) + 1
    p_en = None
    for pc, name_en, name_te in PLANETS:
        if pc == pconst:
            p_en = name_en
            break
    exalted = (EXALTATION.get(p_en) == sign_en) if p_en else False
    return {
        "lon": round(lon,6),
        "deg_in_sign": round(deg_in_sign,4),
        "sign_en": sign_en,
        "sign_te": sign_te,
        "element": element,
        "modality": modality,
        "nakshatra_en": nak_en,
        "nakshatra_te": nak_te,
        "nakshatra_pada": pada,
        "retrograde": retro,
        "exalted": exalted,
        "speed_dpd": round(speed,6)
    }


def refine_aspect(p1, p2, target_arc, jd_start, jd_end, tol_seconds=1):
    def f(jd):
        a = norm(swe.calc_ut(jd, p1)[0])
        b = norm(swe.calc_ut(jd, p2)[0])
        diff = (a - b + 180.0) % 360.0 - 180.0
        return diff - target_arc
    a = jd_start
    b = jd_end
    fa = f(a)
    fb = f(b)
    if fa == 0:
        return a
    if fb == 0:
        return b
    for _ in range(60):
        mid = (a + b) / 2.0
        fm = f(mid)
        if abs(fm) < 1e-8:
            return mid
        if fa * fm <= 0:
            b = mid
            fb = fm
        else:
            a = mid
            fa = fm
        if (b - a) * 86400.0 < tol_seconds:
            return (a+b)/2.0
    return (a+b)/2.0


def find_aspects(start_date, end_date, targets=[0.0,180.0], orb=1.0):
    jd0 = swe.julday(start_date.year, start_date.month, start_date.day)
    jd1 = swe.julday(end_date.year, end_date.month, end_date.day)
    step = 0.5
    events = []
    planet_consts = [p[0] for p in PLANETS]
    for i in range(len(planet_consts)):
        for j in range(i+1, len(planet_consts)):
            p1 = planet_consts[i]
            p2 = planet_consts[j]
            jd = jd0
            while jd <= jd1:
                a = norm(swe.calc_ut(jd, p1)[0])
                b = norm(swe.calc_ut(jd, p2)[0])
                diff = abs((a - b + 180.0) % 360.0 - 180.0)
                if diff <= orb + 2.0:
                    low = max(jd - 1.0, jd0)
                    high = min(jd + 1.0, jd1)
                    for tgt in targets:
                        refined = refine_aspect(p1, p2, tgt, low, high)
                        final_a = norm(swe.calc_ut(refined, p1)[0])
                        final_b = norm(swe.calc_ut(refined, p2)[0])
                        final_diff = abs((final_a - final_b + 180.0) % 360.0 - 180.0)
                        if final_diff <= orb:
                            dt = jd_to_datetime(refined)
                            p1info = planet_info_at_jd(refined, p1)
                            p2info = planet_info_at_jd(refined, p2)
                            ved = compute_vedic(refined)
                            p1_en = next(x[1] for x in PLANETS if x[0]==p1)
                            p1_te = next(x[2] for x in PLANETS if x[0]==p1)
                            p2_en = next(x[1] for x in PLANETS if x[0]==p2)
                            p2_te = next(x[2] for x in PLANETS if x[0]==p2)
                            events.append({
                                "datetime": dt.isoformat(),
                                "jd": round(refined,6),
                                "type": "Conjunction" if tgt==0.0 else ("Opposition" if tgt==180.0 else f"Arc {tgt}"),
                                "planet1_en": p1_en,
                                "planet1_te": p1_te,
                                "planet2_en": p2_en,
                                "planet2_te": p2_te,
                                "degree_diff": round(final_diff,4),
                                "planet1": p1info,
                                "planet2": p2info,
                                "vedic": ved
                            })
                jd += step
    events.sort(key=lambda x: x['jd'])
    return events


ASTRO_RULES = [
    (lambda ev: ev['planet1_en'] in ['Jupiter','Venus'] or ev['planet2_en'] in ['Jupiter','Venus'], ['EURUSD','GBPUSD','AUDUSD','NZDUSD'], 'Bullish Risk-On', 0.6),
    (lambda ev: ev['planet1_en'] in ['Saturn','Mars'] or ev['planet2_en'] in ['Saturn','Mars'], ['USDJPY','USDCAD','USDCHF','XAUUSD'], 'Bearish Risk-Off', 0.6),
    (lambda ev: ev['planet1']['retrograde'] or ev['planet2']['retrograde'], 'all', 'Trend Reversal / Noise', 0.4),
    (lambda ev: ev['planet1']['exalted'] or ev['planet2']['exalted'], 'all', 'Strengthen Planetary Influence', 0.5),
]


def generate_predictions(events):
    preds = []
    for ev in events:
        matched = []
        for cond, pairs, bias, conf in ASTRO_RULES:
            try:
                if cond(ev):
                    if pairs == 'all':
                        affected = ['EURUSD','GBPUSD','AUDUSD','NZDUSD','USDJPY','USDCAD','USDCHF','XAUUSD']
                    else:
                        affected = pairs
                    matched.append({"bias": bias, "pairs": affected, "confidence": conf})
            except Exception:
                continue
        if matched:
            preds.append({
                "jd": ev['jd'],
                "datetime": ev['datetime'],
                "event_type": ev['type'],
                "event_desc": f"{ev['planet1_en']} - {ev['planet2_en']} ({ev['degree_diff']}°)",
                "matches": matched
            })
    return preds


if __name__ == '__main__':
    today = datetime.date.today()
    start = today - datetime.timedelta(days=365)
    end = today + datetime.timedelta(days=365)
    print(f"Scanning {start} -> {end} (may take a few minutes)")
    evts = find_aspects(start, end, targets=[0.0,180.0], orb=0.5)
    os.makedirs('data', exist_ok=True)
    with open('data/astro_events.json','w',encoding='utf-8') as f:
        json.dump(evts,f,ensure_ascii=False,indent=2)
    preds = generate_predictions(evts)
    with open('data/astro_predictions.json','w',encoding='utf-8') as f:
        json.dump(preds,f,ensure_ascii=False,indent=2)
    print(f"Wrote {len(evts)} events and {len(preds)} predictions to data/")
