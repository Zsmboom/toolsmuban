#!/usr/bin/env python3
"""Diagnostic script to check page rendering"""

from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)  # Not headless so we can see
    page = browser.new_page()

    print("Navigating to home page...")
    page.goto('http://localhost:3000/', wait_until='networkidle', timeout=30000)
    page.wait_for_timeout(3000)

    # Get the page HTML
    html = page.content()

    # Save HTML
    with open('/tmp/page_html.html', 'w') as f:
        f.write(html)

    print("HTML saved to /tmp/page_html.html")
    print(f"Page title: {page.title()}")
    print(f"Current URL: {page.url}")

    # Check for specific elements
    h1_count = page.locator('h1').count()
    print(f"H1 elements found: {h1_count}")

    if h1_count > 0:
        for i in range(min(h1_count, 5)):
            text = page.locator('h1').nth(i).text_content()
            print(f"  H1 {i+1}: {text}")

    # Wait for user to see
    print("\nBrowser window opened. Check what's displayed.")
    print("Press Enter to close...")
    input()

    browser.close()
