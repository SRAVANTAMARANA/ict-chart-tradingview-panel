#!/usr/bin/env python3
"""Playwright helper: open the frontend headless and stream console, errors, and failed requests to stdout.

Usage:
  python3 -m pip install --user playwright
  python3 -m playwright install
  python3 scripts/collect_console_playwright.py

This will print console messages, page errors, and network failures to stdout for debugging.
"""
from playwright.sync_api import sync_playwright
import time

URL = "http://localhost:3000"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()

    def on_console(msg):
        try:
            args = [a.json_value() if a.type == 'object' else a.to_string() for a in msg.args]
        except Exception:
            args = [msg.text]
        print(f"CONSOLE [{msg.type}] {msg.text}")
        for a in args:
            print("  ->", a)

    def on_pageerror(exc):
        print("PAGE_ERROR:", exc)

    def on_request_failed(req):
        print(f"REQUEST_FAILED: {req.url} - {req.failure}")

    page.on("console", on_console)
    page.on("pageerror", on_pageerror)
    page.on("requestfailed", on_request_failed)

    print(f"Opening {URL} ...")
    page.goto(URL, timeout=15000)

    # allow time for widgets and XHR to load
    time.sleep(6)

    print("Done — closing browser")
    browser.close()
