#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${1:-http://127.0.0.1:8000}

echo "Running smoke tests against ${BASE_URL}"

echo -n "Health... " && curl -sSf ${BASE_URL}/health | jq -r '.status' && echo OK

echo -n "Events list... "
curl -sSf ${BASE_URL}/astro/events | jq '.[0] // empty' && echo OK

echo -n "Ephemeris & AI Mentor... "
curl -sSf ${BASE_URL}/astro/ephemeris | jq '.ai_mentor // "no-ai"' && echo OK

echo -n "ICS... " && curl -sSf ${BASE_URL}/astro/events.ics | head -n 3 && echo OK

echo -n "Per-event AI... "
PAYLOAD='{"event":"Mars Conjunction Jupiter","type":"Conjunction","planets":["Mars","Jupiter"],"angle_diff":0}'
curl -sSf -X POST ${BASE_URL}/astro/event-ai -H 'Content-Type: application/json' -d "${PAYLOAD}" | jq -r '.insight' && echo OK

echo "All smoke tests passed"
