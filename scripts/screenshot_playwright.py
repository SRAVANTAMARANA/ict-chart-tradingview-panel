#!/usr/bin/env python3
"""Take a full-page screenshot of the running frontend using Playwright.

Usage (recommended):
  python3 -m pip install --user playwright
  python3 -m playwright install
  # On some systems playwright needs extra system deps (see message from playwright):
  # sudo playwright install-deps
  python3 scripts/screenshot_playwright.py

This script will save `/tmp/frontend_playwright.png`.
"""
from playwright.sync_api import sync_playwright

URL = "http://localhost:8082/index.html"
OUT = "/tmp/frontend_playwright.png"

with sync_playwright() as p:
  browser = p.chromium.launch()
  page = browser.new_page(viewport={"width": 1366, "height": 900})
  page.goto(URL, timeout=25000)
  # Try switching to ICT module for chart view before screenshot
  try:
    page.click("text=ICT", timeout=5000)
    page.wait_for_timeout(1500)
  except Exception:
    pass
  page.screenshot(path=OUT, full_page=True)
  print(f"SCREENSHOT_SAVED:{OUT}")
  browser.close()
