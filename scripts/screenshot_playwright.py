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

URL = "http://localhost:3000"
OUT = "/tmp/frontend_playwright.png"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.goto(URL, timeout=15000)
    page.screenshot(path=OUT, full_page=True)
    print(f"SCREENSHOT_SAVED:{OUT}")
    browser.close()
