# ASTRO MODULE — Run instructions

## Requirements
- Python 3.9+
- pip install -r backend/requirements.txt (includes pyswisseph, plotly)

## Generate planetary data
```
python scripts/planetary_generator.py
```
Outputs:
- /mnt/data/planetary_orbits_table.json
- /mnt/data/planetary_events_daily.json
- /mnt/data/planetary_orbits_3d.html

## FastAPI routes
Include router in your app:
```
from astro_routes import router as astro_router
app.include_router(astro_router)
```

## Frontend
- Integrate an Astro panel that fetches `/astro/orbits`, `/astro/events` and embeds `/astro/orbit3d`.

Quick development setup for Astro features
----------------------------------------

The Astro modules use pyswisseph for precise ephemeris calculations. To enable full astro scanning and event generation install pyswisseph in the project's Python environment:

```bash
# Activate your virtualenv, then:
pip install pyswisseph
```

If you run inside Docker, add `pyswisseph` to the backend `requirements.txt` and rebuild the container. A small smoke-test after installation:

```bash
python -c "import swisseph as swe; print('swe version', getattr(swe,'__version__', 'unknown'))"
```

If pyswisseph is not available the API falls back to the internal synthetic generator. For production-grade event generation, ensure pyswisseph is installed on the host/container.

## Scheduling
- Run the generator monthly to refresh future planetary positions and events.
